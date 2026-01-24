import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Career from './pages/Career';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import ProfileSetup from './pages/ProfileSetup'; // <--- 1. Import the new page

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto">
        <Routes>
          {/* 2. CHANGE DEFAULT ROUTE: Show ProfileSetup first */}
          <Route path="/" element={<ProfileSetup />} />
          
          {/* 3. Your App Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/career" element={<Career />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* Note: You don't need /login here because Clerk handles it in main.jsx */}
        </Routes>
      </div>
    </div>
  );
}

export default App;