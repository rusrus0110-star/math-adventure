import { describe, expect, it } from 'vitest';
import { calculateMasteryFeedback } from './masteryFeedback';

describe('mastery feedback', () => {
  it('marks only stars beyond the previous best as new', () => {
    expect(calculateMasteryFeedback(6, { previousBestStars: 4, unlockedLevelId: null })).toEqual({
      previousBestStars: 4, sessionStars: 6, newBestStars: 6,
      isNewBest: true, newStarNumbers: [5, 6], fullMastery: false, unlockedLevelId: null,
    });
  });
  it.each([4, 3, 0])('does not celebrate an equal or worse result of %i stars', sessionStars => {
    expect(calculateMasteryFeedback(sessionStars, { previousBestStars: 4, unlockedLevelId: null })).toMatchObject({
      sessionStars, newBestStars: 4, isNewBest: false, newStarNumbers: [], fullMastery: false,
    });
  });
  it.each([6, 7])('recognizes full mastery with a previous best of %i', previousBestStars => {
    expect(calculateMasteryFeedback(7, { previousBestStars, unlockedLevelId: null })).toMatchObject({ fullMastery: true, newBestStars: 7 });
  });
  it('does not label a lower session as perfect because the previous best was seven', () => {
    expect(calculateMasteryFeedback(5, { previousBestStars: 7, unlockedLevelId: null })).toMatchObject({ fullMastery: false, newBestStars: 7, newStarNumbers: [] });
  });
});
