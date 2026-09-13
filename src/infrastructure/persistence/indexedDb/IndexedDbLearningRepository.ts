import type { LearningRepository } from '@/application/ports/LearningRepository';
import type { LearningInterval } from '@/domain/learning/ActiveLearningClock';
import { addActiveLearning, createLearningAccount, spendBonusTime } from '@/domain/learning/learning';
import { getDatabase, type DatabaseProvider } from './database';
import { createDailyActivity } from '@/domain/activity/dailyGoal';
import { splitLearningByLocalDay } from '@/domain/learning/localLearningIntervals';

export class IndexedDbLearningRepository implements LearningRepository {
  constructor(private readonly databaseProvider: DatabaseProvider = getDatabase) {}

  async getByPlayerId(playerId: string) {
    const database = await this.databaseProvider();
    return await database.get('learning', playerId) ?? createLearningAccount(playerId);
  }

  async record({ playerId, start, end }: LearningInterval) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) throw new Error('Ungültiges Lernintervall.');
    const database = await this.databaseProvider();
    const transaction = database.transaction(['learning', 'dailyActivity'], 'readwrite');
    try {
      const previous = await transaction.objectStore('learning').get(playerId) ?? createLearningAccount(playerId);
      const activeMs = Math.max(0, end - Math.max(start, previous.lastCreditedAt));
      const update = addActiveLearning(previous, activeMs);
      update.account.lastCreditedAt = Math.max(previous.lastCreditedAt, end);
      await transaction.objectStore('learning').put(update.account);
      for (const interval of splitLearningByLocalDay(Math.max(start, previous.lastCreditedAt), end)) {
        const day = await transaction.objectStore('dailyActivity').get([playerId, interval.localDate]) ?? createDailyActivity(playerId, interval.localDate);
        await transaction.objectStore('dailyActivity').put({ ...day, activeLearningMs: day.activeLearningMs + interval.activeLearningMs });
      }
      await transaction.done;
      return update;
    } catch (error) {
      try { transaction.abort(); } catch { await transaction.done.catch(() => undefined); }
      await transaction.done.catch(() => undefined);
      throw error;
    }
  }

  async spend(playerId: string, durationMs: number) {
    const database = await this.databaseProvider();
    const transaction = database.transaction('learning', 'readwrite');
    try {
      const previous = await transaction.store.get(playerId) ?? createLearningAccount(playerId);
      const updated = spendBonusTime(previous, durationMs);
      await transaction.store.put(updated);
      await transaction.done;
      return updated;
    } catch (error) {
      try { transaction.abort(); } catch { await transaction.done.catch(() => undefined); }
      await transaction.done.catch(() => undefined);
      throw error;
    }
  }
}
