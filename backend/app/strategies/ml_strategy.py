"""
ML Strategy — wraps a trained scikit-learn / XGBoost model.
The model file is expected at ml/models/model_v1.pkl
"""
import os
import logging
import pandas as pd

from app.strategies.base import BaseStrategy, Signal

logger = logging.getLogger(__name__)

# Resolve model path relative to project root
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),   # backend/app/strategies/
    "..", "..", "..",            # -> project root
    "ml", "models", "model_v1.pkl",
)
_MODEL_PATH = os.path.normpath(_MODEL_PATH)


class MLStrategy(BaseStrategy):
    """
    ML-based strategy that loads a pre-trained classifier.
    Expected labels: 0=SELL, 1=HOLD, 2=BUY
    """

    name = "ML"
    description = "Predict BUY/SELL/HOLD using a trained ML model"

    def __init__(self, config: dict = {}):
        super().__init__(config)
        self._model = None
        self._load_model()

    def _load_model(self):
        try:
            import joblib
            if os.path.exists(_MODEL_PATH):
                self._model = joblib.load(_MODEL_PATH)
                logger.info("ML model loaded from %s", _MODEL_PATH)
            else:
                logger.warning("ML model not found at %s — strategy will return HOLD", _MODEL_PATH)
        except Exception as exc:
            logger.error("Failed to load ML model: %s", exc)

    def generate_signal(self, df: pd.DataFrame) -> str:
        if self._model is None:
            return Signal.HOLD
        if not self._validate_df(df, 30):
            return Signal.HOLD

        try:
            features = self._extract_features(df)
            prediction = self._model.predict([features])[0]
            label_map = {0: Signal.SELL, 1: Signal.HOLD, 2: Signal.BUY}
            return label_map.get(int(prediction), Signal.HOLD)
        except Exception as exc:
            logger.error("ML prediction failed: %s", exc)
            return Signal.HOLD

    def _extract_features(self, df: pd.DataFrame) -> list:
        """Extract the same feature vector used during training."""
        close = df["close"].astype(float)
        volume = df["volume"].astype(float)

        # RSI (14)
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=13, min_periods=14).mean()
        avg_loss = loss.ewm(com=13, min_periods=14).mean()
        rs = avg_gain / avg_loss.replace(0, float("inf"))
        rsi = (100 - (100 / (1 + rs))).iloc[-1]

        # Moving averages
        ma_20 = close.rolling(20).mean().iloc[-1]
        ma_50 = close.rolling(50).mean().iloc[-1] if len(close) >= 50 else ma_20
        ma_200 = close.rolling(200).mean().iloc[-1] if len(close) >= 200 else ma_50

        # Price momentum
        price_change_1 = close.pct_change(1).iloc[-1]
        price_change_5 = close.pct_change(5).iloc[-1]

        # Volume z-score
        vol_mean = volume.rolling(20).mean().iloc[-1]
        vol_std = volume.rolling(20).std().iloc[-1] or 1.0
        vol_zscore = (volume.iloc[-1] - vol_mean) / vol_std

        # Distance from MAs (normalised)
        current = close.iloc[-1]
        dist_ma20 = (current - ma_20) / ma_20 if ma_20 else 0
        dist_ma50 = (current - ma_50) / ma_50 if ma_50 else 0

        return [
            float(rsi),
            float(ma_20),
            float(ma_50),
            float(ma_200),
            float(price_change_1),
            float(price_change_5),
            float(vol_zscore),
            float(dist_ma20),
            float(dist_ma50),
        ]
