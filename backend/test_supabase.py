import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
# The corrupted anon key from frontend/.env: yeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c3h1anN3cWJmaWZzaml6eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODQwODIsImV4cCI6MjA4OTQ2MDA4Mn0.nbaF8ckkAkgb4hSDn_4daTbDnG_vvRnWVPSuJDcaQj4
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c3h1anN3cWJmaWZzaml6eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODQwODIsImV4cCI6MjA4OTQ2MDA4Mn0.nbaF8ckkAkgb4hSDn_4daTbDnG_vvRnWVPSuJDcaQj4"

print(f"URL: {url}")
print(f"Key: {key[:10]}...{key[-10:]}" if key else "Key: None")

try:
    supabase: Client = create_client(url, key)
    print("Supabase client initialized.")
    
    # Try to fetch from loan_rates
    try:
        res = supabase.table("loan_rates").select("*").limit(1).execute()
        print(f"Successfully queried 'loan_rates' table. Data: {res.data}")
    except Exception as e:
        print(f"Error querying 'loan_rates': {e}")
        
    # Try to fetch from notifications
    try:
        res = supabase.table("notifications").select("*").limit(1).execute()
        print(f"Successfully queried 'notifications' table. Data: {res.data}")
    except Exception as e:
        print(f"Error querying 'notifications': {e}")

    # Try to fetch from predictions (again, for double check)
    try:
        res = supabase.table("predictions").select("*").limit(1).execute()
        print(f"Successfully queried 'predictions' table. Data: {res.data}")
    except Exception as e:
        print(f"Error querying 'predictions': {e}")
    
except Exception as e:
    print(f"Error: {e}")
