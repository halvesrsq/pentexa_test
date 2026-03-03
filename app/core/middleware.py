"""
Middlewares — CORS, Rate Limiting, Trusted Host
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from app.core.config import settings

# SlowAPI limiter — Redis backend
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    strategy="fixed-window",
)


def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Rate limit aşıldığında özel JSON response"""
    return JSONResponse(
        status_code=429,
        content={
            "error": True,
            "message": "İstek limiti aşıldı. Lütfen biraz bekleyin.",
            "retry_after": str(exc.detail),
        },
    )


def register_middlewares(app: FastAPI):
    # 1. CORS
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # 2. Rate Limiting (SlowAPI + Redis)
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # 3. Trusted Host
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["*"]
    )
