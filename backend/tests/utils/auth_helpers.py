"""
Authentication utilities for testing.
"""

from datetime import timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.user import User


async def create_test_user(
    db: AsyncSession,
    email: str = "test@example.com",
    password: str = "testpass123",
    user_id: Optional[str] = None
) -> User:
    """
    Create a test user in the database.

    Args:
        db: Database session
        email: User email
        password: Plain text password (will be hashed)
        user_id: Optional user ID (defaults to generate UUID)

    Returns:
        Created User object
    """
    import uuid

    if user_id is None:
        user_id = str(uuid.uuid4())

    user = User(
        id=user_id,
        email=email,
        hashed_password=get_password_hash(password),
        is_active=True,
        is_superuser=False
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


def create_test_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token for testing.

    Args:
        user_id: User ID to encode in token
        expires_delta: Optional expiration time delta

    Returns:
        JWT access token string
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=1)

    return create_access_token(
        data={"sub": user_id},
        expires_delta=expires_delta
    )


async def get_auth_headers(
    db: AsyncSession,
    email: str = "test@example.com",
    password: str = "testpass123"
) -> dict:
    """
    Get authentication headers with Bearer token for testing.

    Args:
        db: Database session
        email: User email
        password: User password

    Returns:
        Dictionary with Authorization header
    """
    # Create or get test user
    user = await create_test_user(db, email=email, password=password)

    # Create token
    token = create_test_token(user.id)

    return {
        "Authorization": f"Bearer {token}"
    }
