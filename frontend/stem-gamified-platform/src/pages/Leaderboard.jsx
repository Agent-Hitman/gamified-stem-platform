export default function Leaderboard() {
  // Temporary mock users (later backend will replace this)
  const users = [
    { name: "You", xp: Number(localStorage.getItem("quizXP")) || 0 },
    { name: "Student A", xp: 120 },
    { name: "Student B", xp: 80 },
    { name: "Student C", xp: 40 },
  ];

  // Sort by XP descending
  const sorted = [...users].sort((a, b) => b.xp - a.xp);

  return (
    <div>
      <h2>Leaderboard</h2>

      <ol>
        {sorted.map((user, index) => (
          <li key={index}>
            {user.name} — {user.xp} XP
          </li>
        ))}
      </ol>
    </div>
  );
}
