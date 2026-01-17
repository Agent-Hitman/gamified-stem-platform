export function calculateXP(score) {
  return score * 5;
}

export function getLevel(xp) {
  if (xp < 50) return "Beginner";
  if (xp < 150) return "Intermediate";
  return "Advanced";
}

export function getBadges(score) {
  const badges = [];
  if (score >= 20) badges.push("Quick Learner");
  if (score === 20) badges.push("Perfect Score");
  return badges;
}
