import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Analytics from "./pages/Analytics";
import Career from "./pages/Career";
import Leaderboard from "./pages/Leaderboard";
import Navbar from "./components/Navbar";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/career" element={<Career />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
