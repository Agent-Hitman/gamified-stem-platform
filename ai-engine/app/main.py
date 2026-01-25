from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
import json
import re
import random
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# --- 1. LIBRARIES & SETUP ---
from groq import Groq
from pymongo import MongoClient

# --- 2. ENVIRONMENT & DATABASE CONFIGURATION ---
# Robust logic to find .env file (Same dir or parent)
current_file_path = Path(__file__).resolve()
env_path = current_file_path.parent / '.env' # Look in same folder first

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    # Fallback: Look in parent (root)
    root_env = current_file_path.parent.parent / '.env'
    if root_env.exists():
        load_dotenv(dotenv_path=root_env)
    else:
        load_dotenv() # System env vars

# Load Secrets
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

# Setup Groq Client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq AI Brain Online")
    except Exception as e:
        print(f"⚠️ Groq Error: {e}")

# Setup MongoDB Connection
db = None
users_collection = None
scores_collection = None

if MONGO_URI:
    try:
        client = MongoClient(MONGO_URI)
        db = client['gamified_stem'] # Unified DB Name
        users_collection = db['users']
        scores_collection = db['scores']
        
        # Create Indexes
        users_collection.create_index("userId", unique=True)
        users_collection.create_index([("username", "text"), ("email", "text")])
        
        # Ping
        client.admin.command('ping')
        print("✅ MongoDB Connected Successfully!")
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
else:
    print("❌ Error: MONGO_URI not found in .env")

# --- 3. FASTAPI APP ---
app = FastAPI()

# --- CORS CONFIGURATION (THE FIX) ---
origins = [
    "http://localhost:5173",                 # For local testing
    "http://localhost:3000",                 # For local testing
    "https://gamified-stem-platform.vercel.app"  # 👈 YOUR VERCEL FRONTEND URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 👈 Allow ALL temporarily to test
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. DATA MODELS (Schemas) ---
class LoginRequest(BaseModel):
    userId: str
    email: Optional[str] = ""
    firstName: Optional[str] = ""

class QuizRequest(BaseModel):
    topic: str
    difficulty: str
    userId: Optional[str] = None 

class SkillAnalysisRequest(BaseModel):
    userId: str
    grade: str
    interests: List[str]

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

# --- 5. HELPER FUNCTIONS ---
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

# --- 6. API ENDPOINTS ---

# --- A. USER MANAGEMENT ---
@app.post("/api/daily-login")
def daily_login(req: LoginRequest):
    if users_collection is None: return {"error": "No DB"}
    today_str = datetime.utcnow().date().isoformat()
    
    initial_username = "Explorer"
    if req.firstName: initial_username = req.firstName
    elif req.email: initial_username = req.email.split('@')[0].capitalize()

    # Upsert User
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
                    "friends": [],
                    "last_login_date": today_str
                }
            },
            upsert=True
        )
    except: pass

    # Calculate Streak
    user = users_collection.find_one({"userId": req.userId})
    if not user: return {"error": "User creation failed"}

    last_login_str = user.get("last_login_date", "")
    current_streak = user.get("streak", 1)
    max_streak = user.get("max_streak", 1)

    try:
        if last_login_str != today_str: # Only update if new day
            last_date = datetime.strptime(last_login_str, "%Y-%m-%d").date()
            delta = (datetime.utcnow().date() - last_date).days
            if delta == 1: current_streak += 1
            elif delta > 1: current_streak = 1
    except: current_streak = 1

    if current_streak > max_streak: max_streak = current_streak

    users_collection.update_one(
        {"userId": req.userId},
        {"$set": {"last_login_date": today_str, "streak": current_streak, "max_streak": max_streak}}
    )
    return {"streak": current_streak, "max_streak": max_streak}

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

# --- B. AI FEATURES (GROQ) ---
@app.post("/api/generate-quiz")
def generate_quiz(req: QuizRequest):
    # Backup placeholder
    BACKUP = [{"id": 0, "question": "Force unit?", "options": ["N","J","W","Pa"], "correctAnswer":"N", "topic":req.topic, "difficulty":req.difficulty}]
    
    if not groq_client: return BACKUP
    
    try:
        # 1. Determine User Grade
        user_grade = "10th Grade"
        
        # --- FIX IS HERE: Explicitly check 'is not None' ---
        if req.userId and users_collection is not None: 
            u = users_collection.find_one({"userId": req.userId})
            if u: user_grade = u.get("grade", "10th Grade")
        
        # 2. Set Exam Context based on Grade
        exam_instruction = ""
        if user_grade in ["11th Grade", "12th Grade"]:
            exam_instruction = "Include real Previous Year Questions (PYQs) from JEE Mains and JEE Advanced where applicable."
        elif user_grade == "Undergraduate":
            exam_instruction = "Include real Previous Year Questions (PYQs) from GATE exam where applicable."
        
        # 3. Construct Prompt
        prompt = f"""
        Create 10 multiple-choice questions about "{req.topic}".
        Target Audience: {user_grade} student. Difficulty: {req.difficulty}.
        
        INSTRUCTIONS:
        {exam_instruction}
        If the topic is general, ensure standard academic rigor suitable for {user_grade}.
        
        STRICT RULES:
        1. Return ONLY a JSON Array.
        2. No Markdown, no explanation, no ```json tags.
        3. Format: [{{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A" }}]
        """
        
        # 4. Call AI
        chat = groq_client.chat.completions.create(
            messages=[{"role":"user","content":prompt}], 
            model="llama-3.3-70b-versatile", 
            temperature=0.5
        )
        
        # 5. Parse Response
        raw = chat.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match: raw = match.group(0)
        
        data = json.loads(raw)
        
        # 6. Format for Frontend
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
        print(f"Quiz Error: {e}")
        return BACKUP

@app.post("/api/analyze-skill")
def analyze_skill(req: SkillAnalysisRequest):
    BACKUP = {"source":"backup", "profile":{"summary":"AI Unavailable"},"careers":[],"roadmap":[]}
    if not groq_client: return BACKUP
    try:
        prompt = f"""
        Act as a Career Counselor for a {req.grade} student interested in {req.interests}.
        Suggest 2 suitable career paths.
        
        STRICT JSON FORMAT ONLY:
        {{
          "profile": {{ "summary": "Short 2 sentence profile." }},
          "careers": [ 
            {{ 
                "title": "Job Title", 
                "major": "Recommended College Major", 
                "match": 95, 
                "reason": "Why it fits." 
            }} 
          ],
          "roadmap": ["Step 1: Learn Basics", "Step 2: Build Projects", "Step 3: Internships"]
        }}
        """
        
        chat = groq_client.chat.completions.create(
            messages=[{"role":"user","content":prompt}], 
            model="llama-3.3-70b-versatile"
        )
        
        raw = chat.choices[0].message.content.replace("```json","").replace("```","").strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group(0) if match else raw)
        data["source"] = "ai"
        return data
    except Exception as e: 
        print(f"AI Error: {e}")
        return BACKUP

# --- C. SCORING & HISTORY ---
@app.post("/api/save-score")
def save_score(req: ScoreRequest):
    if scores_collection is None: return
    data = req.dict()
    data["timestamp"] = datetime.utcnow().isoformat()
    scores_collection.insert_one(data)
    
    # Update User XP
    users_collection.update_one({"userId": req.userId}, {"$inc": {"total_xp": req.score}})
    
    # Update Level
    u = users_collection.find_one({"userId": req.userId})
    if u: 
        users_collection.update_one(
            {"userId": req.userId}, 
            {"$set": {"level": calculate_level(u.get("total_xp", 0))}}
        )
    return {"status": "success"}

@app.get("/api/history/{user_id}")
def get_history(user_id: str):
    if scores_collection is None: return []
    return list(scores_collection.find({"userId": user_id}, {"_id": 0}).sort("timestamp", -1))

# --- D. FRIENDS & SOCIAL ---
@app.get("/api/search-users")
def search_users(q: str):
    if users_collection is None: return []
    if not q: return []
    regex = re.compile(f"^{q}", re.IGNORECASE)
    cursor = users_collection.find(
        {"username": regex}, 
        {"_id": 0, "userId": 1, "username": 1, "level": 1}
    ).limit(5)
    return list(cursor)

@app.post("/api/add-friend")
def add_friend(req: FriendRequest):
    if users_collection is None: return {"error": "No DB"}
    if req.userId == req.friendId: return {"status": "error", "message": "Cannot add self."}
    
    users_collection.update_one(
        {"userId": req.userId},
        {"$addToSet": {"friends": req.friendId}}
    )
    return {"status": "success"}

@app.post("/api/remove-friend")
def remove_friend(req: FriendRequest):
    if users_collection is None: return {"error": "No DB"}
    users_collection.update_one(
        {"userId": req.userId},
        {"$pull": {"friends": req.friendId}}
    )
    return {"status": "success"}

@app.get("/api/friends/{user_id}")
def get_friends(user_id: str):
    if users_collection is None: return []
    user = users_collection.find_one({"userId": user_id})
    friend_ids = user.get("friends", []) if user else []
    if not friend_ids: return []

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

@app.get("/api/leaderboard")
def get_leaderboard(current_user_id: Optional[str] = None):
    if users_collection is None: return []
    all_users = list(users_collection.find({}, {"_id": 0, "userId": 1, "username": 1, "total_xp": 1, "level": 1}).sort("total_xp", -1))
    lb = []
    found = False
    
    # Top 10
    for i, u in enumerate(all_users[:10]):
        is_me = (u["userId"] == current_user_id)
        if is_me: found = True
        lb.append({"rank": i+1, "name": u.get("username","?"), "xp": u.get("total_xp",0), "level": u.get("level",1), "userId": u["userId"], "isCurrentUser": is_me})
    
    # Add Current User if not in top 10
    if current_user_id and not found:
        for i, u in enumerate(all_users):
            if u["userId"] == current_user_id:
                lb.append({"rank": i+1, "name": u.get("username","?"), "xp": u.get("total_xp",0), "level": u.get("level",1), "userId": u["userId"], "isCurrentUser": True})
                break
    return lb