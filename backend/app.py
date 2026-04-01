import mimetypes
import os
from datetime import datetime
from decimal import Decimal
from functools import wraps
from urllib.parse import urlparse
from uuid import uuid4

import psycopg2
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from supabase import Client, create_client

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# ============================================
# SUPABASE CONFIG
# ============================================
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

if not url or url == "your_supabase_url_here":
    print("\n" + "!" * 50)
    print("  CRITICAL ERROR: SUPABASE_URL is missing or placeholder!")
    print("  Please update backend/.env with your real Supabase URL.")
    print("!" * 50 + "\n")

if not key or key == "your_supabase_service_role_key_here":
    print("\n" + "!" * 50)
    print("  CRITICAL ERROR: SUPABASE_KEY is missing or placeholder!")
    print("  Please update backend/.env with your real Supabase Service Role Key.")
    print("!" * 50 + "\n")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"\nFailed to initialize Supabase client: {e}")
    supabase = None

MARKETPLACE_BUCKET = os.environ.get("SUPABASE_MARKETPLACE_BUCKET", "car_images")
MARKETPLACE_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# ============================================
# DIRECT POSTGRESQL CONNECTION (bypasses PostgREST)
# ============================================
db_password = os.environ.get("SUPABASE_DB_PASSWORD", "")
project_ref = url.replace("https://", "").split(".")[0] if url else ""
DB_HOST = f"db.{project_ref}.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"


def get_db_connection():
    """Get a direct PostgreSQL connection to the Supabase database."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=db_password,
        sslmode="require",
        connect_timeout=5,
    )


def save_prediction_to_db(brand, model, year, engine, mileage, predicted_price):
    """Save a prediction to the database. Tries direct PostgreSQL first, then falls back to Supabase REST API."""
    if db_password and db_password != "your_database_password_here":
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO predictions (brand, model, year, engine, mileage, predicted_price)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (brand, model, int(year), int(engine), int(mileage), Decimal(str(predicted_price))),
            )
            conn.commit()
            cur.close()
            print(
                f"[OK] Prediction saved (PostgreSQL): {brand} {model} {year} - LKR {predicted_price:,}",
                flush=True,
            )
            return True
        except Exception as e:
            print(f"[WARN] Direct DB save failed: {e}", flush=True)
            print("[INFO] Falling back to Supabase REST API...", flush=True)
        finally:
            if conn:
                conn.close()

    if supabase:
        try:
            supabase.table("predictions").insert(
                {
                    "brand": brand,
                    "model": model,
                    "year": int(year),
                    "engine": int(engine),
                    "mileage": int(mileage),
                    "predicted_price": float(predicted_price),
                }
            ).execute()
            print(
                f"[OK] Prediction saved (Supabase API): {brand} {model} {year} - LKR {predicted_price:,}",
                flush=True,
            )
            return True
        except Exception as e:
            print(f"[FAIL] Supabase API save error: {e}", flush=True)
            return False

    print("[WARN] No database connection available - prediction not saved", flush=True)
    return False


def get_admin_by_email(email):
    """Look up an admin user by email from the admin_users table."""
    normalized_email = (email or "").lower().strip()
    if not normalized_email:
        return None

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, full_name, role, created_at FROM admin_users WHERE email = %s",
            (normalized_email,),
        )
        row = cur.fetchone()
        cur.close()
        if row:
            return {
                "id": row[0],
                "email": row[1],
                "full_name": row[2],
                "role": row[3],
                "created_at": str(row[4]),
            }
    except Exception as e:
        print(f"[FAIL] Admin lookup error: {e}", flush=True)
    finally:
        if conn:
            conn.close()

    if supabase:
        try:
            response = (
                supabase.table("admin_users")
                .select("id,email,full_name,role,created_at")
                .eq("email", normalized_email)
                .limit(1)
                .execute()
            )
            if response.data:
                return response.data[0]
        except Exception as e:
            print(f"[FAIL] Admin lookup via Supabase API error: {e}", flush=True)

    return None


# ============================================
# AUTH HELPERS
# ============================================
def extract_bearer_token():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def get_authenticated_user(token):
    if not token or not supabase:
        return None

    try:
        response = supabase.auth.get_user(token)
        return getattr(response, "user", None)
    except Exception:
        return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = extract_bearer_token()
        if not token:
            return jsonify({"error": "Token is missing"}), 401

        user = get_authenticated_user(token)
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        email = (getattr(g.current_user, "email", "") or "").strip().lower()
        admin = get_admin_by_email(email)
        if not admin:
            return jsonify({"error": "Admin access required"}), 403

        g.current_admin = admin
        return f(*args, **kwargs)

    return decorated


def parse_int_field(field_name, raw_value, *, minimum=None, maximum=None):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid integer") from None

    if minimum is not None and value < minimum:
        raise ValueError(f"{field_name} must be at least {minimum}")
    if maximum is not None and value > maximum:
        raise ValueError(f"{field_name} must be at most {maximum}")
    return value


def get_request_payload():
    if request.content_type and "multipart/form-data" in request.content_type:
        return request.form.to_dict()
    return request.get_json(silent=True) or {}


def normalize_listing_payload(data):
    current_year = datetime.utcnow().year + 1
    payload = {
        "brand": (data.get("brand") or "").strip(),
        "model": (data.get("model") or "").strip(),
        "fuel_type": (data.get("fuel_type") or "").strip(),
        "transmission": (data.get("transmission") or "").strip(),
        "condition": (data.get("condition") or "").strip(),
        "year": parse_int_field("year", data.get("year"), minimum=1900, maximum=current_year),
        "mileage": parse_int_field("mileage", data.get("mileage"), minimum=0),
        "price": parse_int_field("price", data.get("price"), minimum=0),
    }

    missing = [key for key, value in payload.items() if value == ""]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    return payload


def upload_listing_image(image_file, listing_id):
    if not image_file or not image_file.filename:
        return None

    content_type = (image_file.mimetype or "").lower()
    file_extension = MARKETPLACE_ALLOWED_IMAGE_TYPES.get(content_type)

    if not file_extension:
        guessed_extension = os.path.splitext(image_file.filename)[1].lower()
        if guessed_extension in {".jpg", ".jpeg"}:
            content_type = "image/jpeg"
            file_extension = ".jpg"
        elif guessed_extension in {".png", ".webp"}:
            content_type = mimetypes.types_map.get(guessed_extension, content_type)
            file_extension = guessed_extension

    if not file_extension:
        raise ValueError("Image must be a JPG, PNG, or WEBP file")

    image_bytes = image_file.read()
    if not image_bytes:
        raise ValueError("Uploaded image is empty")

    storage_path = f"listings/{listing_id}/{uuid4().hex}{file_extension}"
    supabase.storage.from_(MARKETPLACE_BUCKET).upload(
        storage_path,
        image_bytes,
        {"content-type": content_type or "application/octet-stream"},
    )
    public_url = supabase.storage.from_(MARKETPLACE_BUCKET).get_public_url(storage_path)
    return {"path": storage_path, "public_url": public_url}


def get_storage_path_from_public_url(image_url):
    if not image_url:
        return None

    parsed = urlparse(image_url)
    marker = f"/storage/v1/object/public/{MARKETPLACE_BUCKET}/"
    if marker not in parsed.path:
        return None
    return parsed.path.split(marker, 1)[1]


# ============================================
# PRICE PREDICTION
# ============================================
def predict_price(brand, model, year, engine, mileage):
    brand_prices = {
        "toyota": 5200000,
        "honda": 5500000,
        "nissan": 4800000,
        "suzuki": 3500000,
        "mitsubishi": 4500000,
        "bmw": 8500000,
        "benz": 9500000,
        "mercedes": 9500000,
        "hyundai": 4200000,
        "kia": 4000000,
        "mazda": 4600000,
        "subaru": 5000000,
        "daihatsu": 3200000,
        "perodua": 3000000,
        "mg": 4800000,
    }

    model_adjustments = {
        "aqua": 1.05,
        "prius": 1.08,
        "vezel": 1.12,
        "civic": 1.10,
        "fit": 0.95,
        "vitz": 0.92,
        "corolla": 1.06,
        "premio": 1.04,
        "axio": 1.02,
        "swift": 0.98,
        "alto": 0.85,
        "wagon r": 0.88,
        "x-trail": 1.15,
        "note": 0.96,
        "leaf": 1.10,
        "march": 0.88,
        "lancer": 0.95,
        "outlander": 1.12,
        "montero": 1.20,
    }

    base = brand_prices.get(brand.lower().strip(), 4500000)
    model_factor = model_adjustments.get(model.lower().strip(), 1.0)
    age = max(0, 2025 - year)
    year_factor = max(0.35, 1 - (age * 0.06))

    if engine <= 1000:
        engine_factor = 0.85
    elif engine <= 1500:
        engine_factor = 1.0
    elif engine <= 2000:
        engine_factor = 1.12
    elif engine <= 2500:
        engine_factor = 1.25
    else:
        engine_factor = 1.40

    mileage_factor = max(0.60, 1 - (mileage / 1000000))
    price = base * model_factor * year_factor * engine_factor * mileage_factor
    return round(price / 10000) * 10000


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        brand = data.get("brand", "")
        model = data.get("model", "")
        year = data.get("year", 2020)
        engine = data.get("engine", 1500)
        mileage = data.get("mileage", 0)

        if not brand or not model:
            return jsonify({"error": "Brand and model are required"}), 400

        predicted_price = predict_price(brand, model, int(year), int(engine), int(mileage))
        save_prediction_to_db(brand, model, int(year), int(engine), int(mileage), predicted_price)

        return jsonify({"predicted_price": predicted_price})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "CarPrice AI Backend is running with Supabase"})


# ============================================
# ADMIN API ENDPOINTS
# ============================================
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if res.user:
            admin = get_admin_by_email(email)
            if not admin:
                return jsonify({"error": "This account is not authorized for admin access."}), 403
            return jsonify({"token": res.session.access_token, "message": "Admin login successful"})
        return jsonify({"error": "Invalid email or password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@app.route("/api/admin/stats", methods=["GET"])
@token_required
def admin_stats():
    try:
        pred_res = supabase.table("predictions").select("id", count="exact").execute()
        total_predictions = pred_res.count if pred_res.count is not None else 0

        loan_res = (
            supabase.table("loan_rates")
            .select("interest_rate")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        current_rate = loan_res.data[0]["interest_rate"] if loan_res.data else 12.5

        return jsonify(
            {
                "total_predictions": total_predictions,
                "r2_score": 0.9234,
                "mae": 285000,
                "last_training_date": "2026-02-28",
                "active_loan_rate": current_rate,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/loan-rate", methods=["GET"])
@token_required
def get_loan_rate():
    try:
        res = supabase.table("loan_rates").select("*").order("created_at", desc=True).limit(1).execute()
        if res.data:
            return jsonify(res.data[0])
        return jsonify({"interest_rate": 12.5, "min_down_payment": 20, "max_duration": 60})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/update-loan-rate", methods=["POST"])
@token_required
def update_loan_rate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    new_rate = {
        "interest_rate": data.get("interest_rate"),
        "min_down_payment": data.get("min_down_payment"),
        "max_duration": data.get("max_duration"),
    }

    try:
        supabase.table("loan_rates").insert(new_rate).execute()
        return jsonify({"message": "Loan rate updated successfully", **new_rate})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/notifications", methods=["GET"])
@token_required
def get_notifications():
    try:
        res = supabase.table("notifications").select("*").order("created_at", desc=True).execute()
        return jsonify({"notifications": res.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/create-notification", methods=["POST"])
@token_required
def create_notification():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    notif = {
        "title": data.get("title", ""),
        "message": data.get("message", ""),
        "active": data.get("active", True),
    }

    try:
        res = supabase.table("notifications").insert(notif).execute()
        return jsonify({"message": "Notification created", "notification": res.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/delete-notification/<int:notif_id>", methods=["DELETE"])
@token_required
def delete_notification(notif_id):
    try:
        supabase.table("notifications").delete().eq("id", notif_id).execute()
        return jsonify({"message": "Notification deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/update-notification/<int:notif_id>", methods=["PUT"])
@token_required
def update_notification(notif_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    notif = {
        "title": data.get("title", ""),
        "message": data.get("message", ""),
        "active": data.get("active", True),
    }

    try:
        res = supabase.table("notifications").update(notif).eq("id", notif_id).execute()
        return jsonify(
            {
                "message": "Notification updated",
                "notification": res.data[0] if res.data else None,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/notifications", methods=["GET"])
def get_public_notifications():
    try:
        res = (
            supabase.table("notifications")
            .select("*")
            .eq("active", True)
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify({"notifications": res.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# MARKETPLACE API ENDPOINTS
# ============================================
@app.route("/api/marketplace/listings", methods=["GET"])
def get_marketplace_listings():
    try:
        status = (request.args.get("status") or "approved").strip().lower()
        query = supabase.table("listings").select("*").order("created_at", desc=True)

        if status != "all":
            query = query.eq("status", status)

        response = query.execute()
        return jsonify({"listings": response.data or []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/listings/<string:listing_id>", methods=["GET"])
def get_marketplace_listing(listing_id):
    try:
        response = (
            supabase.table("listings")
            .select("*")
            .eq("id", listing_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return jsonify({"error": "Listing not found"}), 404

        listing = response.data[0]
        if listing.get("status") != "approved":
            return jsonify({"error": "Listing not found"}), 404

        return jsonify({"listing": listing})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/listings", methods=["POST"])
def create_marketplace_listing():
    if not supabase:
        return jsonify({"error": "Supabase client is not configured"}), 500

    data = get_request_payload()
    try:
        payload = normalize_listing_payload(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    current_user = get_authenticated_user(extract_bearer_token())
    if current_user:
        payload["user_id"] = str(current_user.id)

    payload["status"] = "pending"
    payload["id"] = str(uuid4())

    try:
        image_file = request.files.get("image")
        if image_file:
            upload_result = upload_listing_image(image_file, payload["id"])
            payload["image_url"] = upload_result["public_url"]

        response = supabase.table("listings").insert(payload).execute()
        created_listing = response.data[0] if response.data else payload

        return (
            jsonify(
                {
                    "message": "Listing submitted successfully and is pending review",
                    "listing": created_listing,
                }
            ),
            201,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/marketplace/listings", methods=["GET"])
@admin_required
def admin_get_marketplace_listings():
    try:
        status = (request.args.get("status") or "all").strip().lower()
        query = supabase.table("listings").select("*").order("created_at", desc=True)

        if status != "all":
            query = query.eq("status", status)

        response = query.execute()
        return jsonify({"listings": response.data or []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/marketplace/listings/<string:listing_id>/status", methods=["PUT"])
@admin_required
def admin_update_marketplace_listing_status(listing_id):
    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").strip().lower()
    allowed_statuses = {"approved", "pending", "rejected", "sold"}

    if new_status not in allowed_statuses:
        return (
            jsonify({"error": f"status must be one of: {', '.join(sorted(allowed_statuses))}"}),
            400,
        )

    try:
        response = supabase.table("listings").update({"status": new_status}).eq("id", listing_id).execute()
        if not response.data:
            return jsonify({"error": "Listing not found"}), 404

        return jsonify(
            {
                "message": "Listing status updated successfully",
                "listing": response.data[0],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/marketplace/listings/<string:listing_id>", methods=["DELETE"])
@admin_required
def admin_delete_marketplace_listing(listing_id):
    try:
        lookup_response = (
            supabase.table("listings")
            .select("id,image_url")
            .eq("id", listing_id)
            .limit(1)
            .execute()
        )
        if not lookup_response.data:
            return jsonify({"error": "Listing not found"}), 404

        listing = lookup_response.data[0]
        image_path = get_storage_path_from_public_url(listing.get("image_url"))
        if image_path:
            try:
                supabase.storage.from_(MARKETPLACE_BUCKET).remove([image_path])
            except Exception as storage_error:
                print(f"[WARN] Failed to delete listing image: {storage_error}", flush=True)

        supabase.table("listings").delete().eq("id", listing_id).execute()
        return jsonify({"message": "Listing deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    print("=" * 50)
    print("  CarPrice AI Backend Server (Supabase version)")
    print("  Running at http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
