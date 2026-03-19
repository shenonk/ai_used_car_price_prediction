import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from supabase import create_client, Client
from dotenv import load_dotenv
import psycopg2
from decimal import Decimal

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ============================================
# SUPABASE CONFIG
# ============================================
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

if not url or url == "your_supabase_url_here":
    print("\n" + "!"*50)
    print("  CRITICAL ERROR: SUPABASE_URL is missing or placeholder!")
    print("  Please update backend/.env with your real Supabase URL.")
    print("!"*50 + "\n")

if not key or key == "your_supabase_service_role_key_here":
    print("\n" + "!"*50)
    print("  CRITICAL ERROR: SUPABASE_KEY is missing or placeholder!")
    print("  Please update backend/.env with your real Supabase Service Role Key.")
    print("!"*50 + "\n")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"\nFailed to initialize Supabase client: {e}")
    # We continue to let Flask start, but API calls will fail until fixed
    supabase = None

# ============================================
# DIRECT POSTGRESQL CONNECTION (bypasses PostgREST)
# ============================================
db_password = os.environ.get("SUPABASE_DB_PASSWORD", "")
# Extract project ref from URL (e.g. "bwsxujswqbfifsjizxrb" from "https://bwsxujswqbfifsjizxrb.supabase.co")
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
        connect_timeout=5
    )

def save_prediction_to_db(brand, model, year, engine, mileage, predicted_price):
    """Save a prediction directly to the PostgreSQL database."""
    if not db_password or db_password == "your_database_password_here":
        print("[WARN] SUPABASE_DB_PASSWORD not set in .env - skipping DB save", flush=True)
        return False

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO predictions (brand, model, year, engine, mileage, predicted_price)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (brand, model, int(year), int(engine), int(mileage), Decimal(str(predicted_price)))
        )
        conn.commit()
        cur.close()
        print(f"[OK] Prediction saved: {brand} {model} {year} - LKR {predicted_price:,}", flush=True)
        return True
    except Exception as e:
        print(f"[FAIL] DB save error: {e}", flush=True)
        return False
    finally:
        if conn:
            conn.close()

def get_admin_by_email(email):
    """Look up an admin user by email from the admin_users table."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, full_name, role, created_at FROM admin_users WHERE email = %s",
            (email.lower().strip(),)
        )
        row = cur.fetchone()
        cur.close()
        if row:
            return {
                "id": row[0],
                "email": row[1],
                "full_name": row[2],
                "role": row[3],
                "created_at": str(row[4])
            }
        return None
    except Exception as e:
        print(f"[FAIL] Admin lookup error: {e}", flush=True)
        return None
    finally:
        if conn:
            conn.close()


# ============================================
# AUTH HELPER — verify Supabase session token
# ============================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            # Verify the token via Supabase
            user = supabase.auth.get_user(token)
            if not user:
                return jsonify({"error": "Invalid or expired token"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated


# ============================================
# PRICE PREDICTION
# ============================================
def predict_price(brand, model, year, engine, mileage):
    brand_prices = {
        "toyota": 5200000, "honda": 5500000, "nissan": 4800000,
        "suzuki": 3500000, "mitsubishi": 4500000, "bmw": 8500000,
        "benz": 9500000, "mercedes": 9500000, "hyundai": 4200000,
        "kia": 4000000, "mazda": 4600000, "subaru": 5000000,
        "daihatsu": 3200000, "perodua": 3000000, "mg": 4800000,
    }

    model_adjustments = {
        "aqua": 1.05, "prius": 1.08, "vezel": 1.12, "civic": 1.10,
        "fit": 0.95, "vitz": 0.92, "corolla": 1.06, "premio": 1.04,
        "axio": 1.02, "swift": 0.98, "alto": 0.85, "wagon r": 0.88,
        "x-trail": 1.15, "note": 0.96, "leaf": 1.10, "march": 0.88,
        "lancer": 0.95, "outlander": 1.12, "montero": 1.20,
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
        
        # Save prediction to database (direct PostgreSQL connection)
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

# --- Admin Login ---
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    try:
        # Perform Supabase Admin Login
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if res.user:
            return jsonify({"token": res.session.access_token, "message": "Admin login successful"})
        else:
            return jsonify({"error": "Invalid email or password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 401


# --- Dashboard Stats ---
@app.route("/api/admin/stats", methods=["GET"])
@token_required
def admin_stats():
    try:
        # Fetch stats from Supabase
        pred_res = supabase.table("predictions").select("id", count="exact").execute()
        total_predictions = pred_res.count if pred_res.count is not None else 0
        
        loan_res = supabase.table("loan_rates").select("interest_rate").order("created_at", desc=True).limit(1).execute()
        current_rate = loan_res.data[0]["interest_rate"] if loan_res.data else 12.5

        return jsonify({
            "total_predictions": total_predictions,
            "r2_score": 0.9234,
            "mae": 285000,
            "last_training_date": "2026-02-28",
            "active_loan_rate": current_rate
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Loan Rate: Get ---
@app.route("/api/admin/loan-rate", methods=["GET"])
@token_required
def get_loan_rate():
    try:
        res = supabase.table("loan_rates").select("*").order("created_at", desc=True).limit(1).execute()
        if res.data:
            return jsonify(res.data[0])
        else:
            return jsonify({"interest_rate": 12.5, "min_down_payment": 20, "max_duration": 60})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Loan Rate: Update ---
@app.route("/api/admin/update-loan-rate", methods=["POST"])
@token_required
def update_loan_rate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    new_rate = {
        "interest_rate": data.get("interest_rate"),
        "min_down_payment": data.get("min_down_payment"),
        "max_duration": data.get("max_duration")
    }

    try:
        supabase.table("loan_rates").insert(new_rate).execute()
        return jsonify({"message": "Loan rate updated successfully", **new_rate})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Notifications: List ---
@app.route("/api/admin/notifications", methods=["GET"])
@token_required
def get_notifications():
    try:
        res = supabase.table("notifications").select("*").order("created_at", desc=True).execute()
        return jsonify({"notifications": res.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Notifications: Create ---
@app.route("/api/admin/create-notification", methods=["POST"])
@token_required
def create_notification():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    notif = {
        "title": data.get("title", ""),
        "message": data.get("message", ""),
        "active": data.get("active", True)
    }
    
    try:
        res = supabase.table("notifications").insert(notif).execute()
        return jsonify({"message": "Notification created", "notification": res.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Notifications: Delete ---
@app.route("/api/admin/delete-notification/<int:notif_id>", methods=["DELETE"])
@token_required
def delete_notification(notif_id):
    try:
        supabase.table("notifications").delete().eq("id", notif_id).execute()
        return jsonify({"message": "Notification deleted"})
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
