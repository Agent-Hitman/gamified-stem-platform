import json
from pathlib import Path
from typing import Dict, List, Tuple

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

class CareerMatchingAgent:
    def __init__(self):
        self.careers = json.loads((DATA_DIR / "careers.json").read_text(encoding="utf-8"))
        self.courses = {c["career_id"]: c["courses"] for c in json.loads((DATA_DIR / "courses.json").read_text(encoding="utf-8"))}
        self.colleges = {c["career_id"]: c["colleges"] for c in json.loads((DATA_DIR / "colleges.json").read_text(encoding="utf-8"))}

    def _score(self, skill_vector: Dict[str, float], required: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        total_w = sum(required.values()) or 1.0
        contrib = {}
        raw = 0.0
        for dim, w in required.items():
            u = float(skill_vector.get(dim, 0.0))
            c = min(u, w) * w
            contrib[dim] = c
            raw += c
        score = raw / total_w

        s = sum(contrib.values()) or 1.0
        contrib = {k: round(v / s, 4) for k, v in contrib.items()}
        return round(score, 4), contrib

    def recommend(self, skill_vector: Dict[str, float], interests: List[str], top_n: int = 3):
        ranked = []
        for c in self.careers:
            score, why = self._score(skill_vector, c["required_skills"])

            boost = 0.0
            title_lower = c["title"].lower()
            for it in interests:
                if it.lower() in title_lower:
                    boost += 0.03
            score = round(min(1.0, score + boost), 4)

            ranked.append((score, why, c))

        ranked.sort(key=lambda x: x[0], reverse=True)
        out = []
        for score, why, c in ranked[:top_n]:
            out.append({
                "id": c["id"],
                "title": c["title"],
                "score": score,
                "why": why,
                "description": c["description"],
                "qualifications": c["qualifications"],
                "growth": c["growth"],
                "suggested_courses": self.courses.get(c["id"], []),
                "suggested_colleges": self.colleges.get(c["id"], [])
            })
        return out
