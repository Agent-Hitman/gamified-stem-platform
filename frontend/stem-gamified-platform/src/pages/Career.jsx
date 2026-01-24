import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Career() {
  const navigate = useNavigate();
  
  // State for user input
  const [grade, setGrade] = useState("10th Grade");
  const [interests, setInterests] = useState("");
  
  // State for AI Results
  const [loading, setLoading] = useState(false);
  const [skillProfile, setSkillProfile] = useState(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setSkillProfile(null); 

    try {
      const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');

      const res = await fetch("http://127.0.0.1:8000/analyze-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_123",
          grade: grade,
          interests: interests.split(","),
          quizHistory: history
        })
      });

      if (!res.ok) throw new Error("Server failed");

      const data = await res.json();
      console.log("DATA RECEIVED:", data); 
      setSkillProfile(data);

    } catch (err) {
      console.error(err);
      alert("Failed to connect to AI Brain. Ensure backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
          AI Career Guidance
        </h1>
        <p className="text-gray-500 text-lg">
          Our AI Agents analyze your quiz performance and interests to build your future.
        </p>
      </div>

      {/* INPUT SECTION */}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-xl mb-12">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-600 mb-2 font-bold">Current Grade</label>
            <select 
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition"
            >
              <option>9th Grade</option>
              <option>10th Grade</option>
              <option>11th Grade</option>
              <option>12th Grade</option>
              <option>Undergrad (1st Year)</option>
              <option>Undergrad (2nd Year)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 mb-2 font-bold">Your Interests (comma separated)</label>
            <input 
              type="text" 
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Robotics, Space, Biology, Drawing"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                AI Agents Working...
              </span>
            ) : "🚀 Analyze My Career Path"}
          </button>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {skillProfile && (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
          
           {/* AI INDICATOR BADGE */}
          <div className="flex justify-center mb-4">
            {skillProfile.source === "ai" ? (
              <span className="bg-green-100 text-green-700 border border-green-200 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                ⚡ Generated Live by Gemini AI
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 border border-red-200 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                ⚠️ Offline Mode (Backup Data)
              </span>
            )}
          </div>

          {/* 1. ARCHETYPE CARD */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 rounded-3xl text-center mb-12 shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <h2 className="text-white/80 uppercase tracking-widest text-sm font-bold mb-2">Your Scientist Archetype</h2>
            <h3 className="text-4xl md:text-5xl font-black text-yellow-300 mb-4 drop-shadow-md">
              {skillProfile.profile.archetype}
            </h3>
            <p className="text-xl text-white/90 max-w-2xl mx-auto italic font-medium">
              "{skillProfile.profile.summary}"
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* 2. CAREER MATCHES */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                <span className="text-3xl">🎯</span> Top Career Matches
              </h3>
              <div className="space-y-4">
                {skillProfile.careers.map((career, idx) => (
                  <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-800 group-hover:text-purple-700">{career.title}</h4>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                        {career.match}% Match
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{career.reason}</p>
                    <div className="text-xs text-gray-400 font-mono font-bold">
                      🎓 Major: <span className="text-indigo-600">{career.degree}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. LEARNING ROADMAP (FIXED FOR OBJECT ERROR) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                <span className="text-3xl">🗺️</span> Your Roadmap
              </h3>
              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                
                {skillProfile.roadmap.map((step, idx) => (
                  <div key={idx} className="relative pl-12">
                    {/* Dot */}
                    <div className="absolute left-2 top-1 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow-sm box-content"></div>
                    <h4 className="font-bold text-lg text-gray-800 mb-1">Step {idx + 1}</h4>
                    
                    {/* --- THE FIX IS HERE --- */}
                    {typeof step === 'object' ? (
                      <div>
                        <span className="block font-bold text-indigo-600 mb-1">{step.title}</span>
                        <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm leading-relaxed">{step}</p>
                    )}
                    {/* ----------------------- */}
                    
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center mt-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-purple-600 transition underline font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>

    </div>
  );
}