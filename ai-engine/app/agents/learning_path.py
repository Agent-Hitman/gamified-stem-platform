import json
from pathlib import Path
from typing import Dict, List

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

class LearningPathAgent:
    def __init__(self):
        taxonomy = json.loads((DATA_DIR / "skill_taxonomy.json").read_text(encoding="utf-8"))
        self.topic_to_dim = taxonomy["topic_to_dim"]
        self.dim_to_topics = {}
        for topic, dim in self.topic_to_dim.items():
            self.dim_to_topics.setdefault(dim, []).append(topic)

    def suggest(self, skill_vector: Dict[str, float], weak_dimensions: List[str], target: float = 0.75, max_steps: int = 3):
        steps = []
        if not weak_dimensions:
            weak_dimensions = [d for d, _ in sorted(skill_vector.items(), key=lambda x: x[1])[:max_steps]]

        for dim in weak_dimensions[:max_steps]:
            current = float(skill_vector.get(dim, 0.0))
            topics = self.dim_to_topics.get(dim, [])[:4]
            steps.append({
                "dimension": dim,
                "target": target,
                "suggested_topics": topics,
                "reason": f"Your {dim} is {current:.2f}. Focus here to reach {target:.2f}."
            })
        return steps