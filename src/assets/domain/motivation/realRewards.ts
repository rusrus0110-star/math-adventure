import type { RealRewardOption } from './motivation.types';

export const REAL_REWARD_OPTIONS: readonly RealRewardOption[] = [
  { id: 'ice-cream', name: 'Eis essen', icon: '🍦' },
  { id: 'playground', name: 'Spielplatz', icon: '🛝' },
  { id: 'movie', name: 'Filmabend', icon: '🎬' },
  { id: 'favorite-food', name: 'Lieblingsessen', icon: '🍕' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'excursion', name: 'Ausflug', icon: '🌳' },
  { id: 'swimming', name: 'Schwimmbad', icon: '🏊' },
  { id: 'crafting', name: 'Gemeinsam basteln', icon: '🎨' },
  { id: 'custom', name: 'Eigene Belohnung', icon: '✨', allowsCustomTitle: true },
] as const;

export function getRealRewardById(rewardId: string | null | undefined): RealRewardOption | null {
  if (!rewardId) return null;
  return REAL_REWARD_OPTIONS.find((reward) => reward.id === rewardId) ?? null;
}
