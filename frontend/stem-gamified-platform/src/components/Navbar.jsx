import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
      <Link to="/">Dashboard</Link>
      <Link to="/quiz">Quiz</Link>
      <Link to="/analytics">Analytics</Link>
      <Link to="/leaderboard">Leaderboard</Link>
      <Link to="/career">Career</Link>
    </nav>
  );
}
