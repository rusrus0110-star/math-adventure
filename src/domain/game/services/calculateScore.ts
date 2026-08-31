import type { ScoreBreakdown } from '@/domain/game/game.types';

export function calculateSpeedBonus(responseTimeMs: number): number {
  if (responseTimeMs < 2_000) return 50;
  if (responseTimeMs < 4_000) return 30;
  if (responseTimeMs < 7_000) return 15;
  return 0;
}

export function calculateStreakBonus(streak: number): number {
  if (streak >= 10) return 100;
  if (streak >= 5) return 25;
  if (streak >= 3) return 10;
  return 0;
}

export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  streakAfterAnswer: number,
): ScoreBreakdown {
  if (!isCorrect) {
    return { base: 0, speed: 0, streak: 0, total: 0 };
  }

  const base = 100;
  const speed = calculateSpeedBonus(responseTimeMs);
  const streak = calculateStreakBonus(streakAfterAnswer);

  return {
    base,
    speed,
    streak,
    total: base + speed + streak,
  };
}
