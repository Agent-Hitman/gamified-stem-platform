import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();

  // 1. STATE: Holds the dynamic profile data
  const [profile, setProfile] = useState({ 
    username: "Explorer", 
    grade: "9th Grade" 
  });

  // 2. EFFECT: Fetch the name from LocalStorage when the page loads
  useEffect(() => {
    const savedData = localStorage.getItem("userProfile");
    
    if (savedData) {
      setProfile(JSON.parse(savedData));
    } else if (user) {
      // Fallback to Clerk name if no profile found
      setProfile({ 
        username: user.firstName || "Explorer", 
        grade: "Unknown" 
      });
    }
  }, [user]);

  // Mock Data for the game stats (XP, Level, etc.)
  const gameStats = {
    level: 5,
    xp: 2450,
    nextLevelXp: 3000,
    streak: 12,
    accuracy: "85%"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- HEADER SECTION (Purple Style) --- */}
        <div className="bg-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-end">
            <div>
              {/* ✅ DYNAMIC NAME DISPLAYED HERE */}
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {profile.username}! 👋
              </h1>
              <p className="opacity-90 text-lg">
                You are on a <span className="font-bold text-yellow-300">{gameStats.streak} day streak!</span> Keep it up!
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-6xl font-black text-yellow-300 mb-1">{gameStats.level}</div>
              <div className="text-xs font-bold tracking-widest opacity-80 uppercase">Current Level</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
              <span>XP: {gameStats.xp}</span>
              <span>Next Level: {gameStats.nextLevelXp}</span>
            </div>
            <div className="w-full bg-purple-800 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-yellow-400 h-full rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
                style={{ width: `${(gameStats.xp / gameStats.nextLevelXp) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Decorative Background Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* LEFT: NEXT MISSION CARD */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🚀</span>
                <h2 className="text-2xl font-bold text-gray-800">Next Mission</h2>
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Your next challenge is waiting! Continue your journey in Physics to unlock the "Gravity Master" badge.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/quiz')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg transform hover:scale-[1.02]"
                >
                  🎮 Start Quiz
                </button>
                <button 
                  onClick={() => navigate('/career')}
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 rounded-xl transition shadow-lg transform hover:scale-[1.02]"
                >
                  🎯 Career Goal
                </button>
              </div>
              
              <button 
                onClick={() => navigate('/leaderboard')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                🏆 View Leaderboard
              </button>
            </div>
          </div>

          {/* RIGHT: TROPHY CASE CARD */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-bold text-gray-800">Your Trophy Case</h2>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {["🔬 Lab Rat", "🚀 Rocket Scientist", "➗ Math Whiz"].map((badge, idx) => (
                <span key={idx} className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-bold text-sm border border-yellow-200 shadow-sm">
                  {badge}
                </span>
              ))}
              <button className="px-4 py-2 rounded-lg font-bold text-sm text-gray-400 border-2 border-dashed border-gray-200 hover:border-gray-400 hover:text-gray-600 transition">
                + Unlock more
              </button>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Recent Performance</h3>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-black text-gray-800">{gameStats.accuracy}</div>
                <div className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-sm">
                  📈 High Accuracy
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}