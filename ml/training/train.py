"""
Training script for the ML trading model.

Usage:
    python ml/training/train.py \
        --features ml/data/BTCUSDT_1h_features.csv \
        --output ml/models/model_v1.pkl

Or fetch live data directly from Binance:
    python ml/training/train.py --symbol BTCUSDT --interval 1h --limit 5000
"""
import argparse
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# XGBoost is preferred if available
try:
    from xgboost import XGBClassifier
    _XGBOOST_AVAILABLE = True
except ImportError:
    _XGBOOST_AVAILABLE = False

# Allow running from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


FEATURE_COLS = [
    "rsi_14",
    "ma_20", "ma_50",
    "macd", "macd_signal", "macd_hist",
    "bb_pct",
    "atr_14",
    "vol_zscore", "vol_ratio",
    "return_1", "return_3", "return_5",
    "dist_ma_20", "dist_ma_50",
    "stoch_k", "stoch_d",
]


def load_features_from_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.dropna(subset=["label"], inplace=True)
    return df


def fetch_live_features(symbol: str, interval: str, limit: int) -> pd.DataFrame:
    """Download OHLCV from Binance, run feature engineering, and return labeled DataFrame."""
    # Add project root to path so we can import backend settings
    try:
        from app.core.config import settings
        from binance.client import Client
        client = Client(settings.BINANCE_API_KEY, settings.BINANCE_API_SECRET,
                        testnet=settings.BINANCE_TESTNET)
    except ImportError:
        # Fallback: use public Binance REST without auth
        import requests
        resp = requests.get(
            "https://api.binance.com/api/v3/klines",
            params={"symbol": symbol, "interval": interval, "limit": limit},
            timeout=10,
        )
        raw = resp.json()
        cols = ["time", "open", "high", "low", "close", "volume",
                "ct", "qv", "nt", "tbb", "tbq", "ig"]
        df = pd.DataFrame(raw, columns=cols)
        for c in ["open", "high", "low", "close", "volume"]:
            df[c] = df[c].astype(float)
    else:
        raw = client.get_klines(symbol=symbol, interval=interval, limit=limit)
        cols = ["time", "open", "high", "low", "close", "volume",
                "ct", "qv", "nt", "tbb", "tbq", "ig"]
        df = pd.DataFrame(raw, columns=cols)
        for c in ["open", "high", "low", "close", "volume"]:
            df[c] = df[c].astype(float)

    # Run feature engineering
    ml_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.path.join(ml_dir, "features"))
    from feature_engineering import add_features, add_labels
    df = add_features(df)
    df = add_labels(df)
    df.dropna(inplace=True)
    return df


def get_available_features(df: pd.DataFrame) -> list:
    """Return only the feature columns that exist in this DataFrame."""
    return [c for c in FEATURE_COLS if c in df.columns]


def train(df: pd.DataFrame, output_path: str, use_xgboost: bool = True):
    avail_features = get_available_features(df)
    print(f"Using {len(avail_features)} features: {avail_features}")

    X = df[avail_features].values
    y = df["label"].values.astype(int)

    print(f"Dataset: {len(X)} samples | label dist: {np.bincount(y)}")

    # Time-series cross-validation (5 folds)
    tscv = TimeSeriesSplit(n_splits=5)
    cv_scores = []

    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        if use_xgboost and _XGBOOST_AVAILABLE:
            model = XGBClassifier(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                use_label_encoder=False,
                eval_metric="mlogloss",
                random_state=42,
                verbosity=0,
            )
            model.fit(X_train, y_train)
        else:
            model = RandomForestClassifier(
                n_estimators=200,
                max_depth=8,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_train, y_train)

        score = accuracy_score(y_val, model.predict(X_val))
        cv_scores.append(score)
        print(f"  Fold {fold + 1}: accuracy={score:.3f}")

    print(f"\nMean CV accuracy: {np.mean(cv_scores):.3f} ± {np.std(cv_scores):.3f}")

    # Train final model on all data
    print("\nTraining final model on full dataset...")
    if use_xgboost and _XGBOOST_AVAILABLE:
        final_model = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
            verbosity=0,
        )
    else:
        final_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            random_state=42,
            n_jobs=-1,
        )

    final_model.fit(X, y)
    y_pred = final_model.predict(X)
    print("\nTraining set classification report:")
    print(classification_report(y, y_pred, target_names=["SELL", "HOLD", "BUY"]))

    # Save model
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    joblib.dump(final_model, output_path)
    print(f"\nModel saved to: {output_path}")

    # Save feature list alongside model
    meta_path = output_path.replace(".pkl", "_meta.json")
    import json
    with open(meta_path, "w") as f:
        json.dump({"features": avail_features, "labels": {0: "SELL", 1: "HOLD", 2: "BUY"}}, f, indent=2)
    print(f"Metadata saved to: {meta_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ML trading classifier")
    parser.add_argument("--features", help="Path to feature CSV (from feature_engineering.py)")
    parser.add_argument("--symbol", default="BTCUSDT", help="Symbol for live data fetch")
    parser.add_argument("--interval", default="1h", help="Candle interval (e.g. 1h, 4h, 1d)")
    parser.add_argument("--limit", type=int, default=5000, help="Number of candles to fetch")
    parser.add_argument("--output", default="ml/models/model_v1.pkl", help="Output model path")
    parser.add_argument("--no-xgboost", action="store_true", help="Force RandomForest instead of XGBoost")
    args = parser.parse_args()

    if args.features:
        print(f"Loading features from CSV: {args.features}")
        df = load_features_from_csv(args.features)
    else:
        print(f"Fetching live data: {args.symbol} {args.interval} x{args.limit} candles")
        df = fetch_live_features(args.symbol, args.interval, args.limit)

    train(df, args.output, use_xgboost=not args.no_xgboost)
