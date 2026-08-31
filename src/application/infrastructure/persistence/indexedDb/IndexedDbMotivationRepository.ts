import type { MotivationRepository } from '@/application/ports/MotivationRepository';
import type { MotivationSettings } from '@/domain/motivation/motivation.types';
import { getDatabase } from './database';

export class IndexedDbMotivationRepository implements MotivationRepository {
  async getByPlayerId(playerId: string): Promise<MotivationSettings | null> {
    const database = await getDatabase();
    return (await database.get('motivation', playerId)) ?? null;
  }

  async save(settings: MotivationSettings): Promise<void> {
    const database = await getDatabase();
    await database.put('motivation', settings);
  }
}
