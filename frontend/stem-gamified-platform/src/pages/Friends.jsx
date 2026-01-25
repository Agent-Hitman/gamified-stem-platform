import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";

export default function Friends() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedFriend, setExpandedFriend] = useState(null); // Track clicked friend

  // 1. Load Friends List
  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = () => {
    fetch(`https://stem-pulse.onrender.com/api/friends/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setFriends(data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  // 2. Handle Search
  useEffect(() => {
    const timer = setTimeout(() => {
        if (query.length > 0) {
            setIsSearching(true);
            fetch(`https://stem-pulse.onrender.com/api/search-users?q=${query}`)
                .then(res => res.json())
                .then(data => {
                    const filtered = data.filter(u => u.userId !== user.id && !friends.some(f => f.userId === u.userId));
                    setSearchResults(filtered);
                    setIsSearching(false);
                });
        } else {
            setSearchResults([]);
        }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, user, friends]);

  // 3. Add Friend
  const handleAddFriend = async (friendId) => {
    try {
        const res = await fetch('https://stem-pulse.onrender.com/api/add-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, friendId: friendId })
        });
        if (res.ok) {
            setQuery(""); 
            setSearchResults([]);
            fetchFriends(); 
        }
    } catch (err) {
        console.error("Failed to add friend", err);
    }
  };

  // 4. Remove Friend
  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
        const res = await fetch('https://stem-pulse.onrender.com/api/remove-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, friendId: friendId })
        });
        if (res.ok) {
            setExpandedFriend(null); // Close dropdown
            fetchFriends(); // Refresh list
        }
    } catch (err) {
        console.error("Failed to remove friend", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Network...</div>;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col items-center py-10 px-4">
      
      {/* HEADER */}
      <div className="max-w-2xl w-full flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">Your Network</h1>
            <p className="text-slate-400">Add friends and compare progress.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition">← Back</button>
      </div>

      {/* SEARCH BAR SECTION */}
      <div className="w-full max-w-2xl relative mb-10 z-50">
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for explorers by username..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 pl-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none transition shadow-lg text-lg"
            />
        </div>

        {/* SEARCH RESULTS */}
        {query.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                {isSearching ? (
                    <div className="p-4 text-center text-slate-500 font-bold">Searching...</div>
                ) : searchResults.length > 0 ? (
                    searchResults.map((u) => (
                        <div key={u.userId} className="flex justify-between items-center p-4 hover:bg-slate-700 transition border-b border-slate-700/50 last:border-0">
                            <div>
                                <p className="font-bold text-white text-lg">{u.username}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level {u.level || 1}</p>
                            </div>
                            <button 
                                onClick={() => handleAddFriend(u.userId)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-purple-900/20"
                            >
                                Add +
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-slate-500 font-bold">No explorer found with that name.</div>
                )}
            </div>
        )}
      </div>

      {/* FRIENDS LIST BLOCK */}
      <div className="w-full max-w-2xl">
        <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 pl-2">My Friends List</h2>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-2 space-y-2">
            {friends.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p className="text-xl mb-2">📭</p>
                    <p className="font-medium">Your list is empty.</p>
                    <p className="text-sm opacity-70">Search above to add your first connection!</p>
                </div>
            ) : (
                friends.map((friend) => (
                  <div key={friend.userId} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden transition-all duration-200">
                      {/* MAIN CARD (CLICKABLE) */}
                      <div 
                        onClick={() => setExpandedFriend(expandedFriend === friend.userId ? null : friend.userId)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-750 transition"
                      >
                          <div className="flex items-center gap-5">
                            {/* Rank Circle */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-inner shrink-0
                                ${friend.rank === 1 ? 'bg-yellow-400 text-yellow-900' : 
                                  friend.rank === 2 ? 'bg-slate-300 text-slate-900' : 
                                  friend.rank === 3 ? 'bg-orange-400 text-orange-900' : 
                                  'bg-slate-700 text-slate-400'}
                            `}>
                              #{friend.rank}
                            </div>

                            <div>
                              <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">{friend.name}</h3>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                <span className="text-yellow-500">⚡</span> Level {friend.level}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="font-mono font-bold text-xl text-indigo-300">
                                {friend.xp} <span className="text-sm text-slate-500">XP</span>
                            </div>
                            <span className="text-slate-500 text-sm transform transition-transform duration-200" style={{ transform: expandedFriend === friend.userId ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                ▼
                            </span>
                          </div>
                      </div>

                      {/* EXPANDED OPTIONS (REMOVE BUTTON) */}
                      {expandedFriend === friend.userId && (
                          <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex justify-end">
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent clicking the card again
                                    handleRemoveFriend(friend.userId);
                                }}
                                className="text-red-400 hover:text-white hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-bold transition border border-red-500/20"
                              >
                                🗑️ Remove Friend
                              </button>
                          </div>
                      )}
                  </div>
                ))
            )}
        </div>
      </div>

    </div>
  );
}