from app.workers.celery_app import celery_app
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"]
BINANCE_BASE = (
    "https://testnet.binance.vision/api"
    if settings.BINANCE_TESTNET
    else "https://api.binance.com/api"
)

# ─────────────────────────────────────────────────────────────────────────────
# Helper: build a candle DataFrame from Binance kline response
# ─────────────────────────────────────────────────────────────────────────────

def _klines_to_df(raw_klines):
    import pandas as pd
    cols = [
        "time", "open", "high", "low", "close", "volume",
        "close_time", "quote_vol", "trades", "taker_base",
        "taker_quote", "ignore",
    ]
    df = pd.DataFrame(raw_klines, columns=cols)
    for c in ["open", "high", "low", "close", "volume"]:
        df[c] = df[c].astype(float)
    return df


def _fetch_binance_klines(symbol: str, interval: str, limit: int = 250):
    """Fetch OHLCV candles from Binance (sync, for Celery tasks)."""
    from binance.client import Client
    client = Client(
        settings.BINANCE_API_KEY,
        settings.BINANCE_API_SECRET,
        testnet=settings.BINANCE_TESTNET,
    )
    raw = client.get_klines(symbol=symbol, interval=interval, limit=limit)
    return _klines_to_df(raw)


# ─────────────────────────────────────────────────────────────────────────────
# Task: execute_order — route to real broker
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.execute_order", bind=True, max_retries=3)
def execute_order(self, order_id: int):
    """Execute a pending order against the configured broker API."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.order import Order, OrderStatus, OrderSide
    from datetime import datetime, timezone

    engine = create_engine(settings.DATABASE_SYNC_URL)
    with Session(engine) as db:
        order = db.get(Order, order_id)
        if not order:
            return {"error": f"Order {order_id} not found"}
        if order.status != OrderStatus.PENDING:
            return {"skip": f"Order {order_id} already in state {order.status}"}

        try:
            broker_order_id, filled_price = _route_to_broker(order)
            order.status = OrderStatus.FILLED
            order.broker_order_id = broker_order_id
            order.filled_price = filled_price
            order.filled_at = datetime.now(timezone.utc)
            db.commit()

            # Fire-and-forget Telegram notification (best effort)
            try:
                from app.services.notifications import send_telegram_sync
                side_emoji = "🟢" if order.side == OrderSide.BUY else "🔴"
                send_telegram_sync(
                    f"{side_emoji} Order FILLED\n"
                    f"Symbol: {order.symbol}\n"
                    f"Side: {order.side.upper()}\n"
                    f"Qty: {order.quantity}\n"
                    f"Price: {filled_price}\n"
                    f"Broker: {order.broker}"
                )
            except Exception:
                pass

            return {"success": True, "order_id": order_id, "filled_price": filled_price}

        except Exception as exc:
            logger.exception("execute_order failed for order %s", order_id)
            order.status = OrderStatus.FAILED
            db.commit()
            raise self.retry(exc=exc, countdown=10)


def _route_to_broker(order) -> tuple[str, float]:
    """
    Route an Order to the configured broker.
    Returns (broker_order_id, filled_price).
    """
    if order.broker == "binance":
        return _execute_binance(order)
    elif order.broker == "alpaca":
        return _execute_alpaca(order)
    else:
        raise ValueError(f"Unknown broker: {order.broker}")


def _execute_binance(order) -> tuple[str, float]:
    from binance.client import Client
    client = Client(
        settings.BINANCE_API_KEY,
        settings.BINANCE_API_SECRET,
        testnet=settings.BINANCE_TESTNET,
    )
    if order.order_type == "market":
        if order.side == "buy":
            resp = client.order_market_buy(symbol=order.symbol, quantity=order.quantity)
        else:
            resp = client.order_market_sell(symbol=order.symbol, quantity=order.quantity)
    else:
        if order.side == "buy":
            resp = client.order_limit_buy(
                symbol=order.symbol, quantity=order.quantity, price=str(order.price)
            )
        else:
            resp = client.order_limit_sell(
                symbol=order.symbol, quantity=order.quantity, price=str(order.price)
            )

    broker_order_id = str(resp.get("orderId", ""))
    fills = resp.get("fills", [])
    filled_price = float(fills[0]["price"]) if fills else float(order.price or 0)
    return broker_order_id, filled_price


def _execute_alpaca(order) -> tuple[str, float]:
    from alpaca.trading.client import TradingClient
    from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
    from alpaca.trading.enums import OrderSide as ASide, TimeInForce

    client = TradingClient(
        settings.ALPACA_API_KEY,
        settings.ALPACA_API_SECRET,
        paper=True,
    )
    side = ASide.BUY if order.side == "buy" else ASide.SELL

    if order.order_type == "market":
        req = MarketOrderRequest(
            symbol=order.symbol,
            qty=order.quantity,
            side=side,
            time_in_force=TimeInForce.DAY,
        )
    else:
        req = LimitOrderRequest(
            symbol=order.symbol,
            qty=order.quantity,
            side=side,
            time_in_force=TimeInForce.DAY,
            limit_price=order.price,
        )

    resp = client.submit_order(req)
    broker_order_id = str(resp.id)
    filled_price = float(resp.filled_avg_price or order.price or 0)
    return broker_order_id, filled_price


# ─────────────────────────────────────────────────────────────────────────────
# Task: update_price_cache — Binance prices → Redis every 2 s
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.update_price_cache")
def update_price_cache():
    """Fetch latest prices from Binance and store in Redis."""
    import requests as req_lib
    from app.core.redis import get_sync_redis

    r = get_sync_redis()

    for symbol in SYMBOLS:
        try:
            url = f"{BINANCE_BASE}/v3/ticker/price"
            resp = req_lib.get(url, params={"symbol": symbol}, timeout=3)
            if resp.ok:
                price = float(resp.json()["price"])
                r.setex(f"price:{symbol}", 10, str(price))
        except Exception as exc:
            logger.warning("Price cache update failed for %s: %s", symbol, exc)


# ─────────────────────────────────────────────────────────────────────────────
# Task: fetch_all_candles — update candle cache for all running bots
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.fetch_all_candles")
def fetch_all_candles():
    """Fetch and cache candles for all actively running bots."""
    import json
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.bot import Bot, BotStatus
    from app.core.redis import get_sync_redis

    engine = create_engine(settings.DATABASE_SYNC_URL)
    r = get_sync_redis()

    with Session(engine) as db:
        running_bots = db.query(Bot).filter(Bot.status == BotStatus.RUNNING).all()
        seen = set()
        for bot in running_bots:
            key = (bot.symbol, bot.timeframe)
            if key in seen:
                continue
            seen.add(key)
            try:
                df = _fetch_binance_klines(bot.symbol, bot.timeframe, limit=250)
                cache_key = f"candles:{bot.symbol}:{bot.timeframe}"
                r.setex(cache_key, 120, df.to_json(orient="records"))
                logger.info("Cached candles for %s %s", bot.symbol, bot.timeframe)
            except Exception as exc:
                logger.warning("Candle fetch failed for %s: %s", bot.symbol, exc)


# ─────────────────────────────────────────────────────────────────────────────
# Task: run_bot_tick — one strategy tick for a trading bot
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.run_bot_tick")
def run_bot_tick(bot_id: int):
    """Run one tick for an active trading bot: candles → strategy → signal → order."""
    import json
    import pandas as pd
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.bot import Bot, BotStatus, StrategyType
    from app.models.order import Order, OrderSide, OrderType, OrderStatus
    from app.core.redis import get_sync_redis
    from datetime import datetime, timezone

    engine = create_engine(settings.DATABASE_SYNC_URL)
    r = get_sync_redis()

    with Session(engine) as db:
        bot = db.get(Bot, bot_id)
        if not bot or bot.status != BotStatus.RUNNING:
            return {"skip": f"Bot {bot_id} not running"}

        # 1. Load candles (from Redis cache or live fetch)
        cache_key = f"candles:{bot.symbol}:{bot.timeframe}"
        cached = r.get(cache_key)
        if cached:
            df = pd.read_json(cached)
        else:
            try:
                df = _fetch_binance_klines(bot.symbol, bot.timeframe, limit=250)
                r.setex(cache_key, 120, df.to_json(orient="records"))
            except Exception as exc:
                logger.error("Bot %s: candle fetch failed: %s", bot_id, exc)
                bot.status = BotStatus.ERROR
                db.commit()
                return {"error": str(exc)}

        # 2. Select and run strategy
        strategy_type = bot.strategy.type if bot.strategy else StrategyType.RULE
        strategy_name = bot.strategy.config.get("strategy_name", "rsi") if bot.strategy else "rsi"
        config = bot.risk_config or {}

        try:
            signal = _run_strategy(strategy_type, strategy_name, config, df)
        except Exception as exc:
            logger.error("Bot %s: strategy error: %s", bot_id, exc)
            signal = "hold"

        logger.info("Bot %s (%s %s): signal=%s", bot_id, bot.symbol, bot.timeframe, signal)

        # 3. Place order if signal is BUY or SELL
        if signal in ("BUY", "SELL"):
            # Check no open orders already exist for this bot
            open_count = (
                db.query(Order)
                .filter(
                    Order.bot_id == bot_id,
                    Order.status.in_([OrderStatus.PENDING, OrderStatus.OPEN]),
                )
                .count()
            )
            max_open = config.get("max_open_trades", 3)
            if open_count < max_open:
                order = Order(
                    user_id=bot.user_id,
                    bot_id=bot_id,
                    broker=bot.broker,
                    symbol=bot.symbol,
                    side=OrderSide.BUY if signal == "BUY" else OrderSide.SELL,
                    order_type=OrderType.MARKET,
                    quantity=_calculate_quantity(df, config),
                    status=OrderStatus.PENDING,
                )
                db.add(order)
                db.flush()
                bot.total_trades += 1
                execute_order.delay(order.id)

        bot.last_run_at = datetime.now(timezone.utc)
        db.commit()
        return {"bot_id": bot_id, "signal": signal}


def _run_strategy(strategy_type, strategy_name: str, config: dict, df) -> str:
    """Instantiate and run the appropriate strategy class."""
    from app.strategies.rsi import RSIStrategy
    from app.strategies.ma_crossover import MACrossoverStrategy

    strategy_map = {
        "rsi": RSIStrategy,
        "ma_crossover": MACrossoverStrategy,
        "ma": MACrossoverStrategy,
    }

    if strategy_type == "ml":
        try:
            from app.strategies.ml_strategy import MLStrategy
            strategy_map["ml"] = MLStrategy
        except ImportError:
            pass

    cls = strategy_map.get(strategy_name.lower(), RSIStrategy)
    return cls(config=config).generate_signal(df)


def _calculate_quantity(df, config: dict) -> float:
    """Calculate order quantity based on risk config."""
    max_pct = config.get("max_position_pct", 2.0)
    account_size = config.get("account_size_usdt", 1000.0)
    last_price = float(df["close"].iloc[-1]) if len(df) else 1.0
    usdt_amount = account_size * (max_pct / 100)
    qty = usdt_amount / last_price
    return round(qty, 6)


# ─────────────────────────────────────────────────────────────────────────────
# Task: run_backtest — historical simulation
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.run_backtest")
def run_backtest(backtest_result_id: int, strategy_id: int, symbol: str,
                 timeframe: str, start_ts: float, end_ts: float):
    """Run a real backtest and save results to DB."""
    import pandas as pd
    import numpy as np
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.bot import BacktestResult, Strategy
    from binance.client import Client
    from datetime import datetime, timezone

    engine = create_engine(settings.DATABASE_SYNC_URL)
    with Session(engine) as db:
        bt = db.get(BacktestResult, backtest_result_id)
        if not bt:
            return {"error": "BacktestResult not found"}

        strategy = db.get(Strategy, strategy_id)
        if not strategy:
            return {"error": "Strategy not found"}

        try:
            # 1. Fetch historical candles
            client = Client(
                settings.BINANCE_API_KEY,
                settings.BINANCE_API_SECRET,
                testnet=settings.BINANCE_TESTNET,
            )
            start_str = datetime.fromtimestamp(start_ts, tz=timezone.utc).strftime("%d %b %Y")
            end_str = datetime.fromtimestamp(end_ts, tz=timezone.utc).strftime("%d %b %Y")
            raw = client.get_historical_klines(symbol, timeframe, start_str, end_str)
            df = _klines_to_df(raw)

            if len(df) < 10:
                bt.total_trades = 0
                db.commit()
                return {"warning": "Not enough candle data"}

            # 2. Generate signals for each row using strategy
            strategy_name = strategy.config.get("strategy_name", "rsi")
            from app.strategies.rsi import RSIStrategy
            from app.strategies.ma_crossover import MACrossoverStrategy
            strategy_map = {"rsi": RSIStrategy, "ma_crossover": MACrossoverStrategy}
            cls = strategy_map.get(strategy_name.lower(), RSIStrategy)
            strat = cls(config=strategy.config)

            signals = []
            window = max(50, strat.config.get("period", 14) + 2 if hasattr(strat, "config") else 50)
            for i in range(window, len(df)):
                sig = strat.generate_signal(df.iloc[:i + 1])
                signals.append((i, sig))

            # 3. Simulate trades
            balance = 10000.0
            position = 0.0
            entry_price = 0.0
            trades = []
            equity_curve = []

            for idx, signal in signals:
                price = df["close"].iloc[idx]
                if signal == "BUY" and position == 0:
                    qty = (balance * 0.02) / price
                    position = qty
                    entry_price = price
                    balance -= qty * price
                elif signal == "SELL" and position > 0:
                    pnl = (price - entry_price) * position
                    balance += position * price
                    trades.append({"pnl": pnl, "entry": entry_price, "exit": price})
                    position = 0.0
                equity_curve.append(round(balance + position * price, 2))

            # 4. Compute stats
            total_trades = len(trades)
            wins = sum(1 for t in trades if t["pnl"] > 0)
            win_rate = (wins / total_trades * 100) if total_trades > 0 else 0.0
            total_return = ((balance - 10000) / 10000 * 100) if total_trades > 0 else 0.0

            returns = np.diff(equity_curve) / np.array(equity_curve[:-1]) if len(equity_curve) > 1 else [0]
            sharpe = (np.mean(returns) / (np.std(returns) + 1e-9)) * np.sqrt(252) if len(returns) > 1 else 0.0

            peak = equity_curve[0] if equity_curve else 10000
            max_dd = 0.0
            for eq in equity_curve:
                peak = max(peak, eq)
                dd = (peak - eq) / peak * 100
                max_dd = max(max_dd, dd)

            # 5. Save results
            bt.total_trades = total_trades
            bt.win_rate = round(win_rate, 2)
            bt.total_return = round(total_return, 2)
            bt.sharpe_ratio = round(float(sharpe), 3)
            bt.max_drawdown = round(-max_dd, 2)
            bt.equity_curve = equity_curve[-100:]  # store last 100 points
            db.commit()
            return {"success": True, "total_trades": total_trades, "win_rate": win_rate}

        except Exception as exc:
            logger.exception("Backtest failed for BacktestResult %s", backtest_result_id)
            return {"error": str(exc)}
