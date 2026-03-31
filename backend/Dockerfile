FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifest first (Docker layer cache optimisation)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

EXPOSE 5000

# Run with Gunicorn (production WSGI server) bound to all interfaces
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]
