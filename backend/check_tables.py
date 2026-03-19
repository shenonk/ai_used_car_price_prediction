import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

# PostgREST root endpoint returns OpenAPI spec with table info
try:
    response = requests.get(f"{url}/rest/v1/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("Available Tables/Paths and Details:")
        paths = data.get("paths", {})
        for path, info in paths.items():
            print(f"Path: {path}")
            # Check which methods are available
            methods = info.keys()
            print(f"  Methods: {list(methods)}")
    else:
        print(f"Failed to fetch metadata. Status: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
