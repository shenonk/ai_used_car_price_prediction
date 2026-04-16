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
REFERENCE_LISTING_MONTH = 1
REFERENCE_LISTING_YEAR = 2025


class PriceModelState:
    artifact: dict[str, Any] | None = None
    model: Any | None = None
    feature_columns: list[str] = []
    target_column: str | None = None
    load_error: str | None = None


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


@app.post("/predict")
def predict_price(payload: VehiclePredictionRequest) -> dict[str, float]:
    if price_model_state.model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Price model is not available. {price_model_state.load_error or ''}".strip(),
        )

    raw_features = payload.model_dump()
    raw_features["listing_month"] = REFERENCE_LISTING_MONTH
    raw_features["listing_year"] = REFERENCE_LISTING_YEAR
    feature_frame = pd.DataFrame(
        [{column: raw_features[column] for column in price_model_state.feature_columns}]
    )

    try:
        predicted_log_price = price_model_state.model.predict(feature_frame)[0]
        predicted_price = float(np.expm1(predicted_log_price))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error}") from error

    return {"predicted_price_lkr": round(predicted_price, 2)}
