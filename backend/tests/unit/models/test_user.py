"""
Unit tests for User model
"""

import pytest
from app.models.user import User


@pytest.mark.unit
@pytest.mark.asyncio
class TestUserModel:
    """Test User database model."""

    async def test_create_user(self, async_session, sample_user_data):
        """Test creating a user."""
        user = User(**sample_user_data)
        async_session.add(user)
        await async_session.commit()
        await async_session.refresh(user)

        assert user.id == sample_user_data["id"]
        assert user.email == sample_user_data["email"]
        assert user.is_active is True

    async def test_user_relationships(self, async_session, sample_user_data):
        """Test user has correct relationship attributes."""
        user = User(**sample_user_data)

        assert hasattr(user, "threads")
        assert hasattr(user, "goals")
        assert hasattr(user, "portfolios")

    def test_user_risk_tolerance_validation(self, sample_user_data):
        """Test risk tolerance is within valid range."""
        user = User(**sample_user_data)

        assert 0 <= user.risk_tolerance <= 1

    def test_user_tax_rate_validation(self, sample_user_data):
        """Test tax rate is within valid range."""
        user = User(**sample_user_data)

        assert 0 <= user.tax_rate <= 1
