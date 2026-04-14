from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


FEATURE_COLUMNS = [
    "brand",
    "model",
    "year",
    "engine_cc",
    "gear_type",
    "fuel_type",
    "mileage_km",
    "condition",
    "town",
    "listing_month",
    "listing_year",
]

TARGET_COLUMN = "price_lkr"
DEFAULT_DATA_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset.csv")
DEFAULT_MODEL_PATH = Path("ml/models/price_model.joblib")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the used vehicle price model.")
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to the training CSV file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to save the trained model.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data to use for evaluation.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducibility.",
    )
    return parser.parse_args()


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    missing_columns = [col for col in FEATURE_COLUMNS + [TARGET_COLUMN] if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")
    return df


def build_pipeline() -> Pipeline:
    categorical_features = ["brand", "model", "gear_type", "fuel_type", "condition", "town"]
    numeric_features = ["year", "engine_cc", "mileage_km", "listing_month", "listing_year"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
            (
                "numeric",
                Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))]),
                numeric_features,
            ),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def main() -> None:
    args = parse_args()
    df = load_dataset(args.data)

    X = df[FEATURE_COLUMNS].copy()
    y = np.log1p(df[TARGET_COLUMN].astype(float))

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    pred_log = pipeline.predict(X_test)
    pred_price = np.expm1(pred_log)
    actual_price = np.expm1(y_test)

    mae = mean_absolute_error(actual_price, pred_price)
    rmse = root_mean_squared_error(actual_price, pred_price)
    r2 = r2_score(actual_price, pred_price)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": pipeline,
            "feature_columns": FEATURE_COLUMNS,
            "target_column": TARGET_COLUMN,
        },
        args.output,
    )

    print("Training complete")
    print(f"Rows: {len(df)}")
    print(f"Model saved to: {args.output}")
    print(f"MAE: {mae:,.2f} LKR")
    print(f"RMSE: {rmse:,.2f} LKR")
    print(f"R2: {r2:.4f}")


if __name__ == "__main__":
    main()