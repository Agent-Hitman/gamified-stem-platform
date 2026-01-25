import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";

export default function QuizHistory() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (user) {
      fetch(`http://127.0.0.1:8000/api/history/${user.id}`)
        .then(res => res.json())
        .then(data => {
            setHistory(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }
  }, [user]);

  // Group Quizzes by Topic
  const groupedHistory = history.reduce((acc, quiz) => {
    const topic = quiz.topic || "General";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(quiz);
    return acc;
  }, {});

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Archives...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mission Archives</h1>
            <p className="text-slate-400">Review your past performance and analysis.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white">← Back</button>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6">
        {Object.keys(groupedHistory).length === 0 ? (
            <div className="bg-slate-800 p-10 rounded-2xl text-center text-slate-500">
                No quizzes taken yet. Go start a mission!
            </div>
        ) : (
            Object.keys(groupedHistory).map((topic) => (
                <div key={topic} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    
                    {/* TOPIC HEADER */}
                    <button 
                        onClick={() => setExpandedTopic(expandedTopic === topic ? null : topic)}
                        className="w-full flex justify-between items-center p-6 hover:bg-slate-700/50 transition"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">📚</span>
                            <h2 className="text-xl font-bold text-white">{topic}</h2>
                            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full font-bold">
                                {groupedHistory[topic].length} Quizzes
                            </span>
                        </div>
                        <span className="text-slate-500">{expandedTopic === topic ? "▲" : "▼"}</span>
                    </button>

                    {/* QUIZ LIST (Visible if Topic Expanded) */}
                    {expandedTopic === topic && (
                        <div className="bg-slate-900/50 p-4 space-y-3 border-t border-slate-700">
                            {groupedHistory[topic].map((quiz, idx) => (
                                <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase mr-2 ${quiz.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {quiz.difficulty || 'Medium'}
                                            </span>
                                            <span className="text-slate-400 text-sm">{new Date(quiz.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div className="font-mono font-bold text-yellow-400">+{quiz.score} XP</div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setSelectedQuiz(selectedQuiz === quiz ? null : quiz)}
                                        className="w-full text-left text-sm text-indigo-400 hover:text-indigo-300 font-bold"
                                    >
                                        {selectedQuiz === quiz ? "Hide Analysis" : "View Analysis 🔍"}
                                    </button>

                                    {/* DETAILED ANALYSIS (Visible if Quiz Selected) */}
                                    {selectedQuiz === quiz && (
                                        <div className="mt-4 space-y-4">
                                            {quiz.details && quiz.details.map((q, i) => (
                                                <div key={i} className={`p-4 rounded-lg border ${q.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                    <p className="font-bold text-slate-200 mb-2">Q{i+1}: {q.question}</p>
                                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                                        <div className={`${q.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                            Your Answer: {q.userAnswer}
                                                        </div>
                                                        <div className="text-green-400">
                                                            Correct Answer: {q.correctAnswer}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
}