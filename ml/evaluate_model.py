from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error

DEFAULT_DATA_PATH = Path("ml/data/active/finalized_vehicle_prices.csv")
DEFAULT_MODEL_PATH = Path("ml/models/price_model.joblib")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained price model.")
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to the evaluation CSV file.",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to the saved model artifact.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    artifact = joblib.load(args.model)

    feature_columns = artifact["feature_columns"]
    target_column = artifact["target_column"]
    model = artifact["model"]

    df = pd.read_csv(args.data)
    X = df[feature_columns].copy()
    y = df[target_column].astype(float)

    pred = np.expm1(model.predict(X))

    mae = mean_absolute_error(y, pred)
    rmse = root_mean_squared_error(y, pred)
    r2 = r2_score(y, pred)

    print("Evaluation complete")
    print(f"Rows: {len(df)}")
    print(f"MAE: {mae:,.2f} LKR")
    print(f"RMSE: {rmse:,.2f} LKR")
    print(f"R2: {r2:.4f}")


if __name__ == "__main__":
    main()
