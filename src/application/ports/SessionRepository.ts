import type { GameSessionRecord } from '@/domain/game/game.types';

export interface SessionRepository {
  save(session: GameSessionRecord): Promise<void>;
  listByPlayerId(playerId: string): Promise<GameSessionRecord[]>;
}
