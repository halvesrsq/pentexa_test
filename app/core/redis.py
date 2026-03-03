"""
Redis Async Client — Token blacklisting, login attempt tracking, cache
"""
import logging
from typing import Optional
from redis.asyncio import Redis, ConnectionPool

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Singleton Redis async client with connection pooling"""

    def __init__(self):
        self._pool: Optional[ConnectionPool] = None
        self._redis: Optional[Redis] = None

    async def initialize(self) -> None:
        """Uygulama başlangıcında çağrılır (lifespan)"""
        self._pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=20,
            decode_responses=True,
        )
        self._redis = Redis(connection_pool=self._pool)
        # Bağlantı testi
        await self._redis.ping()
        logger.info("Redis bağlantısı kuruldu ✓")

    async def close(self) -> None:
        """Uygulama kapanışında çağrılır"""
        if self._redis:
            await self._redis.close()
        if self._pool:
            await self._pool.disconnect()
        logger.info("Redis bağlantısı kapatıldı ✓")

    @property
    def client(self) -> Redis:
        if not self._redis:
            raise RuntimeError("Redis henüz initialize edilmedi. Önce initialize() çağırın.")
        return self._redis

    # ---- Token Blacklisting ----

    async def blacklist_token(self, jti: str, ttl_seconds: int) -> None:
        """Token JTI'sini blacklist'e ekler (TTL ile otomatik silinir)"""
        key = f"blacklist:{jti}"
        await self.client.setex(key, max(ttl_seconds, 1), "1")

    async def is_blacklisted(self, jti: str) -> bool:
        """Token'ın blacklist'te olup olmadığını kontrol eder"""
        key = f"blacklist:{jti}"
        return await self.client.exists(key) > 0

    # ---- Login Attempt Tracking ----

    async def increment_login_attempts(self, email: str) -> int:
        """Hatalı giriş sayacını artırır, ilk denemede TTL başlatır"""
        key = f"login_attempts:{email}"
        count = await self.client.incr(key)
        if count == 1:
            # İlk hatalı giriş → lockout süresi kadar TTL
            await self.client.expire(key, settings.LOGIN_LOCKOUT_MINUTES * 60)
        return count

    async def get_login_attempts(self, email: str) -> int:
        """Mevcut hatalı giriş sayısını döner"""
        key = f"login_attempts:{email}"
        val = await self.client.get(key)
        return int(val) if val else 0

    async def reset_login_attempts(self, email: str) -> None:
        """Başarılı giriş sonrası sayacı sıfırlar"""
        key = f"login_attempts:{email}"
        await self.client.delete(key)

    async def is_account_locked(self, email: str) -> bool:
        """Hesabın kilitli olup olmadığını kontrol eder"""
        attempts = await self.get_login_attempts(email)
        return attempts >= settings.MAX_LOGIN_ATTEMPTS


# Global singleton instance
redis_client = RedisClient()


# ---- Convenience fonksiyonları (import kolaylığı) ----

async def blacklist_token(jti: str, ttl_seconds: int) -> None:
    await redis_client.blacklist_token(jti, ttl_seconds)

async def is_blacklisted(jti: str) -> bool:
    return await redis_client.is_blacklisted(jti)

async def increment_login_attempts(email: str) -> int:
    return await redis_client.increment_login_attempts(email)

async def reset_login_attempts(email: str) -> None:
    await redis_client.reset_login_attempts(email)

async def is_account_locked(email: str) -> bool:
    return await redis_client.is_account_locked(email)
