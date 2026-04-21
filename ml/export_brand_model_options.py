from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


INPUT_PATH = Path("ml/data/active/AutoValueLK_Finalized_Dataset_v2.csv")
OUTPUT_PATH = Path("frontend/src/data/brand_model_options.json")


def normalize_text(value: object) -> str:
    return " ".join(str(value or "").strip().upper().split())


def main() -> None:
    df = pd.read_csv(INPUT_PATH)

    working = df[["brand", "model"]].copy()
    working["brand"] = working["brand"].map(normalize_text)
    working["model"] = working["model"].map(normalize_text)
    working = working[(working["brand"] != "") & (working["model"] != "")]
    working = working.drop_duplicates().sort_values(["brand", "model"])

    brand_model_map: dict[str, list[str]] = {}
    for brand, group in working.groupby("brand", sort=True):
        brand_model_map[brand] = group["model"].tolist()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(brand_model_map, indent=2) + "\n", encoding="utf-8")

    print(f"Exported {len(brand_model_map)} brands to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
