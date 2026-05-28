from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _asyncpg_connect_args(database_url: str) -> dict:
    """Cloud Postgres (Neon, etc.) requires SSL; asyncpg does not accept sslmode= in the URL."""
    host = urlparse(database_url.replace("postgresql+asyncpg://", "postgresql://")).hostname or ""
    if any(domain in host for domain in ("neon.tech", "supabase.co", "render.com")):
        return {"ssl": True}
    return {}


engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=_asyncpg_connect_args(settings.DATABASE_URL),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
