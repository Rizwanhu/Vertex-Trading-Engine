from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean, func, Enum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class BotStatus(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


class StrategyType(str, enum.Enum):
    RULE = "rule"
    ML = "ml"
    HYBRID = "hybrid"


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(Enum(StrategyType), default=StrategyType.RULE)
    description = Column(String, default="")
    config = Column(JSON, default={})   # strategy-specific params
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bots = relationship("Bot", back_populates="strategy")
    backtest_results = relationship("BacktestResult", back_populates="strategy")


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, default="1h")
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    total_trades = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    total_return = Column(Float, default=0.0)
    sharpe_ratio = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    equity_curve = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    strategy = relationship("Strategy", back_populates="backtest_results")


class Bot(Base):
    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, default="1h")
    broker = Column(String, default="binance")
    status = Column(Enum(BotStatus), default=BotStatus.IDLE)
    risk_config = Column(JSON, default={
        "max_position_pct": 2.0,
        "stop_loss_pct": 1.5,
        "take_profit_pct": 3.0,
        "max_open_trades": 3,
        "daily_loss_limit_pct": 5.0,
        "trailing_stop": False,
    })
    total_pnl = Column(Float, default=0.0)
    total_trades = Column(Integer, default=0)
    celery_task_id = Column(String, nullable=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="bots")
    strategy = relationship("Strategy", back_populates="bots")
    orders = relationship("Order", back_populates="bot")
