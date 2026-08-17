from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from typing import AsyncGenerator

# Ensure we use asyncpg driver for async
async_db_url = settings.DATABASE_URL
sync_db_url = settings.DATABASE_URL

if async_db_url and async_db_url.startswith("postgresql://"):
    async_db_url = async_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create async engine
engine = create_async_engine(
    async_db_url,
    echo=False,
    future=True,
)

# Create sync engine for celery
sync_engine = create_engine(sync_db_url, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Create session maker
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Dependency to get DB session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
