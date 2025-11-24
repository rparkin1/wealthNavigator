"""
Pytest configuration and shared fixtures for backend tests
"""

import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.base import Base
from app.main import app
from app.core.database import get_db


# Test database URL - Using SQLite for tests (no external database required)
# For true isolation, use in-memory: sqlite+aiosqlite:///:memory:
# For debugging, use file-based: sqlite+aiosqlite:///./test.db
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def async_engine():
    """Create async engine for testing."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
def async_session_maker(async_engine):
    """Session factory shared between tests and FastAPI dependency override."""
    return async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


@pytest.fixture(scope="function")
async def async_session(async_session_maker) -> AsyncGenerator[AsyncSession, None]:
    """Create async session for testing."""
    async with async_session_maker() as session:
        yield session


@pytest.fixture(scope="function")
def sync_session():
    """Create synchronous session for tests that run without asyncio."""
    sync_engine = create_engine(
        TEST_DATABASE_URL.replace("+aiosqlite", ""),
        future=True,
    )
    SessionLocal = sessionmaker(bind=sync_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        sync_engine.dispose()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "test-user-001",
        "email": "test@example.com",
        "hashed_password": "hashed_password",
        "is_active": True,
        "is_superuser": False,
        "full_name": "Test User",
        "age": 35,
        "risk_tolerance": 0.6,
        "tax_rate": 0.24,
        "preferences": {}
    }


@pytest.fixture
def sample_thread_data():
    """Sample thread data for testing."""
    return {
        "id": "thread-001",
        "user_id": "test-user-001",
        "title": "Retirement Planning",
        "goal_types": ["retirement"]
    }


@pytest.fixture
def sample_goal_data():
    """Sample goal data for testing."""
    return {
        "id": "goal-001",
        "user_id": "test-user-001",
        "thread_id": "thread-001",
        "name": "Retirement at 60",
        "category": "retirement",
        "target_amount": 2000000.0,
        "target_date": "2050-01-01",
        "priority": "essential",
        "current_funding": 50000.0,
        "monthly_contribution": 1500.0,
        "success_probability": 0.75
    }


@pytest.fixture
def sample_portfolio_data():
    """Sample portfolio data for testing."""
    return {
        "allocation": {
            "US_LargeCap": 0.35,
            "US_SmallCap": 0.20,
            "International": 0.17,
            "Bonds": 0.23,
            "REITs": 0.05
        },
        "expected_return": 0.088,
        "expected_volatility": 0.121,
        "sharpe_ratio": 0.40
    }


@pytest.fixture(scope="function")
async def client(async_engine) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_user_id() -> str:
    """Provide a test user ID."""
    return "test-user-123"


@pytest.fixture
async def test_user(async_session):
    """Create a test user in the database."""
    from tests.utils.auth_helpers import create_test_user
    from sqlalchemy import select
    from app.models.user import User

    result = await async_session.execute(
        select(User).where(User.email == "test@example.com")
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    user = await create_test_user(
        async_session,
        email="test@example.com",
        password="testpass123",
        user_id="test-user-123"
    )
    return user


@pytest.fixture
async def auth_headers(async_session):
    """Create a real JWT for a test user so auth-dependent endpoints return 200."""
    from tests.utils.auth_helpers import create_test_user, create_test_token
    from sqlalchemy import select
    from app.models.user import User

    result = await async_session.execute(
        select(User).where(User.email == "test@example.com")
    )
    user = result.scalar_one_or_none()

    if not user:
        user = await create_test_user(
            async_session,
            email="test@example.com",
            password="testpass123",
            user_id="test-user-123",
        )

    token = create_test_token(user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def authenticated_client(client, auth_headers) -> AsyncClient:
    """Create an authenticated HTTP client for testing."""
    client.headers.update(auth_headers)
    return client


@pytest.fixture
def db(request, async_session, sync_session):
    """Provide database session for tests (async for asyncio-marked tests, sync otherwise)."""

    if request.node.get_closest_marker("asyncio"):
        yield async_session
    else:
        yield sync_session


@pytest.fixture(autouse=True)
async def override_database_dependency(async_session_maker):
    """
    Override the application-level database dependency so API tests use the
    in-memory SQLite session instead of attempting to reach an external
    PostgreSQL instance.
    """

    async def _get_test_db():
        async with async_session_maker() as session:
            try:
                yield session
            finally:
                await session.rollback()

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def auth_headers():
    """Mock authentication headers for API tests"""
    return {"Authorization": "Bearer test_token"}


@pytest.fixture
def test_user_token():
    """Mock user token for integration tests"""
    return "test_token"
