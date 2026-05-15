"""
WebSocket relay endpoint: /api/ws/prices

Subscribes to Redis pub/sub channel "live_prices" (populated by BinanceWebsocketService)
and streams price updates to connected frontend clients.
"""
import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/prices")
async def ws_prices(websocket: WebSocket):
    """
    Stream live price ticks to the frontend.
    Each message is JSON: {"symbol": "BTCUSDT", "price": "67000.00", "change": "1.23"}
    """
    await websocket.accept()
    from app.core.redis import get_redis

    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe("live_prices")
    logger.info("WS client connected — subscribed to live_prices")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                # data is bytes or str depending on redis client
                if isinstance(data, bytes):
                    data = data.decode()
                await websocket.send_text(data)
    except WebSocketDisconnect:
        logger.info("WS client disconnected")
    except Exception as exc:
        logger.warning("WS error: %s", exc)
    finally:
        await pubsub.unsubscribe("live_prices")
        await pubsub.close()


@router.websocket("/orders/{user_id}")
async def ws_orders(websocket: WebSocket, user_id: int):
    """
    Stream order status updates for a specific user.
    Published to Redis channel "orders:{user_id}" when orders are filled/failed.
    """
    await websocket.accept()
    from app.core.redis import get_redis

    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = f"orders:{user_id}"
    await pubsub.subscribe(channel)
    logger.info("WS order stream connected for user %s", user_id)

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode()
                await websocket.send_text(data)
    except WebSocketDisconnect:
        logger.info("WS order stream disconnected for user %s", user_id)
    except Exception as exc:
        logger.warning("WS orders error: %s", exc)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
