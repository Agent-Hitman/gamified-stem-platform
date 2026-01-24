# backend/database.py
from pymongo import MongoClient

# YOUR CONNECTION STRING
# I added the database name 'gamified_stem' to the URL so data goes to the right place.
MONGO_URI = "mongodb+srv://admin:Hello123@cluster1.eiqm8on.mongodb.net/gamified_stem?retryWrites=true&w=majority&appName=Cluster1"

def get_database():
    try:
        # Create a connection using MongoClient
        client = MongoClient(MONGO_URI)
        
        # Create/Connect to the database named 'gamified_stem'
        db = client['gamified_stem']
        
        # Send a ping to confirm a successful connection
        client.admin.command('ping')
        print("✅ Pinged your deployment. You successfully connected to MongoDB!")
        return db
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

# Run this file directly to test the connection: 'python backend/database.py'
if __name__ == "__main__":
    get_database()