import { create } from 'zustand';
import { dependencies } from '@/app/dependencies';
import {
  calculateWeeklyGoalProgress,
  createDefaultMotivationSettings,
  isRewardUnlocked,
} from '@/domain/motivation/motivation.service';
import type {
  MotivationSettings,
  WeeklyGoalProgress,
} from '@/domain/motivation/motivation.types';
import { getRealRewardById } from '@/domain/motivation/realRewards';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';

interface WeeklyGoalInput {
  enabled: boolean;
  rewardId: string;
  customTitle: string | null;
  requiredDays: number;
}

interface MotivationState {
  playerId: string | null;
  settings: MotivationSettings | null;
  weeklyProgress: WeeklyGoalProgress | null;
  isLoading: boolean;
  error: string | null;
  loadForPlayer: (playerId: string) => Promise<void>;
  refresh: (playerId: string) => Promise<void>;
  selectVirtualWish: (playerId: string, rewardId: string) => Promise<void>;
  equipVirtualReward: (playerId: string, rewardId: string, coins: number) => Promise<void>;
  saveWeeklyGoal: (playerId: string, input: WeeklyGoalInput) => Promise<void>;
}

async function readStateForPlayer(playerId: string): Promise<{ settings: MotivationSettings; weeklyProgress: WeeklyGoalProgress }> {
  let settings = await dependencies.motivationRepository.getByPlayerId(playerId);

  if (!settings) {
    settings = createDefaultMotivationSettings(playerId);
    await dependencies.motivationRepository.save(settings);
  }

  const sessions = await dependencies.sessionRepository.listByPlayerId(playerId);
  const weeklyProgress = calculateWeeklyGoalProgress(
    sessions,
    settings.weeklyRequiredDays,
  );

  return { settings, weeklyProgress };
}

export const useMotivationStore = create<MotivationState>((set, get) => ({
  playerId: null,
  settings: null,
  weeklyProgress: null,
  isLoading: false,
  error: null,

  loadForPlayer: async (playerId) => {
    if (get().playerId === playerId && get().settings) return;
    await get().refresh(playerId);
  },

  refresh: async (playerId) => {
    set({ isLoading: true, error: null });

    try {
      const { settings, weeklyProgress } = await readStateForPlayer(playerId);
      set({ playerId, settings, weeklyProgress, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Motivation konnte nicht geladen werden.',
      });
    }
  },

  selectVirtualWish: async (playerId, rewardId) => {
    const storeSettings = get().settings;
    const current: MotivationSettings =
      storeSettings?.playerId === playerId
        ? storeSettings
        : (await readStateForPlayer(playerId)).settings;

    if (!getVirtualRewardById(rewardId)) {
      throw new Error('Unknown virtual reward.');
    }

    const updated: MotivationSettings = {
      ...current,
      selectedVirtualRewardId: rewardId,
      updatedAt: new Date().toISOString(),
    };

    await dependencies.motivationRepository.save(updated);
    set({ playerId, settings: updated });
  },

  equipVirtualReward: async (playerId, rewardId, coins) => {
    const reward = getVirtualRewardById(rewardId);
    if (!reward || !isRewardUnlocked(reward, coins)) {
      throw new Error('This reward is still locked.');
    }

    const storeSettings = get().settings;
    const current: MotivationSettings =
      storeSettings?.playerId === playerId
        ? storeSettings
        : (await readStateForPlayer(playerId)).settings;

    const updated: MotivationSettings = {
      ...current,
      equippedVirtualRewardId: rewardId,
      updatedAt: new Date().toISOString(),
    };

    await dependencies.motivationRepository.save(updated);
    set({ playerId, settings: updated });
  },

  saveWeeklyGoal: async (playerId, input) => {
    if (!getRealRewardById(input.rewardId)) {
      throw new Error('Unknown real-world reward.');
    }

    const storeSettings = get().settings;
    const current: MotivationSettings =
      storeSettings?.playerId === playerId
        ? storeSettings
        : (await readStateForPlayer(playerId)).settings;

    const requiredDays = Math.min(7, Math.max(1, Math.round(input.requiredDays)));
    const customTitle = input.customTitle?.trim().slice(0, 50) || null;

    const updated: MotivationSettings = {
      ...current,
      weeklyGoalEnabled: input.enabled,
      weeklyRewardId: input.rewardId,
      weeklyCustomRewardTitle: customTitle,
      weeklyRequiredDays: requiredDays,
      updatedAt: new Date().toISOString(),
    };

    await dependencies.motivationRepository.save(updated);
    const sessions = await dependencies.sessionRepository.listByPlayerId(playerId);
    const weeklyProgress = calculateWeeklyGoalProgress(sessions, requiredDays);
    set({ playerId, settings: updated, weeklyProgress });
  },
}));
