import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock User Data (In the future, this will come from your backend)
  const userData = {
    name: "Alex",
    level: 5,
    xp: 2450,
    nextLevelXp: 3000,
    streak: 12,
    badges: ["🔬 Lab Rat", "🚀 Rocket Scientist", "➗ Math Whiz"],
    recentScore: "85%"
  };

  const progressPercentage = (userData.xp / userData.nextLevelXp) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Header Section with Gamified Profile */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {userData.name}! 👋</h1>
              <p className="text-indigo-100 text-lg">You are on a <span className="font-bold text-yellow-300">{userData.streak} day streak!</span> Keep it up!</p>
            </div>
            <div className="mt-6 md:mt-0 text-center">
              <div className="text-6xl font-black text-yellow-400">{userData.level}</div>
              <div className="text-sm uppercase tracking-wider font-semibold opacity-80">Current Level</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm font-medium mb-1">
              <span>XP: {userData.xp}</span>
              <span>Next Level: {userData.nextLevelXp}</span>
            </div>
            <div className="w-full bg-indigo-900/50 rounded-full h-4 backdrop-blur-sm">
              <div 
                className="bg-yellow-400 h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* 2. Main Actions Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Next Mission</h2>
            <p className="text-gray-600 mb-6">Your next challenge is waiting! Continue your journey in Physics to unlock the "Gravity Master" badge.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/quiz')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
              >
                🎮 Start Quiz
              </button>
              <button 
                onClick={() => navigate('/career')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
              >
                🎯 Career Goal
              </button>

              <button 
  onClick={() => navigate('/leaderboard')}
  className="bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
>
  🏆 Leaderboard
</button>
            </div>
          </div>

          {/* 3. Badges & Achievements */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 Your Trophy Case</h2>
            <div className="flex flex-wrap gap-3">
              {userData.badges.map((badge, index) => (
                <span key={index} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold border border-yellow-200 shadow-sm">
                  {badge}
                </span>
              ))}
              <span className="border-2 border-dashed border-gray-300 text-gray-400 px-4 py-2 rounded-full font-semibold">
                + Unlock more
              </span>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-gray-700">Recent Performance</h3>
              <div className="mt-2 flex items-center text-green-600 font-bold text-xl">
                📈 {userData.recentScore} Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}