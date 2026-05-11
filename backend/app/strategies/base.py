from abc import ABC, abstractmethod
from typing import Optional
import pandas as pd


class Signal:
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class BaseStrategy(ABC):
    """All trading strategies must implement this interface."""

    name: str = "base"
    description: str = ""

    def __init__(self, config: dict = {}):
        self.config = config

    @abstractmethod
    def generate_signal(self, df: pd.DataFrame) -> str:
        """
        Given a DataFrame of OHLCV candles, return BUY / SELL / HOLD.
        df columns: time, open, high, low, close, volume
        """
        ...

    def _validate_df(self, df: pd.DataFrame, min_rows: int = 2) -> bool:
        return df is not None and len(df) >= min_rows
