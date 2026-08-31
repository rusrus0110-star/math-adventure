export function calculateStars(accuracy: number): number {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.85) return 2;
  if (accuracy >= 0.7) return 1;
  return 0;
}

export function calculateCoins(correctAnswers: number, questionCount: number): number {
  let bonus = 0;

  if (correctAnswers === questionCount) bonus = 15;
  else if (correctAnswers >= Math.ceil(questionCount * 0.9)) bonus = 10;
  else if (correctAnswers >= Math.ceil(questionCount * 0.8)) bonus = 5;

  return correctAnswers + bonus;
}
