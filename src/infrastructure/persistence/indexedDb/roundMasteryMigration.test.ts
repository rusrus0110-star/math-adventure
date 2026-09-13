import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import { expect, it } from 'vitest';
import { openDatabase, type MathAdventureDb } from './database';
import { IndexedDbGameCompletionRepository } from './IndexedDbGameCompletionRepository';
import { completeGameSession } from '@/application/game/completeGameSession';
import { LEVELS } from '@/domain/progression/levels';
import { createInitialProgress } from '@/domain/progression/progression.service';
import { createDefaultMotivationSettings } from '@/domain/motivation/motivation.service';
import { createLearningAccount, BONUS_GRANT_MS } from '@/domain/learning/learning';
import { sessionInput } from '@/test/fixtures';

it('upgrades version 5 by resetting only mastery, preserving history, unlocks, rewards and saved Bonuszeit', async () => {
  const name = crypto.randomUUID();
  const previous = await openDB<MathAdventureDb>(name, 5, {
    upgrade(database) {
      database.createObjectStore('players', { keyPath: 'id' });
      database.createObjectStore('progress', { keyPath: 'playerId' });
      database.createObjectStore('sessions', { keyPath: 'id' }).createIndex('by-player', 'playerId');
      const attempts = database.createObjectStore('attempts', { keyPath: 'id' });
      attempts.createIndex('by-player', 'playerId');
      attempts.createIndex('by-session', 'sessionId');
      database.createObjectStore('motivation', { keyPath: 'playerId' });
      database.createObjectStore('activity', { keyPath: ['playerId', 'localDate'] }).createIndex('by-player', 'playerId');
      database.createObjectStore('claims', { keyPath: ['playerId', 'rewardKey'] }).createIndex('by-player', 'playerId');
      database.createObjectStore('learning', { keyPath: 'playerId' });
    },
  });
  const input = sessionInput('child', 10);
  const original = { ...createInitialProgress('child'), coins: 900, totalScore: 1234, bestStreak: 10,
    totalCorrectAnswers: 50, totalQuestionsAnswered: 50, unlockedLevelIds: LEVELS.map(level => level.id),
    levelStars: Object.fromEntries(LEVELS.map(level => [level.id, 7])) };
  await previous.put('players', { id: 'child', name: 'Mia', characterId: 'placeholder-cat', createdAt: input.session.startedAt, updatedAt: input.session.startedAt });
  await previous.put('progress', original);
  for (const level of LEVELS) {
    await previous.put('sessions', { ...input.session, id: level.id, levelId: level.id, coinsEarned: 19, activityCoins: 0, stars: 7,
      mastery: { previousBestStars: 0, unlockedLevelId: null } });
  }
  for (const attempt of input.attempts) await previous.put('attempts', attempt);
  await previous.put('motivation', { ...createDefaultMotivationSettings('child'), equippedVirtualRewardId: 'bow' });
  await previous.put('activity', { playerId: 'child', localDate: input.session.localDate, firstSessionId: 'addition-5' });
  await previous.put('claims', { playerId: 'child', rewardKey: 'super:shopping', rewardName: 'Shopping', claimedAt: input.session.completedAt });
  await previous.put('learning', { ...createLearningAccount('child'), bonusTimeMs: BONUS_GRANT_MS * 2, learningProgressMs: 123_000 });
  const unchanged = ['players', 'sessions', 'attempts', 'motivation', 'activity', 'claims', 'learning'] as const;
  const before = await Promise.all(unchanged.map(store => previous.getAll(store)));
  previous.close();
  let database = await openDatabase(name);
  try {
    expect(await Promise.all(unchanged.map(store => database.getAll(store)))).toEqual(before);
    expect(await database.get('progress', 'child')).toEqual({ ...original, levelStars: Object.fromEntries(LEVELS.map(level => [level.id, 0])) });
    const repository = new IndexedDbGameCompletionRepository(async () => database);
    const retryLegacy = { ...input, session: { ...input.session, id: 'addition-5' }, attempts: input.attempts.map(attempt => ({ ...attempt, sessionId: 'addition-5' })) };
    expect((await completeGameSession(retryLegacy, { gameCompletionRepository: repository })).mastery).toBeNull();
    expect((await database.get('progress', 'child'))?.levelStars['addition-5']).toBe(0);
    const fresh = sessionInput('child', 10);
    const result = await completeGameSession(fresh, { gameCompletionRepository: repository });
    expect(result.mastery).toMatchObject({ newBestStars: 1, unlockedLevelId: null });
    expect((await database.get('sessions', fresh.session.id))?.masteryVersion).toBe('successful-rounds-v1');
    database.close();
    database = await openDatabase(name);
    expect((await database.get('progress', 'child'))?.levelStars['addition-5']).toBe(1);
    expect((await database.get('progress', 'child'))?.unlockedLevelIds).toEqual(original.unlockedLevelIds);
    expect(await database.getAll('learning')).toEqual(before[6]);
  } finally {
    database.close();
    await deleteDB(name);
  }
});
