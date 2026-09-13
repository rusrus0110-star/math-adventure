import type { LearningAccount, LearningUpdate } from '@/domain/learning/learning';
import type { LearningInterval } from '@/domain/learning/ActiveLearningClock';

export interface LearningRepository {
  getByPlayerId(playerId: string): Promise<LearningAccount>;
  record(interval: LearningInterval): Promise<LearningUpdate>;
  spend(playerId: string, durationMs: number): Promise<LearningAccount>;
}
