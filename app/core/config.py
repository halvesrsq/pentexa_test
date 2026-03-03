from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pentexa Backend API"
    API_V1_STR: str = "/api/v1"
    
    # JWT — Güvenlik
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Redis
    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Login Protection
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    
    # CORS — Frontend URL (ana URL)
    FRONTEND_URL: str
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        """Birden fazla dev ortam portunu destekle"""
        origins = [self.FRONTEND_URL]
        common_ports = [
            "http://localhost:3000",
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
        ]
        for origin in common_ports:
            if origin not in origins:
                origins.append(origin)
        return origins
    
    # Database — PostgreSQL
    DATABASE_URL: str
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
