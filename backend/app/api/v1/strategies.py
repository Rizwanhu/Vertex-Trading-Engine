from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bot import Strategy, BacktestResult, StrategyType

router = APIRouter()


class StrategyCreate(BaseModel):
    name: str
    type: StrategyType = StrategyType.RULE
    description: str = ""
    config: dict = {}


class StrategyOut(BaseModel):
    id: int
    name: str
    type: str
    description: str
    config: dict
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class BacktestRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"
    start_date: datetime
    end_date: datetime


class BacktestResultOut(BaseModel):
    id: int
    symbol: str
    timeframe: str
    total_trades: int
    win_rate: float
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    created_at: datetime
    model_config = {"from_attributes": True}


@router.get("/", response_model=List[StrategyOut])
async def list_strategies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Strategy)
        .where(Strategy.user_id == current_user.id)
        .order_by(Strategy.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=StrategyOut, status_code=201)
async def create_strategy(
    body: StrategyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    strategy = Strategy(
        user_id=current_user.id,
        name=body.name,
        type=body.type,
        description=body.description,
        config=body.config,
    )
    db.add(strategy)
    await db.flush()
    await db.refresh(strategy)
    return strategy


@router.post("/{strategy_id}/backtest", response_model=BacktestResultOut, status_code=201)
async def run_backtest(
    strategy_id: int,
    body: BacktestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == current_user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    # TODO: Run actual backtest via Celery task
    # Placeholder result
    bt = BacktestResult(
        strategy_id=strategy_id,
        symbol=body.symbol,
        timeframe=body.timeframe,
        start_date=body.start_date,
        end_date=body.end_date,
        total_trades=42,
        win_rate=58.3,
        total_return=14.7,
        sharpe_ratio=1.45,
        max_drawdown=-8.2,
        equity_curve=[],
    )
    db.add(bt)
    await db.flush()
    await db.refresh(bt)
    return bt


@router.get("/{strategy_id}/results", response_model=List[BacktestResultOut])
async def get_backtest_results(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(BacktestResult)
        .where(BacktestResult.strategy_id == strategy_id)
        .order_by(BacktestResult.created_at.desc())
    )
    return result.scalars().all()
