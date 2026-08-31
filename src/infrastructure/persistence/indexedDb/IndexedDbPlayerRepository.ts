import type { PlayerRepository } from '@/application/ports/PlayerRepository';
import type { PlayerProfile } from '@/domain/player/player.types';
import { getDatabase } from './database';

export class IndexedDbPlayerRepository implements PlayerRepository {
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
