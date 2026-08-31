import type { ProgressRepository } from '@/application/ports/ProgressRepository';
import type { PlayerProgress } from '@/domain/player/player.types';
import { getDatabase } from './database';

export class IndexedDbProgressRepository implements ProgressRepository {
  async getByPlayerId(playerId: string): Promise<PlayerProgress | null> {
    const database = await getDatabase();
    return (await database.get('progress', playerId)) ?? null;
  }

  async save(progress: PlayerProgress): Promise<void> {
    const database = await getDatabase();
    await database.put('progress', progress);
  }
}
