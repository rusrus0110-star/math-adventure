import { describe, expect, it, vi } from 'vitest';
import { createDailyActivity, dailyGoalProgress, DAILY_LEARNING_TARGET_MS, isActiveDay } from './dailyGoal';
import { splitLearningByLocalDay } from '@/domain/learning/localLearningIntervals';
import { weeklyActivity } from './activity';

const empty = createDailyActivity('child', '2026-09-07');

describe('daily training goal', () => {
  it.each([0, 1, 2, 3, 4, 5, 6])('requires five full rounds, not just one: %i rounds', completedSessions => {
    expect(isActiveDay({ ...empty, completedSessions })).toBe(completedSessions >= 5);
    expect(dailyGoalProgress({ ...empty, completedSessions }).roundSegments).toBe(Math.min(5, completedSessions));
  });
  it('accepts exactly twenty active minutes without requiring any completed rounds', () => {
    expect(isActiveDay({ ...empty, activeLearningMs: DAILY_LEARNING_TARGET_MS - 1 })).toBe(false);
    expect(isActiveDay({ ...empty, activeLearningMs: DAILY_LEARNING_TARGET_MS })).toBe(true);
  });
  it('does not add partial round and time goals together', () => {
    expect(isActiveDay({ ...empty, completedSessions: 4, activeLearningMs: 19 * 60_000 })).toBe(false);
  });
  it.each([0, 1, 2, 3, 4, 5])('maps active time to %i daily segments', segments => {
    expect(dailyGoalProgress({ ...empty, activeLearningMs: segments * DAILY_LEARNING_TARGET_MS / 5 }).timeSegments).toBe(segments);
  });
  it('counts qualified local days once, not all days with some activity', () => {
    const days = [empty, { ...empty, completedSessions: 5 }, { ...empty, activeLearningMs: DAILY_LEARNING_TARGET_MS },
      { ...empty, localDate: '2026-09-08', completedSessions: 4 }, { ...empty, localDate: '2026-09-09', activeLearningMs: DAILY_LEARNING_TARGET_MS }];
    expect(weeklyActivity(days, new Date(2026, 8, 9))).toEqual(['2026-09-07', '2026-09-09']);
  });
  it('splits credited time at local midnight, including DST days', () => {
    try {
      vi.stubEnv('TZ', 'Europe/Berlin');
      const start = new Date(2026, 2, 28, 23, 59, 59).getTime();
      const end = new Date(2026, 2, 30, 0, 0, 1).getTime();
      expect(splitLearningByLocalDay(start, end)).toEqual([
        { localDate: '2026-03-28', activeLearningMs: 1000 },
        { localDate: '2026-03-29', activeLearningMs: 23 * 60 * 60_000 },
        { localDate: '2026-03-30', activeLearningMs: 1000 },
      ]);
    } finally { vi.unstubAllEnvs(); }
  });
});
