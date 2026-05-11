import asyncio
import json
import logging
from websockets import connect, ConnectionClosed
from app.core.config import settings
from app.core.redis import get_redis

logger = logging.getLogger(__name__)

class BinanceWebsocketService:
    def __init__(self):
        self.ws_url = "wss://stream.binance.com:9443/ws"
        self.streams = ["btcusdt@ticker", "ethusdt@ticker", "solusdt@ticker"]
        self.redis = None
        self.is_running = False

    async def connect_redis(self):
        if not self.redis:
            self.redis = await get_redis()

    async def run(self):
        await self.connect_redis()
        self.is_running = True
        
        # Combine streams: e.g. wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker
        stream_url = f"wss://stream.binance.com:9443/stream?streams={'/'.join(self.streams)}"
        
        while self.is_running:
            try:
                logger.info(f"Connecting to Binance WS: {stream_url}")
                async with connect(stream_url) as ws:
                    logger.info("Binance WS Connected.")
                    while self.is_running:
                        message = await ws.recv()
                        data = json.loads(message)
                        
                        if "data" in data and "s" in data["data"] and "c" in data["data"]:
                            symbol = data["data"]["s"]  # e.g., BTCUSDT
                            price = data["data"]["c"]   # Last price
                            change = data["data"]["P"]  # Price change percent
                            
                            # Cache in Redis: key="price:BTCUSDT"
                            await self.redis.set(f"price:{symbol}", price)
                            await self.redis.set(f"change:{symbol}", change)
                            
                            # Publish to a Pub/Sub channel for frontend WS clients
                            payload = json.dumps({"symbol": symbol, "price": price, "change": change})
                            await self.redis.publish("live_prices", payload)
                            
            except ConnectionClosed:
                logger.warning("Binance WS connection closed. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error in Binance WS: {e}")
                await asyncio.sleep(5)

    def stop(self):
        self.is_running = False

# Global instance
binance_ws = BinanceWebsocketService()
