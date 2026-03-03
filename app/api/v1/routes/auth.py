from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core import security
from app.core.security import decode_access_token
from app.db.session import get_db
from app.api.dependencies import get_current_user, oauth2_scheme
from app.models.user import User as UserModel
from app.schemas.user import UserCreate, User as UserSchema
from app.schemas.token import Token, RefreshTokenRequest

router = APIRouter()


# ---- Helpers ----

async def _try_redis(coro):
    """Redis çağrısını güvenli şekilde yapar — bağlantı yoksa sessizce atlar"""
    try:
        return await coro
    except RuntimeError:
        return None


async def _log_audit(db: AsyncSession, request: Request, action: str,
                     user_id: int = None, details: str = None):
    """Audit log kaydı oluşturur"""
    try:
        from app.models.audit_log import AuditLog
        log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", "")[:500],
            details=details,
        )
        db.add(log)
        await db.commit()
    except Exception:
        # Audit log hatası işlemi durdurmamali
        pass


# ---- Endpoints ----

@router.post("/login", response_model=Token)
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 uyumlu login — access + refresh token döner
    Brute-force koruması: {MAX_LOGIN_ATTEMPTS} hatalı deneme → {LOGIN_LOCKOUT_MINUTES}dk kilit
    """
    # 1. Brute-force kontrol
    from app.core.redis import is_account_locked, increment_login_attempts, reset_login_attempts
    locked = await _try_redis(is_account_locked(form_data.username))
    if locked:
        await _log_audit(db, request, "login_locked", details=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Çok fazla başarısız giriş denemesi. {settings.LOGIN_LOCKOUT_MINUTES} dakika bekleyin.",
        )

    # 2. Kullanıcı kontrol
    result = await db.execute(select(UserModel).filter(UserModel.email == form_data.username))
    user = result.scalars().first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        await _try_redis(increment_login_attempts(form_data.username))
        await _log_audit(db, request, "login_failed", details=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta veya şifre",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Pasif kullanıcı")

    # 3. Başarılı → sayacı sıfırla
    await _try_redis(reset_login_attempts(form_data.username))

    # 4. Token oluştur
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # 5. Audit log
    await _log_audit(db, request, "login_success", user_id=user.id)

    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(
            user.email, expires_delta=refresh_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    body: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Refresh token ile yeni access + refresh token çifti al (token rotation)
    """
    payload = security.decode_refresh_token(body.refresh_token)
    if payload is None or payload.get("sub") is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token geçersiz veya süresi dolmuş",
        )

    email = payload["sub"]

    # Eski refresh token blacklist kontrolü
    from app.core.redis import is_blacklisted, blacklist_token
    old_jti = payload.get("jti")
    if old_jti:
        blacklisted = await _try_redis(is_blacklisted(old_jti))
        if blacklisted:
            raise HTTPException(status_code=401, detail="Token iptal edilmiş")

    result = await db.execute(select(UserModel).filter(UserModel.email == email))
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı veya pasif")

    # Eski refresh token'ı blacklist'e ekle (token rotation güvenliği)
    if old_jti and payload.get("exp"):
        ttl = payload["exp"] - int(datetime.now(timezone.utc).timestamp())
        await _try_redis(blacklist_token(old_jti, max(ttl, 1)))

    # Yeni token çifti döndür
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # Audit log
    await _log_audit(db, request, "token_refresh", user_id=user.id)

    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(
            user.email, expires_delta=refresh_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(
    request: Request,
    current_user: UserModel = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Mevcut token'ı blacklist'e ekleyerek geçersiz kılar.
    """
    from app.core.redis import blacklist_token

    payload = decode_access_token(token)
    if payload and payload.get("jti"):
        # Token'ın kalan süresini TTL olarak kullan
        ttl = payload["exp"] - int(datetime.now(timezone.utc).timestamp())
        await _try_redis(blacklist_token(payload["jti"], max(ttl, 1)))

    # Audit log
    await _log_audit(db, request, "logout", user_id=current_user.id)

    return {"message": "Oturum başarıyla kapatıldı"}


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Sisteme yeni kullanıcı kaydeder. Varsayılan rol: viewer
    """
    result = await db.execute(select(UserModel).filter(UserModel.email == user_in.email))
    user = result.scalars().first()

    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle sistemde bir kayıt mevcut.",
        )

    hashed_password = security.get_password_hash(user_in.password)

    # Varsayılan "viewer" rolünü bul
    from app.models.role import Role
    role_result = await db.execute(select(Role).filter(Role.name == "viewer"))
    default_role = role_result.scalars().first()

    db_user = UserModel(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=True,
        is_superuser=False,
        role_id=default_role.id if default_role else None,
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Audit log
    await _log_audit(db, request, "register", user_id=db_user.id)

    return db_user


@router.get("/me", response_model=UserSchema)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Mevcut kullanıcının kendi bilgilerini getirir (rol + izinler dahil).
    """
    return current_user
