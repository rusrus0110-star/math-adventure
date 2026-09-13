export const MAX_STARS = 7;

export function calculateMasteryGain(previousStars: number, correctAnswers: number, questionCount = 10): number {
  return previousStars < MAX_STARS && questionCount === 10 && Number.isInteger(correctAnswers) &&
    correctAnswers >= 8 && correctAnswers <= questionCount ? 1 : 0;
}

export function calculateCoins(correctAnswers: number, questionCount: number): number {
  if (!Number.isInteger(questionCount) || questionCount <= 0 || !Number.isFinite(correctAnswers)) return 0;
  const safeCorrectAnswers = Math.min(questionCount, Math.max(0, Math.floor(correctAnswers)));
  const accuracy = safeCorrectAnswers / questionCount;
  const completionBonus = 3;
  const accuracyBonus = accuracy >= 1 ? 6 : accuracy >= 0.9 ? 4 : accuracy >= 0.8 ? 2 : 0;
  return safeCorrectAnswers + completionBonus + accuracyBonus;
}
