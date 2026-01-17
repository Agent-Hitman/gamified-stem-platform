import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        background: "#1e293b",
        padding: "16px",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", gap: "20px", color: "white" }}>
        <Link style={{ color: "white" }} to="/">Dashboard</Link>
        <Link style={{ color: "white" }} to="/quiz">Quiz</Link>
        <Link style={{ color: "white" }} to="/analytics">Analytics</Link>
        <Link style={{ color: "white" }} to="/leaderboard">Leaderboard</Link>
        <Link style={{ color: "white" }} to="/career">Career</Link>
      </div>
    </nav>
  );
}
