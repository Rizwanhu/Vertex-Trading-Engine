import pandas as pd
from app.strategies.base import BaseStrategy, Signal


class RSIStrategy(BaseStrategy):
    """
    RSI Strategy:
      - BUY  when RSI crosses below oversold threshold (default 30)
      - SELL when RSI crosses above overbought threshold (default 70)
      - HOLD otherwise
    """
    name = "RSI"
    description = "Buy oversold, sell overbought using Relative Strength Index"

    def __init__(self, config: dict = {}):
        super().__init__(config)
        self.period = config.get("period", 14)
        self.oversold = config.get("oversold", 30)
        self.overbought = config.get("overbought", 70)

    def generate_signal(self, df: pd.DataFrame) -> str:
        if not self._validate_df(df, self.period + 1):
            return Signal.HOLD

        df = df.copy()
        df["rsi"] = self._calculate_rsi(df["close"], self.period)

        last_rsi = df["rsi"].iloc[-1]
        prev_rsi = df["rsi"].iloc[-2]

        # Crossing below oversold → BUY
        if prev_rsi >= self.oversold and last_rsi < self.oversold:
            return Signal.BUY
        # Crossing above overbought → SELL
        if prev_rsi <= self.overbought and last_rsi > self.overbought:
            return Signal.SELL

        return Signal.HOLD

    def _calculate_rsi(self, prices: pd.Series, period: int) -> pd.Series:
        delta = prices.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
        rs = avg_gain / avg_loss.replace(0, float("inf"))
        return 100 - (100 / (1 + rs))
