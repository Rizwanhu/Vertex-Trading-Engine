"""
Notifications service — Telegram + (future) email.
Uses sync HTTP for Celery tasks and async HTTP for FastAPI endpoints.
"""
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_telegram(message: str) -> bool:
    """Async Telegram notification (for use in FastAPI async endpoints)."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return False
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(url, json={
                "chat_id": settings.TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
            })
            return resp.status_code == 200
    except Exception as exc:
        logger.warning("Telegram send failed: %s", exc)
        return False


def send_telegram_sync(message: str) -> bool:
    """Sync Telegram notification (for use in Celery tasks)."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return False
    import requests
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        resp = requests.post(url, json={
            "chat_id": settings.TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML",
        }, timeout=5)
        return resp.status_code == 200
    except Exception as exc:
        logger.warning("Telegram send failed: %s", exc)
        return False
