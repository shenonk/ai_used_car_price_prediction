from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


SOURCE_PATH = Path(r"F:\Downloads Google\AutoValueLK_Market_Trends_2026.csv")
OUTPUT_PATH = Path("frontend/src/data/market_trends.json")


def normalize_text(value: object) -> str:
    return " ".join(str(value).strip().upper().split())


def main() -> None:
    frame = pd.read_csv(SOURCE_PATH)
    frame["Brand"] = frame["Brand"].map(normalize_text)
    frame["Model"] = frame["Model"].map(normalize_text)

    grouped = (
        frame.groupby(["Brand", "Model", "Manufacture_Year", "Trend_Year"], as_index=False)
        .agg(market_value_lkr=("Market_Value_LKR", "median"))
        .sort_values(["Brand", "Model", "Manufacture_Year", "Trend_Year"])
    )

    exact_trends: dict[str, list[dict[str, int | float]]] = {}
    for row in grouped.itertuples(index=False):
        key = f"{row.Brand}|||{row.Model}|||{int(row.Manufacture_Year)}"
        exact_trends.setdefault(key, []).append(
            {
                "trendYear": int(row.Trend_Year),
                "marketValueLkr": round(float(row.market_value_lkr), 2),
            }
        )

    output = {
        "generatedFrom": str(SOURCE_PATH),
        "exactTrends": exact_trends,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")

    print(f"Exported market trends to {OUTPUT_PATH}")
    print(f"Exact trend groups: {len(exact_trends)}")


if __name__ == "__main__":
    main()
