import type { SessionRepository } from '@/application/ports/SessionRepository';
import type { GameSessionRecord } from '@/domain/game/game.types';
import { getDatabase } from './database';

export class IndexedDbSessionRepository implements SessionRepository {
  async save(session: GameSessionRecord): Promise<void> {
    const database = await getDatabase();
    await database.put('sessions', session);
  }

  async listByPlayerId(playerId: string): Promise<GameSessionRecord[]> {
    const database = await getDatabase();
    return database.getAllFromIndex('sessions', 'by-player', playerId);
  }
}
