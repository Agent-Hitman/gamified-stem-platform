import sys
import os

print("--- DIAGNOSTIC START ---")
print(f"Current Working Directory: {os.getcwd()}")

# 1. TEST IMPORTS
print("\n1. Testing Imports...")
try:
    import fastapi
    print("✅ FastAPI found")
    import pymongo
    print("✅ PyMongo found")
    import uvicorn
    print("✅ Uvicorn found")
    import dotenv
    print("✅ Dotenv found (optional)")
except ImportError as e:
    print(f"❌ IMPORT ERROR: {e}")
    print("SOLUTION: Run 'pip install fastapi uvicorn pymongo python-dotenv requests'")

# 2. TEST FILE STRUCTURE
print("\n2. Checking File Structure...")
if os.path.exists("backend/main.py"):
    print("✅ backend/main.py exists")
else:
    print("❌ backend/main.py NOT FOUND")

if os.path.exists("backend/database.py"):
    print("✅ backend/database.py exists")
else:
    print("❌ backend/database.py NOT FOUND")

# 3. TEST DB CONNECTION
print("\n3. Testing Database Connection...")
try:
    # Try to import your actual database file
    sys.path.append("backend") # Add backend to path so we can import from it
    from database import get_database
    db = get_database()
    if db is not None:
        print("✅ Database connection SUCCESSFUL")
    else:
        print("❌ Database connection FAILED (Check your connection string in database.py)")
except Exception as e:
    print(f"❌ CRASH WHILE CONNECTING: {e}")

print("\n--- DIAGNOSTIC END ---")