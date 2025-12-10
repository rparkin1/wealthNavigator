"""
Rate Limiting Middleware
Protects API endpoints from abuse using slowapi
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Initialize rate limiter
# Uses client IP address as the key for rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute", "1000/hour"],  # Global rate limits
    storage_uri="memory://",  # In production, use Redis: "redis://localhost:6379"
    strategy="fixed-window"  # or "moving-window" for more accurate limiting
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Custom handler for rate limit exceeded errors

    Returns a JSON response with rate limit information
    """
    logger.warning(
        f"Rate limit exceeded for {get_remote_address(request)} on {request.url.path}"
    )

    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "detail": str(exc.detail) if hasattr(exc, 'detail') else None,
        },
        headers={
            "Retry-After": "60",  # Suggest retry after 60 seconds
            "X-RateLimit-Limit": str(exc.detail.split()[0]) if hasattr(exc, 'detail') else "Unknown",
        }
    )


# Rate limit configurations for different endpoint types
class RateLimits:
    """Predefined rate limits for different API endpoint types"""

    # Authentication endpoints - strict limits
    AUTH = "5/minute"

    # Plaid Link token creation - moderate limits
    PLAID_LINK = "10/minute"

    # Data sync endpoints - moderate limits
    SYNC = "20/minute"

    # Read endpoints - generous limits
    READ = "100/minute"

    # Write endpoints - moderate limits
    WRITE = "50/minute"

    # Sensitive operations - very strict limits
    SENSITIVE = "3/minute"
