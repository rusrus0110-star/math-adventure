import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteDB, openDB, type IDBPDatabase } from 'idb';
import { openDatabase, type MathAdventureDb } from './database';
import { IndexedDbActivityRepository } from './IndexedDbActivityRepository';
import { IndexedDbLearningRepository } from './IndexedDbLearningRepository';
import { IndexedDbGameCompletionRepository } from './IndexedDbGameCompletionRepository';
import { completeGameSession } from '@/application/game/completeGameSession';
import { DAILY_LEARNING_TARGET_MS, isActiveDay } from '@/domain/activity/dailyGoal';
import { weeklyActivity } from '@/domain/activity/activity';
import { BONUS_GRANT_MS } from '@/domain/learning/learning';
import { sessionInput } from '@/test/fixtures';
import { createInitialProgress } from '@/domain/progression/progression.service';
import { createLearningAccount } from '@/domain/learning/learning';
import { createDefaultMotivationSettings } from '@/domain/motivation/motivation.service';

let name: string;
let database: IDBPDatabase<MathAdventureDb>;
let activity: IndexedDbActivityRepository;
let learning: IndexedDbLearningRepository;
let gameCompletionRepository: IndexedDbGameCompletionRepository;
beforeEach(async () => {
  name = crypto.randomUUID(); database = await openDatabase(name);
  activity = new IndexedDbActivityRepository(async () => database);
  learning = new IndexedDbLearningRepository(async () => database);
  gameCompletionRepository = new IndexedDbGameCompletionRepository(async () => database);
});
afterEach(async () => { database.close(); await deleteDB(name); });

describe('persistent daily goals', () => {
  it('migrates version 6 history without resetting mastery, coins, Bonuszeit or claims', async () => {
    database.close(); await deleteDB(name);
    const previous = await openDB(name, 6, { upgrade(legacy) {
      legacy.createObjectStore('players', { keyPath: 'id' });
      for (const store of ['progress', 'learning', 'motivation']) legacy.createObjectStore(store, { keyPath: 'playerId' });
      legacy.createObjectStore('sessions', { keyPath: 'id' }).createIndex('by-player', 'playerId');
      const attempts = legacy.createObjectStore('attempts', { keyPath: 'id' });
      attempts.createIndex('by-player', 'playerId'); attempts.createIndex('by-session', 'sessionId');
      legacy.createObjectStore('activity', { keyPath: ['playerId', 'localDate'] }).createIndex('by-player', 'playerId');
      legacy.createObjectStore('claims', { keyPath: ['playerId', 'rewardKey'] }).createIndex('by-player', 'playerId');
    } });
    await previous.put('players', { id: 'child', name: 'Mia' });
    await previous.put('progress', { ...createInitialProgress('child'), coins: 123, levelStars: { 'addition-5': 3 }, unlockedLevelIds: ['addition-5', 'addition-10'] });
    await previous.put('learning', { ...createLearningAccount('child'), bonusTimeMs: BONUS_GRANT_MS * 2, learningProgressMs: 120_000, totalActiveMs: 8_000_000 });
    await previous.put('motivation', { ...createDefaultMotivationSettings('child'), equippedVirtualRewardId: 'bow' });
    await previous.put('claims', { playerId: 'child', rewardKey: 'weekly:2026-09-07', rewardName: 'Eis essen', claimedAt: '2026-09-09' });
    for (const day of [7, 8]) {
      for (let round = 0; round < (day === 7 ? 5 : 1); round += 1) {
        const input = sessionInput('child', 0, new Date(2026, 8, day, 12));
        await previous.put('sessions', { ...input.session, durationMs: DAILY_LEARNING_TARGET_MS, stars: 0, coinsEarned: 3, activityCoins: 0 });
        for (const attempt of input.attempts) await previous.put('attempts', attempt);
        if (round === 0) await previous.put('activity', { playerId: 'child', localDate: input.session.localDate, firstSessionId: input.session.id });
      }
    }
    const stores = ['players', 'progress', 'learning', 'motivation', 'claims', 'activity', 'sessions', 'attempts'] as const;
    const before = await Promise.all(stores.map(store => previous.getAll(store)));
    previous.close(); database = await openDatabase(name);
    expect(database.version).toBe(7);
    expect(await Promise.all(stores.map(store => database.getAll(store)))).toEqual(before);
    expect(await activity.getByDate('child', '2026-09-07')).toMatchObject({ completedSessions: 5, activeLearningMs: 0 });
    expect(await activity.getByDate('child', '2026-09-08')).toMatchObject({ completedSessions: 1, activeLearningMs: 0 });
    expect(weeklyActivity(await activity.listByPlayerId('child'), new Date(2026, 8, 9))).toEqual(['2026-09-07']);
    database.close(); database = await openDatabase(name);
    expect((await activity.getByDate('child', '2026-09-07')).completedSessions).toBe(5);
  });
  it('counts five completed rounds regardless of accuracy, without counting retries or incomplete games', async () => {
    for (let round = 1; round <= 5; round += 1) {
      const input = sessionInput('child', 0);
      await Promise.all([completeGameSession(input, { gameCompletionRepository }), completeGameSession(input, { gameCompletionRepository })]);
      const day = await activity.getByDate('child', input.session.localDate);
      expect(day.completedSessions).toBe(round);
      expect(isActiveDay(day)).toBe(round === 5);
    }
    const incomplete = sessionInput();
    await expect(completeGameSession({ ...incomplete, attempts: incomplete.attempts.slice(0, 9) }, { gameCompletionRepository })).rejects.toThrow();
    expect((await activity.getByDate('child', '2026-09-07')).completedSessions).toBe(5);
    expect((await database.get('progress', 'child'))?.coins).toBe(20);
    expect((await activity.getByDate('child', '2026-09-08')).completedSessions).toBe(0);
  });
  it('uses the same credited time for the daily goal and bonus bank, without resetting the daily goal at fifteen minutes', async () => {
    const start = new Date(2026, 8, 7, 12).getTime();
    await learning.record({ playerId: 'child', start, end: start + 15 * 60_000 });
    expect((await learning.getByPlayerId('child')).bonusTimeMs).toBe(BONUS_GRANT_MS);
    expect(isActiveDay(await activity.getByDate('child', '2026-09-07'))).toBe(false);
    const interval = { playerId: 'child', start: start + 15 * 60_000, end: start + DAILY_LEARNING_TARGET_MS };
    await Promise.all([learning.record(interval), learning.record(interval)]);
    database.close(); database = await openDatabase(name);
    expect(await activity.getByDate('child', '2026-09-07')).toMatchObject({ activeLearningMs: DAILY_LEARNING_TARGET_MS, completedSessions: 0 });
    expect(weeklyActivity(await activity.listByPlayerId('child'), new Date(2026, 8, 7))).toEqual(['2026-09-07']);
    expect(isActiveDay(await activity.getByDate('another', '2026-09-07'))).toBe(false);
  });
  it('preserves both counters when session completion and time saving overlap', async () => {
    const start = new Date(2026, 8, 7, 12).getTime();
    await Promise.all([
      completeGameSession(sessionInput('child', 0), { gameCompletionRepository }),
      learning.record({ playerId: 'child', start, end: start + DAILY_LEARNING_TARGET_MS }),
    ]);
    expect(await activity.getByDate('child', '2026-09-07')).toMatchObject({ completedSessions: 1, activeLearningMs: DAILY_LEARNING_TARGET_MS });
  });
  it('starts a separate local day without deleting yesterday or saved Bonuszeit', async () => {
    const start = new Date(2026, 8, 7, 23, 40).getTime();
    const midnight = new Date(2026, 8, 8).getTime();
    await learning.record({ playerId: 'child', start, end: midnight + 1000 });
    expect(await activity.getByDate('child', '2026-09-07')).toMatchObject({ activeLearningMs: DAILY_LEARNING_TARGET_MS });
    expect(await activity.getByDate('child', '2026-09-08')).toMatchObject({ activeLearningMs: 1000, completedSessions: 0 });
    database.close(); database = await openDatabase(name);
    expect((await learning.getByPlayerId('child')).bonusTimeMs).toBe(BONUS_GRANT_MS);
    expect(isActiveDay(await activity.getByDate('child', '2026-09-08'))).toBe(false);
  });
});
