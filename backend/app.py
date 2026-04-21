from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "models" / "price_model.joblib"
REFERENCE_DATASET_PATH = Path(__file__).resolve().parents[1] / "ml" / "data" / "active" / "AutoValueLK_Finalized_Dataset_v2.csv"
OLDER_REFERENCE_LISTING_MONTH = 1
OLDER_REFERENCE_LISTING_YEAR = 2025
RECENT_REFERENCE_LISTING_MONTH = 4
RECENT_REFERENCE_LISTING_YEAR = 2026


class PriceModelState:
    artifact: dict[str, Any] | None = None
    model: Any | None = None
    feature_columns: list[str] = []
    target_column: str | None = None
    load_error: str | None = None
    reference_df: pd.DataFrame | None = None


price_model_state = PriceModelState()


class VehiclePredictionRequest(BaseModel):
    brand: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    year: int = Field(..., ge=1900, le=2100)
    engine_cc: float = Field(..., ge=0)
    gear_type: str = Field(..., min_length=1)
    fuel_type: str = Field(..., min_length=1)
    mileage_km: float = Field(..., ge=0)
    condition: str = Field(..., min_length=1)
    town: str = Field(..., min_length=1)
    listing_month: int = Field(..., ge=1, le=12)
    listing_year: int = Field(..., ge=1900, le=2100)


def normalize_input(data: dict[str, Any]) -> dict[str, Any]:
    return {
        **data,
        "brand": data["brand"].strip().upper(),
        "model": data["model"].strip().upper(),
        "town": data["town"].strip(),
    }


def normalize_reference_text(value: object) -> str:
    return str(value or "").strip().upper()


def resolve_reference_listing_period(payload: VehiclePredictionRequest) -> tuple[int, int]:
    if payload.condition == "BRAND NEW" or payload.year >= 2023:
        return RECENT_REFERENCE_LISTING_MONTH, RECENT_REFERENCE_LISTING_YEAR
    return OLDER_REFERENCE_LISTING_MONTH, OLDER_REFERENCE_LISTING_YEAR


def load_reference_dataset() -> None:
    if not REFERENCE_DATASET_PATH.exists():
        print(f"[WARN] Reference dataset not found at {REFERENCE_DATASET_PATH}", flush=True)
        price_model_state.reference_df = None
        return

    reference_df = pd.read_csv(REFERENCE_DATASET_PATH)
    reference_df["brand_norm"] = reference_df["brand"].map(normalize_reference_text)
    reference_df["model_norm"] = reference_df["model"].map(normalize_reference_text)
    reference_df["town_norm"] = reference_df["town"].astype(str).str.strip()
    price_model_state.reference_df = reference_df


def load_price_model() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

    artifact = joblib.load(MODEL_PATH)
    required_keys = {"model", "feature_columns", "target_column"}
    missing_keys = required_keys.difference(artifact)

    if missing_keys:
        raise ValueError(f"Model artifact is missing required keys: {sorted(missing_keys)}")

    price_model_state.artifact = artifact
    price_model_state.model = artifact["model"]
    price_model_state.feature_columns = list(artifact["feature_columns"])
    price_model_state.target_column = artifact["target_column"]
    price_model_state.load_error = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        load_price_model()
        load_reference_dataset()
        print(f"[OK] Loaded price model from {MODEL_PATH}", flush=True)
        print(f"[OK] Feature columns: {price_model_state.feature_columns}", flush=True)
        print(f"[OK] Target column: {price_model_state.target_column}", flush=True)
    except Exception as error:
        price_model_state.load_error = str(error)
        print(f"[FAIL] Failed to load price model: {error}", flush=True)

    yield


app = FastAPI(title="AI Used Car Price Prediction API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Invalid prediction request payload.",
            "details": exc.errors(),
        },
    )


@app.get("/")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": price_model_state.model is not None,
        "model_path": str(MODEL_PATH),
        "target_column": price_model_state.target_column,
        "feature_columns": price_model_state.feature_columns,
        "load_error": price_model_state.load_error,
    }


def get_targeted_reference_price(features: dict[str, Any]) -> float | None:
    reference_df = price_model_state.reference_df
    if reference_df is None or reference_df.empty:
        return None

    brand = features["brand"]
    model = features["model"]
    family_rows: pd.DataFrame | None = None
    minimum_exact_matches = 3
    minimum_nearby_matches = 3

    if brand == "BMW" and "520" in model:
        family_rows = reference_df[
            reference_df["brand_norm"].eq("BMW") & reference_df["model_norm"].str.contains("520", na=False)
        ].copy()
    elif brand == "TESLA" and "MODEL 3" in model:
        family_rows = reference_df[
            reference_df["brand_norm"].eq("TESLA") & reference_df["model_norm"].str.contains("MODEL 3", na=False)
        ].copy()
    elif brand == "SUZUKI" and ("WAGON R" in model or "STINGRAY" in model):
        family_rows = reference_df[
            reference_df["brand_norm"].eq("SUZUKI")
            & reference_df["model_norm"].str.contains("WAGON R|STINGRAY", na=False)
        ].copy()
        minimum_exact_matches = 2
        minimum_nearby_matches = 2

    if family_rows is None or family_rows.empty:
        return None

    subset = family_rows.copy()
    subset = subset[subset["condition"].astype(str).eq(features["condition"])]
    if subset.empty:
        subset = family_rows.copy()

    fuel_subset = subset[subset["fuel_type"].astype(str).str.lower().eq(features["fuel_type"])]
    if not fuel_subset.empty:
        subset = fuel_subset

    if features["engine_cc"] == 0:
        engine_subset = subset[subset["engine_cc"].fillna(-1).eq(0)]
    else:
        engine_subset = subset[subset["engine_cc"].sub(float(features["engine_cc"])).abs() <= 250]
    if not engine_subset.empty:
        subset = engine_subset

    if brand == "SUZUKI" and ("WAGON R" in model or "STINGRAY" in model):
        plausible_price_subset = subset[subset["price_lkr"].between(1_000_000, 20_000_000)]
        if not plausible_price_subset.empty:
            subset = plausible_price_subset

        if len(subset) >= 4:
            q1 = float(subset["price_lkr"].quantile(0.25))
            q3 = float(subset["price_lkr"].quantile(0.75))
            iqr = q3 - q1
            lower_bound = max(0.0, q1 - (1.5 * iqr))
            upper_bound = q3 + (1.5 * iqr)
            iqr_filtered_subset = subset[subset["price_lkr"].between(lower_bound, upper_bound)]
            if not iqr_filtered_subset.empty:
                subset = iqr_filtered_subset

    exact_year = subset[subset["year"].eq(int(features["year"]))]
    if len(exact_year) >= minimum_exact_matches:
        return float(exact_year["price_lkr"].median())

    nearby_year = subset[subset["year"].sub(int(features["year"])).abs() <= 2]
    if len(nearby_year) >= minimum_nearby_matches:
        return float(nearby_year["price_lkr"].median())

    family_median_price = float(subset["price_lkr"].median())
    family_median_year = float(subset["year"].median())
    input_year = float(features["year"])

    if input_year < family_median_year:
        year_factor = 0.93 ** (family_median_year - input_year)
    else:
        year_factor = 1.04 ** (input_year - family_median_year)

    adjusted_price = family_median_price * year_factor
    return float(max(0.0, adjusted_price))


@app.post("/predict")
def predict_price(payload: VehiclePredictionRequest) -> dict[str, float]:
    if price_model_state.model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Price model is not available. {price_model_state.load_error or ''}".strip(),
        )

    raw_features = normalize_input(payload.model_dump())
    listing_month, listing_year = resolve_reference_listing_period(payload)
    raw_features["listing_month"] = listing_month
    raw_features["listing_year"] = listing_year
    print(f"Normalized input: {raw_features}", flush=True)
    feature_frame = pd.DataFrame(
        [{column: raw_features[column] for column in price_model_state.feature_columns}]
    )

    try:
        predicted_log_price = price_model_state.model.predict(feature_frame)[0]
        predicted_price = float(np.expm1(predicted_log_price))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error}") from error

    targeted_reference_price = get_targeted_reference_price(raw_features)
    if targeted_reference_price is not None:
        print(
            f"Applying targeted reference calibration for {raw_features['brand']} {raw_features['model']}: "
            f"{predicted_price:,.2f} -> {targeted_reference_price:,.2f}",
            flush=True,
        )
        predicted_price = targeted_reference_price

    return {"predicted_price_lkr": round(predicted_price, 2)}
