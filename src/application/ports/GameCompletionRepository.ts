import type { GameSessionRecord, QuestionAttempt } from '@/domain/game/game.types';
import type { PlayerProgress } from '@/domain/player/player.types';
import type { ActivityDay } from '@/domain/activity/activity';

export interface GameCompletion {
  session: GameSessionRecord;
  attempts: readonly QuestionAttempt[];
  progress: PlayerProgress;
  activity: ActivityDay;
}

export interface GameCompletionRepository {
  saveCompletion(
    sessionId: string,
    playerId: string,
    localDate: string,
    calculate: (progress: PlayerProgress | null, alreadyActive: boolean) => GameCompletion,
  ): Promise<GameSessionRecord>;
}
