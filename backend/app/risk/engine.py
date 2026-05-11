"""
Risk Management Engine — validates every order before execution.
Rules:
  1. Max position size (% of portfolio)
  2. Max open trades at once
  3. Daily loss limit
  4. Basic sanity checks (qty > 0, price > 0)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
from typing import Tuple

from app.models.order import Order, OrderStatus, OrderSide


class RiskEngine:
    def __init__(
        self,
        user_id: int,
        db: AsyncSession,
        portfolio_value: float = 10_000.0,   # TODO: fetch real balance
        max_position_pct: float = 2.0,
        max_open_trades: int = 5,
        daily_loss_limit_pct: float = 5.0,
    ):
        self.user_id = user_id
        self.db = db
        self.portfolio_value = portfolio_value
        self.max_position_pct = max_position_pct
        self.max_open_trades = max_open_trades
        self.daily_loss_limit_pct = daily_loss_limit_pct

    async def validate_order(
        self,
        symbol: str,
        side: OrderSide,
        quantity: float,
        price: float | None,
    ) -> Tuple[bool, str]:
        """Returns (approved: bool, reason: str)."""

        # 1. Sanity checks
        if quantity <= 0:
            return False, "Quantity must be greater than 0"
        if price is not None and price <= 0:
            return False, "Price must be greater than 0"

        # 2. Max position size check
        estimated_price = price or await self._get_estimated_price(symbol)
        if estimated_price:
            position_value = quantity * estimated_price
            max_allowed = self.portfolio_value * (self.max_position_pct / 100)
            if position_value > max_allowed:
                return False, (
                    f"Position size ${position_value:.2f} exceeds "
                    f"max allowed ${max_allowed:.2f} ({self.max_position_pct}% of portfolio)"
                )

        # 3. Max open trades check
        open_count = await self._count_open_orders()
        if open_count >= self.max_open_trades:
            return False, f"Max open trades limit ({self.max_open_trades}) reached"

        # 4. Daily loss limit check
        daily_loss = await self._get_daily_loss()
        max_daily_loss = self.portfolio_value * (self.daily_loss_limit_pct / 100)
        if daily_loss >= max_daily_loss:
            return False, (
                f"Daily loss limit reached: ${daily_loss:.2f} "
                f"(limit: ${max_daily_loss:.2f})"
            )

        return True, "OK"

    async def _count_open_orders(self) -> int:
        result = await self.db.execute(
            select(func.count(Order.id)).where(
                Order.user_id == self.user_id,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.OPEN]),
            )
        )
        return result.scalar() or 0

    async def _get_daily_loss(self) -> float:
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        result = await self.db.execute(
            select(Order).where(
                Order.user_id == self.user_id,
                Order.status == OrderStatus.FILLED,
                Order.filled_at >= today_start,
            )
        )
        orders = result.scalars().all()
        losses = [
            (o.price - o.filled_price) * o.quantity
            for o in orders
            if o.filled_price and o.price and o.side == OrderSide.BUY
            and o.filled_price < o.price
        ]
        return sum(losses) if losses else 0.0

    async def _get_estimated_price(self, symbol: str) -> float | None:
        from app.core.redis import get_price_cache
        return await get_price_cache(symbol)

    def inject_stop_loss(self, price: float, side: OrderSide, stop_loss_pct: float = 1.5) -> float:
        """Calculate stop-loss price based on entry price."""
        if side == OrderSide.BUY:
            return round(price * (1 - stop_loss_pct / 100), 8)
        else:
            return round(price * (1 + stop_loss_pct / 100), 8)

    def inject_take_profit(self, price: float, side: OrderSide, take_profit_pct: float = 3.0) -> float:
        """Calculate take-profit price based on entry price."""
        if side == OrderSide.BUY:
            return round(price * (1 + take_profit_pct / 100), 8)
        else:
            return round(price * (1 - take_profit_pct / 100), 8)
