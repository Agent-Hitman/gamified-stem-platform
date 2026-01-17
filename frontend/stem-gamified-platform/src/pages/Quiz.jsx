import { useState } from "react";
import { questions } from "../data/questions";
import { calculateXP, getLevel, getBadges } from "../utils/gamification";

export default function Quiz() {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState("");
  const [badges, setBadges] = useState([]);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  const q = questions[current];

  const selectAnswer = (option) => {
    if (option === q.correct) {
      setScore(score + 10);
    }

    else {
      const earnedXP = calculateXP(newScore);
      setXP(earnedXP);
      setLevel(getLevel(earnedXP));
      setBadges(getBadges(newScore));
    }


    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      alert(`Quiz finished! Score: ${score + (option === q.correct ? 10 : 0)}`);
    }
  };

  return (
    <div>
      <h2>{q.topic}</h2>
      <h3>{q.question}</h3>

      {q.options.map((opt) => (
        <button key={opt} onClick={() => selectAnswer(opt)}>
          {opt}
        </button>
      ))}

      <p>Score: {score}</p>
      <p>XP: {xp} | Level: {level} | Badges: {badges.join(", ")}</p>
    </div>
    
  );
}
