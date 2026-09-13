import { describe, expect, it } from 'vitest';
import { calculateMasteryFeedback } from './masteryFeedback';

describe('cumulative mastery feedback', () => {
  it('marks only the one newly earned star', () => {
    expect(calculateMasteryFeedback(1, { previousBestStars: 4, unlockedLevelId: null })).toMatchObject({
      newBestStars: 5, sessionStars: 1, newStarNumbers: [5], isNewBest: true, fullMastery: false,
    });
  });
  it('preserves mastery after a failed round', () => {
    expect(calculateMasteryFeedback(0, { previousBestStars: 4, unlockedLevelId: null })).toMatchObject({
      newBestStars: 4, newStarNumbers: [], isNewBest: false,
    });
  });
  it('recognizes the seventh successful round and does not exceed seven', () => {
    expect(calculateMasteryFeedback(1, { previousBestStars: 6, unlockedLevelId: null })).toMatchObject({ newBestStars: 7, fullMastery: true, newStarNumbers: [7] });
    expect(calculateMasteryFeedback(0, { previousBestStars: 7, unlockedLevelId: null })).toMatchObject({ newBestStars: 7, fullMastery: true, isNewBest: false, newStarNumbers: [] });
  });
});
