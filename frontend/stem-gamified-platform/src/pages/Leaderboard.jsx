import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const navigate = useNavigate();

  // Mock Data: In a real app, this comes from your database
  const leaders = [
    { rank: 1, name: "Sarah_Space", xp: 5200, badge: "🚀" },
    { rank: 2, name: "Quantum_Kai", xp: 4850, badge: "⚛️" },
    { rank: 3, name: "Alex (You)", xp: 2450, badge: "🔬" }, // Highlights the user
    { rank: 4, name: "Bio_Ben", xp: 2100, badge: "🧬" },
    { rank: 5, name: "Math_Minds", xp: 1950, badge: "➗" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8 font-sans">
      
      {/* Header */}
      <div className="max-w-4xl w-full text-center mb-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
          Global Leaderboard
        </h1>
        <p className="text-gray-500">Top explorers of the STEM universe</p>
      </div>

      {/* Leaderboard Card */}
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Top 3 Podium (Optional Visual) */}
        <div className="bg-gradient-to-b from-indigo-600 to-purple-700 p-8 pb-12 text-white text-center">
           <div className="text-6xl mb-4">👑</div>
           <h2 className="text-2xl font-bold">Current Champion</h2>
           <p className="opacity-80 text-lg">{leaders[0].name}</p>
           <div className="mt-2 inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold">
             {leaders[0].xp} XP
           </div>
        </div>

        {/* List */}
        <div className="p-6 -mt-6 bg-white rounded-t-3xl relative">
          {leaders.map((user) => (
            <div 
              key={user.rank}
              className={`flex items-center justify-between p-4 mb-3 rounded-xl transition-transform hover:scale-[1.02] ${
                user.name.includes("(You)") 
                  ? "bg-yellow-50 border border-yellow-200 shadow-sm" 
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                  user.rank === 1 ? "bg-yellow-100 text-yellow-700" : 
                  user.rank === 2 ? "bg-gray-200 text-gray-700" :
                  user.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-white border text-gray-500"
                }`}>
                  #{user.rank}
                </div>
                <div>
                  <h3 className={`font-bold ${user.name.includes("(You)") ? "text-indigo-900" : "text-gray-700"}`}>
                    {user.name}
                  </h3>
                  <span className="text-xs text-gray-400">{user.badge} Explorer</span>
                </div>
              </div>
              <div className="font-mono font-bold text-indigo-600">
                {user.xp} XP
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => navigate('/dashboard')}
        className="mt-8 text-gray-400 hover:text-gray-600 underline"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}