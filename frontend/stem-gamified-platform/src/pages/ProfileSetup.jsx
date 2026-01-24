// src/pages/ProfileSetup.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
  const { user } = useUser();
  const navigate = useNavigate();

  // State for the form
  const [formData, setFormData] = useState({
    username: "",
    email: "", 
    grade: "9th Grade"
  });

  // Load defaults from Clerk when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.firstName || "",
        email: user.primaryEmailAddress?.emailAddress || "", // Auto-fill Email
        grade: "9th Grade"
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Save to LocalStorage (so we can use it in the Quiz/Career agents)
    localStorage.setItem("userProfile", JSON.stringify(formData));
    
    // 2. (Optional) You can also send this to your MongoDB backend here if needed
    
    // 3. Navigate to the Quiz (or Dashboard)
    navigate("/quiz"); 
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-white">Setup Your Profile</h1>
          <p className="text-slate-400 text-sm mt-2">Complete your mission data to begin.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Username Field */}
          <div>
            <label className="block text-purple-400 font-bold text-sm mb-2">USERNAME</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="Enter your codename"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-purple-400 font-bold text-sm mb-2">EMAIL ADDRESS</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {/* Grade Dropdown */}
          <div>
            <label className="block text-purple-400 font-bold text-sm mb-2">CURRENT GRADE</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
              value={formData.grade}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
            >
              <option>8th Grade</option>
              <option>9th Grade</option>
              <option>10th Grade</option>
              <option>11th Grade</option>
              <option>12th Grade</option>
              <option>Undergraduate</option>
            </select>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all"
          >
            Start Mission ➔
          </button>
        </form>

      </div>
    </div>
  );
}