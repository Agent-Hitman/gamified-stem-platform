import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryParam = user ? `?current_user_id=${user.id}` : "";
    
    fetch(`https://stem-pulse.onrender.com/api/leaderboard${queryParam}`)
      .then(res => res.json())
      .then(data => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Leaderboard Error:", err);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold text-xl">Loading Rankings...</div>;

  const topPlayer = leaders.length > 0 ? leaders[0] : null;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col items-center py-10 px-4">
      
      {/* CHAMPION CARD */}
      {topPlayer && (
        <div className="w-full max-w-md bg-gradient-to-b from-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-center shadow-2xl mb-10 relative overflow-hidden border border-purple-400/30 transform hover:scale-105 transition-transform duration-300">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
           <div className="relative z-10">
             <div className="text-6xl mb-4 drop-shadow-md">👑</div>
             <div className="text-xs font-bold uppercase tracking-[0.3em] text-purple-200 mb-2">Current Champion</div>
             <h1 className="text-4xl font-black text-white mb-4 drop-shadow-sm">{topPlayer.name}</h1>
             <div className="inline-block bg-white/20 px-6 py-2 rounded-full backdrop-blur-md border border-white/30 font-mono font-bold text-lg shadow-inner">
               {topPlayer.xp} XP
             </div>
           </div>
        </div>
      )}

      {/* LEADERBOARD LIST */}
      <div className="w-full max-w-2xl space-y-4">
        {leaders.map((player, index) => {
            const isSeparator = index > 0 && (player.rank - leaders[index-1].rank > 1);

            return (
              <React.Fragment key={player.rank}>
                {isSeparator && (
                    <div className="text-center text-slate-500 py-2 font-bold tracking-widest text-xs">•••</div>
                )}

                <div 
                  className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group
                    ${player.isCurrentUser 
                        ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] transform scale-105 z-10' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-5">
                    {/* Rank Circle */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner
                        ${player.rank === 1 ? 'bg-yellow-400 text-yellow-900' : 
                          player.rank === 2 ? 'bg-slate-300 text-slate-900' : 
                          player.rank === 3 ? 'bg-orange-400 text-orange-900' : 
                          'bg-slate-700 text-slate-400'}
                    `}>
                      {player.rank}
                    </div>

                    <div>
                      <h3 className={`font-bold text-lg ${player.isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                        {player.name} {player.isCurrentUser && "(You)"}
                      </h3>
                      
                      {/* --- UPDATED: Shows Level instead of Explorer Badge --- */}
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">⚡</span> Level {player.level}
                      </div>
                    </div>
                  </div>

                  <div className="font-mono font-bold text-xl text-indigo-300">
                    {player.xp} <span className="text-sm text-slate-500">XP</span>
                  </div>
                </div>
              </React.Fragment>
            );
        })}
      </div>

      <div className="mt-12">
        <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-white font-bold transition flex items-center gap-2">
            ← Back to Dashboard
        </button>
      </div>

    </div>
  );
}