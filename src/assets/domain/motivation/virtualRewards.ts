import type { VirtualReward } from './motivation.types';

export const VIRTUAL_REWARDS: readonly VirtualReward[] = [
  { id: 'bow', name: 'Schleife', icon: '🎀', thresholdCoins: 20, category: 'accessory' },
  { id: 'flower', name: 'Blume', icon: '🌼', thresholdCoins: 40, category: 'accessory' },
  { id: 'crown', name: 'Krone', icon: '👑', thresholdCoins: 60, category: 'accessory' },
  { id: 'wizard-hat', name: 'Zauberhut', icon: '🧙', thresholdCoins: 90, category: 'accessory' },
  { id: 'party-hat', name: 'Partyhut', icon: '🥳', thresholdCoins: 125, category: 'accessory' },
  { id: 'space-helmet', name: 'Weltraumhelm', icon: '🚀', thresholdCoins: 165, category: 'accessory' },
] as const;

export function getVirtualRewardById(rewardId: string | null | undefined): VirtualReward | null {
  if (!rewardId) return null;
  return VIRTUAL_REWARDS.find((reward) => reward.id === rewardId) ?? null;
}
