# Price Prediction ML

This folder contains the training and evaluation code for the used vehicle
price prediction model.

## Suggested structure

- `data/` stores the training dataset CSV
- `models/` stores trained model artifacts
- `train_price_model.py` trains and saves a baseline model
- `evaluate_model.py` loads the saved model and evaluates it on the dataset

## Quick start

1. Copy your final dataset CSV into `ml/data/`
2. Install the required Python packages in your environment:
   - `pandas`
   - `numpy`
   - `scikit-learn`
   - `joblib`
3. Train:
   - `python ml/train_price_model.py --data ml/data/merged_vehicle_dataset_FINAL_sort.csv`
4. Evaluate:
   - `python ml/evaluate_model.py --data ml/data/merged_vehicle_dataset_FINAL_sort.csv`
