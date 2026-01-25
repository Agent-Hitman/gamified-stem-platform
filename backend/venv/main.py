from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import re
import random
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# --- 1. LIBRARIES ---
from groq import Groq       # AI Brain
from database import get_database # Database

# --- 2. SETUP & SECRETS ---
from dotenv import load_dotenv
from pathlib import Path
import os
from groq import Groq

# ROBUST PATH FINDER (Silent Mode)
current_path = Path(__file__).resolve()
root_dir = None

# Walk up until we find the project root
while current_path.parent != current_path:
    if current_path.name == 'gamified-stem-platform':
        root_dir = current_path
        break
    current_path = current_path.parent

# Load .env if found
if root_dir:
    env_path = root_dir / 'ai-engine' / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)

groq_key = os.getenv("GROQ_API_KEY")
groq_client = None

if groq_key:
    try:
        groq_client = Groq(api_key=groq_key)
        print("✅ Groq AI Brain Online")
    except Exception as e:
        print(f"⚠️ Groq Error: {e}")
else:
    print("⚠️ GROQ_API_KEY not found! AI features will fail.")

# CONNECT DB
db = get_database()
scores_collection = db["scores"] if db is not None else None
users_collection = db["users"] if db is not None else None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class QuestionDetail(BaseModel):
    question: str
    userAnswer: str
    correctAnswer: str
    isCorrect: bool

class ScoreRequest(BaseModel):
    userId: str
    username: Optional[str] = "Anonymous"
    email: Optional[str] = None
    score: int
    topic: str
    difficulty: Optional[str] = "Medium"
    details: List[QuestionDetail] # <-- Stores the Q&A log


class LoginRequest(BaseModel):
    userId: str

class SkillAnalysisRequest(BaseModel):
    userId: str
    grade: str
    interests: List[str]

# --- 4. HELPER FUNCTIONS ---
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

# ==========================================
#  ENDPOINT 1: AI QUIZ GENERATION (GROQ)
# ==========================================
@app.post("/api/generate-quiz")
def generate_quiz(req: QuizRequest):
    # Fallback if no API key
    if not groq_client:
        return [{"id": 1, "topic": req.topic, "question": "AI Offline. Check API Key.", "options": ["Ok"], "correctAnswer": "Ok", "difficulty": "Easy"}]

    difficulty_prompt = ""
    if req.difficulty == "Easy": difficulty_prompt = "Simple conceptual questions."
    elif req.difficulty == "Medium": difficulty_prompt = "Undergraduate level problems."
    elif req.difficulty == "Hard": difficulty_prompt = "Complex, tricky, multi-step reasoning problems."

    try:
        prompt = f"""
        Create 5 multiple-choice questions about "{req.topic}".
        Difficulty: {req.difficulty}. {difficulty_prompt}
        
        STRICT JSON FORMATTING:
        Return ONLY a JSON array. No text before/after.
        Format: [{{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A" }}]
        """
        
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5, 
        )
        
        # Clean & Parse JSON
        raw_text = chat_completion.choices[0].message.content
        text = raw_text.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match: text = match.group(0)
        
        data = json.loads(text)
        
        # Add metadata for Frontend
        formatted = []
        for i, q in enumerate(data):
            formatted.append({
                "id": i,
                "topic": req.topic,
                "difficulty": req.difficulty,
                "question": q["question"],
                "options": q["options"],
                "correctAnswer": q["correctAnswer"]
            })
        return formatted

    except Exception as e:
        print(f"❌ Quiz Gen Error: {e}")
        return [{"id": 1, "topic": "Error", "question": "Simulation Failed.", "options": ["Retry"], "correctAnswer": "Retry", "difficulty": "Easy"}]

# ==========================================
#  ENDPOINT 2: CAREER GUIDANCE (GROQ)
# ==========================================
@app.post("/api/analyze-skill")
def analyze_skill(req: SkillAnalysisRequest):
    if not groq_client:
        return {"error": "AI Offline"}

    try:
        prompt = f"""
        Act as a Career Counselor. User Grade: {req.grade}, Interests: {req.interests}.
        Suggest 2 suitable career paths.
        STRICT JSON: {{ "profile": {{ "summary": "..." }}, "careers": [ {{ "title": "...", "match": 90, "reason": "..." }} ] }}
        """
        
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7, 
        )
        
        text = chat_completion.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match: text = match.group(0)
        
        return json.loads(text)
    except Exception as e:
        print(e)
        return {"error": "Analysis failed"}

# ==========================================
#  ENDPOINT 3: USER & DB MANAGEMENT
# ==========================================
@app.post("/api/daily-login")
def daily_login(req: LoginRequest):
    if users_collection is None: return {"error": "No DB"}
    
    user = users_collection.find_one({"userId": req.userId})
    today_str = datetime.utcnow().date().isoformat()
    
    # AUTO-CREATE USER
    if not user:
        users_collection.insert_one({
            "userId": req.userId,
            "username": "Explorer",
            "email": "",
            "grade": "9th Grade",
            "total_xp": 0,
            "level": 1,
            "streak": 1,
            "max_streak": 1,
            "last_login_date": today_str
        })
        return {"streak": 1, "message": "User created"}

    # STREAK LOGIC
    last_login = user.get("last_login_date", "")
    current_streak = user.get("streak", 1)
    max_streak = user.get("max_streak", 1)

    if last_login != today_str:
        yesterday = (datetime.utcnow().date() - timedelta(days=1)).isoformat()
        if last_login == yesterday:
            current_streak += 1
        else:
            current_streak = 1 
        
        if current_streak > max_streak: max_streak = current_streak

        users_collection.update_one(
            {"userId": req.userId},
            {"$set": {"last_login_date": today_str, "streak": current_streak, "max_streak": max_streak}}
        )

    return {"streak": current_streak, "max_streak": max_streak}

@app.post("/api/save-score")
def save_score(req: ScoreRequest):
    if scores_collection is None: return {"error": "No DB"}
    
    # Save the score with TIMESTAMP and DETAILS
    score_data = req.dict()
    score_data["timestamp"] = datetime.utcnow().isoformat()
    scores_collection.insert_one(score_data)
    
    # Add XP to User
    users_collection.update_one({"userId": req.userId}, {"$inc": {"total_xp": req.score}})
    
    # Check Level Up
    user = users_collection.find_one({"userId": req.userId})
    if user:
        new_lvl = calculate_level(user.get("total_xp", 0))
        users_collection.update_one({"userId": req.userId}, {"$set": {"level": new_lvl}})
    
    return {"status": "success"}

@app.get("/api/user/{user_id}")
def get_user_stats(user_id: str):
    if users_collection is None: return {"error": "No DB"}
    user = users_collection.find_one({"userId": user_id}, {"_id": 0})
    if user: return user
    return {"total_xp": 0, "level": 1, "username": "Explorer"}

# 3. NEW ENDPOINT: GET QUIZ HISTORY
@app.get("/api/history/{user_id}")
def get_history(user_id: str):
    if scores_collection is None: return []
    
    # Fetch all scores for this user, newest first
    cursor = scores_collection.find({"userId": user_id}, {"_id": 0}).sort("timestamp", -1)
    history = list(cursor)
    return history