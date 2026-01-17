from typing import Dict, List

class GuidanceAgent:
    def roadmap(self, career_id: str, timeframe_months: int, skill_vector: Dict[str, float]) -> Dict[str, List[str]]:
        months = max(3, timeframe_months)
        phases = []
        tips = []

        phases.append("Phase 1 (Weeks 1-4): Strengthen fundamentals + daily practice (30-60 mins).")
        phases.append("Phase 2 (Weeks 5-8): Topic-focused improvement on weakest areas + weekly mock quizzes.")
        phases.append("Phase 3 (Weeks 9-12): Projects/competitions + revision + speed/accuracy tuning.")

        weak = [d for d, v in sorted(skill_vector.items(), key=lambda x: x[1])[:2]]
        if weak:
            tips.append(f"Prioritize weak skills: {', '.join(weak)} with 2 extra sessions/week.")
        tips.append("Track accuracy and time-per-question; aim for steady improvement each week.")
        tips.append("Use spaced repetition for formulas/definitions and active recall for concepts.")

        if career_id == "data_scientist":
            phases.append("Phase 4: Build 1 mini data project (EDA + simple model) and publish on GitHub.")
            tips.append("Learn Python + basic stats + linear algebra foundations.")
        elif career_id == "doctor":
            phases.append("Phase 4: NEET-style revision cycles + previous years questions.")
            tips.append("Daily biology diagrams + chemistry numericals practice.")
        elif career_id == "mechanical_engineer":
            phases.append("Phase 4: Mechanics/physics problem sets + CAD intro project.")
            tips.append("Focus on physics fundamentals and visualization of forces.")
        elif career_id == "civil_engineer":
            phases.append("Phase 4: Geometry + physics applications + basic structural concepts.")
            tips.append("Practice spatial reasoning and measurement-based numericals.")

        return {"roadmap": phases[:max(4, months // 3 + 2)], "tips": tips}