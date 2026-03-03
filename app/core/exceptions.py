from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

import logging

logger = logging.getLogger(__name__)

async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": exc.detail},
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    # Formatting pydantic errors for better readability
    formatted_errors = [{"field": e.get("loc")[-1], "message": e.get("msg")} for e in errors]
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "message": "Validasyon Hatası (Unprocessable Entity)",
            "details": formatted_errors
        },
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": "İç Veritabanı Hatası Sunucu Tarafından Engellendi"},
    )
