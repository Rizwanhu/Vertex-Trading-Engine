from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order, OrderStatus, OrderSide

router = APIRouter()


class BalanceOut(BaseModel):
    total_balance: float
    available_balance: float
    in_positions: float
    currency: str = "USDT"


class PnLOut(BaseModel):
    today_pnl: float
    today_pnl_pct: float
    total_pnl: float
    win_rate: float
    total_trades: int
    winning_trades: int


class EquityPoint(BaseModel):
    timestamp: str
    equity: float


@router.get("/balance", response_model=BalanceOut)
async def get_balance(
    _: User = Depends(get_current_user),
):
    # TODO: Fetch real balance from broker API
    # Placeholder for now
    return BalanceOut(
        total_balance=10000.0,
        available_balance=8500.0,
        in_positions=1500.0,
    )


@router.get("/pnl", response_model=PnLOut)
async def get_pnl(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # All filled orders
    result = await db.execute(
        select(Order).where(
            Order.user_id == current_user.id,
            Order.status == OrderStatus.FILLED,
        )
    )
    orders = result.scalars().all()

    total_pnl = sum(
        ((o.filled_price - o.price) if o.side == OrderSide.BUY else (o.price - o.filled_price)) * o.quantity
        for o in orders
        if o.filled_price and o.price
    )

    today_orders = [o for o in orders if o.filled_at and o.filled_at >= today_start]
    today_pnl = sum(
        ((o.filled_price - o.price) if o.side == OrderSide.BUY else (o.price - o.filled_price)) * o.quantity
        for o in today_orders
        if o.filled_price and o.price
    )

    winning = sum(1 for o in orders if o.filled_price and o.price and (
        (o.filled_price > o.price and o.side == OrderSide.BUY) or
        (o.filled_price < o.price and o.side == OrderSide.SELL)
    ))

    return PnLOut(
        today_pnl=round(today_pnl, 2),
        today_pnl_pct=round((today_pnl / 10000) * 100, 2),
        total_pnl=round(total_pnl, 2),
        win_rate=round((winning / len(orders) * 100) if orders else 0, 1),
        total_trades=len(orders),
        winning_trades=winning,
    )


@router.get("/equity-curve", response_model=List[EquityPoint])
async def get_equity_curve(_: User = Depends(get_current_user)):
    # TODO: Build real equity curve from trade history
    import random
    base = 10000.0
    now = datetime.now(timezone.utc)
    points = []
    for i in range(30):
        base += random.uniform(-150, 200)
        ts = now - timedelta(days=29 - i)
        points.append(EquityPoint(timestamp=ts.isoformat(), equity=round(base, 2)))
    return points
