from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)  # Allow frontend at localhost:5173 to call this API

# ============================================
# JWT CONFIG
# ============================================
JWT_SECRET = 'carprice-ai-admin-secret-key-2026'

# Admin credentials (email: admin@gmail.com, password: admin1234)
ADMIN_EMAIL = 'admin@gmail.com'
ADMIN_PASSWORD = 'admin1234'

# ============================================
# IN-MEMORY DATA STORES
# ============================================
# Prediction counter
prediction_count = 0

# Loan rate config
loan_rate = {
    "interest_rate": 12.5,
    "min_down_payment": 20,
    "max_duration": 60
}

# Notifications list
notifications = [
    {"id": 1, "title": "System Online", "message": "CarPrice AI system is running.", "active": True, "created_at": "2026-03-01"},
]
next_notification_id = 2


# ============================================
# JWT HELPER — verify token from Authorization header
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
            jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


# ============================================
# PRICE PREDICTION
# ============================================
def predict_price(brand, model, year, engine, mileage):
    """
    Mock AI prediction model.
    Uses brand base prices, year depreciation, engine size, and mileage
    to generate a realistic predicted price in LKR.
    """
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
    global prediction_count
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
        prediction_count += 1

        return jsonify({"predicted_price": predicted_price})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "CarPrice AI Backend is running"})


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

    if email != ADMIN_EMAIL or password != ADMIN_PASSWORD:
        return jsonify({"error": "Invalid email or password."}), 401

    # Generate JWT token (expires in 24 hours)
    token = jwt.encode({
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({"token": token, "message": "Login successful"})


# --- Dashboard Stats ---
@app.route("/api/admin/stats", methods=["GET"])
@token_required
def admin_stats():
    return jsonify({
        "total_predictions": prediction_count,
        "r2_score": 0.9234,
        "mae": 285000,
        "last_training_date": "2026-02-28",
        "active_loan_rate": loan_rate["interest_rate"]
    })


# --- Loan Rate: Get ---
@app.route("/api/admin/loan-rate", methods=["GET"])
@token_required
def get_loan_rate():
    return jsonify(loan_rate)


# --- Loan Rate: Update ---
@app.route("/api/admin/update-loan-rate", methods=["POST"])
@token_required
def update_loan_rate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    loan_rate["interest_rate"] = data.get("interest_rate", loan_rate["interest_rate"])
    loan_rate["min_down_payment"] = data.get("min_down_payment", loan_rate["min_down_payment"])
    loan_rate["max_duration"] = data.get("max_duration", loan_rate["max_duration"])

    return jsonify({"message": "Loan rate updated successfully", **loan_rate})


# --- Notifications: List ---
@app.route("/api/admin/notifications", methods=["GET"])
@token_required
def get_notifications():
    return jsonify({"notifications": notifications})


# --- Notifications: Create ---
@app.route("/api/admin/create-notification", methods=["POST"])
@token_required
def create_notification():
    global next_notification_id
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    notif = {
        "id": next_notification_id,
        "title": data.get("title", ""),
        "message": data.get("message", ""),
        "active": data.get("active", True),
        "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d")
    }
    next_notification_id += 1
    notifications.append(notif)

    return jsonify({"message": "Notification created", "notification": notif}), 201


# --- Notifications: Delete ---
@app.route("/api/admin/delete-notification/<int:notif_id>", methods=["DELETE"])
@token_required
def delete_notification(notif_id):
    global notifications
    original_len = len(notifications)
    notifications = [n for n in notifications if n["id"] != notif_id]
    if len(notifications) == original_len:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification deleted"})


# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    print("=" * 50)
    print("  CarPrice AI Backend Server")
    print("  Running at http://localhost:5000")
    print("  Admin: admin@gmail.com / admin1234")
    print("=" * 50)
    app.run(debug=True, port=5000)
