from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


DATASET_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset_v2.csv")
OUTPUT_PATH = Path("frontend/src/data/analytics_trends.json")


def normalize_text(value: object) -> str:
    return " ".join(str(value).strip().upper().split())


def build_exact_year_trends(frame: pd.DataFrame) -> dict[str, list[dict[str, int | float]]]:
    grouped = (
        frame.groupby(["brand", "model", "year", "listing_year"], as_index=False)
        .agg(median_price=("price_lkr", "median"), sample_count=("price_lkr", "size"))
        .sort_values(["brand", "model", "year", "listing_year"])
    )

    trends: dict[str, list[dict[str, int | float]]] = {}
    for row in grouped.itertuples(index=False):
        key = f"{row.brand}|||{row.model}|||{int(row.year)}"
        trends.setdefault(key, []).append(
            {
                "listingYear": int(row.listing_year),
                "medianPrice": round(float(row.median_price), 2),
                "sampleCount": int(row.sample_count),
            }
        )
    return trends


def build_model_family_trends(frame: pd.DataFrame) -> dict[str, list[dict[str, int | float]]]:
    grouped = (
        frame.groupby(["brand", "model", "listing_year"], as_index=False)
        .agg(median_price=("price_lkr", "median"), sample_count=("price_lkr", "size"))
        .sort_values(["brand", "model", "listing_year"])
    )

    trends: dict[str, list[dict[str, int | float]]] = {}
    for row in grouped.itertuples(index=False):
        key = f"{row.brand}|||{row.model}"
        trends.setdefault(key, []).append(
            {
                "listingYear": int(row.listing_year),
                "medianPrice": round(float(row.median_price), 2),
                "sampleCount": int(row.sample_count),
            }
        )
    return trends


def main() -> None:
    frame = pd.read_csv(DATASET_PATH)
    frame["brand"] = frame["brand"].map(normalize_text)
    frame["model"] = frame["model"].map(normalize_text)

    output = {
        "generatedFrom": str(DATASET_PATH).replace("\\", "/"),
        "exactYearTrends": build_exact_year_trends(frame),
        "modelFamilyTrends": build_model_family_trends(frame),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")

    print(f"Exported analytics trend data to {OUTPUT_PATH}")
    print(f"Exact year trend groups: {len(output['exactYearTrends'])}")
    print(f"Model family trend groups: {len(output['modelFamilyTrends'])}")


if __name__ == "__main__":
    main()
