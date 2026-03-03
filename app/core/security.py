import uuid
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError

from app.core.config import settings

# JWT configurations
ALGORITHM = "HS256"


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Kısa süreli access token oluşturur (varsayılan 15dk)"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Uzun süreli refresh token oluşturur (varsayılan 7 gün)"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    encoded_jwt = jwt.encode(to_encode, settings.REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Access token decode eder. Geçersizse None döner."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    """Refresh token decode eder. Geçersizse None döner."""
    try:
        payload = jwt.decode(token, settings.REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), 
        hashed_password.encode("utf-8")
    )

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")
