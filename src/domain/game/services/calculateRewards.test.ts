import { describe, expect, it } from 'vitest';
import { calculateCoins, calculateStars } from './calculateRewards';
import { createInitialProgress, unlockNextLevel } from '@/domain/progression/progression.service';

describe('seven-star mastery', () => {
  it.each([0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 7].map((stars, correct) => ({ stars, correct })))('$correct correct gives $stars stars', ({ correct, stars }) => {
    expect(calculateStars(correct / 10)).toBe(stars);
  });
  it('unlocks at 80%, which is five of seven stars', () => {
    expect(calculateStars(0.8)).toBe(5);
    expect(unlockNextLevel(createInitialProgress('child'), 'addition-5', 0.8).unlockedLevelIds).toContain('addition-10');
    expect(unlockNextLevel(createInitialProgress('child'), 'addition-5', 0.7).unlockedLevelIds).not.toContain('addition-10');
  });
});

describe('session coins, excluding activity', () => {
  it.each([3, 4, 5, 6, 7, 8, 9, 10, 13, 16, 19].map((coins, correct) => ({ coins, correct })))('$correct correct earns $coins coins', ({ coins, correct }) => {
    expect(calculateCoins(correct, 10)).toBe(coins);
  });
  it('bounds invalid input and never awards an empty session', () => {
    expect(calculateCoins(0, 0)).toBe(0);
    expect(calculateCoins(-1, 10)).toBe(3);
    expect(calculateCoins(11, 10)).toBe(19);
    expect(calculateCoins(NaN, 10)).toBe(0);
  });
});
