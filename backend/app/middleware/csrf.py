"""
CSRF Protection Middleware
Implements Cross-Site Request Forgery protection using double-submit cookie pattern
"""

import secrets
import hmac
import hashlib
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection using double-submit cookie pattern.

    For state-changing operations (POST, PUT, PATCH, DELETE), requires:
    1. CSRF token in cookie (set by server)
    2. Matching CSRF token in X-CSRF-Token header (set by client)

    Token generation uses cryptographically secure random values.
    """

    # HTTP methods that require CSRF protection
    PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"]

    # Paths exempt from CSRF protection (e.g., auth endpoints, webhooks)
    EXEMPT_PATHS = [
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/plaid/webhook",  # Plaid webhooks
        "/health",
        "/",
    ]

    # Cookie name for CSRF token
    CSRF_COOKIE_NAME = "csrf_token"

    # Header name for CSRF token
    CSRF_HEADER_NAME = "X-CSRF-Token"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate CSRF token for state-changing requests."""

        # Skip CSRF validation for exempt paths
        if any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            response = await call_next(request)
            return self._set_csrf_cookie(response)

        # Skip CSRF validation for safe methods (GET, HEAD, OPTIONS)
        if request.method not in self.PROTECTED_METHODS:
            response = await call_next(request)
            return self._set_csrf_cookie(response)

        # Get CSRF token from cookie
        cookie_token = request.cookies.get(self.CSRF_COOKIE_NAME)

        # Get CSRF token from header
        header_token = request.headers.get(self.CSRF_HEADER_NAME)

        # Validate tokens
        if not cookie_token or not header_token:
            logger.warning(
                f"CSRF token missing for {request.method} {request.url.path} "
                f"from {request.client.host}"
            )
            return JSONResponse(
                status_code=403,
                content={
                    "error": "csrf_token_missing",
                    "message": "CSRF token required for this operation",
                    "detail": "Include CSRF token in both cookie and X-CSRF-Token header"
                }
            )

        # Compare tokens using constant-time comparison to prevent timing attacks
        if not self._constant_time_compare(cookie_token, header_token):
            logger.warning(
                f"CSRF token mismatch for {request.method} {request.url.path} "
                f"from {request.client.host}"
            )
            return JSONResponse(
                status_code=403,
                content={
                    "error": "csrf_token_invalid",
                    "message": "CSRF token validation failed",
                    "detail": "Cookie and header tokens do not match"
                }
            )

        # Validate token signature
        if not self._validate_token(cookie_token):
            logger.warning(
                f"CSRF token signature invalid for {request.method} {request.url.path} "
                f"from {request.client.host}"
            )
            return JSONResponse(
                status_code=403,
                content={
                    "error": "csrf_token_expired",
                    "message": "CSRF token has expired or is invalid",
                    "detail": "Please refresh the page to get a new token"
                }
            )

        # Process request
        response = await call_next(request)

        # Ensure CSRF cookie is set in response
        return self._set_csrf_cookie(response)

    def _generate_token(self) -> str:
        """
        Generate a new CSRF token.

        Returns:
            Base64-encoded token with signature
        """
        # Generate random token
        random_token = secrets.token_urlsafe(32)

        # Sign token with secret key
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            random_token.encode(),
            hashlib.sha256
        ).hexdigest()

        # Combine token and signature
        return f"{random_token}.{signature}"

    def _validate_token(self, token: str) -> bool:
        """
        Validate CSRF token signature.

        Args:
            token: Token to validate

        Returns:
            True if token is valid, False otherwise
        """
        try:
            # Split token and signature
            parts = token.split(".")
            if len(parts) != 2:
                return False

            random_token, signature = parts

            # Verify signature
            expected_signature = hmac.new(
                settings.SECRET_KEY.encode(),
                random_token.encode(),
                hashlib.sha256
            ).hexdigest()

            return self._constant_time_compare(signature, expected_signature)

        except Exception as e:
            logger.error(f"Error validating CSRF token: {str(e)}")
            return False

    def _constant_time_compare(self, a: str, b: str) -> bool:
        """
        Compare two strings in constant time to prevent timing attacks.

        Args:
            a: First string
            b: Second string

        Returns:
            True if strings are equal, False otherwise
        """
        return hmac.compare_digest(a.encode(), b.encode())

    def _set_csrf_cookie(self, response: Response) -> Response:
        """
        Set CSRF token cookie in response if not already set.

        Args:
            response: Response to add cookie to

        Returns:
            Response with CSRF cookie
        """
        # Generate new token if not in response cookies
        if self.CSRF_COOKIE_NAME not in response.headers.get("set-cookie", ""):
            token = self._generate_token()

            # Set secure cookie
            response.set_cookie(
                key=self.CSRF_COOKIE_NAME,
                value=token,
                httponly=False,  # Must be accessible to JavaScript
                secure=not settings.DEBUG,  # HTTPS only in production
                samesite="strict",  # Prevent CSRF via cookie
                max_age=86400,  # 24 hours
            )

        return response
