export type RewardRarity = 'common' | 'rare' | 'epic';

export interface Reward {
  id: string;
  nameKey: string;
  rarity: RewardRarity;
  priceCoins: number;
  icon: string;
}
