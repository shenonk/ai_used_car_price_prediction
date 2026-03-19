import os
import base64
import json
from dotenv import load_dotenv

load_dotenv()

key = os.environ.get("SUPABASE_KEY")
if not key:
    print("No key found")
    exit()

parts = key.split('.')
if len(parts) != 3:
    print("Invalid JWT format")
    exit()

payload = parts[1]
# Add padding if needed
payload += '=' * (-len(payload) % 4)
decoded = base64.b64decode(payload).decode('utf-8')
print(f"Payload: {decoded}")
