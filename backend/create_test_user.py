"""Create a test user for development"""
import asyncio
import uuid
from app.core.database import AsyncSessionLocal
from app.models.user import User


async def create_test_user():
    """Create a test user with ID 'test-user-123'"""
    async with AsyncSessionLocal() as db:
        # Check if user exists
        from sqlalchemy import select
        result = await db.execute(
            select(User).where(User.id == "test-user-123")
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"✅ Test user already exists: {existing_user.email}")
            print(f"   ID: {existing_user.id}")
            print(f"   Name: {existing_user.full_name}")
            return

        # Create new test user
        test_user = User(
            id="test-user-123",
            email="test@wealthnavigator.ai",
            hashed_password="hashed_password_placeholder",  # Not used in dev
            is_active=True,
            is_superuser=False,
            full_name="Test User",
            age=35,
            risk_tolerance=0.6,
            tax_rate=0.24,
            preferences={}
        )

        db.add(test_user)
        await db.commit()
        await db.refresh(test_user)

        print(f"✅ Test user created successfully!")
        print(f"   ID: {test_user.id}")
        print(f"   Email: {test_user.email}")
        print(f"   Name: {test_user.full_name}")
        print(f"   Risk Tolerance: {test_user.risk_tolerance}")
        print(f"   Tax Rate: {test_user.tax_rate}")


if __name__ == "__main__":
    asyncio.run(create_test_user())
