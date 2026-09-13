import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteDB, openDB, type IDBPDatabase } from 'idb';
import { openDatabase, type MathAdventureDb } from './database';
import { IndexedDbGameCompletionRepository } from './IndexedDbGameCompletionRepository';
import { IndexedDbActivityRepository } from './IndexedDbActivityRepository';
import { IndexedDbRewardClaimRepository } from './IndexedDbRewardClaimRepository';
import { completeGameSession } from '@/application/game/completeGameSession';
import { createInitialProgress } from '@/domain/progression/progression.service';
import { createDefaultMotivationSettings } from '@/domain/motivation/motivation.service';
import { weekDates } from '@/domain/activity/activity';
import { sessionInput } from '@/test/fixtures';
import { LEVELS } from '@/domain/progression/levels';

let name: string;
let database: IDBPDatabase<MathAdventureDb>;
let repository: IndexedDbGameCompletionRepository;

beforeEach(async () => {
  name = crypto.randomUUID();
  database = await openDatabase(name);
  repository = new IndexedDbGameCompletionRepository(async () => database);
});
afterEach(async () => {
  database.close();
  await deleteDB(name);
});
const finish = (input = sessionInput()) => completeGameSession(input, { gameCompletionRepository: repository });

describe('transactional session completion', () => {
  it('rejects unversioned sessions and addition-only sessions before writing', async () => {
    const input = sessionInput();
    const { questionSetVersion, ...unversioned } = input.session;
    expect(questionSetVersion).toBe('mixed-v1');
    await expect(finish({ ...input, session: unversioned })).rejects.toThrow('gemischte Runde');
    await expect(finish({ ...input, attempts: input.attempts.map(attempt => ({ ...attempt, operation: 'addition' })) })).rejects.toThrow('gemischte Runde');
    expect(await database.count('sessions')).toBe(0);
    expect(await database.count('progress')).toBe(0);
  });
  it('awards +5 once per local day, independent of accuracy, and survives reopening', async () => {
    expect(await finish(sessionInput('child', 0, new Date(2026, 8, 7, 12)))).toMatchObject({ stars: 0, coinsEarned: 8, activityCoins: 5 });
    expect((await finish(sessionInput('child', 0, new Date(2026, 8, 7, 23, 59)))).activityCoins).toBe(0);
    database.close();
    database = await openDatabase(name);
    const activityRepository = new IndexedDbActivityRepository(async () => database);
    expect(await activityRepository.listByPlayerId('child')).toHaveLength(1);
    expect((await finish(sessionInput('child', 0, new Date(2026, 8, 8, 0, 1)))).activityCoins).toBe(5);
    expect((await activityRepository.listByPlayerId('child')).map(day => day.localDate)).toEqual(['2026-09-07', '2026-09-08']);
    expect((await database.get('progress', 'child'))?.coins).toBe(19);
  });
  it('is idempotent even for simultaneous retries', async () => {
    const input = sessionInput();
    const results = await Promise.all([finish(input), finish(input)]);
    expect(results[0]).toEqual(results[1]);
    expect((await database.get('progress', 'child'))?.coins).toBe(18);
    expect(await database.count('sessions')).toBe(1);
    expect(await database.count('attempts')).toBe(10);
    expect(await database.count('activity')).toBe(1);
  });
  it('does not lose progress or duplicate daily bonuses across concurrent sessions', async () => {
    const results = await Promise.all([finish(), finish()]);
    expect(results.reduce((sum, result) => sum + result.activityCoins, 0)).toBe(5);
    expect(results.filter(result => result.mastery?.isNewBest)).toHaveLength(1);
    expect(results.filter(result => result.mastery?.unlockedLevelId)).toHaveLength(1);
    const progress = await database.get('progress', 'child');
    expect(progress?.coins).toBe(31);
    expect(progress?.totalQuestionsAnswered).toBe(20);
    expect(progress?.levelStars['addition-5']).toBe(5);
    expect(progress?.unlockedLevelIds).toContain('addition-10');
  });
  it('keeps players independent', async () => {
    const results = await Promise.all([finish(sessionInput('first')), finish(sessionInput('second'))]);
    expect(results.map(result => result.activityCoins)).toEqual([5, 5]);
    expect(await database.count('activity')).toBe(2);
  });
  it('rejects incomplete sessions without writing anything', async () => {
    const input = sessionInput();
    await expect(finish({ ...input, attempts: input.attempts.slice(0, 9) })).rejects.toThrow();
    expect(await database.count('sessions')).toBe(0);
    expect(await database.count('activity')).toBe(0);
  });
  it('rolls back all writes on attempt conflicts', async () => {
    const first = sessionInput();
    await finish(first);
    const second = sessionInput();
    const attempts = second.attempts.map((attempt, index) => index === 5 ? { ...attempt, id: first.attempts[0]!.id } : attempt);
    await expect(finish({ ...second, attempts })).rejects.toThrow();
    expect(await database.count('sessions')).toBe(1);
    expect(await database.count('attempts')).toBe(10);
    expect((await database.get('progress', 'child'))?.coins).toBe(18);
  });
});

describe('persisted mastery feedback', () => {
  it('captures improvement from four to six stars without extra mastery coins', async () => {
    await database.put('progress', { ...createInitialProgress('child'), levelStars: { 'addition-5': 4 } });
    const result = await finish(sessionInput('child', 9));
    expect(result).toMatchObject({ stars: 6, coinsEarned: 21, activityCoins: 5, mastery: {
      previousBestStars: 4, sessionStars: 6, newBestStars: 6, isNewBest: true,
      newStarNumbers: [5, 6], unlockedLevelId: 'addition-10', fullMastery: false,
    } });
  });
  it('unlocks the next level at five stars only once, including equal and worse replays', async () => {
    expect((await finish()).mastery).toMatchObject({ sessionStars: 5, isNewBest: true, unlockedLevelId: 'addition-10' });
    expect(await finish()).toMatchObject({ coinsEarned: 13, activityCoins: 0, mastery: {
      previousBestStars: 5, sessionStars: 5, newBestStars: 5, isNewBest: false, newStarNumbers: [], unlockedLevelId: null,
    } });
    expect((await finish(sessionInput('child', 7))).mastery).toMatchObject({ sessionStars: 4, newBestStars: 5, isNewBest: false, newStarNumbers: [], unlockedLevelId: null });
  });
  it('preserves original feedback on retries after later progress and database reopening', async () => {
    const first = sessionInput();
    const original = await finish(first);
    expect((await finish(sessionInput('child', 10))).mastery).toMatchObject({ previousBestStars: 5, newStarNumbers: [6, 7], fullMastery: true, unlockedLevelId: null });
    database.close();
    database = await openDatabase(name);
    expect(await finish(first)).toEqual(original);
    expect(await database.count('sessions')).toBe(2);
    expect((await database.get('progress', 'child'))?.levelStars['addition-5']).toBe(7);
  });
  it('keeps legacy session rewards without inventing historical improvement events', async () => {
    const input = sessionInput();
    const result = await finish(input);
    const persisted = (await database.get('sessions', input.session.id))!;
    const { mastery, ...legacy } = persisted;
    expect(mastery).toBeDefined();
    await database.put('sessions', legacy);
    expect(await finish(input)).toEqual({ ...result, mastery: null });
  });
});

describe('explicit reward claims', () => {
  it('rejects locked prizes, records unlocked claims once, and never spends coins', async () => {
    const claims = new IndexedDbRewardClaimRepository(async () => database);
    await database.put('progress', { ...createInitialProgress('child'), coins: 499 });
    await expect(claims.claim('child', 'super:shopping')).rejects.toThrow('noch nicht');
    await database.put('progress', { ...createInitialProgress('child'), coins: 500 });
    expect(await claims.listByPlayerId('child')).toHaveLength(0);
    await Promise.all([claims.claim('child', 'super:shopping'), claims.claim('child', 'super:shopping')]);
    database.close();
    database = await openDatabase(name);
    expect(await claims.listByPlayerId('child')).toHaveLength(1);
    expect((await database.get('progress', 'child'))?.coins).toBe(500);
    expect(await claims.listByPlayerId('another-child')).toHaveLength(0);
  });
  it('requires distinct weekly training days and an explicit parent claim', async () => {
    const claims = new IndexedDbRewardClaimRepository(async () => database);
    const now = new Date(2026, 8, 9, 15);
    const key = `weekly:${weekDates(now)[0]}`;
    await database.put('motivation', { ...createDefaultMotivationSettings('child'), weeklyGoalEnabled: true, weeklyRequiredDays: 3 });
    await finish(sessionInput('child', 0, new Date(2026, 8, 7, 12)));
    await finish(sessionInput('child', 0, new Date(2026, 8, 7, 13)));
    await expect(claims.claim('child', key, now)).rejects.toThrow();
    await finish(sessionInput('child', 0, new Date(2026, 8, 8, 12)));
    await finish(sessionInput('child', 0, new Date(2026, 8, 9, 12)));
    expect(await claims.listByPlayerId('child')).toHaveLength(0);
    await claims.claim('child', key, now);
    expect((await claims.listByPlayerId('child'))[0]?.rewardName).toBe('Eis essen');
    await expect(claims.claim('child', 'weekly:2026-09-14', new Date(2026, 8, 14))).rejects.toThrow();
  });
});

describe('weekly catalog migration', () => {
  it('migrates invalid version-4 selections without changing progress, history, or valid selections', async () => {
    database.close();
    await deleteDB(name);
    const previous = await openDB<MathAdventureDb>(name, 4, {
      upgrade(legacy) {
        legacy.createObjectStore('players', { keyPath: 'id' });
        legacy.createObjectStore('progress', { keyPath: 'playerId' });
        legacy.createObjectStore('sessions', { keyPath: 'id' }).createIndex('by-player', 'playerId');
        const attempts = legacy.createObjectStore('attempts', { keyPath: 'id' });
        attempts.createIndex('by-player', 'playerId');
        attempts.createIndex('by-session', 'sessionId');
        legacy.createObjectStore('motivation', { keyPath: 'playerId' });
        legacy.createObjectStore('activity', { keyPath: ['playerId', 'localDate'] }).createIndex('by-player', 'playerId');
        legacy.createObjectStore('claims', { keyPath: ['playerId', 'rewardKey'] }).createIndex('by-player', 'playerId');
      },
    });
    const invalidIds = ['shopping', 'excursion', 'yes-day', 'swimming', 'crafting', 'custom', 'unknown'];
    const validIds = ['ice-cream', 'playground', 'movie', 'favorite-food'];
    const settings = [...invalidIds, ...validIds].map(weeklyRewardId => ({
      ...createDefaultMotivationSettings(weeklyRewardId), weeklyRewardId, weeklyGoalEnabled: true,
      weeklyRequiredDays: 5, equippedVirtualRewardId: 'bow', weeklyCustomRewardTitle: weeklyRewardId === 'custom' ? 'Shopping' : null,
    }));
    for (const value of settings) await previous.put('motivation', value);
    const input = sessionInput();
    await previous.put('players', { id: 'child', name: 'Mia', characterId: 'mia-cat', createdAt: input.session.startedAt, updatedAt: input.session.startedAt });
    await previous.put('progress', { ...createInitialProgress('child'), coins: 777, totalScore: 900, levelStars: { 'addition-5': 5, 'addition-10': 6 }, unlockedLevelIds: LEVELS.map(level => level.id) });
    await previous.put('sessions', { ...input.session, coinsEarned: 18, activityCoins: 5, stars: 5 });
    for (const attempt of input.attempts) await previous.put('attempts', attempt);
    await previous.put('activity', { playerId: 'child', localDate: input.session.localDate, firstSessionId: input.session.id });
    await previous.put('claims', { playerId: 'child', rewardKey: 'super:ice-cream', rewardName: 'Eis essen', claimedAt: input.session.completedAt });
    const unchangedStores = ['players', 'progress', 'sessions', 'attempts', 'activity', 'claims'] as const;
    const before = await Promise.all(unchangedStores.map(store => previous.getAll(store)));
    previous.close();

    database = await openDatabase(name);
    expect(database.version).toBe(5);
    expect(await Promise.all(unchangedStores.map(store => database.getAll(store)))).toEqual(before);
    for (const original of settings) {
      expect(await database.get('motivation', original.playerId)).toEqual(invalidIds.includes(original.weeklyRewardId)
        ? { ...original, weeklyRewardId: 'ice-cream', weeklyCustomRewardTitle: null } : original);
    }
    const updated = { ...settings[0]!, weeklyRewardId: 'movie' };
    await database.put('motivation', updated);
    database.close();
    database = await openDatabase(name);
    expect(await database.get('motivation', updated.playerId)).toEqual(updated);
    expect(await Promise.all(unchangedStores.map(store => database.getAll(store)))).toEqual(before);
  });
});

describe('versioned migrations', () => {
  it.each([1, 2, 3])('preserves version %i data while excluding unversioned history from mixed mastery', async version => {
    database.close();
    await deleteDB(name);
    const legacy = await openDB(name, version, {
      upgrade(legacyDatabase) {
        legacyDatabase.createObjectStore('players', { keyPath: 'id' });
        legacyDatabase.createObjectStore('progress', { keyPath: 'playerId' });
        legacyDatabase.createObjectStore('sessions', { keyPath: 'id' }).createIndex('by-player', 'playerId');
        const attempts = legacyDatabase.createObjectStore('attempts', { keyPath: 'id' });
        attempts.createIndex('by-player', 'playerId'); attempts.createIndex('by-session', 'sessionId');
        if (version >= 2) legacyDatabase.createObjectStore('motivation', { keyPath: 'playerId' });
        if (version === 3) {
          legacyDatabase.createObjectStore('activity', { keyPath: ['playerId', 'localDate'] }).createIndex('by-player', 'playerId');
          legacyDatabase.createObjectStore('claims', { keyPath: ['playerId', 'rewardKey'] }).createIndex('by-player', 'playerId');
        }
      },
    });
    const input = sessionInput('child', 10);
    await legacy.put('players', { id: 'child', name: 'Mia', characterId: 'placeholder-cat', createdAt: '2026-01-01', updatedAt: '2026-01-01' });
    const originalProgress = { ...createInitialProgress('child'), coins: 123, totalScore: 800,
      levelStars: Object.fromEntries(LEVELS.map(level => [level.id, version === 3 ? 7 : 3])), unlockedLevelIds: LEVELS.map(level => level.id) };
    await legacy.put('progress', originalProgress);
    const { localDate, questionSetVersion, ...legacySession } = input.session;
    expect(questionSetVersion).toBe('mixed-v1');
    expect(localDate).toBe('2026-09-07');
    for (const level of LEVELS) {
      await legacy.put('sessions', { ...legacySession, id: level.id === 'addition-5' ? input.session.id : level.id, levelId: level.id, coinsEarned: 13,
        ...(version === 3 ? { stars: 7, activityCoins: 0, localDate } : {}) });
    }
    const { operation, ...legacyAttempt } = input.attempts[0]!;
    expect(operation).toBe('addition');
    await legacy.put('attempts', legacyAttempt);
    if (version >= 2) await legacy.put('motivation', { ...createDefaultMotivationSettings('child'), weeklyGoalEnabled: true, equippedVirtualRewardId: 'bow' });
    if (version === 3) {
      await legacy.put('activity', { playerId: 'child', localDate, firstSessionId: input.session.id });
      await legacy.put('claims', { playerId: 'child', rewardKey: 'super:ice-cream', rewardName: 'Eis essen', claimedAt: input.session.completedAt });
      await legacy.put('progress', { ...createInitialProgress('mixed-child'), levelStars: { 'addition-5': 7, 'addition-10': 7 } });
      await legacy.put('progress', { ...createInitialProgress('no-history'), levelStars: { 'addition-5': 7, 'archived-level': 2 } });
      for (const [levelId, correct] of [['addition-5', 8], ['addition-5', 6], ['addition-10', 6]] as const) {
        const mixed = sessionInput('mixed-child', correct);
        await legacy.put('sessions', { ...mixed.session, levelId, coinsEarned: 0, stars: 7, activityCoins: 0 });
      }
    }
    legacy.close();
    database = await openDatabase(name);
    expect((await database.get('players', 'child'))?.name).toBe('Mia');
    expect(await database.get('progress', 'child')).toEqual({ ...originalProgress, levelStars: Object.fromEntries(LEVELS.map(level => [level.id, 0])) });
    expect((await database.get('sessions', input.session.id))).toMatchObject({ coinsEarned: 13, stars: 7, activityCoins: 0, localDate: '2026-09-07' });
    expect((await database.get('sessions', input.session.id))?.questionSetVersion).toBeUndefined();
    expect(await database.count('sessions')).toBe(version === 3 ? 8 : 5);
    expect(await database.get('attempts', legacyAttempt.id)).toEqual(version === 3 ? legacyAttempt : { ...legacyAttempt, operation: 'addition' });
    expect(await database.count('activity')).toBe(1);
    if (version >= 2) expect(await database.get('motivation', 'child')).toMatchObject({ weeklyGoalEnabled: true, equippedVirtualRewardId: 'bow' });
    if (version === 3) {
      expect(await database.get('claims', ['child', 'super:ice-cream'])).toMatchObject({ rewardName: 'Eis essen', claimedAt: input.session.completedAt });
      expect((await database.get('progress', 'mixed-child'))?.levelStars).toEqual({ 'addition-5': 5, 'addition-10': 3, 'addition-20': 0, 'tens-100': 0, 'addition-100': 0 });
      expect((await database.get('progress', 'no-history'))?.levelStars).toEqual({ 'addition-5': 0, 'addition-10': 0, 'addition-20': 0, 'tens-100': 0, 'addition-100': 0, 'archived-level': 2 });
    }
    expect((await finish(sessionInput()))).toMatchObject({ activityCoins: 0, coinsEarned: 13 });
    expect((await database.get('progress', 'child'))?.levelStars).toEqual({ 'addition-5': 5, 'addition-10': 0, 'addition-20': 0, 'tens-100': 0, 'addition-100': 0 });
    database.close();
    database = await openDatabase(name);
    expect((await database.get('progress', 'child'))?.coins).toBe(136);
    expect((await database.get('progress', 'child'))?.levelStars['addition-5']).toBe(5);
    await finish(sessionInput('child', 6));
    expect((await database.get('progress', 'child'))?.levelStars['addition-5']).toBe(5);
  });
});
