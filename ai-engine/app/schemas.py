from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class TopicPerformance(BaseModel):
    topic: str
    attempts: int = Field(ge=0)
    correct: int = Field(ge=0)
    avg_time_sec: float = Field(ge=0)

class SkillProfileRequest(BaseModel):
    user_id: str
    grade: Optional[str] = None
    interests: List[str] = []
    topic_performance: List[TopicPerformance]

class SkillProfileResponse(BaseModel):
    user_id: str
    skill_vector: Dict[str, float]
    weak_dimensions: List[str]
    strengths: List[str]
    explain: Dict[str, Dict[str, float]]

class CareerRecommendRequest(BaseModel):
    user_id: str
    skill_vector: Dict[str, float]
    interests: List[str] = []
    grade: Optional[str] = None

class CareerMatch(BaseModel):
    id: str
    title: str
    score: float
    why: Dict[str, float]
    description: str
    qualifications: List[str]
    growth: str
    suggested_courses: List[str] = []
    suggested_colleges: List[str] = []

class CareerRecommendResponse(BaseModel):
    user_id: str
    recommendations: List[CareerMatch]

class LearningPathRequest(BaseModel):
    user_id: str
    skill_vector: Dict[str, float]
    weak_dimensions: List[str] = []

class LearningStep(BaseModel):
    dimension: str
    target: float
    suggested_topics: List[str]
    reason: str

class LearningPathResponse(BaseModel):
    user_id: str
    steps: List[LearningStep]

class GuidanceRequest(BaseModel):
    user_id: str
    career_id: str
    current_grade: Optional[str] = None
    timeframe_months: int = 12
    skill_vector: Dict[str, float] = {}

class GuidanceResponse(BaseModel):
    user_id: str
    career_id: str
    roadmap: List[str]
    tips: List[str]