from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    SkillProfileRequest, SkillProfileResponse,
    CareerRecommendRequest, CareerRecommendResponse,
    LearningPathRequest, LearningPathResponse,
    GuidanceRequest, GuidanceResponse
)

from .agents.skill_profiling import SkillProfilingAgent
from .agents.career_matching import CareerMatchingAgent
from .agents.learning_path import LearningPathAgent
from .agents.guidance import GuidanceAgent

app = FastAPI(title="AI Engine - Gamified STEM + Career Guidance", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

skill_agent = SkillProfilingAgent()
career_agent = CareerMatchingAgent()
path_agent = LearningPathAgent()
guide_agent = GuidanceAgent()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze-skill", response_model=SkillProfileResponse)
def analyze_skill(req: SkillProfileRequest):
    topic_perf = [tp.model_dump() for tp in req.topic_performance]
    skill_vector, explain = skill_agent.build_skill_vector(topic_perf)
    weak, strong = skill_agent.summarize(skill_vector, k=2)
    return SkillProfileResponse(
        user_id=req.user_id,
        skill_vector=skill_vector,
        weak_dimensions=weak,
        strengths=strong,
        explain=explain
    )

@app.post("/recommend-career", response_model=CareerRecommendResponse)
def recommend_career(req: CareerRecommendRequest):
    recs = career_agent.recommend(req.skill_vector, req.interests, top_n=3)
    return CareerRecommendResponse(user_id=req.user_id, recommendations=recs)

@app.post("/next-learning-path", response_model=LearningPathResponse)
def next_learning_path(req: LearningPathRequest):
    steps = path_agent.suggest(req.skill_vector, req.weak_dimensions, target=0.75, max_steps=3)
    return LearningPathResponse(user_id=req.user_id, steps=steps)

@app.post("/guidance", response_model=GuidanceResponse)
def guidance(req: GuidanceRequest):
    data = guide_agent.roadmap(req.career_id, req.timeframe_months, req.skill_vector)
    return GuidanceResponse(
        user_id=req.user_id,
        career_id=req.career_id,
        roadmap=data["roadmap"],
        tips=data["tips"]
    )

