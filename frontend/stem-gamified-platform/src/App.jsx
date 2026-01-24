import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Career from './pages/Career';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import ProfileSetup from './pages/ProfileSetup';

function App() {
  return (
    // ❌ REMOVED: <div className="min-h-screen bg-slate-900">
    // ❌ REMOVED: <div className="container mx-auto">
    
    // ✅ NEW: Just the Routes. 
    // This lets "ProfileSetup" take up the full screen with its own white background.
    <Routes>
        <Route path="/" element={<ProfileSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/career" element={<Career />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

export default App;