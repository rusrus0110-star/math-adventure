import type { RewardClaim } from '@/domain/motivation/superPrizes';

export interface RewardClaimRepository {
  listByPlayerId(playerId: string): Promise<RewardClaim[]>;
  claim(playerId: string, rewardKey: string, now?: Date): Promise<void>;
}
