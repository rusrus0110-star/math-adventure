import { create } from 'zustand';
import { dependencies } from '@/app/dependencies';
import { calculateWeeklyGoalProgress, createDefaultMotivationSettings, isRewardUnlocked } from '@/domain/motivation/motivation.service';
import type { MotivationSettings, WeeklyGoalProgress } from '@/domain/motivation/motivation.types';
import type { DailyActivity } from '@/domain/activity/dailyGoal';
import type { GameSessionRecord } from '@/domain/game/game.types';
import type { RewardClaim } from '@/domain/motivation/superPrizes';
import { getRealRewardById } from '@/domain/motivation/realRewards';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';

export interface WeeklyGoalInput {
  enabled: boolean;
  rewardId: string;
  requiredDays: number;
}

interface MotivationState {
  playerId: string | null;
  settings: MotivationSettings | null;
  weeklyProgress: WeeklyGoalProgress | null;
  activities: DailyActivity[];
  sessions: GameSessionRecord[];
  claims: RewardClaim[];
  isLoading: boolean;
  error: string | null;
  loadForPlayer: (playerId: string) => Promise<void>;
  refresh: (playerId: string) => Promise<void>;
  selectVirtualWish: (playerId: string, rewardId: string) => Promise<void>;
  equipVirtualReward: (playerId: string, rewardId: string | null) => Promise<void>;
  saveWeeklyGoal: (playerId: string, input: WeeklyGoalInput) => Promise<void>;
  claimReward: (playerId: string, rewardKey: string) => Promise<void>;
}

let loadVersion = 0;

async function readSettings(playerId: string) {
  return await dependencies.motivationRepository.getByPlayerId(playerId) ?? createDefaultMotivationSettings(playerId);
}

export const useMotivationStore = create<MotivationState>((set, get) => ({
  playerId: null, settings: null, weeklyProgress: null, activities: [], sessions: [], claims: [],
  isLoading: false, error: null,
  loadForPlayer: async (playerId) => {
    if (get().playerId !== playerId || !get().settings) await get().refresh(playerId);
  },
  refresh: async (playerId) => {
    const version = ++loadVersion;
    if (get().playerId !== playerId) set({ playerId, settings: null, weeklyProgress: null, activities: [], sessions: [], claims: [] });
    set({ isLoading: true, error: null });
    try {
      const [settings, activities, sessions, claims] = await Promise.all([
        readSettings(playerId), dependencies.activityRepository.listByPlayerId(playerId),
        dependencies.sessionRepository.listByPlayerId(playerId), dependencies.rewardClaimRepository.listByPlayerId(playerId),
      ]);
      const weeklyProgress = calculateWeeklyGoalProgress(activities, settings.weeklyRequiredDays);
      if (version === loadVersion) set({ playerId, settings, activities, sessions: sessions.sort((left, right) => right.completedAt.localeCompare(left.completedAt)), claims, weeklyProgress, isLoading: false });
    } catch (error) {
      if (version === loadVersion) set({ isLoading: false, error: error instanceof Error ? error.message : 'Fortschritt konnte nicht geladen werden.' });
    }
  },
  selectVirtualWish: async (playerId, rewardId) => {
    if (!getVirtualRewardById(rewardId)) throw new Error('Unbekanntes Accessoire.');
    const settings = await readSettings(playerId);
    await dependencies.motivationRepository.save({ ...settings, selectedVirtualRewardId: rewardId, updatedAt: new Date().toISOString() });
    if (get().playerId === playerId) await get().refresh(playerId);
  },
  equipVirtualReward: async (playerId, rewardId) => {
    if (rewardId !== null) {
      const reward = getVirtualRewardById(rewardId);
      const progress = await dependencies.progressRepository.getByPlayerId(playerId);
      if (!reward || !isRewardUnlocked(reward, progress?.coins ?? 0)) throw new Error('Dieses Accessoire ist noch gesperrt.');
    }
    const settings = await readSettings(playerId);
    const updated = { ...settings, equippedVirtualRewardId: rewardId, updatedAt: new Date().toISOString() };
    await dependencies.motivationRepository.save(updated);
    if (get().playerId === playerId) {
      loadVersion += 1;
      set({ settings: updated, isLoading: false });
    }
  },
  saveWeeklyGoal: async (playerId, input) => {
    if (!getRealRewardById(input.rewardId) || !Number.isInteger(input.requiredDays) || input.requiredDays < 3 || input.requiredDays > 7) {
      throw new Error('Bitte ein gültiges Wochenziel mit 3–7 Tagen auswählen.');
    }
    const settings = await readSettings(playerId);
    await dependencies.motivationRepository.save({
      ...settings, weeklyGoalEnabled: input.enabled, weeklyRewardId: input.rewardId,
      weeklyCustomRewardTitle: null, weeklyRequiredDays: input.requiredDays, updatedAt: new Date().toISOString(),
    });
    if (get().playerId === playerId) await get().refresh(playerId);
  },
  claimReward: async (playerId, rewardKey) => {
    await dependencies.rewardClaimRepository.claim(playerId, rewardKey);
    if (get().playerId === playerId) await get().refresh(playerId);
  },
}));
