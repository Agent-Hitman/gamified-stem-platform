from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# --- 1. NEW LIBRARY IMPORT ---
from google import genai
from google.genai import types

# --- 2. LOAD SECRETS ---
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

# --- 3. INITIALIZE CLIENT ---
# Use the "Lite" model as discussed for speed and cost
MODEL_NAME = 'gemini-2.5-flash' 

if not api_key:
    print("❌ CRITICAL WARNING: API Key not found! Check your .env file.")
    client = None
else:
    try:
        client = genai.Client(api_key=api_key)
        print(f"✅ Gemini Client Initialized (Model: {MODEL_NAME})")
    except Exception as e:
        print(f"❌ Error initializing client: {e}")
        client = None

app = FastAPI(title="Gamified STEM Platform API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. AGENT CLASSES (The Missing Brains) ---

class SkillProfilingAgent:
    def __init__(self, client):
        self.client = client

    def analyze(self, user_data: Dict):
        """Analyzes quiz history to find strengths/weaknesses."""
        if not self.client:
            return {"error": "AI not connected"}

        prompt = f"""
        Analyze this student's performance data:
        {json.dumps(user_data)}

        Task:
        1. Identify their top 3 strong topics.
        2. Identify 2 weak areas needing improvement.
        3. Assign a "Scientist Archetype" (e.g., "The Quantum Mechanic", "The Data Wizard").

        Return JSON ONLY:
        {{
            "strengths": ["topic1", "topic2", "topic3"],
            "weaknesses": ["topicA", "topicB"],
            "archetype": "Name",
            "summary": "One sentence summary of their ability."
        }}
        """
        
        try:
            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"Skill Agent Error: {e}")
            # Fallback if AI fails
            return {
                "strengths": ["General Science"],
                "weaknesses": ["Advanced Math"],
                "archetype": "Rising Star",
                "summary": "Keep practicing to refine your skills!"
            }

class CareerGuidanceAgent:
    def __init__(self, client):
        self.client = client

    def recommend(self, skill_profile: Dict, interests: List[str]):
        """Suggests careers based on skills + interests."""
        if not self.client:
            return {"error": "AI not connected"}

        prompt = f"""
        Student Skills: {json.dumps(skill_profile)}
        Student Interests: {json.dumps(interests)}

        Task: Recommend 3 specific STEM careers.
        For each, provide:
        - Job Title
        - Match Score (0-100%)
        - Why it fits
        - One required university major

        Return JSON ONLY:
        [
            {{
                "title": "Job Title",
                "match": 95,
                "reason": "Because you are good at X and like Y...",
                "degree": "Major Name"
            }}
        ]
        """
        try:
            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"Career Agent Error: {e}")
            return []

# --- 5. INSTANTIATE AGENTS ---
# This is where your error happened before - we must create the agents!
skill_agent = SkillProfilingAgent(client)
career_agent = CareerGuidanceAgent(client)

# --- 6. DATA MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class SkillAnalysisRequest(BaseModel):
    userId: str
    grade: str
    interests: List[str]
    quizHistory: List[Dict] # The data from your Quiz Page

# --- 7. ENDPOINTS ---

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}

@app.post("/generate-quiz")
def generate_quiz(req: QuizRequest):
    if not client: raise HTTPException(status_code=500, detail="No API Key")
    
    try:
        prompt = f"""
        Create 5 multiple-choice questions about "{req.topic}" at "{req.difficulty}" level.
        Return strictly JSON list. No markdown.
        Format: [{{ "id": 1, "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "topic": "{req.topic}", "difficulty": "{req.difficulty}" }}]
        """
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        return json.loads(response.text.replace("```json", "").replace("```", "").strip())
    except Exception as e:
        print(f"Quiz Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-skill")
def analyze_skill(req: SkillAnalysisRequest):
    """
    1. Uses SkillAgent to profile the user.
    2. Uses CareerAgent to suggest jobs.
    3. Returns a combined report.
    """
    print(f"🧠 Analyzing skills for {req.userId}...")
    
    # Step 1: Profile Skills
    skill_profile = skill_agent.analyze(req.quizHistory)
    
    # Step 2: Get Career Matches
    career_matches = career_agent.recommend(skill_profile, req.interests)
    
    # Step 3: Combine
    return {
        "profile": skill_profile,
        "careers": career_matches,
        "roadmap": ["Learn Python Basics", "Master Algebra II", "Build a Portfolio Project"] # Mock roadmap for now
    }