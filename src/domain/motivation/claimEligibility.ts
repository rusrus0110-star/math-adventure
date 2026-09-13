import type { MotivationSettings } from './motivation.types';
import type { DailyActivity } from '@/domain/activity/dailyGoal';
import { SUPER_PRIZES } from './superPrizes';
import { getRealRewardById } from './realRewards';
import { weekDates, weeklyActivity } from '@/domain/activity/activity';

export function eligibleRewardName(rewardKey: string, coins: number, settings: MotivationSettings | undefined, activities: readonly DailyActivity[], now: Date): string | null {
  const prize = SUPER_PRIZES.find(candidate => rewardKey === `super:${candidate.id}`);
  if (prize) return coins >= prize.thresholdCoins ? prize.name : null;
  if (rewardKey !== `weekly:${weekDates(now)[0]}` || !settings?.weeklyGoalEnabled ||
      weeklyActivity(activities, now).length < settings.weeklyRequiredDays) return null;
  return getRealRewardById(settings.weeklyRewardId)?.name ?? null;
}
