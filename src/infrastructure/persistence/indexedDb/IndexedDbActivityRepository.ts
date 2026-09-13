import type { ActivityRepository } from '@/application/ports/ActivityRepository';
import { createDailyActivity } from '@/domain/activity/dailyGoal';
import { getDatabase, type DatabaseProvider } from './database';

export class IndexedDbActivityRepository implements ActivityRepository {
  constructor(private readonly databaseProvider: DatabaseProvider = getDatabase) {}

  async listByPlayerId(playerId: string) {
    const database = await this.databaseProvider();
    return database.getAllFromIndex('dailyActivity', 'by-player', playerId);
  }

  async getByDate(playerId: string, localDate: string) {
    const database = await this.databaseProvider();
    return await database.get('dailyActivity', [playerId, localDate]) ?? createDailyActivity(playerId, localDate);
  }
}
