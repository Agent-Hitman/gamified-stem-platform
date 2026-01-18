import { useState } from "react";
import { analyzeSkills, getCareerRecommendations, getLearningPath } from "../services/api";

export default function Career() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=Input, 2=Results
  
  // User Inputs
  const [grade, setGrade] = useState("10th");
  const [interests, setInterests] = useState("");
  
  // AI Results Storage
  const [skillProfile, setSkillProfile] = useState(null);
  const [careerRecs, setCareerRecs] = useState([]);
  const [learningPath, setLearningPath] = useState([]);

  // --- MOCK DATA FOR INTEGRATION TESTING ---
  // In the real app, this comes from your database/quiz history
  const mockQuizHistory = [
    { topic: "Algebra", attempts: 5, correct: 4, avg_time_sec: 45 },
    { topic: "Physics_Mechanics", attempts: 3, correct: 1, avg_time_sec: 120 },
    { topic: "Python_Basics", attempts: 10, correct: 9, avg_time_sec: 30 },
  ];

 const handleAnalysis = async () => {
    setLoading(true);
    try {
      const interestList = interests.split(",").map((i) => i.trim());
      const userId = "user_123";

      // --- INTEGRATION CHANGE: READ REAL DATA ---
      // Get history from the Quiz we just played!
      const localHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
      
      // If user hasn't played yet, fallback to mock data so demo doesn't fail
      const quizData = localHistory.length > 0 ? localHistory : [
        { topic: "Algebra", attempts: 5, correct: 4, avg_time_sec: 45 },
        { topic: "Physics_Mechanics", attempts: 3, correct: 1, avg_time_sec: 120 },
      ];

      // 1. Call Skill Profiling Agent
      const profileData = await analyzeSkills(userId, grade, interestList, mockQuizHistory);
      setSkillProfile(profileData);

      // 2. Call Career Matching Agent (using the vector from step 1)
      const careerData = await getCareerRecommendations(userId, profileData.skill_vector, interestList, grade);
      setCareerRecs(careerData.recommendations);

      // 3. Call Learning Path Agent
      const pathData = await getLearningPath(userId, profileData.skill_vector, profileData.weak_dimensions);
      setLearningPath(pathData.steps);

      setStep(2);
    } catch (error) {
      console.error("AI Engine Error:", error);
      alert("Failed to connect to AI Engine. Make sure backend is running on port 8000!");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">AI Career Guidance</h1>

      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Step 1: Tell us about yourself</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Current Grade/Year</label>
            <select 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="9th">9th Grade</option>
              <option value="10th">10th Grade</option>
              <option value="11th">11th Grade</option>
              <option value="12th">12th Grade</option>
              <option value="Undergrad">Undergrad</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Interests (comma separated)</label>
            <input 
              type="text" 
              placeholder="e.g. Robotics, AI, Space, History"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 w-full font-bold"
          >
            {loading ? "AI Agents Working..." : "Analyze Profile & Suggest Careers"}
          </button>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            *This will also analyze your recent quiz performance (Mock Data used for now).
          </p>
        </div>
      )}

      {step === 2 && skillProfile && (
        <div className="space-y-8">
          {/* Section 1: Skill Analysis */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">1. Skill Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-green-700">Your Strengths</h3>
                <ul className="list-disc pl-5">
                  {skillProfile.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-red-700">Areas for Improvement</h3>
                <ul className="list-disc pl-5">
                  {skillProfile.weak_dimensions.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Career Recommendations */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Top Career Matches</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {careerRecs.map((career) => (
                <div key={career.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-5">
                  <h3 className="text-xl font-bold text-indigo-600">{career.title}</h3>
                  <div className="text-sm text-gray-500 mb-2">Match Score: {(career.score * 100).toFixed(0)}%</div>
                  <p className="text-gray-700 text-sm mb-4">{career.description}</p>
                  
                  <div className="mb-3">
                    <span className="text-xs font-semibold bg-gray-100 p-1 rounded">Required:</span>
                    <p className="text-xs text-gray-600 mt-1">{career.qualifications.join(", ")}</p>
                  </div>

                  <button className="text-indigo-600 text-sm font-semibold hover:underline">
                    View Full Roadmap →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Learning Path */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Immediate Learning Path</h2>
            <div className="space-y-4">
              {learningPath.map((step, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-lg">{step.dimension}</h4>
                    <p className="text-gray-600">{step.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {step.suggested_topics.map((topic, i) => (
                        <span key={i} className="bg-white border border-gray-300 px-2 py-1 text-xs rounded-full">
                          Study: {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => setStep(1)}
            className="mt-8 text-gray-500 hover:text-gray-700 underline"
          >
            ← Start Over
          </button>
        </div>
      )}
    </div>
  );
}