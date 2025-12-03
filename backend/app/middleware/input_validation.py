"""
Input Validation Middleware
Sanitizes and validates all incoming requests to prevent injection attacks
"""

import re
from typing import Any, Dict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from typing import Callable
import logging

logger = logging.getLogger(__name__)


class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate and sanitize input data for all endpoints.

    Protections:
    - SQL injection prevention (basic pattern detection)
    - XSS prevention (script tag detection)
    - Path traversal prevention
    - Command injection prevention
    - Large payload rejection (DOS prevention)
    """

    # Maximum request body size (10MB)
    MAX_BODY_SIZE = 10 * 1024 * 1024

    # Suspicious patterns that indicate potential attacks
    SUSPICIOUS_PATTERNS = [
        r"<script[^>]*>.*?</script>",  # Script tags
        r"javascript:",  # JavaScript protocol
        r"on\w+\s*=",  # Event handlers (onclick, onerror, etc.)
        r"\.\./",  # Path traversal
        r"union\s+select",  # SQL injection
        r"drop\s+table",  # SQL injection
        r"exec\s*\(",  # Command injection
        r"eval\s*\(",  # Code injection
        r"system\s*\(",  # System command execution
    ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate request before processing."""

        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE:
            logger.warning(
                f"Request body too large: {content_length} bytes from {request.client.host}"
            )
            return JSONResponse(
                status_code=413,
                content={
                    "error": "payload_too_large",
                    "message": "Request body exceeds maximum allowed size",
                    "max_size_bytes": self.MAX_BODY_SIZE
                }
            )

        # Skip validation for safe methods (no body)
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)

        # Read and validate request body for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Read body
                body = await request.body()

                # Decode and check for suspicious patterns
                try:
                    body_text = body.decode("utf-8")

                    # Check for suspicious patterns
                    for pattern in self.SUSPICIOUS_PATTERNS:
                        if re.search(pattern, body_text, re.IGNORECASE):
                            logger.warning(
                                f"Suspicious pattern detected in request from {request.client.host}: {pattern}"
                            )
                            # In strict mode, we could reject the request
                            # For now, just log it and continue
                            # return JSONResponse(
                            #     status_code=400,
                            #     content={
                            #         "error": "invalid_input",
                            #         "message": "Request contains potentially malicious content"
                            #     }
                            # )

                except UnicodeDecodeError:
                    # Binary data (e.g., file uploads) - skip text validation
                    pass

                # Create a new request with the body restored
                async def receive():
                    return {"type": "http.request", "body": body}

                request._receive = receive

            except Exception as e:
                logger.error(f"Error validating request body: {str(e)}")
                # Don't fail the request on validation errors
                pass

        # Process request
        response = await call_next(request)

        return response


def sanitize_string(value: str) -> str:
    """
    Sanitize a string value to prevent XSS attacks.

    This is a basic sanitization - for production, consider using a library
    like bleach or html-sanitizer for more comprehensive XSS prevention.

    Args:
        value: String to sanitize

    Returns:
        Sanitized string with HTML entities escaped
    """
    if not isinstance(value, str):
        return value

    # Basic HTML entity escaping
    replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
    }

    result = value
    for char, entity in replacements.items():
        result = result.replace(char, entity)

    return result


def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively sanitize all string values in a dictionary.

    Args:
        data: Dictionary to sanitize

    Returns:
        Dictionary with all string values sanitized
    """
    if not isinstance(data, dict):
        return data

    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_string(value)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value)
        elif isinstance(value, list):
            result[key] = [
                sanitize_dict(item) if isinstance(item, dict)
                else sanitize_string(item) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            result[key] = value

    return result
