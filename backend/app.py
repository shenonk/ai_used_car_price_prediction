from __future__ import annotations

import base64
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from io import BytesIO
import json
import os
from pathlib import Path
import secrets
from threading import Lock
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlencode
from urllib.request import Request as UrlRequest, urlopen
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        os.environ[key] = value.strip().strip('"').strip("'")


PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_env_file(PROJECT_ROOT / ".env")
load_env_file(PROJECT_ROOT / ".env.docker")
load_env_file(Path(__file__).resolve().parent / ".env")
MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "models" / "price_model.joblib"
REFERENCE_DATASET_PATH = Path(__file__).resolve().parents[1] / "ml" / "data" / "active" / "AutoValueLK_Finalized_Dataset_v4.csv"
ADMIN_DATA_PATH = Path(__file__).resolve().parent / "data" / "admin_store.json"
ADMIN_STORE_PERSIST_ENABLED = os.getenv("ADMIN_STORE_PERSIST", "true").strip().lower() not in {"0", "false", "no"}
OLDER_REFERENCE_LISTING_MONTH = 1
OLDER_REFERENCE_LISTING_YEAR = 2025
RECENT_REFERENCE_LISTING_MONTH = 4
RECENT_REFERENCE_LISTING_YEAR = 2026
MARKETPLACE_LISTING_SYNC_FIELDS = {
    "id",
    "brand",
    "model",
    "seller_name",
    "phone_number",
    "vehicle_location",
    "vehicle_description",
    "year",
    "mileage",
    "fuel_type",
    "transmission",
    "condition",
    "price",
    "status",
    "image_url",
    "image_urls",
    "uploaded_image_count",
    "is_urgent",
    "is_spotlight",
    "is_bumped",
    "created_at",
    "updated_at",
    "user_id",
    "account_email",
    "username",
    "logged_in_account",
}
CHATBOT_FALLBACK_MESSAGE = (
    "I can help with AutoValueLK price checks, marketplace ads, boost ups, financing, account help, "
    "and contacting admin. Ask me about selling a car, boost ups, ad approval, price prediction, "
    "financing, or how to reach admin."
)
CHATBOT_SYSTEM_PROMPT = """
You are AutoValue Assistant, the helpful in-app support chatbot for AutoValueLK, a Sri Lankan used-car price prediction and marketplace app.

Answer user questions clearly and briefly. Prefer practical app guidance over generic explanations.

Core app facts:
- Price Check estimates vehicle value from brand, model, year, engine/fuel/gearbox, mileage, condition, town, and market timing.
- Results shows the latest Price Check output after a prediction. The predicted price is an AI estimate, not a guaranteed final selling price.
- Marketplace users can publish vehicle ads. New ads are pending until an admin approves them.
- Public marketplace listings only show approved ads.
- Users can track submitted ads under Marketplace > My submitted ads.
- Admin can approve, reject, or mark marketplace ads as sold.
- Buyers use the seller details shown on approved marketplace listings to contact the seller.
- Marketplace boost ups are optional paid ad promotions:
  - Urgent costs LKR 500 and marks the ad as urgent so buyers notice it faster.
  - Spotlight costs LKR 750 and visually highlights/features the listing.
  - Bump Up costs LKR 300 and lifts or refreshes the ad's visibility in the marketplace.
- Boosts do not bypass admin approval; an ad still needs admin review before public publishing.
- Financing helps users compare vehicle loan, leasing, and vehicle draft options, estimate monthly payments, adjust down payment and tenure, compare institution rates, and download a financing report.
- Analytics shows saved Price Check predictions, vehicle value trend charts, estimated current value, dataset-backed market trends or depreciation projections, and prediction history with search, brand filter, and delete controls.
- Notifications show active app updates and announcements. Admins can create system notifications from the admin dashboard.
- Boost payments are processed through Stripe card checkout. After a paid checkout is verified, the selected boost flags are applied to the user's own listing and the payment is recorded for admin review.
- For account/password issues, guide users to Login, Forgot Password, or Settings.
- For problems needing a human admin, tell users to click Talk to Human in the chatbot or use Help Center.

Rules:
- If you are unsure about live prices, legal/financial terms, payments, or account-specific status, say the admin team can confirm it.
- Do not claim a marketplace ad is approved/rejected unless the user can see that status in the app.
- The chatbot cannot approve ads, guarantee prices, provide legal/financial advice, or confirm exact account/payment status.
- Keep answers under 120 words unless the user asks for details.
""".strip()


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


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    pathname: str = Field(default="/", max_length=200)


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


def parse_record_timestamp(value: object) -> datetime | None:
    if not value:
        return None

    normalized = str(value).strip()
    if not normalized:
        return None

    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"

    try:
        timestamp = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    return timestamp.astimezone(timezone.utc)


def get_record_timestamp(item: dict[str, Any]) -> datetime:
    for field_name in ("updated_at", "confirmed_at", "created_at"):
        timestamp = parse_record_timestamp(item.get(field_name))
        if timestamp is not None:
            return timestamp

    return datetime.min.replace(tzinfo=timezone.utc)


def get_marketplace_status_rank(item: dict[str, Any]) -> int:
    return {
        "pending": 0,
        "rejected": 1,
        "approved": 1,
        "sold": 1,
    }.get(str(item.get("status") or "").strip().lower(), 0)


def should_prefer_record(candidate: dict[str, Any], existing: dict[str, Any]) -> bool:
    candidate_timestamp = get_record_timestamp(candidate)
    existing_timestamp = get_record_timestamp(existing)
    if candidate_timestamp != existing_timestamp:
        return candidate_timestamp > existing_timestamp

    return get_marketplace_status_rank(candidate) >= get_marketplace_status_rank(existing)


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
    if not ADMIN_STORE_PERSIST_ENABLED:
        return
    ADMIN_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ADMIN_DATA_PATH.open("w", encoding="utf-8") as file:
        json.dump(price_model_state.admin_store, file, indent=2)


def load_admin_store() -> None:
    if not ADMIN_STORE_PERSIST_ENABLED:
        price_model_state.admin_store = ensure_admin_store_shape(get_default_admin_store())
        return

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
    return (os.getenv("SUPABASE_URL", "") or os.getenv("VITE_SUPABASE_URL", "")).rstrip("/")


def get_supabase_api_key() -> str:
    return (
        os.getenv("SUPABASE_KEY", "")
        or os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY", "")
        or os.getenv("VITE_SUPABASE_ANON_KEY", "")
    )


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
    supabase_key = get_supabase_api_key()
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


def get_gemini_api_key() -> str:
    api_key = (os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")).strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        return ""
    return api_key


def get_gemini_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"


def build_local_chatbot_reply(message: str, pathname: str = "/") -> str:
    normalized = message.strip().lower()
    if not normalized:
        return CHATBOT_FALLBACK_MESSAGE

    if normalized in {"hi", "hello", "hey", "yo", "yo hi", "hi there", "hello there"}:
        return (
            "Hi! I can help with AutoValueLK price checks, marketplace ads, boost ups, financing, "
            "account help, and contacting admin. What would you like to do?"
        )

    if "final selling price" in normalized or ("selling price" in normalized and "prediction" in normalized):
        return (
            "No. The predicted price is an AI estimate to guide your decision, not a guaranteed final selling price. "
            "The real sale price can change based on buyer demand, vehicle condition, documents, negotiation, and market timing."
        )

    if "predicted price" in normalized and any(term in normalized for term in ("mean", "means", "meaning")):
        return (
            "The predicted price is the app's estimated current market value in LKR based on the vehicle details you entered. "
            "Use it as guidance, not a guaranteed selling price."
        )

    if "check" in normalized and "value" in normalized:
        return (
            "Yes. Open Price Check and enter the vehicle's brand, model, year, fuel type, gearbox, condition, town, and mileage. "
            "For a Toyota Aqua 2018, choose Toyota as the brand, Aqua as the model, and 2018 as the year."
        )

    if any(term in normalized for term in ("latest prediction", "latest result", "prediction result", "results page", "see my result")):
        return (
            "Your latest prediction result appears on the Results page after you run Price Check. "
            "Saved predictions can also be reviewed later in Analytics."
        )

    if any(term in normalized for term in ("save my prediction", "save prediction", "saved prediction", "saved predictions")):
        return (
            "Yes. Predictions are saved so you can review them in Analytics. If you are signed in, they can be loaded from your account; "
            "otherwise the app can use local browser history."
        )

    if any(term in normalized for term in ("analytics", "trend", "history", "market value chart", "trend chart", "estimated current value", "depreciation projection", "delete old prediction")):
        if "saved" in normalized or "see my" in normalized:
            return "Open Analytics to see your saved Price Check predictions and prediction history."
        if "trend" in normalized or "chart" in normalized:
            return (
                "The market value trend chart shows how the selected saved vehicle's estimated value changes over time, "
                "using matching market data when available or a depreciation projection when data is sparse."
            )
        if "estimated current value" in normalized:
            return "Estimated current value is the app's current LKR value estimate for the selected saved vehicle in Analytics."
        if "delete" in normalized:
            return "Yes. In Analytics, use the delete button beside a prediction history row to remove an old prediction record."
        if "depreciation" in normalized:
            return (
                "Analytics uses a depreciation projection when there is not enough matching market trend data for that vehicle. "
                "It fills the missing years with an estimated value curve."
            )
        return (
            "Analytics shows saved Price Check predictions, market value trend charts, estimated current value, "
            "and prediction history. You can search, filter by brand, select a saved vehicle, and delete old prediction records."
        )

    if "submitted ads" in normalized or "my submitted ads" in normalized or "my ads" in normalized:
        return "Go to Marketplace > My submitted ads to see the ads you have posted and their current status."

    if "sign in" in normalized and ("publish" in normalized or "ad" in normalized):
        return "You should sign in before publishing an ad so the listing is linked to your account and you can track it under Marketplace > My submitted ads."

    if any(term in normalized for term in ("forgot my password", "forgot password", "reset password")):
        return "Use Forgot Password on the Login page. Enter your email address and the app will send a secure password reset link."

    if "settings" in normalized:
        return "Open Settings to update profile preferences, notification preferences, security/password details, and language settings."

    if "login" in normalized and ("save" in normalized or "prediction" in normalized):
        return "You can save predictions locally, but signing in lets the app load your saved prediction history from your account across sessions."

    if "app update" in normalized or "app updates" in normalized or "where can i see updates" in normalized:
        return "You can see app updates and active announcements in Notifications."

    if "notification" in normalized or "system announcement" in normalized or "announcements" in normalized:
        if "admin" in normalized or "announcement" in normalized:
            return "Yes. Admins can create active system notifications and announcements that users see in Notifications."
        return "Notifications show active app updates, system messages, market notices, and other announcements from AutoValueLK."

    if "sent a message" in normalized and "admin" in normalized:
        return "Your message goes to the admin Contact Messages inbox. Admin can use your provided email or account details to follow up."

    if "where does" in normalized and "support message" in normalized:
        return "Your support message is saved in the admin Contact Messages inbox so the admin team can review it."

    if "how will" in normalized and ("reply" in normalized or "contact me" in normalized):
        return "Admin can follow up using the email address or account details you provided with your support message."

    if "approve my ad" in normalized or "approve ad" in normalized:
        return "I cannot approve ads. Only an admin can approve, reject, or mark marketplace listings as sold."

    if "exact payment status" in normalized or ("payment status" in normalized and "exact" in normalized):
        return "I cannot confirm your exact payment status in chat. Check the payment result in Marketplace, or contact admin if it looks wrong."

    if "guarantee" in normalized and ("price" in normalized or "car" in normalized):
        return "No. Price Check gives an AI estimate, not a guaranteed sale price. The final price depends on condition, documents, buyer demand, and negotiation."

    if "legal" in normalized or "financial advice" in normalized:
        return "I can explain app features, but I cannot provide legal or financial advice. Please confirm important loan, legal, or payment decisions with a qualified professional or admin."

    if "ai is unsure" in normalized or "if the ai is unsure" in normalized or "unsure" in normalized:
        return "If the AI is unsure, treat the answer as guidance only and contact admin for confirmation, especially for live prices, payment status, legal, or financial questions."

    if "card" in normalized or "payment" in normalized or "pay for a boost" in normalized or "payment is cancelled" in normalized or "payment cancelled" in normalized or "boost activate" in normalized or "confirms my payment" in normalized:
        if "safe" in normalized or "card" in normalized:
            return "Boost payments use Stripe card checkout, so card details are handled by Stripe rather than stored directly by AutoValueLK."
        if "cancel" in normalized:
            return "If a boost payment is cancelled, the checkout returns to Marketplace and the boost is not confirmed or applied."
        if "after" in normalized or "pay for a boost" in normalized:
            return "After a successful boost payment, the backend verifies the Stripe checkout session, records the payment, and applies the selected boost to your listing."
        if "immediately" in normalized or "activate" in normalized:
            return "A boost is applied after Stripe confirms the payment. It still does not bypass admin approval for public listing visibility."
        if "who" in normalized or "confirm" in normalized:
            return "Stripe confirms the card payment, then AutoValueLK verifies that checkout session and records the payment for admin."
        return "Boost payments are handled through Stripe checkout and are verified by the backend before boosts are applied."

    if "admin reject" in normalized or "reject my ad" in normalized or "rejected" in normalized:
        return "Yes. Admin can reject an ad if it needs changes, has missing details, or does not meet marketplace rules."

    if "not visible" in normalized or "not showing" in normalized or "not appear" in normalized:
        return "Your ad may not be visible publicly because only approved marketplace ads are shown. Check Marketplace > My submitted ads for its status."

    if "buyers contact" in normalized or "buyer contact" in normalized or "contact the seller" in normalized:
        return "Buyers can contact the seller using the seller details shown on an approved marketplace listing."

    if "more than one boost" in normalized or "multiple boost" in normalized or "buy more than one" in normalized:
        return (
            "Yes. You can select more than one boost for your marketplace ad. The total is added together: "
            "Urgent is LKR 500, Spotlight is LKR 750, and Bump Up is LKR 300."
        )

    if "urgent" in normalized and "how much" in normalized:
        return "Urgent costs LKR 500. It marks your ad as urgent so buyers notice it faster."

    if "spotlight" in normalized:
        return "Spotlight costs LKR 750. It visually highlights or features your listing in the marketplace."

    if "bump" in normalized:
        return "Bump Up costs LKR 300. It refreshes or lifts your ad's visibility in the marketplace."

    if "skip admin approval" in normalized or "bypass admin approval" in normalized:
        return "No. Boost ups do not skip admin approval. Your ad still needs admin review before it appears publicly."

    if any(term in normalized for term in ("boost", "boost up", "urgent")):
        return (
            "Boost ups are optional marketplace promotions. Urgent costs LKR 500, "
            "Spotlight costs LKR 750, and Bump Up costs LKR 300. They help buyers notice the ad, "
            "but they do not skip admin approval."
        )

    if any(term in normalized for term in ("sell", "publish", "post ad", "submit ad")):
        return (
            "To sell a car, go to Marketplace, choose Publish Ad, add the car details and photos, "
            "then submit it. The ad stays pending until admin approves it."
        )

    if any(term in normalized for term in ("pending", "approved", "review")):
        return (
            "New marketplace ads start as pending review. Admin can approve, reject, or mark them sold. "
            "You can track your own ad status under Marketplace > My submitted ads."
        )

    if any(term in normalized for term in ("price check", "valuation", "accuracy", "vehicle value", "car value")):
        return (
            "Use Price Check to estimate a vehicle value. Enter the exact brand, model, year, fuel type, "
            "gearbox, condition, town, and mileage for the best result."
        )

    if any(term in normalized for term in ("finance", "financing", "loan", "leasing", "installment", "monthly payment", "down payment", "loan rate")):
        if "monthly payment" in normalized or "calculated" in normalized:
            return "The monthly payment is estimated from the vehicle price, down payment, loan amount, selected institution interest rate, and tenure."
        if "minimum down payment" in normalized or "min down" in normalized:
            return "Minimum down payment comes from the selected institution's financing rules. If no institution data is available, the app uses 20% as the default."
        if "loan rate" in normalized or "rate change" in normalized:
            return "Yes. Loan rates can change when admins update rates or when institution data changes, so Financing should be treated as an estimate."
        return "Open Financing to compare vehicle loan, leasing, and draft options, adjust down payment and tenure, and estimate monthly payments."

    if any(term in normalized for term in ("admin", "human", "support", "contact", "help")):
        return "Click Talk to Human in the chatbot to send a message directly to the admin Contact Messages inbox."

    if pathname == "/marketplace":
        return "I can help with marketplace ads, boost ups, approvals, searching listings, and contacting sellers."

    if pathname == "/analytics":
        return "I can help explain saved predictions, market value trends, estimated current value, and prediction history."

    return CHATBOT_FALLBACK_MESSAGE


def extract_gemini_response_text(payload: dict[str, Any]) -> str:
    chunks: list[str] = []
    for candidate in payload.get("candidates") or []:
        if not isinstance(candidate, dict):
            continue
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            if not isinstance(part, dict):
                continue
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                chunks.append(text.strip())

    return "\n".join(chunks).strip()


def build_chatbot_contents(payload: ChatRequest) -> list[dict[str, Any]]:
    recent_history = payload.history[-8:]
    contents = [
        {
            "role": "model" if item.role == "assistant" else "user",
            "parts": [{"text": item.content.strip()}],
        }
        for item in recent_history
        if item.content.strip()
    ]
    contents.append(
        {
            "role": "user",
            "parts": [{"text": f"Current app page: {payload.pathname}\nUser question: {payload.message.strip()}"}],
        }
    )
    return contents


def request_gemini_chatbot_reply(payload: ChatRequest) -> str:
    api_key = get_gemini_api_key()
    if not api_key:
        return build_local_chatbot_reply(payload.message, payload.pathname)

    request_payload = {
        "systemInstruction": {
            "parts": [{"text": CHATBOT_SYSTEM_PROMPT}],
        },
        "contents": build_chatbot_contents(payload),
        "generationConfig": {
            "maxOutputTokens": 350,
            "temperature": 0.4,
        },
    }
    model = quote(get_gemini_model(), safe="")
    request = UrlRequest(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={quote(api_key, safe='')}",
        method="POST",
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raw_error = error.read().decode("utf-8", errors="replace")
        log_warning(f"Gemini chatbot request failed: {error.code} {raw_error[:300]}")
        return build_local_chatbot_reply(payload.message, payload.pathname)
    except (URLError, TimeoutError) as error:
        log_warning(f"Gemini chatbot request failed: {error}")
        return build_local_chatbot_reply(payload.message, payload.pathname)

    reply = extract_gemini_response_text(response_payload)
    if not reply:
        return build_local_chatbot_reply(payload.message, payload.pathname)

    return reply


def merge_records_by_id(*collections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for collection in collections:
        for item in collection or []:
            item_id = str(item.get("id") or "").strip()
            if not item_id:
                continue
            if item_id in merged:
                existing = merged[item_id]
                if should_prefer_record(item, existing):
                    merged[item_id] = {**existing, **item}
                else:
                    merged[item_id] = {**item, **existing}
            else:
                merged[item_id] = dict(item)

    return sorted(
        merged.values(),
        key=get_record_timestamp,
        reverse=True,
    )


def sync_marketplace_listing_to_supabase(listing: dict[str, Any]) -> None:
    payload = {key: value for key, value in listing.items() if key in MARKETPLACE_LISTING_SYNC_FIELDS}
    try:
        make_supabase_rest_request(
            "/rest/v1/marketplace_listings?on_conflict=id",
            method="POST",
            data=json.dumps(payload).encode("utf-8"),
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


def sync_prediction_to_supabase(
    prediction_request: dict[str, Any],
    predicted_price_lkr: float,
    requester: dict[str, Any] | None = None,
) -> bool:
    if not (requester or {}).get("is_authenticated"):
        return False

    payload = {
        "brand": str(prediction_request.get("brand") or "").strip(),
        "model": str(prediction_request.get("model") or "").strip(),
        "year": int(prediction_request.get("year") or 0),
        "engine_cc": float(prediction_request.get("engine_cc") or 0),
        "gear_type": str(prediction_request.get("gear_type") or "").strip(),
        "fuel_type": str(prediction_request.get("fuel_type") or "").strip(),
        "mileage_km": float(prediction_request.get("mileage_km") or 0),
        "condition": str(prediction_request.get("condition") or "").strip(),
        "town": str(prediction_request.get("town") or "").strip(),
        "listing_month": int(prediction_request.get("listing_month") or 0),
        "listing_year": int(prediction_request.get("listing_year") or 0),
        "predicted_price_lkr": round(float(predicted_price_lkr), 2),
        "user_id": str((requester or {}).get("user_id") or "") or None,
        "account_email": str((requester or {}).get("email") or "") or None,
        "username": str((requester or {}).get("username") or "") or None,
    }

    try:
        make_supabase_rest_request(
            "/rest/v1/predictions",
            method="POST",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        return True
    except Exception as error:
        log_warning(f"Failed to sync prediction to Supabase: {error}")
        return False


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


def infer_image_content_type(image_format: str) -> str:
    normalized = str(image_format or "").upper()
    if normalized in {"JPEG", "JPG"}:
        return "image/jpeg"
    if normalized == "PNG":
        return "image/png"
    if normalized == "WEBP":
        return "image/webp"
    return "application/octet-stream"


def extract_marketplace_storage_path(public_url: str) -> str:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    prefix = f"{supabase_url}/storage/v1/object/public/car_images/"
    if not public_url.startswith(prefix):
        raise RuntimeError("Marketplace image URL does not match the configured Supabase storage bucket.")
    path_part = public_url[len(prefix):].split("?", 1)[0]
    return unquote(path_part)


def load_watermark_font(font_size: int) -> ImageFont.ImageFont:
    for font_name in ("arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(font_name, font_size)
        except OSError:
            continue
    return ImageFont.load_default()


def watermark_image_bytes(content: bytes, watermark_text: str = "AutoValueLK") -> tuple[bytes, str]:
    with Image.open(BytesIO(content)) as source_image:
        output_format = source_image.format or "JPEG"
        base_image = source_image.convert("RGBA")
        width, height = base_image.size

        overlay = Image.new("RGBA", base_image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        font_size = max(40, min(width, height) // 6)
        font = load_watermark_font(font_size)
        text_box = draw.textbbox((0, 0), watermark_text, font=font, stroke_width=2)
        text_width = text_box[2] - text_box[0]
        text_height = text_box[3] - text_box[1]
        text_x = (width - text_width) / 2 - text_box[0]
        text_y = (height - text_height) / 2 - text_box[1]

        draw.text(
            (text_x, text_y),
            watermark_text,
            font=font,
            fill=(255, 255, 255, 92),
            stroke_width=2,
            stroke_fill=(15, 23, 42, 64),
        )

        composited = Image.alpha_composite(base_image, overlay)

        buffer = BytesIO()
        if output_format.upper() in {"JPEG", "JPG"}:
            composited.convert("RGB").save(buffer, format="JPEG", quality=92)
            image_format = "JPEG"
        else:
            composited.save(buffer, format=output_format)
            image_format = output_format

    return buffer.getvalue(), infer_image_content_type(image_format)


def upload_marketplace_storage_bytes(object_path: str, content: bytes, content_type: str, *, upsert: bool) -> str:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.getenv("SUPABASE_KEY", "")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Supabase storage is not configured for marketplace image uploads.")

    upload_url = f"{supabase_url}/storage/v1/object/car_images/{quote(object_path, safe='/')}"
    request = UrlRequest(
        upload_url,
        data=content,
        method="POST",
        headers={
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
            "Content-Type": content_type,
            "x-upsert": "true" if upsert else "false",
        },
    )
    with urlopen(request):
        pass

    return f"{supabase_url}/storage/v1/object/public/car_images/{object_path}"


def apply_marketplace_watermark(listing: dict[str, Any]) -> dict[str, Any]:
    image_urls = listing.get("image_urls") or []
    if not image_urls and listing.get("image_url"):
        image_urls = [listing["image_url"]]

    if not image_urls:
        return listing

    updated_urls: list[str] = []
    watermark_version = utc_now_iso()
    for public_url in image_urls:
        object_path = extract_marketplace_storage_path(public_url)
        with urlopen(public_url) as response:
            original_content = response.read()
        watermarked_content, content_type = watermark_image_bytes(original_content)
        updated_url = upload_marketplace_storage_bytes(object_path, watermarked_content, content_type, upsert=True)
        updated_urls.append(f"{updated_url}?v={quote(watermark_version, safe='')}")

    listing["image_urls"] = updated_urls
    listing["image_url"] = updated_urls[0] if updated_urls else ""
    listing["images_watermarked"] = True
    listing["watermarked_at"] = watermark_version
    return listing


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


@app.post("/api/chat")
def create_chatbot_reply(payload: ChatRequest) -> dict[str, str]:
    return {
        "message": request_gemini_chatbot_reply(payload),
        "model": get_gemini_model() if get_gemini_api_key() else "local-fallback",
    }


@app.get("/api/marketplace/listings")
def get_public_marketplace_listings() -> dict[str, Any]:
    local_listings = price_model_state.admin_store["marketplace_listings"]
    try:
        supabase_listings = fetch_marketplace_listings_from_supabase("all")
    except Exception as error:
        log_warning(f"Unable to load public marketplace listings from Supabase: {error}")
        supabase_listings = []

    listings = merge_records_by_id(supabase_listings, local_listings)
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
    created_at = utc_now_iso()

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
            "created_at": created_at,
            "updated_at": created_at,
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

    listings = merge_records_by_id(supabase_listings, local_listings)
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
        listing["updated_at"] = utc_now_iso()
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

    listings = merge_records_by_id(supabase_listings, local_listings)
    return {"listings": listings}


@app.put("/api/admin/marketplace/listings/{listing_id}/status")
def update_marketplace_listing_status(
    listing_id: str,
    payload: MarketplaceStatusPayload,
    _token: str = Depends(require_admin),
) -> dict[str, Any]:
    should_apply_watermark = False

    with price_model_state.admin_lock:
        listings = price_model_state.admin_store["marketplace_listings"]
        listing = next((item for item in listings if str(item.get("id")) == listing_id), None)
        if listing is None:
            raise admin_error("Marketplace listing not found.", status_code=404)

        if payload.status == "approved" and listing.get("image_urls") and not listing.get("images_watermarked"):
            should_apply_watermark = True

    if should_apply_watermark:
        try:
            apply_marketplace_watermark(listing)
        except Exception as error:
            raise admin_error(
                f"Unable to watermark marketplace images before approval: {error}",
                status_code=500,
            )

    with price_model_state.admin_lock:
        listings = price_model_state.admin_store["marketplace_listings"]
        listing = next((item for item in listings if str(item.get("id")) == listing_id), None)
        if listing is None:
            raise admin_error("Marketplace listing not found.", status_code=404)
        listing["status"] = payload.status
        listing["updated_at"] = utc_now_iso()
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


def get_prediction_warning(features: dict[str, Any], predicted_price: float) -> str | None:
    reference_df = price_model_state.reference_df
    if reference_df is None or reference_df.empty:
        return None

    subset = reference_df[reference_df["brand_norm"].eq(features["brand"])].copy()
    if subset.empty:
        return None

    exact_model_subset = subset[subset["model_norm"].eq(features["model"])]
    if not exact_model_subset.empty:
        subset = exact_model_subset

    nearby_year_subset = subset[subset["year"].sub(int(features["year"])).abs() <= 2]
    if len(nearby_year_subset) >= 5:
        subset = nearby_year_subset

    if len(subset) < 5:
        return None

    q1 = float(subset["price_lkr"].quantile(0.25))
    q3 = float(subset["price_lkr"].quantile(0.75))
    iqr = q3 - q1
    if iqr <= 0:
        return None

    lower_bound = max(0.0, q1 - (3 * iqr))
    upper_bound = q3 + (3 * iqr)
    if predicted_price < lower_bound or predicted_price > upper_bound:
        return (
            "Predicted price is outside the broad reference range for similar brand/year records. "
            "Please review the input details and treat this estimate with caution."
        )

    return None


@app.post("/predict")
def predict_price(
    payload: VehiclePredictionRequest,
    requester: dict[str, Any] = Depends(get_requester_identity),
) -> dict[str, Any]:
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

    prediction_warning = get_prediction_warning(raw_features, predicted_price)

    cloud_saved = sync_prediction_to_supabase(raw_features, predicted_price, requester)
    save_status = "cloud" if cloud_saved else "local_only"
    save_message = (
        "Prediction saved to your account."
        if cloud_saved
        else "Prediction saved only on this device."
    )

    response = {
        "predicted_price_lkr": round(predicted_price, 2),
        "save_status": save_status,
        "save_message": save_message,
    }
    if prediction_warning:
        response["warning"] = prediction_warning

    return response
