import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import type { GameSessionRecord, QuestionAttempt } from '@/domain/game/game.types';
import type { MotivationSettings } from '@/domain/motivation/motivation.types';
import type { RewardClaim } from '@/domain/motivation/superPrizes';
import type { ActivityDay } from '@/domain/activity/activity';
import type { PlayerProfile, PlayerProgress } from '@/domain/player/player.types';
import { localDateKey } from '@/domain/activity/activity';
import { calculateStars } from '@/domain/game/services/calculateRewards';
import { isCurrentCurriculumSession } from '@/domain/game/curriculum';
import { LEVELS } from '@/domain/progression/levels';
import { DEFAULT_WEEKLY_REWARD_ID, getRealRewardById } from '@/domain/motivation/realRewards';

export interface MathAdventureDb extends DBSchema {
  players: { key: string; value: PlayerProfile };
  progress: { key: string; value: PlayerProgress };
  sessions: { key: string; value: GameSessionRecord; indexes: { 'by-player': string } };
  attempts: { key: string; value: QuestionAttempt; indexes: { 'by-player': string; 'by-session': string } };
  motivation: { key: string; value: MotivationSettings };
  activity: { key: [string, string]; value: ActivityDay; indexes: { 'by-player': string } };
  claims: { key: [string, string]; value: RewardClaim; indexes: { 'by-player': string } };
}

export const DATABASE_VERSION = 5;
export type DatabaseProvider = () => Promise<IDBPDatabase<MathAdventureDb>>;
type UpgradeTransaction = IDBPTransaction<MathAdventureDb, ('players' | 'progress' | 'sessions' | 'attempts' | 'motivation' | 'activity' | 'claims')[], 'versionchange'>;

async function migrateHistory(transaction: UpgradeTransaction) {
  const sessions = await transaction.objectStore('sessions').getAll();
  const activityDates = new Set<string>();
  sessions.sort((left, right) => left.completedAt.localeCompare(right.completedAt) || left.id.localeCompare(right.id));
  for (const session of sessions) {
    const count = session.correctAnswers + session.wrongAnswers;
    const stars = calculateStars(count > 0 ? session.correctAnswers / count : 0);
    const date = new Date(session.completedAt);
    const localDate = Number.isFinite(date.getTime()) ? localDateKey(date) : '';
    await transaction.objectStore('sessions').put({ ...session, stars, activityCoins: 0, localDate });
    const activityKey = JSON.stringify([session.playerId, localDate]);
    if (count === 10 && localDate && !activityDates.has(activityKey)) {
      await transaction.objectStore('activity').put({ playerId: session.playerId, localDate, firstSessionId: session.id });
      activityDates.add(activityKey);
    }
  }
  let cursor = await transaction.objectStore('attempts').openCursor();
  while (cursor) {
    await cursor.update({ ...cursor.value, operation: cursor.value.operation ?? 'addition' });
    cursor = await cursor.continue();
  }
  for (const settings of await transaction.objectStore('motivation').getAll()) {
    await transaction.objectStore('motivation').put({
      ...settings,
      weeklyRequiredDays: Math.min(7, Math.max(3, Math.round(settings.weeklyRequiredDays) || 4)),
    });
  }
}

async function migrateMixedMastery(transaction: UpgradeTransaction) {
  const sessions = await transaction.objectStore('sessions').getAll();
  for (const progress of await transaction.objectStore('progress').getAll()) {
    const levelStars = { ...progress.levelStars, ...Object.fromEntries(LEVELS.map(level => [level.id, 0])) };
    for (const session of sessions) {
      if (session.playerId !== progress.playerId || !isCurrentCurriculumSession(session) ||
          !LEVELS.some(level => level.id === session.levelId)) continue;
      levelStars[session.levelId] = Math.max(levelStars[session.levelId] ?? 0, calculateStars(session.correctAnswers / 10));
    }
    await transaction.objectStore('progress').put({ ...progress, levelStars });
  }
}

async function migrate(transaction: UpgradeTransaction, oldVersion: number) {
  if (oldVersion < 3) await migrateHistory(transaction);
  if (oldVersion < 4) await migrateMixedMastery(transaction);
  if (oldVersion < 5) {
    for (const settings of await transaction.objectStore('motivation').getAll()) {
      if (!getRealRewardById(settings.weeklyRewardId)) {
        await transaction.objectStore('motivation').put({ ...settings, weeklyRewardId: DEFAULT_WEEKLY_REWARD_ID, weeklyCustomRewardTitle: null });
      }
    }
  }
}

export function openDatabase(name = 'math-adventure-db'): Promise<IDBPDatabase<MathAdventureDb>> {
  return openDB<MathAdventureDb>(name, DATABASE_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      if (!database.objectStoreNames.contains('players')) database.createObjectStore('players', { keyPath: 'id' });
      if (!database.objectStoreNames.contains('progress')) database.createObjectStore('progress', { keyPath: 'playerId' });
      if (!database.objectStoreNames.contains('sessions')) {
        database.createObjectStore('sessions', { keyPath: 'id' }).createIndex('by-player', 'playerId');
      }
      if (!database.objectStoreNames.contains('attempts')) {
        const attempts = database.createObjectStore('attempts', { keyPath: 'id' });
        attempts.createIndex('by-player', 'playerId');
        attempts.createIndex('by-session', 'sessionId');
      }
      if (!database.objectStoreNames.contains('motivation')) database.createObjectStore('motivation', { keyPath: 'playerId' });
      if (!database.objectStoreNames.contains('activity')) {
        database.createObjectStore('activity', { keyPath: ['playerId', 'localDate'] }).createIndex('by-player', 'playerId');
      }
      if (!database.objectStoreNames.contains('claims')) {
        database.createObjectStore('claims', { keyPath: ['playerId', 'rewardKey'] }).createIndex('by-player', 'playerId');
      }
      if (oldVersion > 0 && oldVersion < DATABASE_VERSION) {
        void migrate(transaction, oldVersion).catch(() => transaction.abort());
      }
    },
    blocking() {
      void databasePromise?.then(database => database.close());
      databasePromise = null;
    },
    terminated() { databasePromise = null; },
  });
}

let databasePromise: Promise<IDBPDatabase<MathAdventureDb>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<MathAdventureDb>> {
  databasePromise ??= openDatabase().catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}
