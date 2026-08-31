import type { GameSessionRecord, QuestionAttempt } from '@/domain/game/game.types';
import type { PlayerProgress } from '@/domain/player/player.types';

export interface GameCompletion {
  session: GameSessionRecord;
  attempts: readonly QuestionAttempt[];
  progress: PlayerProgress;
}

export interface GameCompletionRepository {
  saveCompletion(completion: GameCompletion): Promise<void>;
}
