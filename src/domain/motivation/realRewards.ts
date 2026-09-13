import type { RealRewardOption } from './motivation.types';

export const DEFAULT_WEEKLY_REWARD_ID = 'ice-cream';

export const WEEKLY_REWARD_OPTIONS: readonly RealRewardOption[] = [
  { id: 'ice-cream', name: 'Eis essen', icon: '🍦' },
  { id: 'playground', name: 'Spielplatz', icon: '🛝' },
  { id: 'movie', name: 'Filmabend', icon: '🎬' },
  { id: 'favorite-food', name: 'Lieblingsessen', icon: '🍕' },
] as const;

export function getRealRewardById(rewardId: string | null | undefined): RealRewardOption | null {
  if (!rewardId) return null;
  return WEEKLY_REWARD_OPTIONS.find((reward) => reward.id === rewardId) ?? null;
}
