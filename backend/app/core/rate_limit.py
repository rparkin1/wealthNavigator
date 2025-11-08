"""
Rate limiting configuration and utilities.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
RATE_LIMITS = {
    "auth_login": "5/minute",  # 5 login attempts per minute
    "auth_register": "3/hour",  # 3 registrations per hour
    "auth_reset_password": "3/hour",  # 3 password reset requests per hour
    "api_default": "100/minute",  # Default API rate limit
    "api_heavy": "10/minute",  # Heavy operations (Monte Carlo, etc.)
}
