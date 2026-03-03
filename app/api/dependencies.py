from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import decode_access_token
from app.core.redis import is_blacklisted
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """JWT access token doğrulayıp mevcut kullanıcıyı döner"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token geçerli değil veya süresi dolmuş",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        raise credentials_exception

    email: str = payload["sub"]
    
    # Redis blacklist kontrolü
    jti = payload.get("jti")
    if jti:
        try:
            if await is_blacklisted(jti):
                raise credentials_exception
        except RuntimeError:
            # Redis bağlı değilse blacklist kontrolünü atla
            pass

    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Kullanıcı pasif durumda")

    return user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Sadece superuser erişimi"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yeterli izne sahip değilsiniz"
        )
    return current_user
