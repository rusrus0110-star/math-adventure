import { describe, expect, it } from 'vitest';
import { calculateCoins, calculateStars } from './calculateRewards';

describe('calculate rewards', () => {
  it('keeps accuracy as the main source of stars', () => {
    expect(calculateStars(0.69)).toBe(0);
    expect(calculateStars(0.7)).toBe(1);
    expect(calculateStars(0.85)).toBe(2);
    expect(calculateStars(0.95)).toBe(3);
  });

  it('rewards completion and correctness without using speed for coins', () => {
    expect(calculateCoins(10, 10)).toBe(19);
    expect(calculateCoins(9, 10)).toBe(16);
    expect(calculateCoins(8, 10)).toBe(13);
    expect(calculateCoins(6, 10)).toBe(9);
    expect(calculateCoins(0, 10)).toBe(3);
  });
});
