from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import re
import random
import time
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# --- 1. LIBRARIES & SETUP ---
from groq import Groq
from pymongo import MongoClient

current_path = Path(__file__).resolve()
root_dir = None
while current_path.parent != current_path:
    if current_path.name == 'gamified-stem-platform':
        root_dir = current_path
        break
    current_path = current_path.parent

if root_dir:
    env_path = root_dir / 'ai-engine' / '.env'
    if env_path.exists(): load_dotenv(dotenv_path=env_path)
    else: load_dotenv() 

groq_key = os.getenv("GROQ_API_KEY")
mongo_uri = os.getenv("MONGO_URI")

groq_client = None
if groq_key:
    try: groq_client = Groq(api_key=groq_key)
    except Exception as e: print(f"⚠️ Groq Error: {e}")

db = None
users_collection = None
scores_collection = None

if mongo_uri:
    try:
        client = MongoClient(mongo_uri)
        db = client['stem_platform']
        users_collection = db['users']
        scores_collection = db['scores']
        users_collection.create_index("userId", unique=True)
        # Create Text Index for Searching
        users_collection.create_index([("username", "text"), ("email", "text")])
        print("✅ MongoDB Connected")
    except Exception as e: print(f"⚠️ MongoDB Error: {e}")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- DATA MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str
    userId: Optional[str] = None 

class SkillAnalysisRequest(BaseModel):
    userId: str
    grade: str
    interests: List[str]

class LoginRequest(BaseModel):
    userId: str
    email: Optional[str] = ""
    firstName: Optional[str] = ""

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
    details: Optional[List[QuestionDetail]] = [] 

class UpdateProfileRequest(BaseModel):
    userId: str
    username: str
    grade: str

class FriendRequest(BaseModel):
    userId: str
    friendId: str

# --- HELPER ---
def calculate_level(total_xp):
    current_level = 1
    xp_needed_for_next = 1000
    accumulated_xp = 0
    while current_level < 10:
        threshold = accumulated_xp + xp_needed_for_next
        if total_xp < threshold: return current_level
        accumulated_xp += xp_needed_for_next
        current_level += 1
        xp_needed_for_next += 500
    return 10

# --- ENDPOINTS ---

@app.post("/api/daily-login")
def daily_login(req: LoginRequest):
    if users_collection is None: return {"error": "No DB"}
    today_str = datetime.utcnow().date().isoformat()
    
    initial_username = "Explorer"
    if req.firstName: initial_username = req.firstName
    elif req.email: initial_username = req.email.split('@')[0].capitalize()

    # ATOMIC CREATE
    try:
        users_collection.update_one(
            {"userId": req.userId},
            {
                "$setOnInsert": {
                    "userId": req.userId,
                    "username": initial_username,
                    "email": req.email,
                    "grade": "9th Grade",
                    "total_xp": 0,
                    "level": 1,
                    "streak": 1,
                    "max_streak": 1,
                    "friends": [], # Initialize Friends List
                    "last_login_date": today_str
                }
            },
            upsert=True
        )
    except: pass

    # UPDATE STREAK
    user = users_collection.find_one({"userId": req.userId})
    if not user: return {"error": "User creation failed"}

    last_login_str = user.get("last_login_date", "")
    current_streak = user.get("streak", 1)
    max_streak = user.get("max_streak", 1)

    try:
        if last_login_str:
            last_date = datetime.strptime(last_login_str, "%Y-%m-%d").date()
            delta = (datetime.utcnow().date() - last_date).days
            if delta == 1: current_streak += 1
            elif delta > 1: current_streak = 1
        else: current_streak = 1
    except: current_streak = 1

    if current_streak > max_streak: max_streak = current_streak

    users_collection.update_one(
        {"userId": req.userId},
        {"$set": {"last_login_date": today_str, "streak": current_streak, "max_streak": max_streak}}
    )
    return {"streak": current_streak, "max_streak": max_streak}

# 1. SEARCH USERS
@app.get("/api/search-users")
def search_users(q: str):
    if users_collection is None: return []
    if not q: return []
    
    # Case-insensitive regex search
    regex = re.compile(f"^{q}", re.IGNORECASE)
    cursor = users_collection.find(
        {"username": regex}, 
        {"_id": 0, "userId": 1, "username": 1, "level": 1}
    ).limit(5)
    
    return list(cursor)

# 2. ADD FRIEND
@app.post("/api/add-friend")
def add_friend(req: FriendRequest):
    if users_collection is None: return {"error": "No DB"}
    
    # Check if adding self
    if req.userId == req.friendId:
        return {"status": "error", "message": "You cannot add yourself."}

    # Add to 'friends' array (addToSet prevents duplicates)
    users_collection.update_one(
        {"userId": req.userId},
        {"$addToSet": {"friends": req.friendId}}
    )
    return {"status": "success"}

# 3. REMOVE FRIEND (NEW)
@app.post("/api/remove-friend")
def remove_friend(req: FriendRequest):
    if users_collection is None: return {"error": "No DB"}
    
    # Remove from 'friends' array
    users_collection.update_one(
        {"userId": req.userId},
        {"$pull": {"friends": req.friendId}}
    )
    return {"status": "success"}

# 4. GET FRIENDS (With Leaderboard Stats)
@app.get("/api/friends/{user_id}")
def get_friends(user_id: str):
    if users_collection is None: return []

    # Get current user's friend list
    user = users_collection.find_one({"userId": user_id})
    friend_ids = user.get("friends", []) if user else []
    
    if not friend_ids: return []

    # Fetch global leaderboard to calculate ranks
    all_users = list(users_collection.find({}, {"_id": 0, "userId": 1, "username": 1, "total_xp": 1, "level": 1}).sort("total_xp", -1))
    
    friends_data = []
    
    for i, u in enumerate(all_users):
        if u["userId"] in friend_ids:
            friends_data.append({
                "rank": i + 1,
                "name": u.get("username", "Unknown"),
                "xp": u.get("total_xp", 0),
                "level": u.get("level", 1),
                "userId": u["userId"]
            })
            
    return friends_data

# --- OTHER ENDPOINTS (Unchanged) ---
@app.post("/api/generate-quiz")
def generate_quiz(req: QuizRequest):
    BACKUP = [{"question": "Force unit?", "options": ["N","J","W","Pa"], "correctAnswer":"N"}]
    if not groq_client: return BACKUP
    try:
        user_grade = "10th Grade"
        if req.userId: 
            u = users_collection.find_one({"userId": req.userId})
            if u: user_grade = u.get("grade", "10th Grade")
        
        prompt = f"""Create 10 MCQs on '{req.topic}'. Target: {user_grade}. Diff: {req.difficulty}. 
        RULES: JSON Array Only. NO LaTeX. Plain text. correctAnswer exact match.
        Format: [{{ "question": "...", "options": ["A","B"], "correctAnswer": "A" }}]"""
        
        chat = groq_client.chat.completions.create(messages=[{"role":"user","content":prompt}], model="llama-3.3-70b-versatile", temperature=0.6)
        raw = chat.choices[0].message.content.replace("```json","").replace("```","").strip()
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        return json.loads(match.group(0) if match else raw)
    except: return BACKUP

@app.post("/api/analyze-skill")
def analyze_skill(req: SkillAnalysisRequest):
    BACKUP = {"source":"backup", "profile":{"archetype":"Explorer","summary":"..."},"careers":[],"roadmap":[]}
    if not groq_client: return BACKUP
    try:
        prompt = f"Mentor for {req.grade}, likes {req.interests}. JSON Only: {{'profile':{{...}},'careers':[...],'roadmap':[...]}}"
        chat = groq_client.chat.completions.create(messages=[{"role":"user","content":prompt}], model="llama-3.3-70b-versatile")
        raw = chat.choices[0].message.content.replace("```json","").replace("```","").strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group(0) if match else raw)
        data["source"] = "ai"
        return data
    except: return BACKUP

@app.post("/api/save-score")
def save_score(req: ScoreRequest):
    if scores_collection is None: return
    data = req.dict()
    data["timestamp"] = datetime.utcnow().isoformat()
    scores_collection.insert_one(data)
    users_collection.update_one({"userId": req.userId}, {"$inc": {"total_xp": req.score}})
    u = users_collection.find_one({"userId": req.userId})
    if u: users_collection.update_one({"userId": req.userId}, {"$set": {"level": calculate_level(u.get("total_xp", 0))}})
    return {"status": "success"}

@app.get("/api/history/{user_id}")
def get_history(user_id: str):
    if scores_collection is None: return []
    return list(scores_collection.find({"userId": user_id}, {"_id": 0}).sort("timestamp", -1))

@app.get("/api/user/{user_id}")
def get_user_stats(user_id: str):
    if users_collection is None: return {"error": "No DB"}
    u = users_collection.find_one({"userId": user_id}, {"_id": 0})
    if u: return u
    return {"total_xp": 0, "level": 1, "username": "Explorer", "streak": 1}

@app.post("/api/update-profile")
def update_profile(req: UpdateProfileRequest):
    if users_collection is None: return
    users_collection.update_one({"userId": req.userId}, {"$set": {"username": req.username, "grade": req.grade}})
    return {"status": "success"}

@app.get("/api/leaderboard")
def get_leaderboard(current_user_id: Optional[str] = None):
    if users_collection is None: return []
    all_users = list(users_collection.find({}, {"_id": 0, "userId": 1, "username": 1, "total_xp": 1, "level": 1}).sort("total_xp", -1))
    lb = []
    found = False
    for i, u in enumerate(all_users[:10]):
        is_me = (u["userId"] == current_user_id)
        if is_me: found = True
        lb.append({"rank": i+1, "name": u.get("username","?"), "xp": u.get("total_xp",0), "level": u.get("level",1), "userId": u["userId"], "isCurrentUser": is_me})
    
    if current_user_id and not found:
        for i, u in enumerate(all_users):
            if u["userId"] == current_user_id:
                lb.append({"rank": i+1, "name": u.get("username","?"), "xp": u.get("total_xp",0), "level": u.get("level",1), "userId": u["userId"], "isCurrentUser": True})
                break
    return lb