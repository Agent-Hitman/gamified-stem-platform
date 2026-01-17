from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ MODELS ------------------

class QuizResult(BaseModel):
    user: str
    score: int
    xp: int
    topic: str

# ------------------ TEMP STORAGE ------------------

quiz_results = []

# ------------------ ROUTES ------------------

@app.get("/")
def root():
    return {"status": "Backend running"}

@app.post("/quiz/submit")
def submit_quiz(result: QuizResult):
    quiz_results.append(result)
    return {"message": "Quiz submitted successfully"}

@app.get("/analytics")
def get_analytics():
    return quiz_results

@app.get("/leaderboard")
def get_leaderboard():
    sorted_users = sorted(
        quiz_results, key=lambda x: x.xp, reverse=True
    )
    return sorted_users
