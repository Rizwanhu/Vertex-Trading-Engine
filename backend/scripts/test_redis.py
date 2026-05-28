"""Quick Redis connectivity check: python scripts/test_redis.py"""
import asyncio

from app.core.redis import get_redis, get_sync_redis


async def main():
    r = await get_redis()
    await r.ping()
    print("Async Redis ping OK")
    await r.publish("live_prices", '{"symbol":"BTCUSDT","price":"1","change":"0"}')
    print("Async Redis publish OK")

    s = get_sync_redis()
    s.ping()
    s.setex("price:BTCUSDT", 10, "67000")
    print("Sync Redis OK (Celery path)")


if __name__ == "__main__":
    asyncio.run(main())
