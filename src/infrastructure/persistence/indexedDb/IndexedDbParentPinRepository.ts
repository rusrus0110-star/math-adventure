import type { ParentPinRepository } from '@/application/ports/ParentPinRepository';
import type { ParentPinRecord } from '@/domain/parents/parentPin';
import { getDatabase, type DatabaseProvider } from './database';

export class IndexedDbParentPinRepository implements ParentPinRepository {
  constructor(private databaseProvider: DatabaseProvider = getDatabase) {}
  async read() { return (await this.databaseProvider()).get('settings', 'parent-pin'); }
  async save(record: ParentPinRecord, expectedHash: string | null) {
    const database = await this.databaseProvider();
    const transaction = database.transaction('settings', 'readwrite');
    const previous = await transaction.store.get('parent-pin');
    if ((previous?.hash ?? null) !== expectedHash) {
      await transaction.done;
      throw new Error('Die Eltern-PIN wurde bereits geändert. Bitte erneut anmelden.');
    }
    await transaction.store.put(record); await transaction.done;
  }
}
