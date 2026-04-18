from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd


DEFAULT_DATA_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset.csv")
DEFAULT_OUTPUT_DIR = Path("ml/reports")
TARGET_COLUMN = "price_lkr"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze dataset coverage, label quality, and price variance by brand/model."
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to the finalized dataset CSV.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory where CSV analysis reports should be written.",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=20,
        help="How many top rows to print for major summary tables.",
    )
    return parser.parse_args()


def canonicalize_label(value: object) -> str:
    text = str(value or "").strip().upper()
    text = re.sub(r"\s+", " ", text)
    return text


def load_dataset(data_path: Path) -> pd.DataFrame:
    df = pd.read_csv(data_path)
    required_columns = {"brand", "model", TARGET_COLUMN}
    missing_columns = sorted(required_columns.difference(df.columns))
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")
    return df


def summarize_brand_counts(df: pd.DataFrame) -> pd.DataFrame:
    summary = (
        df.groupby("brand", dropna=False)
        .size()
        .reset_index(name="row_count")
        .sort_values(["row_count", "brand"], ascending=[False, True])
    )
    return summary


def summarize_brand_model_coverage(df: pd.DataFrame) -> pd.DataFrame:
    summary = (
        df.groupby(["brand", "model"], dropna=False)
        .agg(
            row_count=(TARGET_COLUMN, "size"),
            min_price_lkr=(TARGET_COLUMN, "min"),
            median_price_lkr=(TARGET_COLUMN, "median"),
            max_price_lkr=(TARGET_COLUMN, "max"),
            std_price_lkr=(TARGET_COLUMN, "std"),
            min_year=("year", "min"),
            max_year=("year", "max"),
        )
        .reset_index()
    )
    summary["std_price_lkr"] = summary["std_price_lkr"].fillna(0.0)
    price_denominator = summary["median_price_lkr"].abs().clip(lower=1.0)
    summary["price_range_lkr"] = summary["max_price_lkr"] - summary["min_price_lkr"]
    summary["std_to_median_ratio"] = summary["std_price_lkr"] / price_denominator
    summary["range_to_median_ratio"] = summary["price_range_lkr"] / price_denominator
    summary = summary.sort_values(["row_count", "brand", "model"], ascending=[False, True, True])
    return summary


def find_low_sample_models(coverage: pd.DataFrame, threshold: int) -> pd.DataFrame:
    return coverage[coverage["row_count"] < threshold].sort_values(
        ["row_count", "brand", "model"], ascending=[True, True, True]
    )


def find_high_variance_models(coverage: pd.DataFrame) -> pd.DataFrame:
    filtered = coverage[coverage["row_count"] >= 5].copy()
    filtered = filtered.sort_values(
        ["std_to_median_ratio", "range_to_median_ratio", "std_price_lkr"],
        ascending=[False, False, False],
    )
    return filtered


def find_suspicious_labels(df: pd.DataFrame) -> pd.DataFrame:
    labels = df[["brand", "model"]].copy()
    labels["brand_clean"] = labels["brand"].map(canonicalize_label)
    labels["model_clean"] = labels["model"].map(canonicalize_label)
    labels["issue_brand_equals_model"] = labels["brand_clean"] == labels["model_clean"]
    labels["issue_model_contains_brand_prefix"] = labels.apply(
        lambda row: row["model_clean"].startswith(f"{row['brand_clean']} "),
        axis=1,
    )
    labels["issue_model_contains_brand_suffix"] = labels.apply(
        lambda row: row["model_clean"].endswith(f" {row['brand_clean']}"),
        axis=1,
    )
    labels["issue_brand_needs_normalization"] = (
        labels["brand"].astype(str).str.strip() != labels["brand_clean"]
    )
    labels["issue_model_needs_normalization"] = (
        labels["model"].astype(str).str.strip() != labels["model_clean"]
    )

    suspicious = labels[
        labels["issue_brand_needs_normalization"]
        | labels["issue_model_needs_normalization"]
        | labels["issue_brand_equals_model"]
        | labels["issue_model_contains_brand_prefix"]
        | labels["issue_model_contains_brand_suffix"]
        | labels["brand_clean"].str.contains(r"\s{2,}", regex=True)
        | labels["model_clean"].str.contains(r"\s{2,}", regex=True)
    ].copy()

    suspicious = suspicious.drop_duplicates().sort_values(["brand_clean", "model_clean", "brand", "model"])
    return suspicious


def find_normalization_collisions(df: pd.DataFrame) -> pd.DataFrame:
    labels = df[["brand", "model"]].copy()
    labels["brand_clean"] = labels["brand"].map(canonicalize_label)
    labels["model_clean"] = labels["model"].map(canonicalize_label)

    collisions = (
        labels.groupby(["brand_clean", "model_clean"], dropna=False)
        .agg(
            raw_brand_variants=("brand", lambda values: sorted({str(v) for v in values})),
            raw_model_variants=("model", lambda values: sorted({str(v) for v in values})),
            row_count=("brand", "size"),
        )
        .reset_index()
    )

    collisions["brand_variant_count"] = collisions["raw_brand_variants"].map(len)
    collisions["model_variant_count"] = collisions["raw_model_variants"].map(len)
    collisions = collisions[
        (collisions["brand_variant_count"] > 1) | (collisions["model_variant_count"] > 1)
    ].copy()
    collisions = collisions.sort_values(
        ["row_count", "brand_variant_count", "model_variant_count"],
        ascending=[False, False, False],
    )
    return collisions


def write_report(frame: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False)


def print_table(title: str, frame: pd.DataFrame, top_n: int) -> None:
    print(title)
    if frame.empty:
        print("No rows found.")
    else:
        print(frame.head(top_n).to_string(index=False))
    print()


def print_interpretation(
    low_sample_lt3: pd.DataFrame,
    low_sample_lt5: pd.DataFrame,
    high_variance: pd.DataFrame,
    suspicious_labels: pd.DataFrame,
    normalization_collisions: pd.DataFrame,
) -> None:
    print("Interpretation")

    if len(low_sample_lt3) > 0:
        print(
            f"- There are {len(low_sample_lt3)} brand/model combinations with fewer than 3 rows. "
            "That is a strong sign of weak dataset coverage for some vehicles."
        )
    if len(low_sample_lt5) > 0:
        print(
            f"- There are {len(low_sample_lt5)} brand/model combinations with fewer than 5 rows. "
            "Sparse categories are likely contributing to unstable local predictions."
        )
    if not high_variance.empty and float(high_variance.iloc[0]["std_to_median_ratio"]) > 0.25:
        print(
            "- Some models have very high price variance relative to their median price. "
            "That usually means the current features are not enough to fully explain pricing within those models."
        )
    if len(suspicious_labels) > 0 or len(normalization_collisions) > 0:
        print(
            "- Suspicious naming patterns were found. Dataset cleaning should happen before major retraining, "
            "because inconsistent brand/model labels can fragment the data the model learns from."
        )

    if len(suspicious_labels) > 0 or len(normalization_collisions) > 0:
        print("- Recommended next step: dataset cleaning and label normalization first, then retrain.")
    elif len(low_sample_lt3) > 0 or len(low_sample_lt5) > 0:
        print("- Recommended next step: improve coverage for sparse models before expecting reliable local accuracy.")
    else:
        print("- Recommended next step: model improvement is likely the bigger lever than label cleanup.")

    print()


def main() -> None:
    args = parse_args()
    df = load_dataset(args.data)

    brand_counts = summarize_brand_counts(df)
    brand_model_coverage = summarize_brand_model_coverage(df)
    low_sample_lt3 = find_low_sample_models(brand_model_coverage, threshold=3)
    low_sample_lt5 = find_low_sample_models(brand_model_coverage, threshold=5)
    high_variance = find_high_variance_models(brand_model_coverage)
    suspicious_labels = find_suspicious_labels(df)
    normalization_collisions = find_normalization_collisions(df)

    write_report(brand_counts, args.output_dir / "brand_counts.csv")
    write_report(brand_model_coverage, args.output_dir / "brand_model_coverage.csv")
    write_report(low_sample_lt3, args.output_dir / "low_sample_models_lt3.csv")
    write_report(low_sample_lt5, args.output_dir / "low_sample_models_lt5.csv")
    write_report(high_variance, args.output_dir / "high_variance_models.csv")
    write_report(suspicious_labels, args.output_dir / "suspicious_labels.csv")
    write_report(normalization_collisions, args.output_dir / "normalization_collisions.csv")

    print(f"Rows in dataset: {len(df)}")
    print(f"Distinct brands: {df['brand'].nunique(dropna=False)}")
    print(f"Distinct brand/model combinations: {df[['brand', 'model']].drop_duplicates().shape[0]}")
    print()

    print_table("Top brands by row count", brand_counts, args.top_n)
    print_table("Lowest-sample models (< 3 rows)", low_sample_lt3, args.top_n)
    print_table("Lowest-sample models (< 5 rows)", low_sample_lt5, args.top_n)
    print_table("Highest-variance models", high_variance, args.top_n)
    print_table("Suspicious raw labels", suspicious_labels, args.top_n)
    print_table("Normalization collisions", normalization_collisions, args.top_n)
    print_interpretation(
        low_sample_lt3,
        low_sample_lt5,
        high_variance,
        suspicious_labels,
        normalization_collisions,
    )
    print(f"CSV reports written to: {args.output_dir}")


if __name__ == "__main__":
    main()
