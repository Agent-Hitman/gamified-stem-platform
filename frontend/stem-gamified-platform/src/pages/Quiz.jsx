import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; // <--- 1. Import Clerk
import he from 'he'; 

// Safety Helper: Decodes HTML like "Don&039;t" -> "Don't"
const decodeHTML = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

export default function Quiz() {
  const navigate = useNavigate();
  const { user } = useUser(); // <--- 2. Get User Details
  
  const [questions, setQuestions] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(15); 
  const [history, setHistory] = useState([]);

  // FETCH QUESTIONS
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: "Quantum Physics", difficulty: "Medium" })
        });

        if (!res.ok) throw new Error("AI Failed");
        const data = await res.json();
        
        const formattedQuestions = data.map((q, index) => ({
          id: index,
          topic: q.topic || "Science",
          question: q.question, 
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty || "Medium"
        }));
        
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error("Failed to load questions, using backup...", err);
        setQuestions([
          {
            id: 1, topic: "Physics", question: "What is the speed of light?", 
            options: ["3x10^8 m/s", "Zero", "Infinite", "Sound speed"], 
            correctAnswer: "3x10^8 m/s"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // TIMER
  useEffect(() => {
    if (timer > 0 && !showResult && !loading && questions.length > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && !showResult && !loading) {
      handleNext(false);
    }
  }, [timer, showResult, loading, questions]);

  const handleAnswer = (selectedOption) => {
    if (!questions[currentQ]) return;
    const isCorrect = selectedOption === questions[currentQ].correctAnswer;
    handleNext(isCorrect);
  };

  const handleNext = (isCorrect) => {
    const currentQuestion = questions[currentQ];
    
    const record = {
      topic: currentQuestion.topic,
      attempts: 1,
      correct: isCorrect ? 1 : 0,
      avg_time_sec: 15 - timer
    };
    
    setHistory([...history, record]);
    
    // Calculate intermediate score (for state)
    let newScore = score;
    if (isCorrect) {
        newScore = score + 100;
        setScore(newScore);
    }

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setTimer(15);
    } else {
      finishQuiz(isCorrect, newScore); // Pass the final calculated score
    }
  };

  const finishQuiz = async (lastCorrect, finalScore) => {
    setShowResult(true);
    
    // --- 3. SAVE TO LOCAL STORAGE ---
    const existingData = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const currentQuestion = questions[currentQ];
    
    const newSessionData = [...history, {
        topic: currentQuestion.topic,
        attempts: 1,
        correct: lastCorrect ? 1 : 0,
        avg_time_sec: 15 - timer
    }];

    const merged = [...existingData, ...newSessionData];
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

  if (!q) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">No questions available.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      
      {/* Progress Bar */}
      <div className="w-full max-w-2xl bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-purple-500 h-full transition-all duration-300"
          style={{ width: `${((currentQ) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <span className="bg-slate-800 px-4 py-1 rounded-full text-sm font-mono text-slate-300">
            {q.topic ? q.topic.replace('_', ' ') : 'General'}
          </span>
          <div className={`flex items-center gap-2 font-bold ${timer < 5 ? 'text-red-500' : 'text-green-400'}`}>
            <span>⏱ {timer}s</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold mb-8 leading-relaxed">
            {/* Optional: Use your decodeHTML helper here if questions have weird symbols */}
            {decodeHTML(q.question)}
          </h2>
          
          <div className="grid gap-4">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="p-4 text-left rounded-xl bg-slate-700/50 hover:bg-indigo-600 border border-white/5 hover:border-indigo-400 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="bg-slate-800 group-hover:bg-indigo-500 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="font-medium">{decodeHTML(opt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-between text-slate-500 text-sm">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
      </div>
    </div>
  );
}