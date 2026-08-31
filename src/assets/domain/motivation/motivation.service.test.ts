import { describe, expect, it } from 'vitest';
import type { GameSessionRecord } from '@/domain/game/game.types';
import {
  calculateWeeklyGoalProgress,
  coinsUntilReward,
  isRewardUnlocked,
  rewardProgressPercent,
} from './motivation.service';
import { VIRTUAL_REWARDS } from './virtualRewards';

describe('motivation service', () => {
  it('keeps virtual rewards cumulative', () => {
    const crown = VIRTUAL_REWARDS.find((reward) => reward.id === 'crown');
    expect(crown).toBeDefined();
    if (!crown) return;

    expect(isRewardUnlocked(crown, 59)).toBe(false);
    expect(isRewardUnlocked(crown, 60)).toBe(true);
    expect(coinsUntilReward(crown, 46)).toBe(14);
    expect(rewardProgressPercent(crown, 30)).toBe(50);
  });

  it('counts at most one training day per calendar day', () => {
    const sessions: GameSessionRecord[] = [
      makeSession('2026-08-31T08:00:00.000Z'),
      makeSession('2026-08-31T15:00:00.000Z'),
      makeSession('2026-09-01T08:00:00.000Z'),
    ];

    const progress = calculateWeeklyGoalProgress(
      sessions,
      4,
      new Date('2026-09-02T12:00:00.000Z'),
    );

    expect(progress.completedDays).toBe(2);
    expect(progress.completed).toBe(false);
  });
});

function makeSession(completedAt: string): GameSessionRecord {
  return {
    id: crypto.randomUUID(),
    playerId: 'player-1',
    levelId: 'addition-10',
    score: 100,
    coinsEarned: 10,
    correctAnswers: 8,
    wrongAnswers: 2,
    bestStreak: 3,
    durationMs: 30_000,
    startedAt: completedAt,
    completedAt,
  };
}
