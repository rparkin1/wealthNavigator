"""
Application Configuration
Handles environment variables and settings
"""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import Optional, Union, List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "WealthNavigator AI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False  # Default to False for security

    # Authentication
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Anthropic Claude
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-5-20250929"

    # Plaid Configuration
    PLAID_CLIENT_ID: Optional[str] = None
    PLAID_SECRET: Optional[str] = None
    PLAID_ENV: str = "sandbox"  # sandbox, development, or production
    PLAID_PRODUCTS: List[str] = ["auth", "transactions", "investments"]
    PLAID_COUNTRY_CODES: List[str] = ["US", "CA"]
    PLAID_REDIRECT_URI: Optional[str] = None  # For OAuth flow
    PLAID_WEBHOOK_VERIFICATION_KEY: Optional[str] = None  # For webhook signature verification

    # Security
    SECRET_KEY: str
    ENCRYPTION_KEY: Optional[str] = None  # For MFA secrets and sensitive data (Fernet key)

    # Monitoring (Optional)
    SENTRY_DSN: Optional[str] = None  # Sentry error tracking

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STORAGE: str = "memory://"  # Use "redis://localhost:6379" in production

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields in .env file
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Allow CORS_ORIGINS to be provided as JSON string or comma-separated string.

        Examples:
          CORS_ORIGINS='["http://localhost:5173","http://localhost:3000"]'
          CORS_ORIGINS='http://localhost:5173,http://localhost:3000'
        """
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            # JSON list
            if s.startswith("["):  # looks like JSON
                try:
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return [str(x) for x in parsed]
                except Exception:
                    pass
            # comma-separated
            return [i.strip() for i in s.split(",") if i.strip()]
        # Fallback default
        return ["http://localhost:5173", "http://localhost:3000"]


# Global settings instance
settings = Settings()

def get_settings() -> Settings:
    return settings
