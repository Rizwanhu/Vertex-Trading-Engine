from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bot import Bot, BotStatus

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class BotCreate(BaseModel):
    name: str
    strategy_id: int
    symbol: str
    timeframe: str = "1h"
    broker: str = "binance"
    risk_config: dict = {}


class BotOut(BaseModel):
    id: int
    name: str
    strategy_id: int
    symbol: str
    timeframe: str
    broker: str
    status: str
    risk_config: dict
    total_pnl: float
    total_trades: int
    last_run_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


class BotStats(BaseModel):
    bot_id: int
    status: str
    total_pnl: float
    total_trades: int
    win_rate: float
    last_run_at: Optional[datetime]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_tick_interval(timeframe: str) -> int:
    """Convert timeframe string to Celery beat interval in seconds."""
    mapping = {
        "1m": 60, "3m": 180, "5m": 300, "15m": 900,
        "30m": 1800, "1h": 3600, "4h": 14400, "1d": 86400,
    }
    return mapping.get(timeframe, 3600)


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[BotOut])
async def list_bots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bot).where(Bot.user_id == current_user.id).order_by(Bot.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=BotOut, status_code=201)
async def create_bot(
    body: BotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    default_risk = {
        "max_position_pct": 2.0,
        "stop_loss_pct": 1.5,
        "take_profit_pct": 3.0,
        "max_open_trades": 3,
        "daily_loss_limit_pct": 5.0,
        "trailing_stop": False,
        "account_size_usdt": 1000.0,
    }
    risk_config = {**default_risk, **body.risk_config}

    bot = Bot(
        user_id=current_user.id,
        strategy_id=body.strategy_id,
        name=body.name,
        symbol=body.symbol.upper(),
        timeframe=body.timeframe,
        broker=body.broker,
        risk_config=risk_config,
    )
    db.add(bot)
    await db.flush()
    await db.refresh(bot)
    return bot


@router.post("/{bot_id}/start")
async def start_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    if bot.status == BotStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Bot is already running")

    bot.status = BotStatus.RUNNING
    await db.commit()

    # Register bot tick in Celery beat schedule
    from app.workers.celery_app import schedule_bot_tick
    interval = _get_tick_interval(bot.timeframe)
    schedule_bot_tick(bot_id=bot_id, interval_seconds=interval)

    # Fire first tick immediately so the user sees immediate action
    from app.workers.tasks import run_bot_tick
    run_bot_tick.delay(bot_id)

    return {
        "message": f"Bot '{bot.name}' started",
        "bot_id": bot_id,
        "tick_interval_seconds": interval,
    }


@router.post("/{bot_id}/stop")
async def stop_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    bot.status = BotStatus.STOPPED
    await db.commit()

    # Remove from Celery beat schedule
    from app.workers.celery_app import unschedule_bot_tick
    unschedule_bot_tick(bot_id)

    return {"message": f"Bot '{bot.name}' stopped", "bot_id": bot_id}


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Stop scheduling before deletion
    from app.workers.celery_app import unschedule_bot_tick
    unschedule_bot_tick(bot_id)

    await db.delete(bot)
    await db.commit()


@router.get("/{bot_id}/stats", response_model=BotStats)
async def get_bot_stats(
    bot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Compute win rate from orders linked to this bot
    from app.models.order import Order, OrderStatus, OrderSide
    from sqlalchemy import select as sa_select

    orders_result = await db.execute(
        sa_select(Order).where(
            Order.bot_id == bot_id,
            Order.status == OrderStatus.FILLED,
        )
    )
    orders = orders_result.scalars().all()
    winning = sum(
        1 for o in orders
        if o.filled_price and o.price and (
            (o.side == OrderSide.BUY and o.filled_price > o.price) or
            (o.side == OrderSide.SELL and o.filled_price < o.price)
        )
    )
    win_rate = round((winning / len(orders) * 100) if orders else 0.0, 1)

    return BotStats(
        bot_id=bot.id,
        status=bot.status,
        total_pnl=bot.total_pnl,
        total_trades=bot.total_trades,
        win_rate=win_rate,
        last_run_at=bot.last_run_at,
    )
