# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import random

# Import your database connection
from database import get_database

app = FastAPI()

# 1. SETUP CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
db = get_database()
scores_collection = db["scores"] if db is not None else None

# --- DATA MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class ScoreRequest(BaseModel):
    userId: str
    username: Optional[str] = "Anonymous"
    email: Optional[str] = None
    score: int
    topic: str

# --- ENDPOINT 1: GENERATE QUIZ ---
@app.post("/generate-quiz")
def generate_quiz(req: QuizRequest):
    # Mapping topics to OpenTriviaDB Category IDs
    category_map = {
        "Science": 17, 
        "Computers": 18, 
        "Mathematics": 19,
        "Gadgets": 30, 
        "Quantum Physics": 19 
    }
    
    category_id = category_map.get(req.topic, 19)
    
    url = f"https://opentdb.com/api.php?amount=5&category={category_id}&difficulty={req.difficulty.lower()}&type=multiple"
    
    try:
        response = requests.get(url).json()
        
        if response["response_code"] != 0:
            raise HTTPException(status_code=500, detail="External API failed")

        formatted_questions = []
        for q in response["results"]:
            # Shuffle options so the answer isn't always last
            options = q["incorrect_answers"] + [q["correct_answer"]]
            random.shuffle(options)
            
            formatted_questions.append({
                "topic": req.topic,
                "question": q["question"],
                "options": options,
                "correctAnswer": q["correct_answer"],
                "difficulty": q["difficulty"]
            })
            
        return formatted_questions

    except Exception as e:
        print(f"Error fetching quiz: {e}")
        # Fallback question if API fails
        return [{
            "topic": "Fallback",
            "question": "The external API is busy. What is 2 + 2?",
            "options": ["3", "4", "5", "Fish"],
            "correctAnswer": "4",
            "difficulty": "easy"
        }]

# --- ENDPOINT 2: SAVE SCORE ---
@app.post("/api/save-score")
def save_score(req: ScoreRequest):
    if scores_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Simply insert the score into the database
    result = scores_collection.insert_one(req.dict())
    
    return {
        "status": "success",
        "message": "Score saved successfully",
        "id": str(result.inserted_id)
    }