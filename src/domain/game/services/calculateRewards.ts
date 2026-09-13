export const MAX_STARS = 7;

export function calculateStars(accuracy: number): number {
  if (!Number.isFinite(accuracy)) return 0;
  const correctAnswers = Math.min(10, Math.max(0, Math.round(accuracy * 10)));
  if (correctAnswers < 3) return 0;
  if (correctAnswers < 5) return 1;
  return correctAnswers - 3;
}

export function calculateCoins(correctAnswers: number, questionCount: number): number {
  if (!Number.isInteger(questionCount) || questionCount <= 0 || !Number.isFinite(correctAnswers)) return 0;
  const safeCorrectAnswers = Math.min(questionCount, Math.max(0, Math.floor(correctAnswers)));
  const accuracy = safeCorrectAnswers / questionCount;
  const completionBonus = 3;
  const accuracyBonus = accuracy >= 1 ? 6 : accuracy >= 0.9 ? 4 : accuracy >= 0.8 ? 2 : 0;
  return safeCorrectAnswers + completionBonus + accuracyBonus;
}
