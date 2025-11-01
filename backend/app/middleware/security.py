"""
Security Middleware
Implements security headers, rate limiting, and request validation
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict
import time
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers[
            "Strict-Transport-Security"
        ] = "max-age=31536000; includeSubDomains"
        response.headers[
            "Content-Security-Policy"
        ] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers[
            "Permissions-Policy"
        ] = "geolocation=(), microphone=(), camera=()"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis
    Implements sliding window rate limiting
    """

    def __init__(self, app, redis_url: str = None):
        super().__init__(app)
        self.redis_url = redis_url or settings.REDIS_URL
        self.redis_client: redis.Redis = None
        self._connected = False

        # Rate limits (requests per minute)
        self.rate_limits: Dict[str, int] = {
            "/api/v1/auth/login": 5,
            "/api/v1/auth/register": 3,
            "/api/v1/simulations": 10,
            "default": 100,
        }

    async def connect_redis(self):
        """Connect to Redis for rate limiting"""
        if not self._connected:
            try:
                self.redis_client = await redis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await self.redis_client.ping()
                self._connected = True
                logger.info("Rate limiter connected to Redis")
            except Exception as e:
                logger.error(f"Rate limiter failed to connect to Redis: {e}")
                self._connected = False

    async def get_rate_limit(self, path: str) -> int:
        """Get rate limit for a given path"""
        # Check for exact match
        if path in self.rate_limits:
            return self.rate_limits[path]

        # Check for prefix match
        for pattern, limit in self.rate_limits.items():
            if pattern != "default" and path.startswith(pattern):
                return limit

        return self.rate_limits["default"]

    async def check_rate_limit(
        self, identifier: str, path: str, limit: int
    ) -> tuple[bool, int, int]:
        """
        Check if request is within rate limit

        Args:
            identifier: User ID or IP address
            path: Request path
            limit: Requests per minute

        Returns:
            (allowed, remaining, reset_time)
        """
        if not self._connected:
            await self.connect_redis()
            if not self._connected:
                # If Redis is unavailable, allow request
                logger.warning("Redis unavailable, bypassing rate limit")
                return True, limit, 60

        try:
            key = f"rate_limit:{identifier}:{path}"
            now = int(time.time())
            window_start = now - 60  # 1-minute window

            # Remove old entries
            await self.redis_client.zremrangebyscore(key, 0, window_start)

            # Count requests in current window
            request_count = await self.redis_client.zcard(key)

            if request_count >= limit:
                # Get oldest request time to calculate reset
                oldest = await self.redis_client.zrange(key, 0, 0, withscores=True)
                if oldest:
                    reset_time = int(oldest[0][1]) + 60 - now
                else:
                    reset_time = 60

                return False, 0, reset_time

            # Add current request
            await self.redis_client.zadd(key, {str(now): now})
            await self.redis_client.expire(key, 60)

            remaining = limit - request_count - 1
            return True, remaining, 60

        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            # On error, allow request
            return True, limit, 60

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Get identifier (user ID from auth or IP address)
        identifier = request.client.host
        if hasattr(request.state, "user") and request.state.user:
            identifier = f"user:{request.state.user.id}"
        else:
            identifier = f"ip:{identifier}"

        # Check rate limit
        path = request.url.path
        limit = await self.get_rate_limit(path)
        allowed, remaining, reset_time = await self.check_rate_limit(
            identifier, path, limit
        )

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded",
                    "limit": limit,
                    "retry_after": reset_time,
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                    "Retry-After": str(reset_time),
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)

        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validate and sanitize incoming requests"""

    async def dispatch(self, request: Request, call_next):
        # Validate Content-Type for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")

            # Allow JSON and multipart form data
            if not any(
                ct in content_type
                for ct in ["application/json", "multipart/form-data"]
            ):
                return JSONResponse(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    content={
                        "detail": "Content-Type must be application/json or multipart/form-data"
                    },
                )

        # Validate request size (10MB limit)
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": "Request body too large (max 10MB)"},
            )

        # Process request
        response = await call_next(request)
        return response


async def setup_security_middleware(app):
    """Set up all security middleware"""
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestValidationMiddleware)
    logger.info("Security middleware configured")
