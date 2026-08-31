export function calculateStars(accuracy: number): number {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.85) return 2;
  if (accuracy >= 0.7) return 1;
  return 0;
}

export function calculateCoins(correctAnswers: number, questionCount: number): number {
  if (questionCount <= 0) return 0;

  const safeCorrectAnswers = Math.min(questionCount, Math.max(0, correctAnswers));
  const accuracy = safeCorrectAnswers / questionCount;
  const completionBonus = 3;

  let accuracyBonus = 0;
  if (accuracy >= 1) accuracyBonus = 6;
  else if (accuracy >= 0.9) accuracyBonus = 4;
  else if (accuracy >= 0.8) accuracyBonus = 2;

  return safeCorrectAnswers + completionBonus + accuracyBonus;
}
