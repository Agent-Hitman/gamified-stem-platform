from google import genai
import os
from dotenv import load_dotenv

# Load your API key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ API Key not found!")
else:
    client = genai.Client(api_key=api_key)
    
    print("Checking available models...")
    try:
        # List all models
        # We look for models that support 'generateContent'
        for model in client.models.list():
            print(f"- {model.name}")
            
    except Exception as e:
        print(f"Error: {e}")