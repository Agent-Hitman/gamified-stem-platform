import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Analytics() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get("/analytics")
      .then((res) => setResults(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>Performance Analytics</h2>

        {results.length === 0 ? (
          <p>No quiz data available yet</p>
        ) : (
          <table width="100%" border="1" cellPadding="10">
            <thead>
              <tr>
                <th>User</th>
                <th>Topic</th>
                <th>Score</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, index) => (
                <tr key={index}>
                  <td>{r.user}</td>
                  <td>{r.topic}</td>
                  <td>{r.score}</td>
                  <td>{r.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

}
