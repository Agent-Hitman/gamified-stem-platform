import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignOutButton } from "@clerk/clerk-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [stats, setStats] = useState({
    username: "Explorer",
    level: 1,
    total_xp: 0,
    streak: 1,
    max_streak: 1, // <--- NEW STATE
    grade: "9th Grade",
    email: ""
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", grade: "" });

  // --- EFFECT: LOAD DATA & CHECK STREAK ---
  useEffect(() => {
    if (user) {
      // 1. Trigger Daily Login Check (Updates Backend)
      fetch('http://127.0.0.1:8000/api/daily-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      .then(res => res.json())
      .then(streakData => {
          // 2. Fetch Full User Stats (Read Updated Data)
          return fetch(`http://127.0.0.1:8000/api/user/${user.id}`);
      })
      .then(res => res.json())
      .then(data => {
          setStats({
              username: data.username || user.firstName,
              level: data.level || 1,
              total_xp: data.total_xp || 0,
              streak: data.streak || 1,
              max_streak: data.max_streak || 1, // <--- READ MAX STREAK
              grade: data.grade || "9th Grade",
              email: data.email || user.primaryEmailAddress?.emailAddress 
          });
      })
      .catch(err => console.error("Error fetching stats:", err));
    }
  }, [user]);

  // --- LEVEL MATH ---
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

  const progressData = calculateLevelProgress(stats.total_xp);

  // --- HANDLERS ---
  const handleEditClick = () => {
    setEditForm({ username: stats.username, grade: stats.grade });
    setIsEditModalOpen(true);
  };
  const handleSaveProfile = () => {
    setStats({ ...stats, ...editForm });
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
            StemPulse ⚡
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleEditClick} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 font-medium transition group">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">👤</div>
              <span className="hidden md:block">My Account</span>
            </button>
            <SignOutButton>
              <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2 rounded-full font-bold text-sm transition border border-red-100">Log Out</button>
            </SignOutButton>
          </div>
        </div>
      </nav>

      {/* DASHBOARD CONTENT */}
      <div className="p-10 flex justify-center">
        <div className="w-full max-w-7xl space-y-10">
          
          {/* HEADER SECTION */}
          <div className="bg-purple-600 rounded-[2rem] p-12 text-white shadow-2xl relative overflow-hidden mt-6">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
                  Welcome back, {stats.username}! 👋
                </h1>
                
                {/* --- STREAK UI --- */}
                <div className="flex gap-4 mt-2">
                  <p className="opacity-90 text-xl font-medium">
                    You are on a <span className="font-bold text-yellow-300 border-b-2 border-yellow-300 pb-1">{stats.streak} day streak!</span> 🔥
                  </p>
                  
                  {/* NEW MAX STREAK BADGE */}
                  <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/20 text-sm font-bold flex items-center gap-2">
                    <span>🏆 Max Streak: {stats.max_streak}</span>
                  </div>
                </div>

              </div>
              <div className="text-right">
                <div className="text-7xl font-black text-yellow-300 leading-none">{stats.level}</div>
                <div className="text-sm font-bold tracking-[0.2em] opacity-80 uppercase mt-2">Current Level</div>
              </div>
            </div>

            {/* XP PROGRESS BAR */}
            <div className="mt-10 relative z-10">
              {stats.level >= 10 ? (
                 <div className="flex justify-between text-sm font-bold mb-3 opacity-90 tracking-wide items-center">
                    <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-lg shadow-sm">👑 MAX LEVEL REACHED</span>
                    <span className="text-xl">Total XP: {stats.total_xp}</span>
                 </div>
              ) : (
                 <div className="flex justify-between text-sm font-bold mb-3 opacity-90 tracking-wide">
                    <span>Level Progress: {progressData.currentLevelXp} / {progressData.requiredXp} XP</span>
                    <span>Total XP: {stats.total_xp}</span>
                 </div>
              )}
              <div className="w-full bg-purple-900/40 rounded-full h-6 overflow-hidden backdrop-blur-sm border border-purple-500/30">
                <div 
                  className={`h-full rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] transition-all duration-1000 ${stats.level >= 10 ? 'bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300' : 'bg-gradient-to-r from-yellow-300 to-yellow-500'}`}
                  style={{ width: `${stats.level >= 10 ? 100 : progressData.percent}%` }} 
                ></div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-20 -mt-20 pointer-events-none blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-10 -mb-10 pointer-events-none blur-2xl"></div>
          </div>

          {/* CARDS GRID */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* NEXT MISSION */}
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-4xl bg-purple-100 p-3 rounded-2xl">🚀</span>
                  <h2 className="text-3xl font-bold text-gray-800">Next Mission</h2>
                </div>
                {stats.level >= 10 ? (
                    <p className="text-gray-600 mb-10 leading-relaxed text-xl">
                      You are a <span className="font-bold text-purple-600">Grand Master!</span> Keep practicing to maintain your leaderboard position!
                    </p>
                ) : (
                    <p className="text-gray-600 mb-10 leading-relaxed text-xl">
                      Ready to level up? Complete the next quiz to earn XP and reach <span className="font-bold text-purple-600">Level {stats.level + 1}</span>!
                    </p>
                )}
              </div>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <button onClick={() => navigate('/quiz')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-5 rounded-2xl transition shadow-lg shadow-indigo-200 transform hover:-translate-y-1">🎮 Start Quiz</button>
                  <button onClick={() => navigate('/career')} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-lg font-bold py-5 rounded-2xl transition shadow-lg shadow-fuchsia-200 transform hover:-translate-y-1">🎯 Career Goal</button>
                </div>
                <button onClick={() => navigate('/leaderboard')} className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg font-bold py-4 rounded-2xl transition shadow-lg shadow-yellow-200 transform hover:-translate-y-1 flex items-center justify-center gap-3">🏆 View Global Leaderboard</button>
              </div>
            </div>

            {/* TROPHY CASE */}
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow duration-300">
               <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl bg-yellow-100 p-3 rounded-2xl">🏆</span>
                <h2 className="text-3xl font-bold text-gray-800">Your Trophy Case</h2>
              </div>
              <div className="flex flex-wrap gap-4 mb-10">
                {stats.level >= 2 ? <span className="bg-yellow-50 text-yellow-700 px-6 py-3 rounded-xl font-bold border-2 border-yellow-100">🥉 Rookie</span> : <span className="text-gray-400 italic bg-gray-100 px-4 py-2 rounded-xl border border-dashed border-gray-300">🔒 Reach Lvl 2</span>}
                {stats.level >= 5 ? <span className="bg-blue-50 text-blue-700 px-6 py-3 rounded-xl font-bold border-2 border-blue-100">🥈 Scholar</span> : <span className="text-gray-400 italic bg-gray-100 px-4 py-2 rounded-xl border border-dashed border-gray-300">🔒 Reach Lvl 5</span>}
                {stats.level >= 10 ? <span className="bg-purple-50 text-purple-700 px-6 py-3 rounded-xl font-bold border-2 border-purple-100 shadow-md">👑 Grand Master</span> : <span className="text-gray-400 italic bg-gray-100 px-4 py-2 rounded-xl border border-dashed border-gray-300">🔒 Reach Lvl 10</span>}
              </div>
              <div className="mt-auto pt-8 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Recent Performance</h3>
                <div className="flex items-center gap-6">
                  <div className="text-6xl font-black text-gray-800 tracking-tighter">--%</div>
                  <div className="text-green-600 font-bold bg-green-100 px-4 py-2 rounded-full text-md flex items-center gap-2">📈 Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4 relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Username</label><input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-purple-500" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Email (Locked)</label><input type="text" value={stats.email || "Loading..."} disabled className="w-full bg-gray-100 border border-gray-300 p-3 rounded-xl text-gray-500 cursor-not-allowed" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Grade</label><select value={editForm.grade} onChange={(e) => setEditForm({...editForm, grade: e.target.value})} className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-purple-500"><option>8th Grade</option><option>9th Grade</option><option>10th Grade</option><option>11th Grade</option><option>12th Grade</option><option>Undergraduate</option></select></div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">Cancel</button>
              <button onClick={handleSaveProfile} className="flex-1 py-3 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}