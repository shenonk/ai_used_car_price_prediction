from __future__ import annotations

import base64
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import secrets
from threading import Lock
from typing import Any
from urllib.parse import quote, urlencode
from urllib.request import Request as UrlRequest, urlopen
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "models" / "price_model.joblib"
REFERENCE_DATASET_PATH = Path(__file__).resolve().parents[1] / "ml" / "data" / "active" / "AutoValueLK_Finalized_Dataset_v2.csv"
ADMIN_DATA_PATH = Path(__file__).resolve().parent / "data" / "admin_store.json"
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
    admin_store: dict[str, Any] = {}
    admin_tokens: set[str] = set()
    admin_lock: Lock = Lock()


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


class AdminLoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class LoanRateUpdateRequest(BaseModel):
    interest_rate: float = Field(..., ge=0)
    min_down_payment: float = Field(..., ge=0, le=100)
    max_duration: int = Field(..., ge=1)


class NotificationPayload(BaseModel):
    title: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    active: bool = True


class SupportTicketStatusPayload(BaseModel):
    status: str = Field(..., pattern="^(open|read|closed)$")


class SupportTicketCreatePayload(BaseModel):
    user_name: str = Field(..., min_length=1)
    user_email: str = Field(..., min_length=3)
    message: str = Field(..., min_length=1)
    status: str = Field(default="open", pattern="^(open|read|closed)$")


class MarketplaceStatusPayload(BaseModel):
    status: str = Field(..., pattern="^(pending|approved|rejected|sold)$")


class StripeCheckoutPayload(BaseModel):
    listing_id: str = Field(..., min_length=1)
    boost_type: str | None = None
    boost_types: list[str] | None = None


class StripeVerifyPayload(BaseModel):
    session_id: str = Field(..., min_length=1)


def normalize_input(data: dict[str, Any]) -> dict[str, Any]:
    return {
        **data,
        "brand": data["brand"].strip().upper(),
        "model": data["model"].strip().upper(),
        "town": data["town"].strip(),
    }


def normalize_reference_text(value: object) -> str:
    return str(value or "").strip().upper()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


BOOST_PRICING = {
    "urgent": {"label": "Urgent", "amount": 500},
    "spotlight": {"label": "Spotlight", "amount": 750},
    "bump": {"label": "Bump Up", "amount": 300},
}


def get_default_admin_store() -> dict[str, Any]:
    return {
        "stats": {
            "total_predictions": 1248,
            "r2_score": 0.9234,
            "mae": 285000,
            "last_training_date": "2026-02-28",
        },
        "loan_rate": {
            "interest_rate": 12.5,
            "min_down_payment": 20,
            "max_duration": 60,
            "updated_at": utc_now_iso(),
        },
        "notifications": [
            {
                "id": 1,
                "title": "System Maintenance",
                "message": "Scheduled maintenance on March 5th.",
                "active": True,
                "created_at": "2026-02-28T00:00:00Z",
            },
            {
                "id": 2,
                "title": "New Model Deployed",
                "message": "Updated ML model with improved accuracy.",
                "active": True,
                "created_at": "2026-02-25T00:00:00Z",
            },
        ],
        "support_tickets": [
            {
                "id": 1,
                "user_name": "Kasun Jayasekara",
                "user_email": "kasun@example.com",
                "message": "I need help understanding why my valuation changed after editing mileage.",
                "status": "open",
                "created_at": "2026-04-20T10:15:00Z",
            },
            {
                "id": 2,
                "user_name": "Dilani Perera",
                "user_email": "dilani@example.com",
                "message": "Please check my account verification. I submitted documents yesterday.",
                "status": "read",
                "created_at": "2026-04-19T08:30:00Z",
            },
        ],
        "marketplace_listings": [
            {
                "id": "mock-1",
                "brand": "Toyota",
                "model": "Corolla Cross",
                "seller_name": "Kavindu Perera",
                "phone_number": "0771234567",
                "vehicle_location": "Kandy",
                "vehicle_description": "Single-owner vehicle with full service history and a clean interior.",
                "year": 2022,
                "mileage": 18000,
                "fuel_type": "Hybrid",
                "transmission": "Automatic",
                "condition": "Used",
                "price": 11250000,
                "status": "pending",
                "image_url": "https://bwsxujswqbfifsjizxrb.supabase.co/storage/v1/object/public/car_images/listings/97487278-4862-4789-867e-302c93691a91/ba45f37a86c74ec4a84dec300a9d8bb6.jpg",
                "image_urls": [
                    "https://bwsxujswqbfifsjizxrb.supabase.co/storage/v1/object/public/car_images/listings/97487278-4862-4789-867e-302c93691a91/ba45f37a86c74ec4a84dec300a9d8bb6.jpg"
                ],
                "is_urgent": False,
                "is_spotlight": False,
                "is_bumped": False,
                "created_at": "2026-03-31T08:00:00Z",
                "user_id": "user_104",
            },
            {
                "id": "mock-2",
                "brand": "Honda",
                "model": "Vezel",
                "seller_name": "Dinesh Fernando",
                "phone_number": "0719988776",
                "vehicle_location": "Nugegoda",
                "vehicle_description": "Fresh import with original paint, reverse camera, and low mileage.",
                "year": 2021,
                "mileage": 32000,
                "fuel_type": "Hybrid",
                "transmission": "Automatic",
                "condition": "Reconditioned",
                "price": 12900000,
                "status": "approved",
                "image_url": "https://bwsxujswqbfifsjizxrb.supabase.co/storage/v1/object/public/car_images/listings/31183d3d-53e6-4ad1-b8e6-b8cb4db1226e/ab18dfc25f0b4516894276c3aa6919cf.jpg",
                "image_urls": [
                    "https://bwsxujswqbfifsjizxrb.supabase.co/storage/v1/object/public/car_images/listings/31183d3d-53e6-4ad1-b8e6-b8cb4db1226e/ab18dfc25f0b4516894276c3aa6919cf.jpg"
                ],
                "is_urgent": False,
                "is_spotlight": True,
                "is_bumped": False,
                "created_at": "2026-03-29T10:30:00Z",
                "user_id": "user_087",
            },
        ],
        "payments": [
            {
                "id": "pi_mock_01",
                "payer_name": "Nadeesha Perera",
                "login_name": "nadeesha_p",
                "phone_number": "0771234567",
                "account_email": "nadeesha@example.com",
                "ad_title": "Toyota Aqua 2018",
                "boost_option": "Spotlight",
                "amount": 4500,
                "currency": "LKR",
                "payment_status": "confirmed",
                "stripe_status": "succeeded",
                "payment_method": "Visa ending 4242",
                "confirmed_at": "2026-04-12T08:20:00Z",
                "ad_reference": "AD-24018",
                "notes": "Ad boost activated after Stripe confirmation.",
            }
        ],
    }


def ensure_admin_store_shape(store: dict[str, Any]) -> dict[str, Any]:
    defaults = get_default_admin_store()
    merged = defaults | store
    merged["stats"] = defaults["stats"] | store.get("stats", {})
    merged["loan_rate"] = defaults["loan_rate"] | store.get("loan_rate", {})
    merged["notifications"] = store.get("notifications", defaults["notifications"])
    merged["support_tickets"] = store.get("support_tickets", defaults["support_tickets"])
    merged["marketplace_listings"] = store.get("marketplace_listings", defaults["marketplace_listings"])
    merged["payments"] = store.get("payments", defaults["payments"])
    return merged


def persist_admin_store() -> None:
    ADMIN_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ADMIN_DATA_PATH.open("w", encoding="utf-8") as file:
        json.dump(price_model_state.admin_store, file, indent=2)


def load_admin_store() -> None:
    if ADMIN_DATA_PATH.exists():
        with ADMIN_DATA_PATH.open("r", encoding="utf-8") as file:
            loaded_store = json.load(file)
        price_model_state.admin_store = ensure_admin_store_shape(loaded_store)
    else:
        price_model_state.admin_store = get_default_admin_store()
        persist_admin_store()


def admin_error(message: str, status_code: int = 400) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"error": message})


def log_warning(message: str) -> None:
    print(f"[WARN] {message}", flush=True)


def get_admin_credentials() -> tuple[str, str]:
    return (
        os.getenv("ADMIN_EMAIL", "admin@example.com"),
        os.getenv("ADMIN_PASSWORD", "admin123"),
    )


def require_admin(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise admin_error("Missing admin authorization token.", status_code=401)

    token = authorization.removeprefix("Bearer ").strip()
    if token not in price_model_state.admin_tokens:
        raise admin_error("Admin session expired. Please sign in again.", status_code=401)

    return token


def get_next_numeric_id(items: list[dict[str, Any]]) -> int:
    existing_ids = [int(item["id"]) for item in items if str(item.get("id", "")).isdigit()]
    return (max(existing_ids) if existing_ids else 0) + 1


def parse_boolean_flag(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def get_requester_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        return "anonymous"
    return authorization.removeprefix("Bearer ").strip() or "anonymous"


def get_supabase_base_url() -> str:
    return os.getenv("SUPABASE_URL", "").rstrip("/")


def get_supabase_api_key() -> str:
    return os.getenv("SUPABASE_KEY", "") or os.getenv("VITE_SUPABASE_ANON_KEY", "")


def decode_jwt_payload(token: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) < 2:
        return {}

    payload = parts[1]
    padding = "=" * (-len(payload) % 4)
    try:
        decoded = base64.urlsafe_b64decode(f"{payload}{padding}".encode("utf-8"))
        data = json.loads(decoded.decode("utf-8"))
    except Exception:
        return {}

    return data if isinstance(data, dict) else {}


def fetch_supabase_user(access_token: str) -> dict[str, Any]:
    supabase_url = get_supabase_base_url()
    supabase_key = get_supabase_api_key()
    if not supabase_url or not supabase_key or not access_token:
        return {}

    request = UrlRequest(
        f"{supabase_url}/auth/v1/user",
        method="GET",
        headers={
            "Authorization": f"Bearer {access_token}",
            "apikey": supabase_key,
        },
    )

    try:
        with urlopen(request) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return {}

    return payload if isinstance(payload, dict) else {}


def resolve_requester_identity(authorization: str | None = None) -> dict[str, Any]:
    requester_token = get_requester_token(authorization)
    if requester_token == "anonymous":
        return {
            "access_token": "anonymous",
            "is_authenticated": False,
            "user_id": "anonymous",
            "email": "",
            "username": "",
            "display_name": "",
        }

    user_payload = fetch_supabase_user(requester_token)
    token_payload = decode_jwt_payload(requester_token)
    metadata = user_payload.get("user_metadata") or token_payload.get("user_metadata") or {}
    identities = user_payload.get("identities") or token_payload.get("identities") or []
    email = str(user_payload.get("email") or token_payload.get("email") or "").strip()
    username = str(
        metadata.get("username")
        or metadata.get("user_name")
        or token_payload.get("preferred_username")
        or ""
    ).strip()
    full_name = str(
        metadata.get("full_name")
        or metadata.get("name")
        or user_payload.get("full_name")
        or ""
    ).strip()
    provider = ""
    if identities and isinstance(identities, list):
        provider = str((identities[0] or {}).get("provider") or "").strip()
    display_name = full_name or username or (email.split("@")[0] if email else "")

    return {
        "access_token": requester_token,
        "is_authenticated": True,
        "user_id": str(user_payload.get("id") or token_payload.get("sub") or requester_token).strip(),
        "email": email,
        "username": username,
        "display_name": display_name,
        "provider": provider,
    }


def get_requester_identity(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    return resolve_requester_identity(authorization)


def make_supabase_rest_request(
    path: str,
    *,
    method: str = "GET",
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> Any:
    supabase_url = get_supabase_base_url()
    supabase_key = os.getenv("SUPABASE_KEY", "")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Supabase database sync is not configured.")

    request = UrlRequest(
        f"{supabase_url}{path}",
        method=method,
        data=data,
        headers={
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
            **(headers or {}),
        },
    )

    with urlopen(request) as response:
        raw = response.read().decode("utf-8")

    if not raw:
        return None

    return json.loads(raw)


def merge_records_by_id(*collections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for collection in collections:
        for item in collection or []:
            item_id = str(item.get("id") or "").strip()
            if not item_id:
                continue
            if item_id in merged:
                merged[item_id].update(item)
            else:
                merged[item_id] = dict(item)

    return sorted(
        merged.values(),
        key=lambda item: item.get("confirmed_at") or item.get("created_at") or "",
        reverse=True,
    )


def sync_marketplace_listing_to_supabase(listing: dict[str, Any]) -> None:
    try:
        make_supabase_rest_request(
            "/rest/v1/marketplace_listings?on_conflict=id",
            method="POST",
            data=json.dumps(listing).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
        )
    except Exception as error:
        log_warning(f"Failed to sync marketplace listing {listing.get('id')} to Supabase: {error}")


def delete_marketplace_listing_from_supabase(listing_id: str) -> None:
    try:
        make_supabase_rest_request(
            f"/rest/v1/marketplace_listings?id=eq.{quote(listing_id)}",
            method="DELETE",
            headers={"Prefer": "return=minimal"},
        )
    except Exception as error:
        log_warning(f"Failed to delete marketplace listing {listing_id} from Supabase: {error}")


def fetch_marketplace_listings_from_supabase(status: str = "all") -> list[dict[str, Any]]:
    query = "/rest/v1/marketplace_listings?select=*"
    if status != "all":
        query += f"&status=eq.{quote(status)}"
    query += "&order=created_at.desc"
    rows = make_supabase_rest_request(query, method="GET")
    return rows if isinstance(rows, list) else []


def fetch_marketplace_listings_for_user_from_supabase(user_id: str) -> list[dict[str, Any]]:
    rows = make_supabase_rest_request(
        f"/rest/v1/marketplace_listings?select=*&user_id=eq.{quote(user_id)}&order=created_at.desc",
        method="GET",
    )
    return rows if isinstance(rows, list) else []


def sync_marketplace_payment_to_supabase(payment: dict[str, Any]) -> None:
    try:
        make_supabase_rest_request(
            "/rest/v1/marketplace_payments?on_conflict=id",
            method="POST",
            data=json.dumps(payment).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
        )
    except Exception as error:
        log_warning(f"Failed to sync marketplace payment {payment.get('id')} to Supabase: {error}")


def fetch_marketplace_payments_from_supabase() -> list[dict[str, Any]]:
    rows = make_supabase_rest_request(
        "/rest/v1/marketplace_payments?select=*&order=confirmed_at.desc.nullslast,created_at.desc",
        method="GET",
    )
    return rows if isinstance(rows, list) else []


def hydrate_admin_store_from_supabase() -> None:
    try:
        supabase_listings = fetch_marketplace_listings_from_supabase("all")
    except Exception as error:
        log_warning(f"Unable to load marketplace listings from Supabase during startup: {error}")
        supabase_listings = []

    try:
        supabase_payments = fetch_marketplace_payments_from_supabase()
    except Exception as error:
        log_warning(f"Unable to load marketplace payments from Supabase during startup: {error}")
        supabase_payments = []

    if not supabase_listings and not supabase_payments:
        return

    with price_model_state.admin_lock:
        price_model_state.admin_store["marketplace_listings"] = merge_records_by_id(
            price_model_state.admin_store.get("marketplace_listings", []),
            supabase_listings,
        )
        price_model_state.admin_store["payments"] = merge_records_by_id(
            price_model_state.admin_store.get("payments", []),
            supabase_payments,
        )
        persist_admin_store()


def get_marketplace_listing_by_id(listing_id: str) -> dict[str, Any] | None:
    return next(
        (item for item in price_model_state.admin_store["marketplace_listings"] if str(item.get("id")) == listing_id),
        None,
    )


def normalize_selected_boosts(boost_type: str | None = None, boost_types: list[str] | None = None) -> list[str]:
    raw_values = boost_types or ([boost_type] if boost_type else [])
    normalized: list[str] = []
    seen: set[str] = set()

    alias_map = {
        "urgent": "urgent",
        "spotlight": "spotlight",
        "bump": "bump",
        "bumped": "bump",
        "bump up": "bump",
    }

    for value in raw_values:
        key = alias_map.get(str(value or "").strip().lower())
        if not key or key in seen:
            continue
        seen.add(key)
        normalized.append(key)

    return normalized


def format_boost_option_label(boost_keys: list[str]) -> str:
    labels = [BOOST_PRICING[key]["label"] for key in boost_keys if key in BOOST_PRICING]
    return ", ".join(labels)


def calculate_boost_total(boost_keys: list[str]) -> int:
    return sum(int(BOOST_PRICING[key]["amount"]) for key in boost_keys if key in BOOST_PRICING)


def get_stripe_secret_key() -> str:
    return os.getenv("STRIPE_SECRET_KEY", "").strip()


def stripe_request(path: str, *, method: str = "GET", params: dict[str, Any] | None = None) -> dict[str, Any]:
    secret_key = get_stripe_secret_key()
    if not secret_key:
        raise admin_error("Stripe is not configured on the backend.", status_code=500)

    encoded_data = None
    headers = {"Authorization": f"Bearer {secret_key}"}
    if method != "GET":
        encoded_data = urlencode(params or {}, doseq=True).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    request = UrlRequest(
        f"https://api.stripe.com{path}",
        method=method,
        data=encoded_data,
        headers=headers,
    )

    try:
        with urlopen(request) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        raise admin_error(f"Stripe request failed: {error}", status_code=502) from error

    return payload if isinstance(payload, dict) else {}


def resolve_marketplace_success_url() -> str:
    explicit = os.getenv("STRIPE_SUCCESS_URL", "").strip()
    if explicit:
        return explicit

    frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{frontend_origin}/marketplace?payment=success&session_id={{CHECKOUT_SESSION_ID}}"


def resolve_marketplace_cancel_url() -> str:
    explicit = os.getenv("STRIPE_CANCEL_URL", "").strip()
    if explicit:
        return explicit

    frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{frontend_origin}/marketplace?payment=cancelled"


def build_payment_method_summary(payment_intent: dict[str, Any]) -> str:
    latest_charge = payment_intent.get("latest_charge")
    if not isinstance(latest_charge, dict):
        return "Stripe card payment"

    payment_method_details = latest_charge.get("payment_method_details") or {}
    card = payment_method_details.get("card") or {}
    brand = str(card.get("brand") or "Card").strip().title()
    last4 = str(card.get("last4") or "").strip()
    if last4:
        return f"{brand} ending {last4}"
    return brand


def build_payment_record(
    *,
    listing: dict[str, Any],
    boost_keys: list[str],
    checkout_session: dict[str, Any],
    payment_intent: dict[str, Any],
) -> dict[str, Any]:
    payment_intent_id = str(payment_intent.get("id") or checkout_session.get("payment_intent") or checkout_session.get("id"))
    amount_total = checkout_session.get("amount_total")
    if amount_total is None:
        amount_total = calculate_boost_total(boost_keys) * 100

    return {
        "id": payment_intent_id,
        "checkout_session_id": str(checkout_session.get("id") or "").strip(),
        "listing_id": str(listing.get("id") or "").strip(),
        "user_id": str(listing.get("user_id") or "").strip(),
        "payer_name": str(listing.get("seller_name") or "").strip(),
        "login_name": str(listing.get("username") or "").strip(),
        "phone_number": str(listing.get("phone_number") or "").strip(),
        "account_email": str(listing.get("account_email") or "").strip(),
        "ad_title": " ".join(
            [
                str(listing.get("brand") or "").strip(),
                str(listing.get("model") or "").strip(),
                str(listing.get("year") or "").strip(),
            ]
        ).strip(),
        "boost_option": format_boost_option_label(boost_keys),
        "boost_types": boost_keys,
        "amount": round(float(amount_total) / 100, 2),
        "currency": str(checkout_session.get("currency") or "LKR").upper(),
        "payment_status": "confirmed" if checkout_session.get("payment_status") == "paid" else "pending",
        "stripe_status": str(payment_intent.get("status") or checkout_session.get("payment_status") or "").strip(),
        "payment_method": build_payment_method_summary(payment_intent),
        "confirmed_at": utc_now_iso() if checkout_session.get("payment_status") == "paid" else None,
        "ad_reference": str(listing.get("id") or "").strip(),
        "notes": "Ad boost activated after Stripe confirmation.",
        "created_at": utc_now_iso(),
    }


def upsert_payment_record(payment_record: dict[str, Any]) -> dict[str, Any]:
    with price_model_state.admin_lock:
        payments = price_model_state.admin_store["payments"]
        existing = next((item for item in payments if str(item.get("id")) == str(payment_record.get("id"))), None)
        if existing is None:
            payments.append(payment_record)
            saved_record = payment_record
        else:
            existing.update(payment_record)
            saved_record = existing
        persist_admin_store()

    sync_marketplace_payment_to_supabase(saved_record)
    return saved_record


def upload_marketplace_images(listing_id: str, images: list[UploadFile]) -> list[str]:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.getenv("SUPABASE_KEY", "")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Supabase storage is not configured for marketplace image uploads.")

    public_urls: list[str] = []
    for image in images:
        filename = Path(image.filename or "image.jpg")
        suffix = filename.suffix.lower() or ".jpg"
        object_path = f"listings/{listing_id}/{uuid4().hex}{suffix}"
        upload_url = f"{supabase_url}/storage/v1/object/car_images/{quote(object_path, safe='/')}"
        content = image.file.read()
        request = UrlRequest(
            upload_url,
            data=content,
            method="POST",
            headers={
                "Authorization": f"Bearer {supabase_key}",
                "apikey": supabase_key,
                "Content-Type": image.content_type or "application/octet-stream",
                "x-upsert": "false",
            },
        )
        with urlopen(request):
            pass
        public_urls.append(f"{supabase_url}/storage/v1/object/public/car_images/{object_path}")

    return public_urls


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
        load_admin_store()
        hydrate_admin_store_from_supabase()
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
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


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


@app.get("/api/notifications")
def get_public_notifications() -> dict[str, Any]:
    notifications = sorted(
        [item for item in price_model_state.admin_store.get("notifications", []) if item.get("active", True)],
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )
    return {"notifications": notifications}


@app.post("/api/support-ticket")
def create_support_ticket(payload: SupportTicketCreatePayload) -> dict[str, Any]:
    with price_model_state.admin_lock:
        tickets = price_model_state.admin_store["support_tickets"]
        ticket = {
            "id": get_next_numeric_id(tickets),
            "user_name": payload.user_name.strip(),
            "user_email": payload.user_email.strip(),
            "message": payload.message.strip(),
            "status": payload.status,
            "created_at": utc_now_iso(),
        }
        tickets.append(ticket)
        persist_admin_store()

    return {"message": "Support ticket created successfully.", "ticket": ticket}


@app.get("/api/marketplace/listings")
def get_public_marketplace_listings() -> dict[str, Any]:
    local_listings = price_model_state.admin_store["marketplace_listings"]
    try:
        supabase_listings = fetch_marketplace_listings_from_supabase("all")
    except Exception as error:
        log_warning(f"Unable to load public marketplace listings from Supabase: {error}")
        supabase_listings = []

    listings = merge_records_by_id(local_listings, supabase_listings)
    return {"listings": listings}


@app.post("/api/marketplace/listings")
async def create_marketplace_listing(
    brand: str = Form(...),
    model: str = Form(...),
    seller_name: str = Form(...),
    phone_number: str = Form(...),
    vehicle_location: str = Form(...),
    vehicle_description: str = Form(...),
    year: int = Form(...),
    mileage: int = Form(...),
    fuel_type: str = Form(...),
    transmission: str = Form(...),
    condition: str = Form(...),
    price: float = Form(...),
    is_urgent: str = Form(default="false"),
    is_spotlight: str = Form(default="false"),
    is_bumped: str = Form(default="false"),
    images: list[UploadFile] | None = File(default=None),
    requester: dict[str, Any] = Depends(get_requester_identity),
) -> dict[str, Any]:
    valid_images = [file for file in (images or []) if getattr(file, "filename", "")]
    listing_id = f"listing-{uuid4().hex}"
    image_urls = upload_marketplace_images(listing_id, valid_images) if valid_images else []

    with price_model_state.admin_lock:
        listings = price_model_state.admin_store["marketplace_listings"]
        listing = {
            "id": listing_id,
            "brand": brand.strip(),
            "model": model.strip(),
            "seller_name": seller_name.strip(),
            "phone_number": phone_number.strip(),
            "vehicle_location": vehicle_location.strip(),
            "vehicle_description": vehicle_description.strip(),
            "year": year,
            "mileage": mileage,
            "fuel_type": fuel_type.strip(),
            "transmission": transmission.strip(),
            "condition": condition.strip(),
            "price": price,
            "status": "pending",
            "image_url": image_urls[0] if image_urls else "",
            "image_urls": image_urls,
            "uploaded_image_count": len(image_urls),
            "is_urgent": parse_boolean_flag(is_urgent),
            "is_spotlight": parse_boolean_flag(is_spotlight),
            "is_bumped": parse_boolean_flag(is_bumped),
            "created_at": utc_now_iso(),
            "user_id": requester["user_id"],
            "account_email": requester["email"],
            "username": requester["username"],
            "logged_in_account": requester["email"] or requester["username"] or "anonymous",
        }
        listings.append(listing)
        persist_admin_store()

    sync_marketplace_listing_to_supabase(listing)
    return {"message": "Marketplace listing created successfully.", "listing": listing}


@app.get("/api/marketplace/my-listings")
def get_my_marketplace_listings(requester: dict[str, Any] = Depends(get_requester_identity)) -> dict[str, Any]:
    local_listings = [
        item
        for item in price_model_state.admin_store["marketplace_listings"]
        if requester["is_authenticated"] and item.get("user_id") == requester["user_id"]
    ]

    if requester["is_authenticated"]:
        try:
            supabase_listings = fetch_marketplace_listings_for_user_from_supabase(requester["user_id"])
        except Exception as error:
            log_warning(f"Unable to load user marketplace listings from Supabase: {error}")
            supabase_listings = []
    else:
        supabase_listings = []

    listings = merge_records_by_id(local_listings, supabase_listings)
    return {"listings": listings}


@app.post("/api/create-checkout-session")
def create_checkout_session(
    payload: StripeCheckoutPayload,
    requester: dict[str, Any] = Depends(get_requester_identity),
) -> dict[str, Any]:
    boost_keys = normalize_selected_boosts(payload.boost_type, payload.boost_types)
    if not boost_keys:
        raise admin_error("Please select at least one boost option.", status_code=422)

    listing = get_marketplace_listing_by_id(payload.listing_id)
    if listing is None:
        raise admin_error("Marketplace listing not found for payment.", status_code=404)

    if not requester["is_authenticated"]:
        raise admin_error("Please sign in before paying for a boosted marketplace ad.", status_code=401)

    if listing.get("user_id") != requester["user_id"]:
        raise admin_error("You can only pay for your own marketplace listing.", status_code=403)

    total_amount = calculate_boost_total(boost_keys)
    product_name = f"Marketplace boost: {format_boost_option_label(boost_keys)}"
    stripe_payload = {
        "mode": "payment",
        "success_url": resolve_marketplace_success_url(),
        "cancel_url": resolve_marketplace_cancel_url(),
        "payment_method_types[]": "card",
        "line_items[0][quantity]": 1,
        "line_items[0][price_data][currency]": "lkr",
        "line_items[0][price_data][product_data][name]": product_name,
        "line_items[0][price_data][unit_amount]": total_amount * 100,
        "metadata[listing_id]": str(listing.get("id") or "").strip(),
        "metadata[user_id]": str(listing.get("user_id") or "").strip(),
        "metadata[boost_types]": ",".join(boost_keys),
    }
    if listing.get("account_email"):
        stripe_payload["customer_email"] = str(listing["account_email"])

    session = stripe_request("/v1/checkout/sessions", method="POST", params=stripe_payload)
    session_id = str(session.get("id") or "").strip()
    if not session_id:
        raise admin_error("Stripe did not return a checkout session id.", status_code=502)

    return {"sessionId": session_id}


@app.post("/api/verify-payment")
def verify_payment(
    payload: StripeVerifyPayload,
    requester: dict[str, Any] = Depends(get_requester_identity),
) -> dict[str, Any]:
    checkout_session = stripe_request(
        f"/v1/checkout/sessions/{quote(payload.session_id)}",
        method="GET",
    )
    listing_id = str((checkout_session.get("metadata") or {}).get("listing_id") or "").strip()
    boost_keys = normalize_selected_boosts(boost_types=str((checkout_session.get("metadata") or {}).get("boost_types") or "").split(","))
    listing = get_marketplace_listing_by_id(listing_id)

    if listing is None:
        raise admin_error("Listing linked to this Stripe session was not found.", status_code=404)

    if not requester["is_authenticated"]:
        raise admin_error("Please sign in before confirming a boosted payment.", status_code=401)

    if listing.get("user_id") != requester["user_id"]:
        raise admin_error("You can only confirm payments for your own marketplace listing.", status_code=403)

    if checkout_session.get("payment_status") != "paid":
        raise admin_error("Stripe payment is not confirmed yet.", status_code=409)

    payment_intent_id = str(checkout_session.get("payment_intent") or "").strip()
    payment_intent = {}
    if payment_intent_id:
        payment_intent = stripe_request(
            f"/v1/payment_intents/{quote(payment_intent_id)}?expand[]=latest_charge",
            method="GET",
        )

    with price_model_state.admin_lock:
        listing["is_urgent"] = "urgent" in boost_keys
        listing["is_spotlight"] = "spotlight" in boost_keys
        listing["is_bumped"] = "bump" in boost_keys
        persist_admin_store()

    sync_marketplace_listing_to_supabase(listing)
    payment_record = build_payment_record(
        listing=listing,
        boost_keys=boost_keys,
        checkout_session=checkout_session,
        payment_intent=payment_intent,
    )
    saved_record = upsert_payment_record(payment_record)

    return {
        "message": "Stripe payment verified successfully.",
        "listing": listing,
        "payment": saved_record,
    }


@app.post("/api/admin/login")
def admin_login(payload: AdminLoginRequest) -> dict[str, str]:
    admin_email, admin_password = get_admin_credentials()
    if payload.email.strip().lower() != admin_email.lower() or payload.password != admin_password:
        raise admin_error("Login failed. Please check your credentials.", status_code=401)

    token = secrets.token_urlsafe(32)
    price_model_state.admin_tokens.add(token)
    return {"token": token}


@app.get("/api/admin/stats")
def get_admin_stats(_token: str = Depends(require_admin)) -> dict[str, Any]:
    stats = dict(price_model_state.admin_store.get("stats", {}))
    stats["active_loan_rate"] = price_model_state.admin_store.get("loan_rate", {}).get("interest_rate")

    if price_model_state.reference_df is not None:
        stats["total_predictions"] = int(stats.get("total_predictions") or len(price_model_state.reference_df))

    if price_model_state.load_error and price_model_state.model is None:
        stats["model_status"] = "unavailable"
        stats["model_error"] = price_model_state.load_error
    else:
        stats["model_status"] = "ready"

    return stats


@app.get("/api/admin/loan-rate")
def get_loan_rate(_token: str = Depends(require_admin)) -> dict[str, Any]:
    return price_model_state.admin_store["loan_rate"]


@app.post("/api/admin/update-loan-rate")
def update_loan_rate(payload: LoanRateUpdateRequest, _token: str = Depends(require_admin)) -> dict[str, Any]:
    with price_model_state.admin_lock:
        price_model_state.admin_store["loan_rate"] = {
            "interest_rate": payload.interest_rate,
            "min_down_payment": payload.min_down_payment,
            "max_duration": payload.max_duration,
            "updated_at": utc_now_iso(),
        }
        persist_admin_store()

    return {
        "message": "Loan rate updated successfully.",
        "loan_rate": price_model_state.admin_store["loan_rate"],
    }


@app.get("/api/admin/notifications")
def get_notifications(_token: str = Depends(require_admin)) -> dict[str, Any]:
    notifications = sorted(
        price_model_state.admin_store["notifications"],
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )
    return {"notifications": notifications}


@app.post("/api/admin/create-notification")
def create_notification(payload: NotificationPayload, _token: str = Depends(require_admin)) -> dict[str, Any]:
    with price_model_state.admin_lock:
        notifications = price_model_state.admin_store["notifications"]
        notification = {
            "id": get_next_numeric_id(notifications),
            "title": payload.title.strip(),
            "message": payload.message.strip(),
            "active": payload.active,
            "created_at": utc_now_iso(),
        }
        notifications.append(notification)
        persist_admin_store()

    return {"message": "Notification created successfully.", "notification": notification}


@app.put("/api/admin/update-notification/{notification_id}")
def update_notification(
    notification_id: int,
    payload: NotificationPayload,
    _token: str = Depends(require_admin),
) -> dict[str, Any]:
    with price_model_state.admin_lock:
        notifications = price_model_state.admin_store["notifications"]
        notification = next((item for item in notifications if item["id"] == notification_id), None)
        if notification is None:
            raise admin_error("Notification not found.", status_code=404)

        notification.update(
            {
                "title": payload.title.strip(),
                "message": payload.message.strip(),
                "active": payload.active,
            }
        )
        persist_admin_store()

    return {"message": "Notification updated successfully.", "notification": notification}


@app.delete("/api/admin/delete-notification/{notification_id}")
def delete_notification(notification_id: int, _token: str = Depends(require_admin)) -> dict[str, str]:
    with price_model_state.admin_lock:
        notifications = price_model_state.admin_store["notifications"]
        remaining = [item for item in notifications if item["id"] != notification_id]
        if len(remaining) == len(notifications):
            raise admin_error("Notification not found.", status_code=404)

        price_model_state.admin_store["notifications"] = remaining
        persist_admin_store()

    return {"message": "Notification deleted successfully."}


@app.get("/api/admin/support-tickets")
def get_support_tickets(_token: str = Depends(require_admin)) -> dict[str, Any]:
    tickets = sorted(
        price_model_state.admin_store["support_tickets"],
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )
    return {"tickets": tickets}


@app.put("/api/admin/support-ticket/{ticket_id}")
def update_support_ticket(
    ticket_id: int,
    payload: SupportTicketStatusPayload,
    _token: str = Depends(require_admin),
) -> dict[str, Any]:
    with price_model_state.admin_lock:
        tickets = price_model_state.admin_store["support_tickets"]
        ticket = next((item for item in tickets if item["id"] == ticket_id), None)
        if ticket is None:
            raise admin_error("Support ticket not found.", status_code=404)

        ticket["status"] = payload.status
        persist_admin_store()

    return {"message": "Support ticket updated successfully.", "ticket": ticket}


@app.get("/api/admin/marketplace/listings")
def get_marketplace_listings(
    status: str = Query(default="all"),
    _token: str = Depends(require_admin),
) -> dict[str, Any]:
    local_listings = price_model_state.admin_store["marketplace_listings"]
    if status != "all":
        local_listings = [item for item in local_listings if item.get("status") == status]

    try:
        supabase_listings = fetch_marketplace_listings_from_supabase(status)
    except Exception as error:
        log_warning(f"Unable to load admin marketplace listings from Supabase: {error}")
        supabase_listings = []

    listings = merge_records_by_id(local_listings, supabase_listings)
    return {"listings": listings}


@app.put("/api/admin/marketplace/listings/{listing_id}/status")
def update_marketplace_listing_status(
    listing_id: str,
    payload: MarketplaceStatusPayload,
    _token: str = Depends(require_admin),
) -> dict[str, Any]:
    with price_model_state.admin_lock:
        listings = price_model_state.admin_store["marketplace_listings"]
        listing = next((item for item in listings if str(item.get("id")) == listing_id), None)
        if listing is None:
            raise admin_error("Marketplace listing not found.", status_code=404)

        listing["status"] = payload.status
        persist_admin_store()

    sync_marketplace_listing_to_supabase(listing)
    return {"message": "Marketplace listing updated successfully.", "listing": listing}


@app.delete("/api/admin/marketplace/listings/{listing_id}")
def delete_marketplace_listing(listing_id: str, _token: str = Depends(require_admin)) -> dict[str, str]:
    with price_model_state.admin_lock:
        listings = price_model_state.admin_store["marketplace_listings"]
        remaining = [item for item in listings if str(item.get("id")) != listing_id]
        if len(remaining) == len(listings):
            raise admin_error("Marketplace listing not found.", status_code=404)

        price_model_state.admin_store["marketplace_listings"] = remaining
        persist_admin_store()

    delete_marketplace_listing_from_supabase(listing_id)
    return {"message": "Marketplace listing deleted successfully."}


@app.get("/api/admin/payments")
def get_payments(_token: str = Depends(require_admin)) -> dict[str, Any]:
    local_payments = price_model_state.admin_store["payments"]
    try:
        supabase_payments = fetch_marketplace_payments_from_supabase()
    except Exception as error:
        log_warning(f"Unable to load admin payments from Supabase: {error}")
        supabase_payments = []

    payments = merge_records_by_id(local_payments, supabase_payments)
    return {"payments": payments}


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
