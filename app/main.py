"""
Pentexa Backend API — Vercel Serverless Entry
──────────────────────────────────────────────
Optimized for @vercel/python cold-start behaviour.
DB table creation and seed data run ONCE per cold start,
not on every incoming request.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.middleware import register_middlewares
from app.core.exceptions import (
    custom_http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
)
from app.db.session import engine, Base, AsyncSessionLocal
from app.api.v1.api import api_router

# Register all models so Base.metadata knows every table
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Cold-start guard ────────────────────────────────────────
# Vercel keeps the lambda warm for a few minutes. This flag
# ensures heavy init work runs only ONCE per cold start.
_initialized: bool = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _initialized

    if not _initialized:
        # 1. Database tables (idempotent — safe to call multiple times)
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Veritabanı tabloları kontrol edildi ✓")
        except Exception as e:
            logger.error(f"DB tablo oluşturma hatası: {e}")

        # 2. Seed data (roles + permissions)
        try:
            from app.db.seed import seed_roles_and_permissions
            async with AsyncSessionLocal() as session:
                await seed_roles_and_permissions(session)
        except Exception as e:
            logger.error(f"Seed data hatası: {e}")

        # 3. Redis connection
        from app.core.redis import redis_client
        try:
            await redis_client.initialize()
        except Exception as e:
            logger.warning(
                f"Redis bağlantısı kurulamadı: {e}. "
                "Token blacklisting devre dışı kalacak."
            )

        _initialized = True
        logger.info("Pentexa cold-start initialization tamamlandı ✓")
    else:
        logger.debug("Warm start — initialization atlandı.")

    yield

    # Cleanup (runs when the lambda is recycled)
    try:
        from app.core.redis import redis_client
        await redis_client.close()
    except Exception:
        pass


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Middlewares
    register_middlewares(app)

    # Exception Handlers
    app.add_exception_handler(HTTPException, custom_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)

    # Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/")
    def root():
        return {
            "project": settings.PROJECT_NAME,
            "status": "running",
            "version": "1.0",
            "docs": "/docs",
            "environment": "vercel" if os.environ.get("VERCEL") else "local",
        }

    return app


app = create_app()
