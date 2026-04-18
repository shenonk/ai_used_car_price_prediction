from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error


DEFAULT_DATA_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset.csv")
DEFAULT_MODEL_PATH = Path("ml/models/price_model.joblib")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze model prediction errors by brand/model and highlight weak areas."
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to the finalized dataset CSV.",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to the saved model artifact.",
    )
    parser.add_argument(
        "--min-group-size",
        type=int,
        default=5,
        help="Minimum rows required before a brand/model group is included in worst-group reporting.",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=15,
        help="How many worst groups/rows to print.",
    )
    return parser.parse_args()


def load_inputs(data_path: Path, model_path: Path) -> tuple[pd.DataFrame, list[str], str, object]:
    artifact = joblib.load(model_path)
    feature_columns = list(artifact["feature_columns"])
    target_column = artifact["target_column"]
    model = artifact["model"]

    df = pd.read_csv(data_path)
    missing_columns = [col for col in feature_columns + [target_column] if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    return df, feature_columns, target_column, model


def build_scored_frame(
    df: pd.DataFrame, feature_columns: list[str], target_column: str, model: object
) -> pd.DataFrame:
    scored = df.copy()
    scored["predicted_price_lkr"] = np.expm1(model.predict(scored[feature_columns].copy()))
    scored["absolute_error_lkr"] = (scored["predicted_price_lkr"] - scored[target_column]).abs()
    denominator = scored[target_column].abs().clip(lower=1.0)
    scored["absolute_percentage_error"] = scored["absolute_error_lkr"] / denominator
    scored["signed_error_lkr"] = scored["predicted_price_lkr"] - scored[target_column]
    return scored


def summarize_group_errors(
    scored: pd.DataFrame, group_columns: list[str], min_group_size: int, top_n: int
) -> pd.DataFrame:
    summary = (
        scored.groupby(group_columns, dropna=False)
        .agg(
            row_count=("predicted_price_lkr", "size"),
            median_actual_price_lkr=("price_lkr", "median"),
            median_predicted_price_lkr=("predicted_price_lkr", "median"),
            mae_lkr=("absolute_error_lkr", "mean"),
            median_ape=("absolute_percentage_error", "median"),
            mean_signed_error_lkr=("signed_error_lkr", "mean"),
        )
        .reset_index()
    )
    summary = summary[summary["row_count"] >= min_group_size].copy()
    summary["median_ape_pct"] = summary["median_ape"] * 100
    summary = summary.sort_values(
        ["median_ape_pct", "mae_lkr", "row_count"],
        ascending=[False, False, True],
    )
    return summary.head(top_n)


def print_metrics(scored: pd.DataFrame) -> None:
    actual = scored["price_lkr"].astype(float)
    predicted = scored["predicted_price_lkr"].astype(float)

    mae = mean_absolute_error(actual, predicted)
    rmse = root_mean_squared_error(actual, predicted)
    r2 = r2_score(actual, predicted)

    print("Overall dataset scoring")
    print(f"Rows: {len(scored)}")
    print(f"MAE: {mae:,.2f} LKR")
    print(f"RMSE: {rmse:,.2f} LKR")
    print(f"R2: {r2:.4f}")
    print()


def print_table(title: str, frame: pd.DataFrame) -> None:
    print(title)
    if frame.empty:
        print("No rows matched the current filters.")
    else:
        print(frame.to_string(index=False))
    print()


def main() -> None:
    args = parse_args()
    df, feature_columns, target_column, model = load_inputs(args.data, args.model)
    scored = build_scored_frame(df, feature_columns, target_column, model)

    worst_brands = summarize_group_errors(scored, ["brand"], args.min_group_size, args.top_n)
    worst_models = summarize_group_errors(scored, ["brand", "model"], args.min_group_size, args.top_n)

    worst_rows = (
        scored[
            [
                "brand",
                "model",
                "year",
                "condition",
                "fuel_type",
                "gear_type",
                "town",
                "price_lkr",
                "predicted_price_lkr",
                "absolute_error_lkr",
                "absolute_percentage_error",
            ]
        ]
        .sort_values(["absolute_percentage_error", "absolute_error_lkr"], ascending=[False, False])
        .head(args.top_n)
        .copy()
    )
    worst_rows["absolute_percentage_error"] = worst_rows["absolute_percentage_error"] * 100

    print_metrics(scored)
    print_table(
        f"Worst brands (minimum {args.min_group_size} rows)",
        worst_brands,
    )
    print_table(
        f"Worst brand/model combinations (minimum {args.min_group_size} rows)",
        worst_models,
    )
    print_table("Worst individual rows", worst_rows)


if __name__ == "__main__":
    main()
