import redis.asyncio as aioredis
from app.core.config import settings

_redis_client = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def set_price_cache(symbol: str, price: float, ttl: int = 2):
    r = await get_redis()
    await r.setex(f"price:{symbol.upper()}", ttl, str(price))


async def get_price_cache(symbol: str) -> float | None:
    r = await get_redis()
    val = await r.get(f"price:{symbol.upper()}")
    return float(val) if val else None
