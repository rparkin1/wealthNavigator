"""Database configuration and session management."""
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
from app.core.config import settings
from app.models.base import Base


def _normalize_database_urls(database_url: str) -> tuple[str, str, bool]:
    """Return async/sync URLs and whether we're using SQLite."""
    url = make_url(database_url)
    is_sqlite = url.get_backend_name().startswith("sqlite")

    if is_sqlite and "+aiosqlite" not in database_url:
        async_url = database_url.replace("sqlite://", "sqlite+aiosqlite://")
        sync_url = database_url
    elif is_sqlite:
        async_url = database_url
        sync_url = database_url.replace("+aiosqlite", "")
    else:
        async_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
        sync_url = database_url

    return async_url, sync_url, is_sqlite


async_database_url, sync_database_url, is_sqlite = _normalize_database_urls(settings.DATABASE_URL)

# Engine kwargs differ for SQLite vs. pooled backends like Postgres
async_engine_kwargs = {"pool_pre_ping": True, "echo": settings.DEBUG}
sync_engine_kwargs = {"pool_pre_ping": True}
if not is_sqlite:
    async_engine_kwargs.update(pool_size=10, max_overflow=20)
    sync_engine_kwargs.update(pool_size=10, max_overflow=20)

# Create async database engine (for FastAPI endpoints)
async_engine = create_async_engine(
    async_database_url,
    **async_engine_kwargs,
)

# Create sync engine (for Alembic migrations)
engine = create_engine(
    sync_database_url,
    **sync_engine_kwargs,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Create sync session factory (for backwards compatibility)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db():
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
