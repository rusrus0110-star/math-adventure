import type {
  GameCompletion,
  GameCompletionRepository,
} from '@/application/ports/GameCompletionRepository';
import { getDatabase } from './database';

export class IndexedDbGameCompletionRepository
  implements GameCompletionRepository
{
  async saveCompletion(completion: GameCompletion): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(
      ['attempts', 'sessions', 'progress'],
      'readwrite',
    );

    for (const attempt of completion.attempts) {
      await transaction.objectStore('attempts').put(attempt);
    }

    await transaction.objectStore('sessions').put(completion.session);
    await transaction.objectStore('progress').put(completion.progress);
    await transaction.done;
  }
}
