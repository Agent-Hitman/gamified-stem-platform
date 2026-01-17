import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/leaderboard")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Sort by XP descending
  const sorted = [...users].sort((a, b) => b.xp - a.xp);

  return (
    <div>
      <h2>Leaderboard</h2>

      {sorted.length === 0 ? (
        <p>No leaderboard data yet</p>
      ) : (
        <ol>
          {sorted.map((user, index) => (
            <li key={index}>
              {user.user} — {user.xp} XP
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
