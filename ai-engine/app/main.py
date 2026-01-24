from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import json
import re  # <--- ADDED REGEX MODULE FOR CLEANING
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

if groq_key:
    try:
        groq_client = Groq(api_key=groq_key)
        print("✅ Groq Brain Online (Ready for Quizzes)")
    except Exception as e:
        print(f"⚠️ Groq Error: {e}")

# GEMINI MODEL
GEMINI_MODEL = 'gemini-2.0-flash-lite' 

if gemini_key:
    try:
        gemini_client = genai.Client(api_key=gemini_key)
        print(f"✅ Gemini Brain Online (Ready for Career: {GEMINI_MODEL})")
    except Exception as e:
        print(f"⚠️ Gemini Error: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. BACKUP DATA ---
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
    "roadmap": [
        {"title": "Check API Key", "description": "Ensure your .env file has valid keys."},
        {"title": "Restart Server", "description": "Try restarting the backend terminal."}
    ]
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
    
    # --- UPDATED DIFFICULTY LOGIC ---
    difficulty_instruction = ""
    if req.difficulty.lower() == "easy":
        difficulty_instruction = (
            "DIFFICULTY: COMPETITIVE HIGH SCHOOL (SAT/JEE Main).\n"
            "- Conceptual but solvable in 1 minute."
        )
    elif req.difficulty.lower() == "medium":
        difficulty_instruction = (
            "DIFFICULTY: UNDERGRADUATE ENGINEERING (GATE/Advanced).\n"
            "- Requires derivation or multi-step logic.\n"
            "- Target time: 2-3 minutes."
        )
    elif req.difficulty.lower() == "hard":
        difficulty_instruction = (
            "DIFFICULTY: PhD / OLYMPIAD LEVEL (EXTREMELY HARD).\n"
            "- Involve obscure edge cases or complex math paradoxes.\n"
            "- If using math formulas, write them as PLAIN TEXT description, DO NOT use LaTeX backslashes.\n"
            "- Target time: 5+ minutes."
        )

    try:
        # We explicitly tell it NOT to use backslashes to avoid JSON errors
        prompt = f"""
        Act as a ruthless Examiner. Create 10 multiple-choice questions about "{req.topic}".
        
        {difficulty_instruction}
        
        STRICT JSON FORMATTING RULES:
        1. Return ONLY a valid JSON array.
        2. Do NOT write any introduction or conclusion text.
        3. Do NOT use markdown code blocks (```json).
        4. Do NOT use LaTeX or backslashes (\\) in strings. Write "square root of x" instead of \\sqrt{{x}}.
        5. Structure: [{{ "id": 1, "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A" }}]
        """
        
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5, # Lower temp = more stable JSON
        )
        
        # --- ROBUST CLEANING LOGIC ---
        raw_text = chat_completion.choices[0].message.content
        
        # 1. Remove Markdown (```json ... ```)
        text = raw_text.replace("```json", "").replace("```", "").strip()
        
        # 2. Extract strictly the List [...] part using Regex
        # This ignores any "Here is your quiz:" text before the JSON
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            text = match.group(0)
        
        # 3. Parse
        return json.loads(text)

    except json.JSONDecodeError as je:
        print(f"❌ JSON Parse Error: {je}")
        # Debugging: Print what the AI actually sent so we can see the bad character
        print(f"--- BAD JSON START ---\n{text[:200]}...\n--- BAD JSON END ---")
        return [{"id": 1, "question": "AI Formatting Error (Try again).", "options": ["Ok"], "correctAnswer": "Ok"}]
    except Exception as e:
        print(f"❌ General Error: {e}")
        return [{"id": 1, "question": "Simulation Error.", "options": ["Ok"], "correctAnswer": "Ok"}]

# ==========================================
#  ENDPOINT 2: CAREER GUIDANCE (USES GEMINI)
# ==========================================
@app.post("/analyze-skill")
def analyze_skill(req: SkillAnalysisRequest):
    if not gemini_client:
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
        
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        
        # Regex clean for Gemini too, just in case
        match = re.search(r'\{.*\}', clean_text, re.DOTALL)
        if match:
            clean_text = match.group(0)

        data = json.loads(clean_text)
        data["source"] = "ai" 
        return data

    except Exception as e:
        print(f"❌ AI Career Error: {e}")
        return BACKUP_CAREER