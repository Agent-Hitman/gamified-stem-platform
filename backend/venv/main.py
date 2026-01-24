from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import random
from datetime import datetime, timedelta # <--- NEW IMPORT
from database import get_database

app = FastAPI()

# SETUP CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CONNECT DB
db = get_database()
scores_collection = db["scores"] if db is not None else None
users_collection = db["users"] if db is not None else None

# --- MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class ScoreRequest(BaseModel):
    userId: str
    username: Optional[str] = "Anonymous"
    email: Optional[str] = None
    score: int
    topic: str

class UserInitRequest(BaseModel):
    userId: str
    username: str
    email: str
    grade: str

class LoginRequest(BaseModel):
    userId: str

# --- HELPER: LEVELING LOGIC ---
def calculate_level(total_xp):
    current_level = 1
    xp_needed_for_next = 1000
    accumulated_xp = 0

    while current_level < 10:
        threshold = accumulated_xp + xp_needed_for_next
        if total_xp < threshold:
            return current_level
        accumulated_xp += xp_needed_for_next
        current_level += 1
        xp_needed_for_next += 500
        
    return 10

# --- ENDPOINTS ---

@app.post("/generate-quiz")
def generate_quiz(req: QuizRequest):
    category_map = {"Science": 17, "Computers": 18, "Mathematics": 19, "Gadgets": 30}
    category_id = category_map.get(req.topic, 19)
    url = f"https://opentdb.com/api.php?amount=5&category={category_id}&difficulty={req.difficulty.lower()}&type=multiple"
    try:
        response = requests.get(url).json()
        if response["response_code"] != 0: raise HTTPException(status_code=500)
        formatted_questions = []
        for q in response["results"]:
            options = q["incorrect_answers"] + [q["correct_answer"]]
            random.shuffle(options)
            formatted_questions.append({
                "topic": req.topic, "question": q["question"], "options": options,
                "correctAnswer": q["correct_answer"], "difficulty": q["difficulty"]
            })
        return formatted_questions
    except:
        return [{"topic": "Fallback", "question": "API Error. 2+2?", "options": ["4"], "correctAnswer": "4"}]

# --- NEW: DAILY LOGIN & STREAK CHECK ---
@app.post("/api/daily-login")
def daily_login(req: LoginRequest):
    if users_collection is None: return {"error": "No DB"}
    
    user = users_collection.find_one({"userId": req.req.userId})
    if not user: return {"error": "User not found"}

    # Get Dates
    today_str = datetime.utcnow().date().isoformat() # e.g. "2026-01-24"
    last_login_str = user.get("last_login_date", "")
    
    current_streak = user.get("streak", 1)
    max_streak = user.get("max_streak", 1)

    # LOGIC: Check Streak
    if last_login_str == today_str:
        # Already logged in today. Do nothing.
        pass
    else:
        # Check if yesterday was the last login
        yesterday_str = (datetime.utcnow().date() - timedelta(days=1)).isoformat()
        
        if last_login_str == yesterday_str:
            # Maintained streak!
            current_streak += 1
        else:
            # Broken streak (missed a day or more)
            current_streak = 1 # Reset to 1 (since they logged in today)
        
        # Update Max Streak if beaten
        if current_streak > max_streak:
            max_streak = current_streak

        # Update DB
        users_collection.update_one(
            {"userId": req.userId},
            {
                "$set": {
                    "last_login_date": today_str,
                    "streak": current_streak,
                    "max_streak": max_streak
                }
            }
        )

    return {
        "streak": current_streak,
        "max_streak": max_streak,
        "message": "Streak updated"
    }

@app.post("/api/init-user")
def init_user(req: UserInitRequest):
    if users_collection is None: return {"error": "No DB"}
    existing_user = users_collection.find_one({"userId": req.userId})
    if not existing_user:
        # Defaults for new user
        today_str = datetime.utcnow().date().isoformat()
        users_collection.insert_one({
            "userId": req.userId,
            "username": req.username,
            "email": req.email,
            "grade": req.grade,
            "total_xp": 0,
            "level": 1,
            "streak": 1,
            "max_streak": 1,         # <--- NEW FIELD
            "last_login_date": today_str # <--- NEW FIELD
        })
        return {"message": "User created"}
    return {"message": "Exists"}

@app.post("/api/save-score")
def save_score(req: ScoreRequest):
    if scores_collection is None: return {"error": "No DB"}
    scores_collection.insert_one(req.dict())
    users_collection.update_one({"userId": req.userId}, {"$inc": {"total_xp": req.score}})
    
    user = users_collection.find_one({"userId": req.userId})
    if user:
        new_level = calculate_level(user.get("total_xp", 0))
        users_collection.update_one({"userId": req.userId}, {"$set": {"level": new_level}})
    return {"status": "success"}

@app.get("/api/user/{user_id}")
def get_user_stats(user_id: str):
    if users_collection is None: return {"error": "No DB"}
    user = users_collection.find_one({"userId": user_id}, {"_id": 0})
    if user: return user
    return {"total_xp": 0, "level": 1, "streak": 1, "max_streak": 1, "username": "Explorer"}