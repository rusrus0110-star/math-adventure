import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { GameSessionRecord, QuestionAttempt } from '@/domain/game/game.types';
import type { PlayerProfile, PlayerProgress } from '@/domain/player/player.types';

interface MathAdventureDb extends DBSchema {
  players: {
    key: string;
    value: PlayerProfile;
  };
  progress: {
    key: string;
    value: PlayerProgress;
  };
  sessions: {
    key: string;
    value: GameSessionRecord;
    indexes: { 'by-player': string };
  };
  attempts: {
    key: string;
    value: QuestionAttempt;
    indexes: {
      'by-player': string;
      'by-session': string;
    };
  };
}

let databasePromise: Promise<IDBPDatabase<MathAdventureDb>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<MathAdventureDb>> {
  if (!databasePromise) {
    databasePromise = openDB<MathAdventureDb>('math-adventure-db', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('players')) {
          database.createObjectStore('players', { keyPath: 'id' });
        }

        if (!database.objectStoreNames.contains('progress')) {
          database.createObjectStore('progress', { keyPath: 'playerId' });
        }

        if (!database.objectStoreNames.contains('sessions')) {
          const sessions = database.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-player', 'playerId');
        }

        if (!database.objectStoreNames.contains('attempts')) {
          const attempts = database.createObjectStore('attempts', { keyPath: 'id' });
          attempts.createIndex('by-player', 'playerId');
          attempts.createIndex('by-session', 'sessionId');
        }
      },
    });
  }

  return databasePromise;
}
