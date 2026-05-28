import sys

from celery import Celery
from app.core.config import settings
from app.core.redis import get_celery_ssl_options, get_normalized_redis_url

_broker_url = get_normalized_redis_url()
_ssl_opts = get_celery_ssl_options()

celery_app = Celery(
    "algotrader",
    broker=_broker_url,
    backend=_broker_url,
    include=["app.workers.tasks"],
)

# Windows cannot use the default prefork pool (multiprocessing errors on shutdown).
_worker_defaults: dict = {
    "broker_connection_retry_on_startup": True,
}
if sys.platform == "win32":
    _worker_defaults["worker_pool"] = "solo"
    _worker_defaults["worker_concurrency"] = 1

_celery_conf: dict = {
    "task_serializer": "json",
    "result_serializer": "json",
    "accept_content": ["json"],
    "timezone": "UTC",
    "enable_utc": True,
    "task_track_started": True,
    **_worker_defaults,
    "beat_schedule": {
        "update-price-cache-every-2s": {
            "task": "app.workers.tasks.update_price_cache",
            "schedule": 2.0,
        },
        "fetch-candles-every-minute": {
            "task": "app.workers.tasks.fetch_all_candles",
            "schedule": 60.0,
        },
    },
}

# Upstash / any rediss:// broker needs explicit SSL (CERT_NONE for managed TLS)
if _ssl_opts:
    _celery_conf["broker_use_ssl"] = _ssl_opts
    _celery_conf["redis_backend_use_ssl"] = _ssl_opts

celery_app.conf.update(**_celery_conf)


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
