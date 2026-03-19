import requests
import json

url = "http://localhost:5000/api/predict"
data = {
    "brand": "Toyota",
    "model": "Vitz",
    "year": 2018,
    "engine": 1000,
    "mileage": 45000
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        res_data = response.json()
        if "predicted_price" in res_data:
            print("SUCCESS: Prediction returned correctly.")
        else:
            print("FAILURE: predicted_price missing from response.")
    else:
        print(f"FAILURE: Server returned {response.status_code}")
        
except Exception as e:
    print(f"Error: {e}")
