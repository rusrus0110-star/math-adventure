import { describe, expect, it, vi } from 'vitest';
import { isRewardUnlocked, coinsUntilReward, rewardProgressPercent, calculateWeeklyGoalProgress } from './motivation.service';
import { VIRTUAL_REWARDS } from './virtualRewards';
import { SUPER_PRIZES, rewardState } from './superPrizes';
import { DEFAULT_WEEKLY_REWARD_ID, WEEKLY_REWARD_OPTIONS, getRealRewardById } from './realRewards';
import { localDateKey, weekDates, weeklyActivity, dailyActivityBonus } from '@/domain/activity/activity';
import { sessionInput } from '@/test/fixtures';

describe('cumulative rewards', () => {
  it.each(VIRTUAL_REWARDS)('$id unlocks exactly at its threshold', reward => {
    expect(isRewardUnlocked(reward, reward.thresholdCoins - 1)).toBe(false);
    expect(isRewardUnlocked(reward, reward.thresholdCoins)).toBe(true);
    expect(coinsUntilReward(reward, reward.thresholdCoins - 14)).toBe(14);
    expect(rewardProgressPercent(reward, reward.thresholdCoins * 2)).toBe(100);
  });
  it('preserves configured super-prize milestones and explicit claims', () => {
    expect(SUPER_PRIZES.map(prize => prize.thresholdCoins)).toEqual([500, 800, 1500]);
    expect(rewardState(false, false)).toBe('locked');
    expect(rewardState(true, false)).toBe('unlocked');
    expect(rewardState(true, true)).toBe('claimed');
  });
});

describe('separate reward catalogs', () => {
  it('contains exactly the requested weekly rewards and long-term prizes with no shared IDs', () => {
    expect(WEEKLY_REWARD_OPTIONS.map(reward => reward.name)).toEqual(['Eis essen', 'Spielplatz', 'Filmabend', 'Lieblingsessen']);
    expect(SUPER_PRIZES.map(reward => reward.name)).toEqual(['Shopping', 'Ausflug', 'Ja-Tag']);
    const ids = [...WEEKLY_REWARD_OPTIONS, ...SUPER_PRIZES].map(reward => reward.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getRealRewardById(DEFAULT_WEEKLY_REWARD_ID)?.name).toBe('Eis essen');
    for (const prize of SUPER_PRIZES) expect(getRealRewardById(prize.id)).toBeNull();
  });
});

describe('local activity', () => {
  it('awards activity only for the first full session', () => {
    expect(dailyActivityBonus(false, 10)).toBe(5);
    expect(dailyActivityBonus(true, 10)).toBe(0);
    expect(dailyActivityBonus(false, 9)).toBe(0);
  });
  it('uses local dates across midnight and counts each date once', () => {
    const before = new Date(2026, 8, 7, 23, 59);
    const after = new Date(2026, 8, 8, 0, 1);
    expect(localDateKey(before)).toBe('2026-09-07');
    expect(localDateKey(after)).toBe('2026-09-08');
    expect(weeklyActivity([before, before, after].map(date => ({ localDate: localDateKey(date) })), after)).toHaveLength(2);
  });
  it('uses the device timezone rather than UTC boundaries', () => {
    try {
      const instant = new Date('2026-09-08T00:30:00.000Z');
      vi.stubEnv('TZ', 'America/Los_Angeles');
      expect(localDateKey(instant)).toBe('2026-09-07');
      vi.stubEnv('TZ', 'Europe/Berlin');
      expect(localDateKey(instant)).toBe('2026-09-08');
    } finally { vi.unstubAllEnvs(); }
  });
  it('uses Monday–Sunday weeks including DST transitions', () => {
    expect(weekDates(new Date(2026, 2, 29, 12))).toEqual(['2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29']);
    expect(weeklyActivity([{ localDate: '2026-03-22' }, { localDate: '2026-03-29' }, { localDate: '2026-03-30' }], new Date(2026, 2, 29, 12))).toEqual(['2026-03-29']);
  });
  it('counts full sessions regardless of accuracy using persisted local dates', () => {
    const base = sessionInput('child', 0).session;
    const sessions = ['2026-09-07', '2026-09-07', '2026-09-08'].map(localDate => ({ ...base, localDate, stars: 0, activityCoins: 0, coinsEarned: 3 }));
    expect(calculateWeeklyGoalProgress(sessions, 3, new Date(2026, 8, 9)).completedDays).toBe(2);
    expect(calculateWeeklyGoalProgress([{ ...sessions[0]!, wrongAnswers: 9 }], 3, new Date(2026, 8, 9)).completedDays).toBe(0);
  });
});
