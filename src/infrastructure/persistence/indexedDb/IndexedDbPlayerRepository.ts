import type { PlayerRepository } from '@/application/ports/PlayerRepository';
import type { PlayerProfile, PlayerProgress } from '@/domain/player/player.types';
import { getDatabase } from './database';

export class IndexedDbPlayerRepository implements PlayerRepository {
  async createWithProgress(player: PlayerProfile, progress: PlayerProgress): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(['players', 'progress'], 'readwrite');
    await Promise.all([
      transaction.objectStore('players').add(player),
      transaction.objectStore('progress').add(progress),
      transaction.done,
    ]);
  }

  async list(): Promise<PlayerProfile[]> {
    const database = await getDatabase();
    return database.getAll('players');
  }

  async getById(playerId: string): Promise<PlayerProfile | null> {
    const database = await getDatabase();
    return (await database.get('players', playerId)) ?? null;
  }

  async save(player: PlayerProfile): Promise<void> {
    const database = await getDatabase();
    await database.put('players', player);
  }
}
