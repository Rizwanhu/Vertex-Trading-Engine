from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, market, orders, portfolio, strategies, bots
from app.workers.celery_app import celery_app  # noqa: F401
from app.services.websocket import binance_ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    app.state.bg_tasks = set()
    ws_task = asyncio.create_task(binance_ws.run())
    app.state.bg_tasks.add(ws_task)
    
    yield
    # Shutdown
    binance_ws.stop()
    for task in app.state.bg_tasks:
        task.cancel()
        
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Algo Trading System + Manual Dashboard API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(market.router,     prefix="/api/market",     tags=["Market"])
app.include_router(orders.router,     prefix="/api/orders",     tags=["Orders"])
app.include_router(portfolio.router,  prefix="/api/portfolio",  tags=["Portfolio"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["Strategies"])
app.include_router(bots.router,       prefix="/api/bots",       tags=["Bots"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
