from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from app.core.security import get_current_user
from app.core.redis import get_price_cache
from app.services.market_data import fetch_candles, get_live_price
import asyncio

router = APIRouter()


@router.get("/price/{symbol}")
async def get_price(symbol: str, _=Depends(get_current_user)):
    # Check cache first
    cached = await get_price_cache(symbol)
    if cached:
        return {"symbol": symbol.upper(), "price": cached, "source": "cache"}

    # Fallback: fetch live
    price = await get_live_price(symbol)
    if price is None:
        raise HTTPException(status_code=404, detail=f"Price not available for {symbol}")
    return {"symbol": symbol.upper(), "price": price, "source": "live"}


@router.get("/candles/{symbol}")
async def get_candles(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 200,
    _=Depends(get_current_user),
):
    candles = await fetch_candles(symbol, timeframe, limit)
    return {"symbol": symbol.upper(), "timeframe": timeframe, "candles": candles}


@router.get("/symbols")
async def get_symbols(_=Depends(get_current_user)):
    return {
        "symbols": [
            {"symbol": "BTCUSDT", "name": "Bitcoin", "type": "crypto"},
            {"symbol": "ETHUSDT", "name": "Ethereum", "type": "crypto"},
            {"symbol": "BNBUSDT", "name": "BNB", "type": "crypto"},
            {"symbol": "SOLUSDT", "name": "Solana", "type": "crypto"},
            {"symbol": "ADAUSDT", "name": "Cardano", "type": "crypto"},
            {"symbol": "XRPUSDT", "name": "XRP", "type": "crypto"},
            {"symbol": "DOGEUSDT", "name": "Dogecoin", "type": "crypto"},
        ]
    }


@router.websocket("/ws/prices/{symbol}")
async def price_websocket(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            price = await get_price_cache(symbol)
            if price:
                await websocket.send_json({"symbol": symbol.upper(), "price": price})
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
