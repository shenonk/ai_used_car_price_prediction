from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd


DEFAULT_INPUT_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset.csv")
DEFAULT_OUTPUT_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset_v2.csv")
DEFAULT_REPORT_DIR = Path("ml/reports/label_cleaning")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Conservatively clean vehicle brand/model labels and write review reports."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help="Path to the original finalized dataset CSV.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path to write the cleaned dataset CSV.",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=DEFAULT_REPORT_DIR,
        help="Directory to write review CSV reports.",
    )
    return parser.parse_args()


def normalize_text(value: object) -> str:
    text = str(value or "").strip().upper()
    text = re.sub(r"\s+", " ", text)
    return text


def remove_duplicated_brand_prefix(brand: str, model: str) -> tuple[str, bool]:
    prefix = f"{brand} "
    if model.startswith(prefix):
        cleaned_model = model[len(prefix) :].strip()
        if cleaned_model:
            return cleaned_model, True
    return model, False


def build_remaining_suspicious_rows(df: pd.DataFrame) -> pd.DataFrame:
    working = df.copy()
    working["issue_brand_equals_model"] = working["brand_clean"] == working["model_clean"]
    working["issue_model_contains_brand_prefix"] = working.apply(
        lambda row: row["model_clean"].startswith(f"{row['brand_clean']} "),
        axis=1,
    )
    working["issue_model_contains_brand_suffix"] = working.apply(
        lambda row: row["model_clean"].endswith(f" {row['brand_clean']}"),
        axis=1,
    )
    suspicious = working[
        working["issue_brand_equals_model"]
        | working["issue_model_contains_brand_prefix"]
        | working["issue_model_contains_brand_suffix"]
    ].copy()
    return suspicious.sort_values(["brand_clean", "model_clean", "original_brand", "original_model"])


def main() -> None:
    args = parse_args()
    args.report_dir.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.input)
    row_count_before = len(df)
    unique_brands_before = df["brand"].nunique(dropna=False)
    unique_brand_models_before = df[["brand", "model"]].drop_duplicates().shape[0]

    cleaned = df.copy()
    cleaned["original_brand"] = cleaned["brand"].astype(str)
    cleaned["original_model"] = cleaned["model"].astype(str)

    cleaned["brand_clean"] = cleaned["brand"].map(normalize_text)
    cleaned["model_clean"] = cleaned["model"].map(normalize_text)

    prefix_cleanup_flags: list[bool] = []
    updated_models: list[str] = []
    for brand, model in zip(cleaned["brand_clean"], cleaned["model_clean"], strict=False):
        next_model, was_changed = remove_duplicated_brand_prefix(brand, model)
        updated_models.append(next_model)
        prefix_cleanup_flags.append(was_changed)

    cleaned["brand"] = cleaned["brand_clean"]
    cleaned["model"] = updated_models
    cleaned["prefix_cleanup_applied"] = prefix_cleanup_flags
    cleaned["brand_changed"] = cleaned["original_brand"] != cleaned["brand"]
    cleaned["model_changed"] = cleaned["original_model"] != cleaned["model"]
    cleaned["any_label_changed"] = cleaned["brand_changed"] | cleaned["model_changed"]

    brand_equals_model_review = cleaned[cleaned["brand"] == cleaned["model"]].copy()
    prefix_cleanup_review = cleaned[cleaned["prefix_cleanup_applied"]].copy()
    remaining_suspicious = build_remaining_suspicious_rows(cleaned)
    changed_rows = cleaned[cleaned["any_label_changed"]].copy()

    columns_for_review = [
        "original_brand",
        "original_model",
        "brand",
        "model",
        "brand_changed",
        "model_changed",
        "prefix_cleanup_applied",
    ]

    brand_equals_model_review[columns_for_review].to_csv(
        args.report_dir / "brand_equals_model_review.csv", index=False
    )
    prefix_cleanup_review[columns_for_review].to_csv(
        args.report_dir / "prefix_cleanup_review.csv", index=False
    )
    remaining_suspicious[columns_for_review].to_csv(
        args.report_dir / "remaining_suspicious_labels.csv", index=False
    )
    changed_rows[columns_for_review].to_csv(
        args.report_dir / "all_changed_rows.csv", index=False
    )

    cleaned_dataset = cleaned.drop(
        columns=[
            "original_brand",
            "original_model",
            "brand_clean",
            "model_clean",
            "prefix_cleanup_applied",
            "brand_changed",
            "model_changed",
            "any_label_changed",
        ]
    )
    cleaned_dataset.to_csv(args.output, index=False)

    row_count_after = len(cleaned_dataset)
    unique_brands_after = cleaned_dataset["brand"].nunique(dropna=False)
    unique_brand_models_after = cleaned_dataset[["brand", "model"]].drop_duplicates().shape[0]

    print("Dataset label cleaning complete")
    print(f"Input dataset: {args.input}")
    print(f"Cleaned dataset: {args.output}")
    print()
    print(f"Rows before: {row_count_before}")
    print(f"Rows after: {row_count_after}")
    print(f"Unique brands before: {unique_brands_before}")
    print(f"Unique brands after: {unique_brands_after}")
    print(f"Unique brand/model combinations before: {unique_brand_models_before}")
    print(f"Unique brand/model combinations after: {unique_brand_models_after}")
    print()
    print(f"Rows changed by any label cleanup: {len(changed_rows)}")
    print(f"Rows changed by duplicated brand-prefix cleanup: {len(prefix_cleanup_review)}")
    print(f"Rows where brand == model after conservative cleanup: {len(brand_equals_model_review)}")
    print(f"Remaining suspicious rows for manual review: {len(remaining_suspicious)}")
    print()
    print(f"Review reports written to: {args.report_dir}")


if __name__ == "__main__":
    main()
