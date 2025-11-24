"""
API dependencies used across routers (auth, DB sessions).

Provides JWT-based authentication and re-exports get_db.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.security import decode_access_token
from app.core.config import get_settings
# Re-export async DB dependency so routers can import from app.api.deps
from app.core.database import get_db  # noqa: F401
from app.models.user import User

# Type alias for dependency injection
CurrentUser = User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.

    In DEBUG mode, if no token is provided, returns a test user.

    Args:
        token: JWT access token from Authorization header
        db: Database session

    Returns:
        Authenticated User object

    Raises:
        HTTPException: If token is invalid or user not found (in production)
    """
    settings = get_settings()

    async def _get_or_create_test_user() -> User:
        """Return a test user for debug/test environments."""
        test_user_id = "test-user-123"
        test_email = "test@example.com"
        stmt = select(User).where(User.id == test_user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            email_query = select(User).where(User.email == test_email)
            email_result = await db.execute(email_query)
            user = email_result.scalar_one_or_none()

        if not user:
            from app.core.security import get_password_hash

            user = User(
                id=test_user_id,
                email=test_email,
                hashed_password=get_password_hash("testpassword123"),
                full_name="Test User",
                is_active=True,
                is_superuser=False,
            )
            db.add(user)
            try:
                await db.commit()
            except IntegrityError:
                await db.rollback()
                retry_result = await db.execute(email_query)
                user = retry_result.scalar_one_or_none()
                if not user:
                    raise
            else:
                await db.refresh(user)

        return user

    # Development mode: allow access without token
    if settings.DEBUG and not token:
        return await _get_or_create_test_user()

    # Production mode: require valid token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    # Decode JWT token
    payload = decode_access_token(token)
    if payload is None:
        if settings.DEBUG:
            return await _get_or_create_test_user()
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        if settings.DEBUG:
            return await _get_or_create_test_user()
        raise credentials_exception

    return user
