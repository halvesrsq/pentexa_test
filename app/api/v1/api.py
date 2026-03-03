from fastapi import APIRouter
from app.api.v1.routes import auth, scans

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
