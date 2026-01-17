import json
from pathlib import Path
from typing import Dict, List, Tuple

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

class SkillProfilingAgent:
    def __init__(self):
        taxonomy = json.loads((DATA_DIR / "skill_taxonomy.json").read_text(encoding="utf-8"))
        self.dimensions: List[str] = taxonomy["dimensions"]
        self.topic_to_dim: Dict[str, str] = taxonomy["topic_to_dim"]

    def _safe_div(self, a: float, b: float) -> float:
        return a / b if b else 0.0

    def build_skill_vector(self, topic_perf: List[dict]) -> Tuple[Dict[str, float], Dict[str, Dict[str, float]]]:
        dim_scores = {d: 0.0 for d in self.dimensions}
        dim_weights = {d: 0.0 for d in self.dimensions}
        explain: Dict[str, Dict[str, float]] = {d: {} for d in self.dimensions}

        for row in topic_perf:
            topic = row["topic"]
            attempts = row["attempts"]
            correct = row["correct"]
            avg_time = row["avg_time_sec"]

            dim = self.topic_to_dim.get(topic, "logic")
            acc = self._safe_div(correct, attempts)
            time_factor = 1.0 / (1.0 + (avg_time / 60.0))
            score = 0.75 * acc + 0.25 * time_factor

            weight = max(1.0, attempts ** 0.5)
            dim_scores[dim] += score * weight
            dim_weights[dim] += weight
            explain[dim][topic] = round(score, 4)

        skill_vector = {}
        for d in self.dimensions:
            raw = self._safe_div(dim_scores[d], dim_weights[d])
            skill_vector[d] = round(max(0.0, min(1.0, raw)), 4)

        for d, topics in explain.items():
            if not topics:
                continue
            s = sum(topics.values()) or 1.0
            for t in list(topics.keys()):
                topics[t] = round(topics[t] / s, 4)

        return skill_vector, explain

    def summarize(self, skill_vector: Dict[str, float], k: int = 2):
        ordered = sorted(skill_vector.items(), key=lambda x: x[1])
        weak = [d for d, _ in ordered[:k]]
        strong = [d for d, _ in ordered[-k:]][::-1]
        return weak, strong
