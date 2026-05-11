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

    # TODO: Spawn Celery periodic task for bot
    bot.status = BotStatus.RUNNING
    return {"message": f"Bot '{bot.name}' started", "bot_id": bot_id}


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
    # TODO: Revoke Celery task if celery_task_id is set
    return {"message": f"Bot '{bot.name}' stopped", "bot_id": bot_id}


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

    return BotStats(
        bot_id=bot.id,
        status=bot.status,
        total_pnl=bot.total_pnl,
        total_trades=bot.total_trades,
        win_rate=0.0,  # TODO: calculate from orders
        last_run_at=bot.last_run_at,
    )
