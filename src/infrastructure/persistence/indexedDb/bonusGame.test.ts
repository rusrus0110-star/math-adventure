import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteDB, type IDBPDatabase } from 'idb';
import { openDatabase, type MathAdventureDb } from './database';
import { IndexedDbBonusGameRepository } from './IndexedDbBonusGameRepository';
import { createLearningAccount } from '@/domain/learning/learning';
import { createInitialProgress } from '@/domain/progression/progression.service';

let database: IDBPDatabase<MathAdventureDb>; let name: string; let repository: IndexedDbBonusGameRepository;
beforeEach(async () => { name = crypto.randomUUID(); database = await openDatabase(name); repository = new IndexedDbBonusGameRepository(async () => database); });
afterEach(async () => { database.close(); await deleteDB(name); });
describe('transactional bonus checkpoints', () => {
  it('rejects zero balance and never charges the whole limit at launch', async () => {
    await expect(repository.start('child', 'first')).rejects.toThrow('keine Bonuszeit');
    await database.put('learning', { ...createLearningAccount('child'), bonusTimeMs: 720_000 });
    expect((await repository.start('child', 'first')).limitMs).toBe(720_000);
    expect((await database.get('learning', 'child'))?.bonusTimeMs).toBe(720_000);
  });
  it('saves an early exit and score independently, with idempotent checkpoints and reload', async () => {
    await database.put('learning', { ...createLearningAccount('child'), bonusTimeMs: 720_000, learningProgressMs: 123, totalActiveMs: 456 });
    const math = { ...createInitialProgress('child'), coins: 800, totalScore: 900 }; await database.put('progress', math);
    await repository.start('child', 'first');
    await Promise.all([repository.checkpoint('child', 'first', 200_000, 176, true), repository.checkpoint('child', 'first', 200_000, 176, true)]);
    database.close(); database = await openDatabase(name);
    expect(await database.get('learning', 'child')).toMatchObject({ bonusTimeMs: 520_000, learningProgressMs: 123, totalActiveMs: 456 });
    expect(await database.get('progress', 'child')).toEqual(math);
    expect((await repository.read('child')).bestBonusGameScore).toBe(176);
    await repository.start('child', 'second'); await repository.checkpoint('child', 'second', 1000, 5, true);
    expect((await repository.read('child')).bestBonusGameScore).toBe(176);
    expect((await repository.read('other')).bestBonusGameScore).toBe(0);
    expect(await database.count('dailyActivity')).toBe(0); expect(await database.count('claims')).toBe(0);
  });
  it('rejects simultaneous normal runs and stale session writes', async () => {
    await database.put('learning', { ...createLearningAccount('child'), bonusTimeMs: 300_000 });
    await repository.start('child', 'first'); await expect(repository.start('child', 'second')).rejects.toThrow('geöffnet');
    await repository.checkpoint('child', 'first', 0, 0, true); await repository.start('child', 'second');
    await expect(repository.checkpoint('child', 'first', 2000, 100, false)).rejects.toThrow('ersetzt');
    expect((await database.get('learning', 'child'))?.bonusTimeMs).toBe(300_000);
  });
});
