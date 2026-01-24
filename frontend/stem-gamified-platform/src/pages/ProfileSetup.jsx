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
        email: user.primaryEmailAddress?.emailAddress || "",
        grade: "9th Grade"
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save profile to LocalStorage
    localStorage.setItem("userProfile", JSON.stringify(formData));
    
    // Redirect to Dashboard
    navigate("/dashboard"); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-gray-900">STEM Explorer</h1>
          <p className="text-gray-500 text-sm mt-2">Your journey to science mastery begins here.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Username Field */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-2">Explorer Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              placeholder="e.g. Alex"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {/* Grade Dropdown */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-2">Current Grade</label>
            <select 
              className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
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

          {/* Submit Button - TEXT CHANGED HERE */}
          <button 
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            Proceed ➔
          </button>
        </form>

      </div>
    </div>
  );
}