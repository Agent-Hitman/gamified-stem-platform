from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# --- 1. LIBRARIES FOR BOTH BRAINS ---
from groq import Groq          # For Fast Quizzes
from google import genai       # For Smart Career Advice

# --- 2. SETUP & SECRETS ---
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

groq_key = os.getenv("GROQ_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")

# --- 3. INITIALIZE CLIENTS ---
groq_client = None
gemini_client = None

# Init Groq (The Speedster)
if groq_key:
    try:
        groq_client = Groq(api_key=groq_key)
        print("✅ Groq Brain Online (Ready for Quizzes)")
    except Exception as e:
        print(f"⚠️ Groq Error: {e}")

# Init Gemini (The Philosopher)
if gemini_key:
    try:
        gemini_client = genai.Client(api_key=gemini_key)
        print("✅ Gemini Brain Online (Ready for Career)")
    except Exception as e:
        print(f"⚠️ Gemini Error: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. BACKUP DATA (Safety Net) ---
BACKUP_CAREER = {
    "source": "backup",
    "profile": {
        "strengths": ["Logic", "Patterns"],
        "weaknesses": ["Creativity"],
        "archetype": "The Offline Strategist",
        "summary": "AI is taking a nap, but your potential is awake!"
    },
    "careers": [
        {"title": "System Architect", "match": 95, "reason": "System is offline.", "degree": "CS"},
        {"title": "Network Engineer", "match": 90, "reason": "Connectivity expert.", "degree": "IT"}
    ],
    "roadmap": ["Check API Key", "Restart Server"]
}

# --- 5. DATA MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class SkillAnalysisRequest(BaseModel):
    userId: str
    grade: str
    interests: List[str]
    quizHistory: List[Dict]

# --- 6. ENDPOINTS ---

@app.get("/health")
def health():
    return {
        "status": "ok", 
        "groq": groq_client is not None, 
        "gemini": gemini_client is not None
    }

# ==========================================
#  ENDPOINT 1: QUIZ GENERATION (USES GROQ)
# ==========================================
@app.post("/generate-quiz")
def generate_quiz(req: QuizRequest):
    if not groq_client:
        print("❌ Groq not connected. Sending fallback.")
        return [{"id": 1, "question": "Groq Error. What is 2+2?", "options": ["3","4","5","6"], "correctAnswer": "4"}]
    
    # 1. Logic for Timer/Style
    difficulty_instruction = ""
    if req.difficulty.lower() == "easy":
        difficulty_instruction = "Level: Easy. Target Time: < 1 min per question. Simple facts/math."
    elif req.difficulty.lower() == "medium":
        difficulty_instruction = "Level: Medium. Target Time: ~2 mins per question. Formulas/Application."
    elif req.difficulty.lower() == "hard":
        difficulty_instruction = "Level: Hard. Target Time: ~4 mins per question. Complex Multi-step problems."

    try:
        prompt = f"""
        Act as a strict STEM Professor. Create 10 multiple-choice questions about "{req.topic}".
        
        INSTRUCTIONS:
        {difficulty_instruction}
        
        STRICT FORMATTING RULES:
        1. Return ONLY valid JSON array.
        2. No markdown formatting (do not write ```json).
        3. Structure: [{{ "id": 1, "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A" }}]
        """
        
        # Call Groq (Llama 3 is FAST)
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5, 
        )
        
        # Parse Response
        response_text = chat_completion.choices[0].message.content
        text = response_text.replace("```json", "").replace("```", "").strip()
        
        # Clean up any extra text Llama might add
        start = text.find('[')
        end = text.rfind(']') + 1
        if start != -1 and end != -1:
            text = text[start:end]

        return json.loads(text)

    except Exception as e:
        print(f"❌ Quiz Gen Error: {e}")
        return [{"id": 1, "question": "Simulation Error.", "options": ["Ok"], "correctAnswer": "Ok"}]

# ==========================================
#  ENDPOINT 2: CAREER GUIDANCE (USES GEMINI)
# ==========================================
@app.post("/analyze-skill")
def analyze_skill(req: SkillAnalysisRequest):
    if not gemini_client:
        print("❌ Gemini not connected. Sending backup.")
        return BACKUP_CAREER

    try:
        print(f"🧠 Gemini thinking about: {req.interests}")
        prompt = f"""
        Act as a Career Counselor.
        User Grade: {req.grade}
        User Interests: {json.dumps(req.interests)}
        
        Task: Create a unique career profile.
        STRICTLY return JSON. No Markdown.
        
        Structure:
        {{
            "profile": {{ "strengths": ["A","B"], "weaknesses": ["C"], "archetype": "Cool Title", "summary": "One sentence" }},
            "careers": [ {{ "title": "Job", "match": 90, "reason": "Why", "degree": "Major" }} ],
            "roadmap": [{{ "title": "Step 1", "description": "Details" }}, {{ "title": "Step 2", "description": "Details" }}]
        }}
        """
        
        # Call Gemini (Gemini is Creative)
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash-lite',
            contents=prompt
        )
        
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        
        # Add badge tag
        data["source"] = "ai" 
        return data

    except Exception as e:
        print(f"❌ AI Career Error: {e}")
        return BACKUP_CAREER