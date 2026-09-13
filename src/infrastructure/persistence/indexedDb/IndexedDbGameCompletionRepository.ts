import type { GameCompletionRepository } from '@/application/ports/GameCompletionRepository';
import { getDatabase, type DatabaseProvider } from './database';

export class IndexedDbGameCompletionRepository implements GameCompletionRepository {
  constructor(private readonly databaseProvider: DatabaseProvider = getDatabase) {}

  async saveCompletion(
    sessionId: string,
    playerId: string,
    localDate: string,
    calculate: Parameters<GameCompletionRepository['saveCompletion']>[3],
  ) {
    const database = await this.databaseProvider();
    const transaction = database.transaction(['attempts', 'sessions', 'progress', 'activity'], 'readwrite');
    try {
      const existing = await transaction.objectStore('sessions').get(sessionId);
      if (existing) {
        if (existing.playerId !== playerId) throw new Error('Session belongs to another player.');
        await transaction.done;
        return existing;
      }
      const progress = await transaction.objectStore('progress').get(playerId);
      const activity = await transaction.objectStore('activity').get([playerId, localDate]);
      const completion = calculate(progress ?? null, Boolean(activity));
      for (const attempt of completion.attempts) {
        await transaction.objectStore('attempts').add(attempt);
      }
      await transaction.objectStore('sessions').add(completion.session);
      await transaction.objectStore('progress').put(completion.progress);
      if (!activity) await transaction.objectStore('activity').add(completion.activity);
      await transaction.done;
      return completion.session;
    } catch (error) {
      try { transaction.abort(); } catch { await transaction.done.catch(() => undefined); }
      await transaction.done.catch(() => undefined);
      throw error;
    }
  }
}
