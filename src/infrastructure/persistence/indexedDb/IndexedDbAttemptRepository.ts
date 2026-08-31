import type { AttemptRepository } from '@/application/ports/AttemptRepository';
import type { QuestionAttempt } from '@/domain/game/game.types';
import { getDatabase } from './database';

export class IndexedDbAttemptRepository implements AttemptRepository {
  async saveMany(attempts: readonly QuestionAttempt[]): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction('attempts', 'readwrite');

    await Promise.all([
      ...attempts.map((attempt) => transaction.store.put(attempt)),
      transaction.done,
    ]);
  }

  async listByPlayerId(playerId: string): Promise<QuestionAttempt[]> {
    const database = await getDatabase();
    return database.getAllFromIndex('attempts', 'by-player', playerId);
  }
}
