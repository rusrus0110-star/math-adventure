import type { DailyActivity } from '@/domain/activity/dailyGoal';
import type { MotivationSettings, VirtualReward, WeeklyGoalProgress } from './motivation.types';
import { weeklyActivity } from '@/domain/activity/activity';
import { VIRTUAL_REWARDS } from './virtualRewards';
import { DEFAULT_WEEKLY_REWARD_ID } from './realRewards';

export function createDefaultMotivationSettings(playerId: string): MotivationSettings {
  const firstReward = VIRTUAL_REWARDS[0];
  if (!firstReward) throw new Error('At least one virtual reward is required.');
  return {
    playerId, selectedVirtualRewardId: firstReward.id, equippedVirtualRewardId: null,
    weeklyGoalEnabled: false, weeklyRewardId: DEFAULT_WEEKLY_REWARD_ID, weeklyCustomRewardTitle: null,
    weeklyRequiredDays: 4, updatedAt: new Date().toISOString(),
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
  return Math.max(0, Math.min(100, Math.round(coins / reward.thresholdCoins * 100)));
}

export function calculateWeeklyGoalProgress(activities: readonly DailyActivity[], requiredDays: number, now = new Date()): WeeklyGoalProgress {
  const dayKeys = weeklyActivity(activities, now);
  const safeRequiredDays = Number.isFinite(requiredDays) ? Math.min(7, Math.max(3, Math.round(requiredDays))) : 4;
  return { completedDays: dayKeys.length, requiredDays: safeRequiredDays, completed: dayKeys.length >= safeRequiredDays, dayKeys };
}
