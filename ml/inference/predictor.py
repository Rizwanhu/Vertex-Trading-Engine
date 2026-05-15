"""
ML Inference — standalone predictor for use outside of the backend.

Usage:
    from ml.inference.predictor import MLPredictor
    predictor = MLPredictor("ml/models/model_v1.pkl")
    signal = predictor.predict(df)   # "BUY", "SELL", or "HOLD"
"""
import os
import json
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class MLPredictor:
    """
    Loads a trained joblib model and produces trading signals from OHLCV DataFrames.
    """

    LABEL_MAP = {0: "SELL", 1: "HOLD", 2: "BUY"}

    def __init__(self, model_path: str):
        import joblib
        self.model_path = model_path
        self.model = joblib.load(model_path)

        # Load feature list from companion metadata file
        meta_path = model_path.replace(".pkl", "_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                meta = json.load(f)
            self.feature_cols = meta.get("features", [])
        else:
            # Fallback feature list
            self.feature_cols = [
                "rsi_14", "ma_20", "ma_50", "macd", "macd_signal", "macd_hist",
                "bb_pct", "atr_14", "vol_zscore", "vol_ratio",
                "return_1", "return_3", "return_5",
                "dist_ma_20", "dist_ma_50", "stoch_k", "stoch_d",
            ]

        logger.info("MLPredictor ready — model=%s features=%d", model_path, len(self.feature_cols))

    def predict(self, df: pd.DataFrame) -> str:
        """
        Predict trading signal from an OHLCV DataFrame.
        Runs feature engineering internally.
        Returns: "BUY", "SELL", or "HOLD"
        """
        try:
            features_df = self._engineer_features(df)
            features_df.dropna(inplace=True)
            if features_df.empty:
                return "HOLD"

            avail = [c for c in self.feature_cols if c in features_df.columns]
            X = features_df[avail].iloc[[-1]].values
            pred = int(self.model.predict(X)[0])

            proba = self._get_proba(X)
            confidence = max(proba) if proba is not None else None

            signal = self.LABEL_MAP.get(pred, "HOLD")
            logger.debug("Prediction: %s (confidence=%.2f)", signal, confidence or 0)
            return signal

        except Exception as exc:
            logger.error("MLPredictor.predict failed: %s", exc)
            return "HOLD"

    def predict_proba(self, df: pd.DataFrame) -> dict:
        """
        Returns probability for each class.
        {"BUY": 0.6, "HOLD": 0.3, "SELL": 0.1}
        """
        try:
            features_df = self._engineer_features(df)
            features_df.dropna(inplace=True)
            if features_df.empty:
                return {"BUY": 0.0, "HOLD": 1.0, "SELL": 0.0}
            avail = [c for c in self.feature_cols if c in features_df.columns]
            X = features_df[avail].iloc[[-1]].values
            proba = self._get_proba(X)
            if proba is None:
                return {"BUY": 0.0, "HOLD": 1.0, "SELL": 0.0}
            return {"SELL": round(float(proba[0]), 3),
                    "HOLD": round(float(proba[1]), 3),
                    "BUY":  round(float(proba[2]), 3)}
        except Exception:
            return {"BUY": 0.0, "HOLD": 1.0, "SELL": 0.0}

    def _get_proba(self, X):
        try:
            return self.model.predict_proba(X)[0]
        except AttributeError:
            return None

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Inline feature engineering matching the training pipeline."""
        df = df.copy()
        close = df["close"].astype(float)
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        volume = df["volume"].astype(float)

        # RSI
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=13, min_periods=14).mean()
        avg_loss = loss.ewm(com=13, min_periods=14).mean()
        rs = avg_gain / avg_loss.replace(0, float("inf"))
        df["rsi_14"] = 100 - (100 / (1 + rs))

        # MAs
        df["ma_20"] = close.rolling(20).mean()
        df["ma_50"] = close.rolling(50).mean()

        # MACD
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        df["macd"] = ema12 - ema26
        df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean()
        df["macd_hist"] = df["macd"] - df["macd_signal"]

        # Bollinger
        bb_ma = close.rolling(20).mean()
        bb_std = close.rolling(20).std()
        df["bb_pct"] = (close - (bb_ma - 2*bb_std)) / (4*bb_std + 1e-9)

        # ATR
        tr = pd.concat([high-low, (high-close.shift()).abs(), (low-close.shift()).abs()], axis=1).max(axis=1)
        df["atr_14"] = tr.ewm(com=13, min_periods=14).mean()

        # Volume
        df["vol_ma_20"] = volume.rolling(20).mean()
        df["vol_zscore"] = (volume - df["vol_ma_20"]) / (volume.rolling(20).std() + 1e-9)
        df["vol_ratio"] = volume / (df["vol_ma_20"] + 1e-9)

        # Returns
        for lag in [1, 3, 5]:
            df[f"return_{lag}"] = close.pct_change(lag)

        # Distance from MAs
        df["dist_ma_20"] = (close - df["ma_20"]) / (df["ma_20"] + 1e-9)
        df["dist_ma_50"] = (close - df["ma_50"]) / (df["ma_50"] + 1e-9)

        # Stochastic
        df["stoch_k"] = (close - low.rolling(14).min()) / (high.rolling(14).max() - low.rolling(14).min() + 1e-9) * 100
        df["stoch_d"] = df["stoch_k"].rolling(3).mean()

        return df
