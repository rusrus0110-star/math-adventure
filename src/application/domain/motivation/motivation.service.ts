import type { GameSessionRecord } from '@/domain/game/game.types';
import type {
  MotivationSettings,
  VirtualReward,
  WeeklyGoalProgress,
} from './motivation.types';
import { VIRTUAL_REWARDS } from './virtualRewards';

export function createDefaultMotivationSettings(playerId: string): MotivationSettings {
  const firstReward = VIRTUAL_REWARDS[0];

  if (!firstReward) {
    throw new Error('At least one virtual reward is required.');
  }

  return {
    playerId,
    selectedVirtualRewardId: firstReward.id,
    equippedVirtualRewardId: null,
    weeklyGoalEnabled: false,
    weeklyRewardId: 'ice-cream',
    weeklyCustomRewardTitle: null,
    weeklyRequiredDays: 4,
    updatedAt: new Date().toISOString(),
  };
}

export function isRewardUnlocked(reward: VirtualReward, coins: number): boolean {
  return coins >= reward.thresholdCoins;
}

export function coinsUntilReward(reward: VirtualReward, coins: number): number {
  return Math.max(0, reward.thresholdCoins - coins);
}

export function rewardProgressPercent(reward: VirtualReward, coins: number): number {
  if (reward.thresholdCoins <= 0) return 100;
  return Math.min(100, Math.round((coins / reward.thresholdCoins) * 100));
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfCurrentWeek(now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

export function calculateWeeklyGoalProgress(
  sessions: readonly GameSessionRecord[],
  requiredDays: number,
  now = new Date(),
): WeeklyGoalProgress {
  const safeRequiredDays = Math.min(7, Math.max(1, requiredDays));
  const weekStart = getStartOfCurrentWeek(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const dayKeys = Array.from(
    new Set(
      sessions
        .map((session) => new Date(session.completedAt))
        .filter((completedAt) =>
          Number.isFinite(completedAt.getTime()) &&
          completedAt >= weekStart &&
          completedAt < nextWeekStart
        )
        .map(getLocalDateKey),
    ),
  ).sort();

  return {
    completedDays: dayKeys.length,
    requiredDays: safeRequiredDays,
    completed: dayKeys.length >= safeRequiredDays,
    dayKeys,
  };
}
