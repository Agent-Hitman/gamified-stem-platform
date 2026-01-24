import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Career from './pages/Career';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import QuizSetup from './pages/QuizSetup'; // Import the new page


function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Default Route: Redirect to Login if accessed directly */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/career" element={<Career />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/quiz-setup" element={<QuizSetup />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;