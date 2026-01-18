import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', grade: '10th' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save user to local storage so other pages can use it
    const userData = {
      name: formData.name,
      grade: formData.grade,
      level: 1,
      xp: 0,
      streak: 1,
      badges: []
    };
    localStorage.setItem('userProfile', JSON.stringify(userData));
    localStorage.setItem('userXP', '0'); // Reset XP for new user
    localStorage.setItem('quizHistory', '[]'); // Reset history
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-6xl">🚀</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">STEM Explorer</h1>
          <p className="text-gray-600 mt-2">Your journey to science mastery begins here.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-bold">Explorer Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Alex"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 text-sm font-bold">Current Grade</label>
            <select 
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
            >
              <option value="9th">9th Grade</option>
              <option value="10th">10th Grade</option>
              <option value="11th">11th Grade</option>
              <option value="12th">12th Grade</option>
              <option value="Undergrad">Undergrad</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02]"
          >
            Launch Mission ➜
          </button>
        </form>
      </div>
    </div>
  );
}