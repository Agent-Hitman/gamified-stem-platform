import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignOutButton } from "@clerk/clerk-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [stats, setStats] = useState({
    username: "Explorer",
    level: 1,
    total_xp: 0,
    streak: 1,
    max_streak: 1,
    grade: "9th Grade",
    accuracy: "--" // Default
  });

  const [progressData, setProgressData] = useState({ percent: 0, currentLevelXp: 0, requiredXp: 1000 });

  // LEVEL CALCULATION LOGIC
  const calculateLevelProgress = (totalXp) => {
    let level = 1; let xpForNextStep = 1000; let accumulatedXp = 0;
    while (level < 10) {
      const threshold = accumulatedXp + xpForNextStep;
      if (totalXp < threshold) {
        const xpInCurrentLevel = totalXp - accumulatedXp;
        return { currentLevelXp: xpInCurrentLevel, requiredXp: xpForNextStep, percent: (xpInCurrentLevel / xpForNextStep) * 100 };
      }
      accumulatedXp += xpForNextStep; level++; xpForNextStep += 500;
    }
    return { currentLevelXp: xpForNextStep, requiredXp: xpForNextStep, percent: 100 };
  };

  // --- EFFECT: LOAD DATA & CHECK STREAK ---
  useEffect(() => {
    if (user) {
      // 1. Login & Send User Details (Email/Name)
      fetch('https://stem-pulse.onrender.com/api/daily-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
            firstName: user.firstName || ""
        })
      })
      .then(res => res.json())
      .then(loginData => {
          // No redirect needed anymore!
          return fetch(`https://stem-pulse.onrender.com/api/user/${user.id}`);
      })
      .then(res => res.json())
      .then(data => {
          if (!data) return;
          
          // 2. Fetch History for Accuracy
          fetch(`https://stem-pulse.onrender.com/api/history/${user.id}`)
            .then(res => res.json())
            .then(history => {
                let totalCorrect = 0;
                let totalQuestions = 0;

                history.forEach(quiz => {
                    if (quiz.details) {
                        quiz.details.forEach(q => {
                            totalQuestions++;
                            if (q.isCorrect) totalCorrect++;
                        });
                    }
                });

                const acc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                
                setStats({
                    username: data.username || user.firstName,
                    level: data.level || 1,
                    total_xp: data.total_xp || 0,
                    streak: data.streak || 1,
                    max_streak: data.max_streak || 1,
                    grade: data.grade || "9th Grade",
                    accuracy: totalQuestions > 0 ? acc : "--",
                    email: data.email || user.primaryEmailAddress?.emailAddress 
                });
                
                setProgressData(calculateLevelProgress(data.total_xp || 0));
            });
      })
      .catch(err => console.error("Error:", err));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-md border-b border-slate-700 px-6 py-4 shadow-md h-20 flex items-center">
        <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 tracking-tight cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/dashboard')}>
            StemPulse ⚡
          </div>
          
          <div className="flex items-center gap-6 relative">
            
            {/* DROPDOWN MENU */}
            <div className="relative">
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    className="flex items-center gap-2 text-slate-300 hover:text-purple-400 font-medium transition group focus:outline-none"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition ring-1 ring-slate-600 group-hover:ring-purple-500">
                        👤
                    </div>
                    <span className="hidden md:block">My Account ▼</span>
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-fade-in-up">
                        <button onClick={() => navigate('/profile')} className="block w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 transition border-b border-slate-700">
                            🛠️ My Profile
                        </button>
                        
                        {/* NEW FRIENDS BUTTON */}
                        <button onClick={() => navigate('/friends')} className="block w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 transition border-b border-slate-700">
                            👥 Friends
                        </button>

                        <button onClick={() => navigate('/history')} className="block w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 transition">
                            📜 Quiz History
                        </button>
                    </div>
                )}
            </div>
            
            <SignOutButton>
              <button className="bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white px-5 py-2 rounded-full font-bold text-sm transition border border-red-500/20">Log Out</button>
            </SignOutButton>
          </div>
        </div>
      </nav>

      {/* DASHBOARD CONTENT */}
      <div className="pt-36 px-6 pb-10 md:px-10 flex justify-center">
        <div className="w-full max-w-7xl space-y-10">
          
          {/* HEADER SECTION */}
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-[2rem] p-12 text-white shadow-2xl relative overflow-hidden border border-purple-500/20">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">
                  Welcome back, {stats.username}! 👋
                </h1>
                
                <div className="flex gap-4 mt-2 items-center">
                  <p className="opacity-90 text-xl font-medium">
                    You are on a <span className="font-bold text-yellow-400 border-b-2 border-yellow-400/50 pb-1">{stats.streak} day streak!</span> 🔥
                  </p>
                  <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/20 text-sm font-bold flex items-center gap-2 backdrop-blur-md">
                    <span>🏆 Max Streak: {stats.max_streak}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 leading-none drop-shadow-lg">{stats.level}</div>
                <div className="text-sm font-bold tracking-[0.2em] text-purple-200/70 uppercase mt-2">Current Level</div>
              </div>
            </div>

            {/* XP PROGRESS */}
            <div className="mt-10 relative z-10">
              <div className="flex justify-between text-sm font-bold mb-3 text-purple-200 tracking-wide">
                <span>Level Progress: {progressData.currentLevelXp} / {progressData.requiredXp} XP</span>
                <span>Total XP: {stats.total_xp}</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-6 overflow-hidden backdrop-blur-sm border border-white/10">
                <div 
                  className="h-full rounded-full shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all duration-1000 bg-gradient-to-r from-yellow-400 to-yellow-600"
                  style={{ width: `${progressData.percent}%` }} 
                ></div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full -mr-20 -mt-20 pointer-events-none blur-3xl"></div>
          </div>

          {/* CARDS GRID */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* NEXT MISSION */}
            <div className="bg-slate-800 p-10 rounded-[2rem] shadow-xl border border-slate-700 flex flex-col justify-between hover:border-purple-500/30 hover:shadow-purple-500/10 transition-all duration-300">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-4xl bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20 text-purple-300">🚀</span>
                  <h2 className="text-3xl font-bold text-white">Next Mission</h2>
                </div>
                <p className="text-slate-300 mb-10 leading-relaxed text-xl">
                    Ready to level up? Complete the next quiz to earn XP and reach <span className="font-bold text-purple-400">Level {stats.level + 1}</span>!
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <button onClick={() => navigate('/QuizSetup')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold py-5 rounded-2xl transition shadow-lg shadow-indigo-900/30 transform hover:-translate-y-1 border border-indigo-500/50">🎮 Start Quiz</button>
                  <button onClick={() => navigate('/career')} className="flex-1 bg-fuchsia-700 hover:bg-fuchsia-600 text-white text-lg font-bold py-5 rounded-2xl transition shadow-lg shadow-fuchsia-900/30 transform hover:-translate-y-1 border border-fuchsia-500/50">🎯 Career Goal</button>
                </div>
                <button onClick={() => navigate('/leaderboard')} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 text-lg font-bold py-4 rounded-2xl transition shadow-lg shadow-amber-900/20 transform hover:-translate-y-1 flex items-center justify-center gap-3">🏆 View Global Leaderboard</button>
              </div>
            </div>

            {/* TROPHY CASE & STATS */}
            <div className="bg-slate-800 p-10 rounded-[2rem] shadow-xl border border-slate-700 flex flex-col hover:border-yellow-500/30 hover:shadow-yellow-500/10 transition-all duration-300">
               <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl bg-yellow-500/10 p-3 rounded-2xl border border-yellow-500/20 text-yellow-300">🏆</span>
                <h2 className="text-3xl font-bold text-white">Your Trophy Case</h2>
              </div>
              <div className="flex flex-wrap gap-4 mb-10">
                {stats.level >= 2 ? <span className="bg-yellow-500/10 text-yellow-300 px-6 py-3 rounded-xl font-bold border border-yellow-500/30">🥉 Rookie</span> : <span className="text-slate-500 italic bg-slate-900/50 px-4 py-2 rounded-xl border border-dashed border-slate-600">🔒 Reach Lvl 2</span>}
                {stats.level >= 5 ? <span className="bg-blue-500/10 text-blue-300 px-6 py-3 rounded-xl font-bold border border-blue-500/30">🥈 Scholar</span> : <span className="text-slate-500 italic bg-slate-900/50 px-4 py-2 rounded-xl border border-dashed border-slate-600">🔒 Reach Lvl 5</span>}

                {stats.level >= 10 ? (
                <span className="bg-purple-500/10 text-purple-300 px-6 py-3 rounded-xl font-bold border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  👑 Grand Master
                </span>
              ) : (
                <span className="text-slate-500 italic bg-slate-900/50 px-4 py-2 rounded-xl border border-dashed border-slate-600">
                  🔒 Reach Lvl 10
                </span>
              )}
              </div>
              <div className="mt-auto pt-8 border-t border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest">Recent Performance</h3>
                <div className="flex items-center gap-6">
                  {/* REAL ACCURACY DISPLAY */}
                  <div className="text-6xl font-black text-white tracking-tighter drop-shadow-md">
                    {stats.accuracy !== "--" ? `${stats.accuracy}%` : "--%"}
                  </div>
                  <div className="text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full text-md flex items-center gap-2">📈 Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}