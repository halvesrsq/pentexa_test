from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# PostgreSQL Async Engine — tuned for serverless (Vercel)
# Each lambda handles ~1 concurrent request, so we keep the pool small.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=3,
    pool_pre_ping=True,
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

# Dependency for API Routes
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
