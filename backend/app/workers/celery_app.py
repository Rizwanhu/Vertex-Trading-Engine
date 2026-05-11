from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "algotrader",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        # Fetch candles every minute for active bots
        "fetch-candles-every-minute": {
            "task": "app.workers.tasks.fetch_all_candles",
            "schedule": 60.0,
        },
        # Update price cache every 2 seconds
        "update-price-cache": {
            "task": "app.workers.tasks.update_price_cache",
            "schedule": 2.0,
        },
    },
)


def execute_order_task(order_id: int):
    """Proxy so API can call this without importing task directly."""
    from app.workers.tasks import execute_order
    execute_order.delay(order_id)
