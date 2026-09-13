import { create } from 'zustand';
import { dependencies } from '@/app/dependencies';
import type { LearningInterval } from '@/domain/learning/ActiveLearningClock';
import { learningPathProgress, type LearningAccount, type LearningPathProgress } from '@/domain/learning/learning';
import type { DailyActivity } from '@/domain/activity/dailyGoal';
import { localDateKey } from '@/domain/activity/activity';

interface LearningState {
  playerId: string | null;
  account: LearningAccount | null;
  today: DailyActivity | null;
  path: LearningPathProgress | null;
  error: string | null;
  load: (playerId: string) => Promise<void>;
  record: (interval: LearningInterval) => Promise<void>;
  flush: () => Promise<void>;
}

let loadVersion = 0;
let saving = false;
const pending: LearningInterval[] = [];

export const useLearningStore = create<LearningState>((set, get) => ({
  playerId: null, account: null, today: null, path: null, error: null,
  load: async playerId => {
    const version = ++loadVersion;
    if (get().playerId !== playerId) set({ playerId, account: null, today: null, path: null, error: null });
    try {
      await get().flush();
      const [account, today] = await Promise.all([
        dependencies.learningRepository.getByPlayerId(playerId),
        dependencies.activityRepository.getByDate(playerId, localDateKey()),
      ]);
      if (version === loadVersion) set({ account, today, path: learningPathProgress(account), error: pending.length ? get().error : null });
    } catch (error) {
      if (version === loadVersion) set({ error: error instanceof Error ? error.message : 'Lernfortschritt konnte nicht geladen werden.' });
    }
  },
  record: async interval => {
    pending.push(interval);
    await get().flush();
  },
  flush: async () => {
    if (saving) return;
    saving = true;
    try {
      while (pending.length) {
        const interval = pending[0]!;
        const update = await dependencies.learningRepository.record(interval);
        pending.shift();
        const today = await dependencies.activityRepository.getByDate(interval.playerId, localDateKey());
        if (get().playerId === interval.playerId) {
          loadVersion += 1;
          set({ account: update.account, today, path: learningPathProgress(update.account, update.grantedMs > 0), error: null });
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Lernfortschritt konnte nicht gespeichert werden.' });
    } finally { saving = false; }
  },
}));
