import type { RewardClaimRepository } from '@/application/ports/RewardClaimRepository';
import { eligibleRewardName } from '@/domain/motivation/claimEligibility';
import { getDatabase, type DatabaseProvider } from './database';

export class IndexedDbRewardClaimRepository implements RewardClaimRepository {
  constructor(private readonly databaseProvider: DatabaseProvider = getDatabase) {}

  async listByPlayerId(playerId: string) {
    const database = await this.databaseProvider();
    return database.getAllFromIndex('claims', 'by-player', playerId);
  }

  async claim(playerId: string, rewardKey: string, now = new Date()): Promise<void> {
    const database = await this.databaseProvider();
    const transaction = database.transaction(['claims', 'progress', 'motivation', 'activity'], 'readwrite');
    try {
      if (await transaction.objectStore('claims').get([playerId, rewardKey])) {
        await transaction.done;
        return;
      }
      const progress = await transaction.objectStore('progress').get(playerId);
      const settings = await transaction.objectStore('motivation').get(playerId);
      const days = await transaction.objectStore('activity').index('by-player').getAll(playerId);
      const rewardName = eligibleRewardName(rewardKey, progress?.coins ?? 0, settings, days, now);
      if (!rewardName) throw new Error('Diese Belohnung ist noch nicht freigeschaltet.');
      await transaction.objectStore('claims').add({ playerId, rewardKey, rewardName, claimedAt: now.toISOString() });
      await transaction.done;
    } catch (error) {
      try { transaction.abort(); } catch { await transaction.done.catch(() => undefined); }
      await transaction.done.catch(() => undefined);
      throw error;
    }
  }
}
