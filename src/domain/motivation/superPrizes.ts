export interface SuperPrize {
  id: string;
  name: string;
  icon: string;
  thresholdCoins: number;
}

export const SUPER_PRIZES: readonly SuperPrize[] = [
  { id: 'shopping', name: 'Shopping', icon: '🛍️', thresholdCoins: 500 },
  { id: 'excursion', name: 'Ausflug', icon: '🌳', thresholdCoins: 800 },
  { id: 'yes-day', name: 'Ja-Tag', icon: '🌈', thresholdCoins: 1500 },
];

export interface RewardClaim {
  playerId: string;
  rewardKey: string;
  rewardName: string;
  claimedAt: string;
}

export type RewardState = 'locked' | 'unlocked' | 'claimed';

export function rewardState(unlocked: boolean, claimed: boolean): RewardState {
  return claimed ? 'claimed' : unlocked ? 'unlocked' : 'locked';
}
