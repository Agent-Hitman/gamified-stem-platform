import axios from "axios";

const API_URL = "https://stem-platform-api.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Analyze Skills based on quiz performance
export const analyzeSkills = async (userId, grade, interests, topicPerformance) => {
  const response = await api.post("/analyze-skill", {
    user_id: userId,
    grade: grade,
    interests: interests,
    topic_performance: topicPerformance,
  });
  return response.data;
};

// 2. Get Career Recommendations based on the skill vector from step 1
export const getCareerRecommendations = async (userId, skillVector, interests, grade) => {
  const response = await api.post("/recommend-career", {
    user_id: userId,
    skill_vector: skillVector,
    interests: interests,
    grade: grade,
  });
  return response.data;
};

// 3. Get Learning Path (Next Steps)
export const getLearningPath = async (userId, skillVector, weakDimensions) => {
  const response = await api.post("/next-learning-path", {
    user_id: userId,
    skill_vector: skillVector,
    weak_dimensions: weakDimensions,
  });
  return response.data;
};

// 4. Get Detailed Roadmap for a specific career
export const getCareerGuidance = async (userId, careerId, currentGrade, skillVector) => {
  const response = await api.post("/guidance", {
    user_id: userId,
    career_id: careerId,
    current_grade: currentGrade,
    timeframe_months: 12, // Default timeframe
    skill_vector: skillVector,
  });
  return response.data;
};