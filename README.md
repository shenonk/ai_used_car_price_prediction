# AutoValueLK

AI-powered vehicle valuation, marketplace, financing, and analytics platform for the Sri Lankan automotive market.

## Project Overview

AutoValueLK is a final year project built to help Sri Lankan vehicle buyers, sellers, and administrators make better decisions using data-driven price prediction and supporting marketplace tools.

The system provides:

- Used vehicle price prediction using a trained machine learning model
- User-facing dashboard with valuation results, market analytics, financing options, notifications, and marketplace listings
- Vehicle marketplace with listing submission, admin approval, image upload, view tracking, and boost payments
- Professional PDF reports for vehicle valuation and financing
- Vehicle finance module for vehicle loans, leasing, and money draft products
- Admin dashboard for system metrics, marketplace moderation, notifications, users, payments, and financing facilities
- Multilingual user panel support for English, Sinhala, and Tamil
- Dark mode and light mode support across the user panel
- Automated tests for backend helper/API behavior and frontend finance logic/UI

## Technology Stack

| Layer | Technologies |
| --- | --- |
| User Frontend | React, Vite, Tailwind CSS, Recharts, Chart.js, Leaflet, i18next |
| Admin Frontend | React, Vite, Tailwind CSS, Axios |
| Backend API | FastAPI, Python, scikit-learn, pandas, NumPy, Pillow |
| Database/Auth/Storage | Supabase |
| Payments | Stripe Checkout |
| AI Assistance | Gemini API with local fallback replies |
| PDF Reports | jsPDF, jsPDF AutoTable |
| Testing | Mocha, Chai, Sinon, React Testing Library, jsdom, pytest, FastAPI TestClient |
| Deployment Support | Docker, Docker Compose, Nginx |

## Main Features

### User Panel

- Home page with responsive landing experience
- Price Check form for vehicle valuation
- Results page with predicted price, vehicle summary, market position, cost breakdown, financing estimates, and PDF valuation download
- Dashboard with prediction analytics and financing interest trend panels
- Marketplace with approved ads, search/filtering, location selection, submitted ads, image upload, watermarking, and listing boosts
- Financing page with guided 3-step flow for loan, leasing, and money draft comparison
- Analytics page for market insights and trend visualisation
- Notifications, settings, help center, and support ticket flow
- English, Sinhala, and Tamil language support
- Light and dark theme support

### Admin Panel

- Admin dashboard with live system metrics and platform activity
- Marketplace approval, rejection, and deletion workflow
- User and registration overview
- Notification management
- Support ticket management
- Payment and boost tracking
- Financing facility management
- Model performance metrics display

### Backend API

- Vehicle prediction endpoint
- Marketplace listing, image upload, view tracking, and user listing endpoints
- Stripe checkout and payment verification endpoints
- Gemini chatbot and marketplace description generation endpoints
- Admin authentication and protected admin endpoints
- Supabase sync helpers with local fallback store

## Project Structure

```text
.
├── admin-frontend/        # Admin dashboard React app
├── backend/               # FastAPI backend API and tests
│   ├── app.py
│   ├── requirements.txt
│   └── tests/
├── docs/                  # Project documentation assets
├── frontend/              # User-facing React app
│   ├── src/
│   └── package.json
├── ml/                    # ML training scripts, data, and model folders
├── validation/            # Validation resources
├── docker-compose.yml
├── package.json
└── README.md
```

## Environment Setup

Do not commit or submit real API keys in `.env` files. Use `.env.example` as the safe template.

Create environment files as needed:

```bash
cp .env.example .env
cp .env.example .env.docker
```

Then replace the placeholder values with your own Supabase, Stripe, Gemini, and admin credentials.

Important variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Local Development

### Backend

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:

```text
http://localhost:8000
```

### User Frontend

```bash
cd frontend
npm install
npm run dev
```

User frontend URL:

```text
http://localhost:5173
```

### Admin Frontend

```bash
cd admin-frontend
npm install
npm run dev
```

Admin frontend URL:

```text
http://localhost:5174
```

If Vite chooses a different port, use the URL shown in the terminal.

## Docker Run

```bash
docker-compose --env-file .env.docker up --build
```

Default container ports:

- User frontend: `http://localhost:3000`
- Admin frontend: `http://localhost:3001`
- Backend API: `http://localhost:8000`

## Testing

### Frontend Tests

The frontend uses Mocha, Chai, Sinon, jsdom, and React Testing Library.

```bash
cd frontend
npm test
```

Current coverage includes:

- Vehicle finance calculation engine
- Leasing and loan amortization
- Money draft interest-only calculation
- LTV validation
- Tenure/down-payment edge cases
- Financing page rendering and monthly-estimate updates

### Backend Tests

The backend uses pytest and FastAPI TestClient.

```bash
python -m pytest backend/tests
```

Current coverage includes:

- Backend helper/unit logic
- Marketplace boost normalization and totals
- API health check
- Marketplace listing response behavior
- Missing listing edge cases
- Admin authentication rejection
- Invalid prediction payload validation

### Production Build Checks

```bash
cd frontend
npm run build
```

```bash
cd admin-frontend
npm run build
```

## Machine Learning Model

The trained price prediction model is loaded by the backend at runtime from the `ml/models` area. Model artifacts such as `.joblib` and `.pkl` files are ignored by Git because they can be large.

If running the project on a new machine, make sure the trained model artifact and required dataset files are available in the expected local paths before using `/predict`.

## Final Submission Checklist

Before submitting the project:

- Run `cd frontend && npm test`
- Run `python -m pytest backend/tests`
- Run `cd frontend && npm run build`
- Run `cd admin-frontend && npm run build`
- Confirm `.env`, `.env.docker`, frontend `.env`, backend `.env`, and admin `.env` files are not included in the submitted source bundle
- Use `.env.example` for placeholder configuration
- Remove development log files such as `vite-dev.log`, `vite-dev.err.log`, and `vite-dev.out.log` if packaging manually
- Confirm the trained ML model file is included only if your submission requires runnable prediction locally
- Check that screenshots, diagrams, and report references match the final implemented UI

## Notes

- Supabase, Stripe, and Gemini integrations require valid credentials.
- The backend includes local fallback behavior for several features so tests can run without real external services.
- The frontend build may warn about large chunks due to charting, PDF, and marketplace dependencies. This is a performance warning, not a build failure.

