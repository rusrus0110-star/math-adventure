import type { ActivityRepository } from '@/application/ports/ActivityRepository';
import { getDatabase, type DatabaseProvider } from './database';

export class IndexedDbActivityRepository implements ActivityRepository {
  constructor(private readonly databaseProvider: DatabaseProvider = getDatabase) {}

  async listByPlayerId(playerId: string) {
    const database = await this.databaseProvider();
    return database.getAllFromIndex('activity', 'by-player', playerId);
  }
}
