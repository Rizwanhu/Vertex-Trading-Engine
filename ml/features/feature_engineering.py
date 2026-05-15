"""
Feature engineering for the ML training pipeline.

Usage:
    python ml/features/feature_engineering.py \
        --input ml/data/BTCUSDT_1h.csv \
        --output ml/data/BTCUSDT_1h_features.csv
"""
import argparse
import os
import pandas as pd
import numpy as np


# ─────────────────────────────────────────────────────────────────────────────
# Core feature computation
# ─────────────────────────────────────────────────────────────────────────────

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add technical indicator features to an OHLCV DataFrame.
    Input columns: time, open, high, low, close, volume
    """
    df = df.copy()
    close = df["close"].astype(float)
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    volume = df["volume"].astype(float)

    # ── RSI (14) ──────────────────────────────────────────────────────────────
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=13, min_periods=14).mean()
    avg_loss = loss.ewm(com=13, min_periods=14).mean()
    rs = avg_gain / avg_loss.replace(0, float("inf"))
    df["rsi_14"] = 100 - (100 / (1 + rs))

    # ── Moving Averages ────────────────────────────────────────────────────────
    for period in [10, 20, 50, 100, 200]:
        df[f"ma_{period}"] = close.rolling(period).mean()

    # ── MACD ──────────────────────────────────────────────────────────────────
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df["macd"] = ema12 - ema26
    df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean()
    df["macd_hist"] = df["macd"] - df["macd_signal"]

    # ── Bollinger Bands ────────────────────────────────────────────────────────
    bb_ma = close.rolling(20).mean()
    bb_std = close.rolling(20).std()
    df["bb_upper"] = bb_ma + 2 * bb_std
    df["bb_lower"] = bb_ma - 2 * bb_std
    df["bb_pct"] = (close - df["bb_lower"]) / (df["bb_upper"] - df["bb_lower"] + 1e-9)

    # ── ATR (14) ───────────────────────────────────────────────────────────────
    tr = pd.concat([
        high - low,
        (high - close.shift()).abs(),
        (low - close.shift()).abs(),
    ], axis=1).max(axis=1)
    df["atr_14"] = tr.ewm(com=13, min_periods=14).mean()

    # ── Volume ─────────────────────────────────────────────────────────────────
    df["vol_ma_20"] = volume.rolling(20).mean()
    df["vol_zscore"] = (volume - df["vol_ma_20"]) / (volume.rolling(20).std() + 1e-9)
    df["vol_ratio"] = volume / (df["vol_ma_20"] + 1e-9)

    # ── Price Changes ──────────────────────────────────────────────────────────
    for lag in [1, 3, 5, 10]:
        df[f"return_{lag}"] = close.pct_change(lag)

    # ── Distance from MAs (normalised) ────────────────────────────────────────
    for period in [20, 50, 200]:
        col = f"ma_{period}"
        if col in df.columns:
            df[f"dist_{col}"] = (close - df[col]) / (df[col] + 1e-9)

    # ── Stochastic Oscillator (14) ────────────────────────────────────────────
    lowest_low = low.rolling(14).min()
    highest_high = high.rolling(14).max()
    df["stoch_k"] = (close - lowest_low) / (highest_high - lowest_low + 1e-9) * 100
    df["stoch_d"] = df["stoch_k"].rolling(3).mean()

    return df


def add_labels(df: pd.DataFrame, lookahead: int = 3, threshold: float = 0.01) -> pd.DataFrame:
    """
    Label each row based on future price movement:
      2 = BUY   (price rises > threshold% in next N candles)
      0 = SELL  (price falls > threshold% in next N candles)
      1 = HOLD  (otherwise)
    """
    df = df.copy()
    future_return = df["close"].shift(-lookahead) / df["close"] - 1
    df["label"] = 1  # HOLD
    df.loc[future_return > threshold, "label"] = 2   # BUY
    df.loc[future_return < -threshold, "label"] = 0  # SELL
    return df


# ─────────────────────────────────────────────────────────────────────────────
# CLI entrypoint
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Feature engineering for ML trading pipeline")
    parser.add_argument("--input", required=True, help="Path to raw OHLCV CSV")
    parser.add_argument("--output", required=True, help="Path to save feature CSV")
    parser.add_argument("--lookahead", type=int, default=3, help="Candles to look ahead for labelling")
    parser.add_argument("--threshold", type=float, default=0.01, help="Price change threshold for BUY/SELL label")
    args = parser.parse_args()

    print(f"Loading data from {args.input}")
    df = pd.read_csv(args.input)
    df.columns = [c.lower() for c in df.columns]

    print("Engineering features...")
    df = add_features(df)
    df = add_labels(df, lookahead=args.lookahead, threshold=args.threshold)

    # Drop rows with NaN (from rolling windows)
    df.dropna(inplace=True)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"Saved {len(df)} rows with {len(df.columns)} columns to {args.output}")
    print(f"Label distribution:\n{df['label'].value_counts()}")
