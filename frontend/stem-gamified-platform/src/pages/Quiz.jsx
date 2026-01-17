import { useState } from "react";
import { questions } from "../data/questions";
import { calculateXP, getLevel, getBadges } from "../utils/gamification";
import { useNavigate } from "react-router-dom";


export default function Quiz() {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState("");
  const [badges, setBadges] = useState([]);
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  const q = questions[current];

  const selectAnswer = (option) => {
  let newScore = score;

  if (option === q.correct) {
    newScore += 10;
    setScore(newScore);
  }

  if (current + 1 < questions.length) {
    setCurrent(current + 1);
  } else {
    const earnedXP = calculateXP(newScore);
    setXP(earnedXP);
    setLevel(getLevel(earnedXP));
    setBadges(getBadges(newScore));
    localStorage.setItem("quizScore", newScore);
    navigate("/analytics");

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
