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
    # Default beat schedule — per-bot schedules are added dynamically
    beat_schedule={
        "update-price-cache-every-2s": {
            "task": "app.workers.tasks.update_price_cache",
            "schedule": 2.0,
        },
        "fetch-candles-every-minute": {
            "task": "app.workers.tasks.fetch_all_candles",
            "schedule": 60.0,
        },
    },
)


# ─────────────────────────────────────────────────────────────────────────────
# Proxy helpers so API layer can call tasks without circular imports
# ─────────────────────────────────────────────────────────────────────────────

def execute_order_task(order_id: int):
    """Proxy so API can queue execute_order without importing tasks directly."""
    from app.workers.tasks import execute_order
    execute_order.delay(order_id)


def schedule_bot_tick(bot_id: int, interval_seconds: int = 60):
    """
    Add a periodic task for a bot to celery beat's dynamic schedule.
    Call this when a bot is started.
    """
    celery_app.conf.beat_schedule[f"bot-tick-{bot_id}"] = {
        "task": "app.workers.tasks.run_bot_tick",
        "schedule": float(interval_seconds),
        "args": (bot_id,),
    }
    celery_app.conf.update()


def unschedule_bot_tick(bot_id: int):
    """Remove a bot's periodic task from celery beat's schedule."""
    key = f"bot-tick-{bot_id}"
    celery_app.conf.beat_schedule.pop(key, None)
    celery_app.conf.update()
