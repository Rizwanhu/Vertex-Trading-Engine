from app.workers.celery_app import celery_app
from app.core.config import settings
import httpx
import asyncio

SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"]
BINANCE_BASE = "https://testnet.binance.vision/api" if settings.BINANCE_TESTNET else "https://api.binance.com/api"


@celery_app.task(name="app.workers.tasks.execute_order")
def execute_order(order_id: int):
    """Execute a pending order against the broker API."""
    import asyncio
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.order import Order, OrderStatus

    # Use sync engine for Celery tasks
    engine = create_engine(settings.DATABASE_SYNC_URL)
    with Session(engine) as db:
        order = db.get(Order, order_id)
        if not order:
            return {"error": f"Order {order_id} not found"}
        if order.status != OrderStatus.PENDING:
            return {"error": f"Order {order_id} not in PENDING state"}

        try:
            # TODO: Route to appropriate broker (Binance / Alpaca / MT5)
            # Simulate successful execution for now
            from datetime import datetime, timezone
            order.status = OrderStatus.FILLED
            order.filled_price = order.price or 0.0
            order.filled_at = datetime.now(timezone.utc)
            db.commit()
            return {"success": True, "order_id": order_id}
        except Exception as e:
            order.status = OrderStatus.FAILED
            db.commit()
            return {"error": str(e)}


@celery_app.task(name="app.workers.tasks.update_price_cache")
def update_price_cache():
    """Fetch latest prices and store in Redis cache."""
    import redis
    r = redis.from_url(settings.REDIS_URL, decode_responses=True)

    for symbol in SYMBOLS:
        try:
            import requests
            url = f"{BINANCE_BASE}/v3/ticker/price"
            resp = requests.get(url, params={"symbol": symbol}, timeout=3)
            if resp.ok:
                price = float(resp.json()["price"])
                r.setex(f"price:{symbol}", 5, str(price))
        except Exception:
            pass


@celery_app.task(name="app.workers.tasks.fetch_all_candles")
def fetch_all_candles():
    """Fetch and store candles for all active bot symbols."""
    # TODO: query DB for active bot symbols and fetch candles
    pass


@celery_app.task(name="app.workers.tasks.run_bot_tick")
def run_bot_tick(bot_id: int):
    """Run one tick for an active trading bot."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.bot import Bot, BotStatus
    from datetime import datetime, timezone

    engine = create_engine(settings.DATABASE_SYNC_URL)
    with Session(engine) as db:
        bot = db.get(Bot, bot_id)
        if not bot or bot.status != BotStatus.RUNNING:
            return

        # TODO: fetch candles → run strategy → check signal → risk check → place order
        bot.last_run_at = datetime.now(timezone.utc)
        db.commit()
