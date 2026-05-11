import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.redis import set_price_cache

BINANCE_BASE = "https://testnet.binance.vision/api" if settings.BINANCE_TESTNET else "https://api.binance.com/api"


async def get_live_price(symbol: str) -> Optional[float]:
    """Fetch current price from Binance REST API."""
    url = f"{BINANCE_BASE}/v3/ticker/price"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params={"symbol": symbol.upper()})
            resp.raise_for_status()
            data = resp.json()
            price = float(data["price"])
            await set_price_cache(symbol, price)
            return price
    except Exception:
        return None


async def fetch_candles(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 200,
) -> List[Dict[str, Any]]:
    """Fetch OHLCV candles from Binance REST API."""
    url = f"{BINANCE_BASE}/v3/klines"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={
                "symbol": symbol.upper(),
                "interval": timeframe,
                "limit": limit,
            })
            resp.raise_for_status()
            raw = resp.json()
            return [
                {
                    "time": int(c[0]) // 1000,  # Unix seconds for TradingView
                    "open": float(c[1]),
                    "high": float(c[2]),
                    "low": float(c[3]),
                    "close": float(c[4]),
                    "volume": float(c[5]),
                }
                for c in raw
            ]
    except Exception:
        return []


async def get_ticker_24h(symbol: str) -> Optional[Dict]:
    """Fetch 24h ticker stats."""
    url = f"{BINANCE_BASE}/v3/ticker/24hr"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params={"symbol": symbol.upper()})
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None
