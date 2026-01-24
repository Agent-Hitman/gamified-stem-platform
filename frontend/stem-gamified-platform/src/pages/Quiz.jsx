import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; 
import he from 'he'; 

// Safety Helper: Decodes HTML like "Don&039;t" -> "Don't"
const decodeHTML = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser(); 
  
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
        // Easy = 1 min/q, Medium = 2.5 min/q, Hard = 4.5 min/q
        let timePerQuestion = 60; // Default Easy: 1 min
        
        if (difficulty === "Medium") {
            timePerQuestion = 150; // Medium: 2.5 mins
        } else if (difficulty === "Hard") {
            timePerQuestion = 270; // Hard: 4.5 mins
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
  }, [topic, difficulty]);

  // 3. GLOBAL COUNTDOWN TIMER
  useEffect(() => {
    if (totalTime > 0 && !showResult && !loading) {
      const interval = setInterval(() => {
        setTotalTime((prev) => {
          if (prev <= 1) {
            // Calculate current score to pass to finishQuiz
            // Note: If time runs out, we strictly pass the current score state
            finishQuiz(score, history); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [totalTime, showResult, loading, score, history]);

  // Format Seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAnswer = (selectedOption) => {
    const isCorrect = selectedOption === questions[currentQ].correctAnswer;
    
    // Save history
    const newHistory = [...history, {
      topic: topic,
      correct: isCorrect ? 1 : 0,
    }];
    setHistory(newHistory);

    // Calculate points for this specific question
    const points = isCorrect ? (difficulty === "Hard" ? 500 : difficulty === "Medium" ? 300 : 100) : 0;
    const newScore = score + points;
    
    setScore(newScore);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishQuiz(newScore, newHistory);
    }
  };

  const finishQuiz = async (finalScore, finalHistory) => {
    setShowResult(true);
    
    // --- 3. SAVE TO LOCAL STORAGE ---
    const existingData = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const merged = [...existingData, ...finalHistory];
    localStorage.setItem('quizHistory', JSON.stringify(merged));
    
    const currentXP = parseInt(localStorage.getItem('userXP') || '0');
    localStorage.setItem('userXP', (currentXP + finalScore).toString());

    // --- 4. SEND TO MONGODB (BACKEND) ---
    if (user) {
        try {
            console.log("🚀 Sending score to backend...");
            await fetch('http://127.0.0.1:8000/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    username: user.fullName || user.firstName,
                    email: user.primaryEmailAddress?.emailAddress,
                    score: finalScore,
                    topic: questions[0]?.topic || "General"
                }),
            });
            console.log("✅ Score saved to MongoDB!");
        } catch (error) {
            console.error("❌ Error saving score to backend:", error);
        }
    }
  };

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-4 text-xl">Loading Mission Data...</span>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 text-center max-w-md w-full shadow-2xl">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-slate-400 mb-6">You earned <span className="text-yellow-400 font-bold">{score} XP</span></p>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/career')}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition"
            >
              See Career Impact 🚀
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold mb-8 leading-relaxed">
            {decodeHTML(q.question)}
          </h2>
          
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