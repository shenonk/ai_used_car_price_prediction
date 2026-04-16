FROM python:3.11-slim

WORKDIR /app

# Copy dependency manifest first (Docker layer cache optimisation)
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and trained ML artifacts into the image
COPY backend/ .
COPY ml /ml

EXPOSE 8000

# Run FastAPI with Uvicorn bound to all interfaces
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
