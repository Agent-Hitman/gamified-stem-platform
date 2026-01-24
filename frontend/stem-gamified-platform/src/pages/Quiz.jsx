import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get settings from the Setup Page (or default if direct access)
  const { topic, difficulty } = location.state || { topic: "General Science", difficulty: "Easy" };

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // GLOBAL TIMER (Total seconds for the whole quiz)
  const [totalTime, setTotalTime] = useState(0); 
  const [history, setHistory] = useState([]);

  // 1. FETCH QUESTIONS
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, difficulty })
        });

        if (!res.ok) throw new Error("AI Failed");
        const data = await res.json();
        
        // Format Data
        const formatted = data.map((q, i) => ({
          ...q, 
          id: i,
          topic: topic, 
          difficulty: difficulty
        }));
        
        setQuestions(formatted);

        // 2. SET GLOBAL TIMER BASED ON DIFFICULTY
        // Easy = 1 min/q, Medium = 3 min/q, Hard = 5 min/q
let timePerQuestion = 60; // Default Easy: 1 min
        
        if (difficulty === "Medium") {
            timePerQuestion = 150; // Medium: 2 mins
        } else if (difficulty === "Hard") {
            timePerQuestion = 270; // Hard: 4 mins (middle of 3-5 range)
        }
        
        setTotalTime(formatted.length * timePerQuestion);

      } catch (err) {
        console.error("Using Fallback", err);
        // Fallback
        setQuestions([{
            id: 0, topic: topic, question: "Simulation Failed. Return to base?", 
            options: ["Yes", "No"], correctAnswer: "Yes", difficulty: "Easy"
        }]);
        setTotalTime(60);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [topic, difficulty]);x

  // 3. GLOBAL COUNTDOWN TIMER
  useEffect(() => {
    if (totalTime > 0 && !showResult && !loading) {
      const interval = setInterval(() => {
        setTotalTime((prev) => {
          if (prev <= 1) {
            finishQuiz(false); // Time's up!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [totalTime, showResult, loading]);

  // Format Seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAnswer = (selectedOption) => {
    const isCorrect = selectedOption === questions[currentQ].correctAnswer;
    
    // Save history (simplified time tracking since it's global now)
    const newHistory = [...history, {
      topic: topic,
      correct: isCorrect ? 1 : 0,
    }];
    setHistory(newHistory);

    if (isCorrect) setScore(score + (difficulty === "Hard" ? 500 : difficulty === "Medium" ? 300 : 100));

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishQuiz(isCorrect, newHistory);
    }
  };

  const finishQuiz = (lastCorrect, finalHistory = history) => {
    setShowResult(true);
    
    // Save to LocalStorage
    const existingData = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    // Add dummy history for the last question if not added yet
    const merged = [...existingData, ...finalHistory];
    localStorage.setItem('quizHistory', JSON.stringify(merged));
    
    // Save XP
    const currentXP = parseInt(localStorage.getItem('userXP') || '0');
    localStorage.setItem('userXP', (currentXP + score).toString());
  };

  // --- RENDERING ---

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl text-white font-mono">Generating Simulation: {topic}...</h2>
        <p className="text-slate-500 text-sm">Configuring Difficulty: {difficulty}</p>
      </div>
    </div>
  );

  if (showResult) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-white/10">
        <div className="text-6xl mb-6">🏁</div>
        <h2 className="text-4xl font-black mb-2">Mission Debrief</h2>
        <p className="text-slate-400 mb-8">Simulation Complete</p>
        
        <div className="bg-slate-900 p-6 rounded-2xl mb-8 border border-white/5">
          <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Total XP Earned</p>
          <p className="text-4xl font-bold text-yellow-400">{score}</p>
        </div>

        <button onClick={() => navigate('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold transition">
          Return to Base
        </button>
      </div>
    </div>
  );

  const q = questions[currentQ];
  if (!q) return <div className="text-white">Error</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans flex flex-col items-center">
      
      {/* TOP BAR */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-2xl border border-white/5">
        <div>
          <h2 className="font-bold text-lg">{topic}</h2>
          <span className={`text-xs px-2 py-0.5 rounded ${difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {difficulty} Protocol
          </span>
        </div>
        <div className={`text-2xl font-mono font-bold ${totalTime < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
          {formatTime(totalTime)}
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1 rounded-full mb-6">
          <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="flex justify-between text-slate-500 text-sm mb-6">
            <span>Question {currentQ + 1} / {questions.length}</span>
            <span>XP Potential: {difficulty === "Hard" ? "500" : "100"}</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-8">
            {q.question}
          </h3>

          <div className="grid gap-4">
            {q.options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => handleAnswer(opt)}
                className="text-left p-5 rounded-xl bg-slate-700/50 border border-white/5 hover:bg-indigo-600 hover:border-indigo-400 transition-all font-medium flex items-center gap-4 group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-white group-hover:text-indigo-600 flex items-center justify-center font-bold text-sm transition-colors">
                  {["A","B","C","D"][i]}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}