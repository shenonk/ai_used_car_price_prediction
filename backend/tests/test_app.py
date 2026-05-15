import os
import sys
from pathlib import Path

os.environ.setdefault("ADMIN_STORE_PERSIST", "false")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
import pytest
from fastapi.testclient import TestClient

import backend.app as app_module


@pytest.fixture(autouse=True)
def isolated_backend_state(monkeypatch):
    app_module.price_model_state.admin_store = app_module.get_default_admin_store()
    app_module.price_model_state.admin_tokens = set()
    app_module.price_model_state.reference_df = None
    app_module.price_model_state.model = None
    app_module.price_model_state.feature_columns = []
    app_module.price_model_state.load_error = "test model unavailable"

    monkeypatch.setattr(app_module, "persist_admin_store", lambda: None)
    monkeypatch.setattr(app_module, "fetch_marketplace_listings_from_supabase", lambda status="all": [])
    monkeypatch.setattr(app_module, "fetch_prediction_count_from_supabase", lambda: None)
    yield


@pytest.fixture
def client():
    return TestClient(app_module.app)


def test_normalize_input_trims_and_uppercases_reference_fields():
    normalized = app_module.normalize_input(
        {
            "brand": " toyota ",
            "model": " aqua x urban ",
            "town": " Colombo ",
            "year": 2020,
        }
    )

    assert normalized["brand"] == "TOYOTA"
    assert normalized["model"] == "AQUA X URBAN"
    assert normalized["town"] == "Colombo"
    assert normalized["year"] == 2020


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("true", True),
        ("1", True),
        ("yes", True),
        (True, True),
        ("false", False),
        ("0", False),
        (None, False),
    ],
)
def test_parse_boolean_flag(value, expected):
    assert app_module.parse_boolean_flag(value) is expected


def test_boost_selection_normalizes_aliases_deduplicates_and_ignores_invalid_values():
    boosts = app_module.normalize_selected_boosts(
        boost_types=["urgent", "bumped", "bump", "invalid", "", "spotlight"]
    )

    assert boosts == ["urgent", "bump", "spotlight"]
    assert app_module.calculate_boost_total(boosts) == 1550
    assert app_module.format_boost_option_label(boosts) == "Urgent, Bump Up, Spotlight"


def test_get_prediction_warning_detects_large_reference_outlier():
    app_module.price_model_state.reference_df = pd.DataFrame(
        {
            "brand_norm": ["TOYOTA"] * 6,
            "model_norm": ["AQUA"] * 6,
            "year": [2020, 2020, 2021, 2021, 2019, 2022],
            "price_lkr": [4_000_000, 4_100_000, 4_200_000, 4_300_000, 4_150_000, 4_250_000],
        }
    )

    warning = app_module.get_prediction_warning(
        {"brand": "TOYOTA", "model": "AQUA", "year": 2020},
        predicted_price=20_000_000,
    )

    assert warning is not None
    assert "outside the broad reference range" in warning


def test_health_check_returns_model_status_shape(client):
    response = client.get("/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "model_loaded" in payload
    assert "model_path" in payload


def test_public_marketplace_listings_returns_expected_shape(client):
    app_module.price_model_state.admin_store["marketplace_listings"] = [
        {
            "id": "listing-1",
            "brand": "Toyota",
            "model": "Raize",
            "status": "approved",
            "view_count": 0,
            "created_at": "2026-05-01T00:00:00Z",
        }
    ]

    response = client.get("/api/marketplace/listings")

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload["listings"], list)
    assert payload["listings"][0]["id"] == "listing-1"


def test_public_marketplace_listings_empty_state_does_not_crash(client):
    app_module.price_model_state.admin_store["marketplace_listings"] = []

    response = client.get("/api/marketplace/listings")

    assert response.status_code == 200
    assert response.json() == {"listings": []}


def test_marketplace_view_count_missing_listing_returns_404(client):
    response = client.post("/api/marketplace/listings/missing/view")

    assert response.status_code == 404
    assert response.json()["error"] == "Marketplace listing not found."


def test_admin_protected_endpoint_rejects_missing_or_invalid_auth(client):
    missing = client.get("/api/admin/stats")
    invalid = client.get("/api/admin/stats", headers={"Authorization": "Bearer invalid"})

    assert missing.status_code == 401
    assert invalid.status_code == 401


def test_invalid_prediction_payload_returns_validation_error(client):
    response = client.post("/predict", json={"brand": "Toyota"})

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"] == "Invalid prediction request payload."
    assert isinstance(payload["details"], list)
