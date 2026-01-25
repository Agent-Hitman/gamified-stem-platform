import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuizSetup() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("Physics");
  const [difficulty, setDifficulty] = useState("Easy");

  const handleStart = () => {
    navigate('/quiz', { state: { topic, difficulty } });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      
      {/* CARD CONTAINER */}
      <div className="bg-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md relative overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>

        {/* HEADER */}
        <div className="text-center mb-8 relative z-10">
          <div className="text-5xl mb-4 drop-shadow-md">🚀</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Mission Setup</h1>
          <p className="text-slate-400 text-sm">Configure your training simulation.</p>
        </div>

        {/* FORM */}
        <div className="space-y-6 relative z-10">
          
          {/* TOPIC INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium placeholder-slate-600"
              placeholder="e.g. Thermodynamics, Python, History..."
            />
          </div>

          {/* DIFFICULTY SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    difficulty === level 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-slate-500 mt-2 italic">
              {difficulty === "Easy" && "Theory-focused. < 1 min/question."}
              {difficulty === "Medium" && "Application-focused. ~2.5 min/question."}
              {difficulty === "Hard" && "Complex scenarios. ~4.5 min/question."}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 space-y-3">
            <button 
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transform hover:-translate-y-1 transition-all duration-200"
            >
              Start Mission
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full text-slate-500 font-bold py-3 hover:text-slate-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}