import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuizSetup() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  const startMission = () => {
    if (!topic.trim()) {
      alert("Please enter a topic!");
      return;
    }
    // Navigate to the actual quiz and pass the settings
    navigate('/quiz', { state: { topic, difficulty } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Mission Setup</h1>
          <p className="text-gray-500">Configure your training simulation.</p>
        </div>

        <div className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Target Topic
            </label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Thermodynamics, Linear Algebra, ReactJS"
              className="w-full bg-gray-100 border-2 border-transparent focus:border-indigo-500 rounded-xl p-4 text-lg font-bold outline-none transition-all"
            />
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    difficulty === level 
                      ? "bg-indigo-600 text-white shadow-lg scale-105" 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {difficulty === "Easy" && "Theory-focused. < 1 min/question."}
              {difficulty === "Medium" && "Balanced mix. ~2-3 mins/question."}
              {difficulty === "Hard" && "Complex Math. ~5 mins/question."}
            </p>
          </div>

          <button 
            onClick={startMission}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02]"
          >
            Start Simulation
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-gray-400 font-medium hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}