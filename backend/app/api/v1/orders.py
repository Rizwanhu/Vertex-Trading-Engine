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
from app.models.order import Order, OrderSide, OrderType, OrderStatus
from app.risk.engine import RiskEngine
from app.workers.celery_app import execute_order_task

router = APIRouter()


class PlaceOrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    broker: str = "binance"


class OrderOut(BaseModel):
    id: int
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float]
    status: str
    broker_order_id: Optional[str]
    filled_price: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/", response_model=OrderOut, status_code=201)
async def place_order(
    body: PlaceOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Risk check
    risk = RiskEngine(user_id=current_user.id, db=db)
    approved, reason = await risk.validate_order(
        symbol=body.symbol,
        side=body.side,
        quantity=body.quantity,
        price=body.price,
    )
    if not approved:
        raise HTTPException(status_code=422, detail=f"Risk check failed: {reason}")

    # Create order record
    order = Order(
        user_id=current_user.id,
        broker=body.broker,
        symbol=body.symbol.upper(),
        side=body.side,
        order_type=body.order_type,
        quantity=body.quantity,
        price=body.price,
        stop_price=body.stop_price,
        status=OrderStatus.PENDING,
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)

    # Queue execution via Celery
    execute_order_task(order.id)

    return order


@router.get("/", response_model=List[OrderOut])
async def get_open_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .where(Order.status.in_([OrderStatus.PENDING, OrderStatus.OPEN]))
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/history", response_model=List[OrderOut])
async def get_order_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .where(Order.status.in_([OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.FAILED]))
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.delete("/{order_id}")
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in [OrderStatus.PENDING, OrderStatus.OPEN]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")

    order.status = OrderStatus.CANCELLED
    return {"message": "Order cancelled", "order_id": order_id}
