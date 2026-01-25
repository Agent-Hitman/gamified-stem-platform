import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";

export default function Career() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // State for user input
  const [grade, setGrade] = useState("10th Grade"); // Default fallback
  const [interests, setInterests] = useState("");
  
  // State for AI Results
  const [loading, setLoading] = useState(false);
  const [skillProfile, setSkillProfile] = useState(null);

  // --- NEW: PRE-FILL GRADE FROM PROFILE ---
  useEffect(() => {
    if (user) {
      // Fetch user profile to get the stored grade
      fetch(`http://127.0.0.1:8000/api/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          // If the user has a grade saved, set it. Otherwise keep default.
          if (data && data.grade) {
            setGrade(data.grade);
          }
        })
        .catch(err => console.error("Could not auto-fill grade:", err));
    }
  }, [user]);

  const handleAnalysis = async () => {
    setLoading(true);
    setSkillProfile(null); 

    try {
      const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');

      // Use the live backend URL here (make sure port is correct)
      const res = await fetch("http://127.0.0.1:8000/api/analyze-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "guest_user",
          grade: grade, // This sends whatever is currently selected (Auto or Edited)
          interests: interests.split(","),
          quizHistory: history
        })
      });

      if (!res.ok) throw new Error("Server failed");

      const data = await res.json();
      setSkillProfile(data);

    } catch (err) {
      console.error(err);
      alert("Failed to connect to AI Brain. Ensure backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans flex flex-col items-center">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-12 text-center relative z-10">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4 drop-shadow-md">
          AI Career Guidance
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Our AI Agents analyze your quiz performance and interests to build your future roadmap.
        </p>
        
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      </div>

      {/* INPUT SECTION */}
      <div className="w-full max-w-2xl bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-2xl mb-12 relative overflow-hidden">
        {/* Decorative Blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

        <div className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Grade</label>
            <div className="relative">
                <select 
                value={grade}
                onChange={(e) => setGrade(e.target.value)} // User can still edit manually
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition appearance-none cursor-pointer font-medium"
                >
                <option>8th Grade</option>
                <option>9th Grade</option>
                <option>10th Grade</option>
                <option>11th Grade</option>
                <option>12th Grade</option>
                <option>Undergraduate</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Interests (comma separated)</label>
            <input 
              type="text" 
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Robotics, Space, Biology, Drawing"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition placeholder-slate-600 font-medium"
            />
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                AI Agents Working...
              </span>
            ) : "🚀 Analyze My Career Path"}
          </button>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {skillProfile && (
        <div className="w-full max-w-5xl animate-fade-in-up space-y-10">
          
           {/* AI INDICATOR BADGE */}
          <div className="flex justify-center">
            {skillProfile.source === "ai" ? (
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                ⚡ Generated Live by AI
              </span>
            ) : (
              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                ⚠️ Offline Mode (Backup Data)
              </span>
            )}
          </div>

          {/* 1. ARCHETYPE CARD */}
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-10 rounded-[2rem] text-center shadow-2xl relative overflow-hidden text-white border border-purple-500/30">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            
            <h2 className="text-purple-200 uppercase tracking-[0.3em] text-xs font-bold mb-4">Your Professional Archetype</h2>
            <h3 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-500 mb-6 drop-shadow-sm">
              {skillProfile.profile.archetype || "The Innovator"}
            </h3>
            <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto font-medium leading-relaxed italic">
              "{skillProfile.profile.summary}"
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* 2. CAREER MATCHES */}
            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                <span className="text-3xl bg-slate-700 p-2 rounded-xl">🎯</span> Top Career Matches
              </h3>
              <div className="space-y-4">
                {skillProfile.careers?.map((career, idx) => (
                  <div key={idx} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 hover:border-purple-500/50 hover:bg-slate-900 transition-all group">
                    <div className="mb-3">
                      <h4 className="font-bold text-xl text-white group-hover:text-purple-300 transition-colors">{career.title}</h4>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{career.reason}</p>
                    <div className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                      {/* FIXED: Changed from career.degree to career.major */}
                      🎓 Major: <span className="text-indigo-400">{career.major || career.degree || "Not Specified"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. LEARNING ROADMAP */}
            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                <span className="text-3xl bg-slate-700 p-2 rounded-xl">🗺️</span> Your Roadmap
              </h3>
              
              {!skillProfile.roadmap || skillProfile.roadmap.length === 0 ? (
                 <div className="text-center text-slate-500 py-10">
                    <p>No roadmap generated yet.</p>
                 </div>
              ) : (
                <div className="space-y-8 relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-700"></div>
                  
                  {skillProfile.roadmap.map((step, idx) => (
                    <div key={idx} className="relative pl-12 group">
                      {/* Dot */}
                      <div className="absolute left-2 top-1.5 w-4 h-4 bg-slate-800 rounded-full border-2 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:bg-purple-500 transition-colors"></div>
                      
                      {/* Title Handling (If API sends string, we auto-number it) */}
                      <h4 className="font-bold text-lg text-slate-200 mb-2">
                        {step.title || `Step ${idx + 1}`}
                      </h4>
                      
                      {/* Description Handling */}
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {/* Logic: If it's just a text string, display it. If it's an object, show description. */}
                            {typeof step === 'string' ? step : step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center mt-12 mb-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-slate-500 hover:text-white transition font-bold text-sm flex items-center gap-2 mx-auto"
        >
          ← Back to Dashboard
        </button>
      </div>

    </div>
  );
}