from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend at localhost:5173 to call this API


# Simple price prediction logic based on vehicle attributes
def predict_price(brand, model, year, engine, mileage):
    """
    Mock AI prediction model.
    Uses brand base prices, year depreciation, engine size, and mileage
    to generate a realistic predicted price in LKR.
    """
    # Base prices by brand (LKR)
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

    # Model adjustments (popular models get premium)
    model_adjustments = {
        "aqua": 1.05, "prius": 1.08, "vezel": 1.12, "civic": 1.10,
        "fit": 0.95, "vitz": 0.92, "corolla": 1.06, "premio": 1.04,
        "axio": 1.02, "swift": 0.98, "alto": 0.85, "wagon r": 0.88,
        "x-trail": 1.15, "note": 0.96, "leaf": 1.10, "march": 0.88,
        "lancer": 0.95, "outlander": 1.12, "montero": 1.20,
    }

    # Get base price
    base = brand_prices.get(brand.lower().strip(), 4500000)

    # Apply model adjustment
    model_factor = model_adjustments.get(model.lower().strip(), 1.0)

    # Year depreciation: ~6% per year from 2025
    age = max(0, 2025 - year)
    year_factor = max(0.35, 1 - (age * 0.06))

    # Engine size factor: larger engines → higher price
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

    # Mileage depreciation: ~1% per 10,000 km
    mileage_factor = max(0.60, 1 - (mileage / 1000000))

    # Calculate final price
    price = base * model_factor * year_factor * engine_factor * mileage_factor

    # Round to nearest 10,000
    return round(price / 10000) * 10000


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"error": "No data provided"}), 400

        brand = data.get("brand", "")
        model = data.get("model", "")
        year = data.get("year", 2020)
        engine = data.get("engine", 1500)
        mileage = data.get("mileage", 0)

        if not brand or not model:
            return jsonify({"error": "Brand and model are required"}), 400

        # Run prediction
        predicted_price = predict_price(brand, model, int(year), int(engine), int(mileage))

        return jsonify({
            "predicted_price": predicted_price
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "CarPrice AI Backend is running"})


if __name__ == "__main__":
    print("=" * 50)
    print("  CarPrice AI Backend Server")
    print("  Running at http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
