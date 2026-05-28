import ssl
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import redis
import redis.asyncio as aioredis

from app.core.config import settings

_redis_client: aioredis.Redis | None = None


def _parse_redis_url(url: str) -> tuple[str, dict]:
    """
    Normalize Redis URL for redis-py (async + sync).
    For rediss://, passes ssl_cert_reqs via kwargs (not URL query).
    """
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)

    kwargs: dict = {"decode_responses": True}
    if parsed.scheme == "rediss":
        # redis-py accepts string or ssl constant
        cert_reqs = (query.get("ssl_cert_reqs") or ["none"])[0].lower()
        if cert_reqs in ("cert_none", "none"):
            kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
        elif cert_reqs in ("cert_optional", "optional"):
            kwargs["ssl_cert_reqs"] = ssl.CERT_OPTIONAL
        elif cert_reqs in ("cert_required", "required"):
            kwargs["ssl_cert_reqs"] = ssl.CERT_REQUIRED
        else:
            kwargs["ssl_cert_reqs"] = ssl.CERT_NONE

    # Strip query — redis-py gets SSL via kwargs above
    clean_url = urlunparse(parsed._replace(query="", fragment=""))
    return clean_url, kwargs


def get_normalized_redis_url() -> str:
    """
    Broker/backend URL for Celery + Kombu.
    Celery requires ssl_cert_reqs in the URL query for rediss:// (Upstash).
    """
    parsed = urlparse(settings.REDIS_URL)
    query = parse_qs(parsed.query, keep_blank_values=True)

    if parsed.scheme == "rediss" and "ssl_cert_reqs" not in query:
        query["ssl_cert_reqs"] = ["CERT_NONE"]

    query_str = urlencode({k: v[0] for k, v in query.items()}) if query else ""
    return urlunparse(parsed._replace(query=query_str, fragment=""))


def get_celery_ssl_options() -> dict | None:
    """SSL dict for Celery broker_use_ssl / redis_backend_use_ssl."""
    parsed = urlparse(settings.REDIS_URL)
    if parsed.scheme != "rediss":
        return None
    return {"ssl_cert_reqs": ssl.CERT_NONE}


def _async_redis_from_url(url: str) -> aioredis.Redis:
    clean_url, kwargs = _parse_redis_url(url)
    return aioredis.from_url(clean_url, **kwargs)


def get_sync_redis() -> redis.Redis:
    """Sync Redis client for Celery tasks."""
    clean_url, kwargs = _parse_redis_url(settings.REDIS_URL)
    return redis.from_url(clean_url, **kwargs)


async def get_redis() -> aioredis.Redis:
    """Async Redis client for FastAPI."""
    global _redis_client
    if _redis_client is None:
        _redis_client = _async_redis_from_url(settings.REDIS_URL)
    return _redis_client


async def set_price_cache(symbol: str, price: float, ttl: int = 2):
    r = await get_redis()
    await r.setex(f"price:{symbol.upper()}", ttl, str(price))


async def get_price_cache(symbol: str) -> float | None:
    r = await get_redis()
    val = await r.get(f"price:{symbol.upper()}")
    return float(val) if val else None
