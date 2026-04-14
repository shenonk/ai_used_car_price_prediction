# Price Prediction ML

This folder contains the training and evaluation code for the used vehicle
price prediction model.

## Suggested structure

- `data/active/` stores the current finalized training dataset CSV
- `data/archive/` stores older reference datasets that should not be used for training
- `models/` stores trained model artifacts
- `train_price_model.py` trains and saves a baseline model
- `evaluate_model.py` loads the saved model and evaluates it on the dataset

## Quick start

1. Copy your final dataset CSV into `ml/data/active/finalized_vehicle_prices.csv`
2. Install the required Python packages in your environment:
   - `pandas`
   - `numpy`
   - `scikit-learn`
   - `joblib`
3. Train:
   - `python ml/train_price_model.py`
4. Evaluate:
   - `python ml/evaluate_model.py`
