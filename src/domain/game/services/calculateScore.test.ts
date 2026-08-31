import { describe, expect, it } from 'vitest';
import { calculateScore, calculateSpeedBonus, calculateStreakBonus } from './calculateScore';

describe('calculateSpeedBonus', () => {
  it('awards the configured speed tiers', () => {
    expect(calculateSpeedBonus(1_999)).toBe(50);
    expect(calculateSpeedBonus(2_000)).toBe(30);
    expect(calculateSpeedBonus(4_000)).toBe(15);
    expect(calculateSpeedBonus(7_000)).toBe(0);
  });
});

describe('calculateStreakBonus', () => {
  it('awards milestone streak bonuses', () => {
    expect(calculateStreakBonus(2)).toBe(0);
    expect(calculateStreakBonus(3)).toBe(10);
    expect(calculateStreakBonus(5)).toBe(25);
    expect(calculateStreakBonus(10)).toBe(100);
  });
});

describe('calculateScore', () => {
  it('never gives points for a wrong answer', () => {
    expect(calculateScore(false, 500, 10)).toEqual({
      base: 0,
      speed: 0,
      streak: 0,
      total: 0,
    });
  });
});
