import type { BonusCheckpoint, BonusProgress, BonusRun } from '@/features/bonusGame/bonusGame.types';

export interface BonusGameRepository {
  read(playerId: string): Promise<BonusProgress>;
  start(playerId: string, runId: string): Promise<BonusRun>;
  checkpoint(playerId: string, runId: string, elapsedMs: number, score: number, close: boolean): Promise<BonusCheckpoint>;
}
