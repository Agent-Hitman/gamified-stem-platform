import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    username: "",
    grade: "9th Grade",
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Fetch User Data on Load
  useEffect(() => {
    if (user) {
      // Set email immediately from Clerk (it's the source of truth)
      const email = user.primaryEmailAddress?.emailAddress || "";
      
      fetch(`https://stem-pulse.onrender.com/api/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
            setFormData({
                username: data.username || user.firstName || "Explorer",
                grade: data.grade || "9th Grade",
                email: email // Keep email from Clerk, display only
            });
            setLoading(false);
        })
        .catch(err => {
            console.error("Fetch error:", err);
            setLoading(false);
        });
    }
  }, [user]);

  // 2. Save Handler
  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch('https://stem-pulse.onrender.com/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: formData.username,
          grade: formData.grade
        })
      });

      if (res.ok) {
        setMessage("✅ Profile updated successfully!");
        // Optional: Redirect back after short delay
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setMessage("❌ Failed to update. Try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Connection error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans flex flex-col items-center justify-center">
      
      {/* CARD */}
      <div className="w-full max-w-lg bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl border border-slate-700 relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
           <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner">
             👤
           </div>
           <h1 className="text-3xl font-bold text-white">My Account</h1>
           <p className="text-slate-400">Update your explorer details</p>
        </div>

        <div className="space-y-6 relative z-10">
          
          {/* USERNAME */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
            />
          </div>

          {/* EMAIL (READ ONLY) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address (Locked)</label>
            <input 
              type="text" 
              value={formData.email}
              disabled
              className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-500 p-4 rounded-xl cursor-not-allowed font-medium select-none"
            />
          </div>

          {/* GRADE */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Grade / Level</label>
            <div className="relative">
                <select 
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-xl focus:outline-none focus:border-purple-500 appearance-none cursor-pointer font-medium"
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

          {/* STATUS MESSAGE */}
          {message && (
              <div className={`text-center text-sm font-bold p-3 rounded-lg ${message.includes("✅") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {message}
              </div>
          )}

          {/* ACTIONS */}
          <div className="pt-4 flex gap-4">
             <button 
               onClick={() => navigate('/dashboard')}
               className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition"
             >
               Cancel
             </button>
             <button 
               onClick={handleSave}
               disabled={saving}
               className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
             >
               {saving ? "Saving..." : "Save Changes"}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}