import type { QuestionAttempt } from '@/domain/game/game.types';

export interface AttemptRepository {
  saveMany(attempts: readonly QuestionAttempt[]): Promise<void>;
  listByPlayerId(playerId: string): Promise<QuestionAttempt[]>;
}
