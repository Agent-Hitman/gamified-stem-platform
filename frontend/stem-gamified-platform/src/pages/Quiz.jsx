import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; 

// HELPER: Normalizes text (removes spaces/case)
const normalizeText = (text) => {
  if (!text) return "";
  // Handle case where answer is a number
  const str = String(text);
  const txt = document.createElement('textarea');
  txt.innerHTML = str; 
  return txt.value.trim().toLowerCase();
};

// HELPER: Smart Answer Checker (Handles "A" vs "Option Text")
const isAnswerCorrect = (userAns, correctAns, allOptions) => {
    const u = normalizeText(userAns);
    const c = normalizeText(correctAns);

    // 1. Direct Match (Text == Text)
    if (u === c) return true;

    // 2. Letter Match (AI sent "A", "B", "C", or "D")
    const letterIndex = ["a", "b", "c", "d"].indexOf(c);
    if (letterIndex !== -1 && allOptions[letterIndex]) {
        const optionText = normalizeText(allOptions[letterIndex]);
        return u === optionText;
    }

    return false;
};

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser(); 
  
  const { topic, difficulty } = location.state || { topic: "Science", difficulty: "Easy" };

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); 
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0); 

  // DEFINE XP
  const xpPerQuestion = difficulty === "Hard" ? 80 : difficulty === "Medium" ? 50 : 30;

  // 1. FETCH
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user) return; 
      setLoading(true);
      // RESET STATE for "Play Again"
      setCurrentQ(0);
      setUserAnswers({});
      setShowResult(false);
      setFinalScore(0);

      try {
        const res = await fetch("http://127.0.0.1:8000/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, difficulty, userId: user.id })
        });

        if (!res.ok) throw new Error("AI Failed");
        const data = await res.json();
        setQuestions(data);
        
        let timePerQuestion = 60; 
        if (difficulty === "Medium") timePerQuestion = 150;
        if (difficulty === "Hard") timePerQuestion = 270;
        setTotalTime(data.length * timePerQuestion);

      } catch (err) {
        console.error("Fallback", err);
        setQuestions([{
            id: 0, question: "Simulation Error. Reload?", options: ["Reload"], correctAnswer: "Reload"
        }]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [topic, difficulty, user]); // Re-runs if these change (or on mount)

  // 2. TIMER
  useEffect(() => {
    if (totalTime > 0 && !showResult && !loading) {
      const interval = setInterval(() => {
        setTotalTime((prev) => {
          if (prev <= 1) {
            handleSubmit(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [totalTime, showResult, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionSelect = (option) => {
    setUserAnswers({ ...userAnswers, [currentQ]: option });
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };
  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  // 3. SUBMIT (UPDATED TO SEND HISTORY)
  const handleSubmit = async () => {
    let calculatedScore = 0;
    const historyLog = [];

    questions.forEach((q, index) => {
      const userChoice = userAnswers[index];
      
      // USE SMART MATCHER
      const isCorrect = isAnswerCorrect(userChoice, q.correctAnswer, q.options);
      
      if (isCorrect) {
        calculatedScore += xpPerQuestion;
      }

      historyLog.push({
        question: q.question,
        userAnswer: userChoice || "Skipped", // Handle empty answers
        correctAnswer: q.correctAnswer,
        isCorrect: isCorrect,
        topic: topic
      });
    });

    setFinalScore(calculatedScore);
    setShowResult(true);

    // Optional: Keep local storage backup
    const existingData = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    localStorage.setItem('quizHistory', JSON.stringify([...existingData, ...historyLog]));

    // --- SEND DETAILED DATA TO BACKEND ---
    if (user) {
        await fetch('http://127.0.0.1:8000/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                username: user.fullName || user.firstName,
                email: user.primaryEmailAddress?.emailAddress,
                score: calculatedScore, 
                topic: topic,
                difficulty: difficulty, // Send difficulty
                details: historyLog // <--- CRITICAL: Sending Q&A analysis
            }),
        });
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Mission Data...</div>;

  if (showResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-10 rounded-[2rem] border border-slate-700 text-center max-w-lg w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

          <div className="text-7xl mb-6 drop-shadow-lg">🏆</div>
          <h2 className="text-4xl font-extrabold text-white mb-2">Mission Complete!</h2>
          <p className="text-slate-400 mb-8">Great job, Explorer.</p>
          
          <div className="bg-slate-900/80 p-6 rounded-2xl mb-8 border border-slate-700 backdrop-blur-sm">
             <p className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-2">Total XP Earned</p>
             <p className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">+{finalScore}</p>
          </div>
          
          <button onClick={() => navigate('/dashboard')} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold transition text-lg shadow-lg transform hover:-translate-y-1">Return to Base</button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans flex flex-col items-center justify-center">
      
      {/* HEADER */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg text-slate-200">{topic}</h2>
          <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {difficulty}
          </span>
        </div>
        <div className="text-right flex items-center gap-3">
           <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Time Remaining</div>
           <div className={`text-xl font-mono font-bold ${totalTime < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
             {formatTime(totalTime)}
           </div>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="w-full max-w-3xl relative">
        <div className="flex justify-between items-end mb-4 px-2">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Question <span className="text-white text-lg">{currentQ + 1}</span> <span className="text-slate-600">/ {questions.length}</span>
            </div>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden border border-slate-700/50">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500 ease-out" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
        </div>

        <div className="bg-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

          <h2 className="text-2xl md:text-3xl font-bold mb-10 leading-snug text-white relative z-10">
            {q.question}
            <span className="float-right ml-4 mt-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-lg text-sm font-bold inline-flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                ⚡ {xpPerQuestion} XP
            </span>
          </h2>
          
          <div className="grid gap-4 relative z-10">
            {q.options.map((opt, i) => {
                const isSelected = userAnswers[currentQ] === opt;
                
                let btnClass = "bg-slate-900/50 border-slate-700 hover:bg-slate-700 hover:border-indigo-400 text-slate-300"; 
                if (isSelected) {
                    btnClass = "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]";
                }

                return (
                  <button 
                    key={i}
                    onClick={() => handleOptionSelect(opt)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 font-medium flex items-center gap-5 group ${btnClass}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shrink-0 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                      {["A","B","C","D"][i]}
                    </div>
                    <span className="text-lg">{opt}</span>
                  </button>
                )
            })}
          </div>

          <div className="flex justify-between mt-12 pt-8 border-t border-slate-700/50">
             <button 
                onClick={handlePrev} 
                disabled={currentQ === 0}
                className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${currentQ === 0 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
             >
                ← Previous
             </button>

             {isLastQuestion ? (
                <button 
                    onClick={handleSubmit}
                    className="px-10 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-400 text-green-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] transform hover:-translate-y-1 transition-all"
                >
                    Submit Mission 🚀
                </button>
             ) : (
                <button 
                    onClick={handleNext}
                    className="px-8 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transform hover:-translate-y-1 transition-all"
                >
                    Next →
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}