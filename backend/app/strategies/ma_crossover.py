import pandas as pd
from app.strategies.base import BaseStrategy, Signal


class MACrossoverStrategy(BaseStrategy):
    """
    Moving Average Crossover Strategy:
      - BUY  when fast MA crosses above slow MA (golden cross)
      - SELL when fast MA crosses below slow MA (death cross)
    """
    name = "MA_Crossover"
    description = "Golden/Death cross using two moving averages"

    def __init__(self, config: dict = {}):
        super().__init__(config)
        self.fast_period = config.get("fast_period", 50)
        self.slow_period = config.get("slow_period", 200)

    def generate_signal(self, df: pd.DataFrame) -> str:
        if not self._validate_df(df, self.slow_period + 1):
            return Signal.HOLD

        df = df.copy()
        df["ma_fast"] = df["close"].rolling(self.fast_period).mean()
        df["ma_slow"] = df["close"].rolling(self.slow_period).mean()

        prev_fast = df["ma_fast"].iloc[-2]
        prev_slow = df["ma_slow"].iloc[-2]
        last_fast = df["ma_fast"].iloc[-1]
        last_slow = df["ma_slow"].iloc[-1]

        # Golden cross → BUY
        if prev_fast <= prev_slow and last_fast > last_slow:
            return Signal.BUY
        # Death cross → SELL
        if prev_fast >= prev_slow and last_fast < last_slow:
            return Signal.SELL

        return Signal.HOLD
