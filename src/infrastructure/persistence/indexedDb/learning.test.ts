import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteDB, type IDBPDatabase } from 'idb';
import { openDatabase, type MathAdventureDb } from './database';
import { IndexedDbLearningRepository } from './IndexedDbLearningRepository';
import { BONUS_GRANT_MS, learningPathProgress, MAX_BONUS_MS, REQUIRED_LEARNING_MS } from '@/domain/learning/learning';

let name: string;
let database: IDBPDatabase<MathAdventureDb>;
let repository: IndexedDbLearningRepository;
beforeEach(async () => {
  name = crypto.randomUUID();
  database = await openDatabase(name);
  repository = new IndexedDbLearningRepository(async () => database);
});
afterEach(async () => { database.close(); await deleteDB(name); });

describe('persisted learning and bonus bank', () => {
  it('survives reopening and keeps children independent', async () => {
    await repository.record({ playerId: 'child', start: 0, end: REQUIRED_LEARNING_MS * 1.4 });
    await repository.record({ playerId: 'other', start: 0, end: REQUIRED_LEARNING_MS * 0.2 });
    database.close();
    database = await openDatabase(name);
    const child = await repository.getByPlayerId('child');
    expect(child.bonusTimeMs).toBe(BONUS_GRANT_MS);
    expect(learningPathProgress(child)).toMatchObject({ completedSegments: 2, progress: 0.4 });
    expect(learningPathProgress(await repository.getByPlayerId('other'))).toMatchObject({ completedSegments: 1 });
    expect((await repository.getByPlayerId('other')).bonusTimeMs).toBe(0);
  });
  it('does not double-credit retries or overlapping intervals from another tab', async () => {
    const interval = { playerId: 'child', start: 0, end: REQUIRED_LEARNING_MS };
    const updates = await Promise.all([repository.record(interval), repository.record(interval)]);
    expect(updates.reduce((sum, update) => sum + update.grantedMs, 0)).toBe(BONUS_GRANT_MS);
    await repository.record({ ...interval, start: REQUIRED_LEARNING_MS / 2, end: REQUIRED_LEARNING_MS * 1.5 });
    expect((await repository.getByPlayerId('child')).totalActiveMs).toBe(REQUIRED_LEARNING_MS * 1.5);
  });
  it('caps stored time and persists spending without changing learning progress', async () => {
    await repository.record({ playerId: 'child', start: 0, end: REQUIRED_LEARNING_MS * 8 });
    expect((await repository.getByPlayerId('child')).bonusTimeMs).toBe(MAX_BONUS_MS);
    await repository.spend('child', BONUS_GRANT_MS);
    database.close(); database = await openDatabase(name);
    expect((await repository.getByPlayerId('child')).bonusTimeMs).toBe(MAX_BONUS_MS - BONUS_GRANT_MS);
    await expect(repository.spend('child', MAX_BONUS_MS)).rejects.toThrow();
    expect((await repository.getByPlayerId('child')).bonusTimeMs).toBe(MAX_BONUS_MS - BONUS_GRANT_MS);
  });
});
