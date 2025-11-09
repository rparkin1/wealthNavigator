"""
Monitoring and Error Tracking Configuration
Integrates Sentry for error tracking and performance monitoring
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging
import os
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """
    Initialize Sentry error tracking and performance monitoring

    Only initializes in production or if SENTRY_DSN is explicitly set
    """
    sentry_dsn = os.getenv("SENTRY_DSN")

    if not sentry_dsn:
        logger.info("Sentry DSN not configured - error tracking disabled")
        return

    # Determine environment
    environment = "production" if settings.PLAID_ENV == "production" else "development"

    # Configure Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        release=f"wealthnavigator@{settings.APP_VERSION}",

        # Integrations
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR
            ),
        ],

        # Performance monitoring
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        profiles_sample_rate=0.1 if environment == "production" else 1.0,

        # Error filtering
        before_send=filter_sensitive_data,

        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personally identifiable information
        max_breadcrumbs=50,
        debug=settings.DEBUG,
    )

    logger.info(f"Sentry initialized for {environment} environment")


def filter_sensitive_data(event: dict, hint: dict) -> Optional[dict]:
    """
    Filter sensitive data from Sentry events

    Removes or masks:
    - Access tokens
    - API keys
    - Passwords
    - Credit card numbers
    - SSNs

    Args:
        event: Sentry event data
        hint: Additional context

    Returns:
        Filtered event or None to drop the event
    """
    # List of sensitive keys to filter
    sensitive_keys = [
        'access_token',
        'password',
        'api_key',
        'secret',
        'token',
        'authorization',
        'plaid_secret',
        'plaid_client_id',
        'webhook_verification_key',
        'encryption_key',
        'secret_key',
        'private_key',
    ]

    def filter_dict(data: dict) -> dict:
        """Recursively filter sensitive data from dictionaries"""
        filtered = {}
        for key, value in data.items():
            # Check if key contains sensitive information
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                filtered[key] = "[FILTERED]"
            elif isinstance(value, dict):
                filtered[key] = filter_dict(value)
            elif isinstance(value, list):
                filtered[key] = [filter_dict(item) if isinstance(item, dict) else item for item in value]
            else:
                filtered[key] = value
        return filtered

    # Filter request data
    if 'request' in event:
        if 'data' in event['request']:
            event['request']['data'] = filter_dict(event['request']['data'])
        if 'headers' in event['request']:
            event['request']['headers'] = filter_dict(event['request']['headers'])
        if 'env' in event['request']:
            event['request']['env'] = filter_dict(event['request']['env'])

    # Filter extra data
    if 'extra' in event:
        event['extra'] = filter_dict(event['extra'])

    # Filter context
    if 'contexts' in event:
        event['contexts'] = filter_dict(event['contexts'])

    return event


def capture_exception(exception: Exception, **kwargs) -> None:
    """
    Capture an exception and send to Sentry

    Args:
        exception: The exception to capture
        **kwargs: Additional context to include
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.capture_exception(exception, **kwargs)
    else:
        # Fallback to logging if Sentry is not configured
        logger.exception("Exception occurred", exc_info=exception)


def capture_message(message: str, level: str = "info", **kwargs) -> None:
    """
    Capture a message and send to Sentry

    Args:
        message: The message to capture
        level: Severity level (debug, info, warning, error, fatal)
        **kwargs: Additional context to include
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.capture_message(message, level=level, **kwargs)
    else:
        # Fallback to logging if Sentry is not configured
        logger.log(getattr(logging, level.upper(), logging.INFO), message)


def set_user_context(user_id: str, email: Optional[str] = None, **kwargs) -> None:
    """
    Set user context for error tracking

    Args:
        user_id: User identifier
        email: User email (optional)
        **kwargs: Additional user context
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            **kwargs
        })


def set_tag(key: str, value: str) -> None:
    """
    Set a tag for error grouping and filtering

    Args:
        key: Tag key
        value: Tag value
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_tag(key, value)


def set_context(name: str, context: dict) -> None:
    """
    Set additional context for errors

    Args:
        name: Context name
        context: Context data
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_context(name, context)
