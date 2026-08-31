import { create } from 'zustand';
import { createPlayer as createPlayerUseCase } from '@/application/player/createPlayer';
import { dependencies } from '@/app/dependencies';
import type { PlayerProfile, PlayerProgress } from '@/domain/player/player.types';
import { createInitialProgress } from '@/domain/progression/progression.service';

const ACTIVE_PLAYER_KEY = 'math-adventure-active-player';

interface PlayerState {
  players: PlayerProfile[];
  activePlayer: PlayerProfile | null;
  progress: PlayerProgress | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  createPlayer: (name: string) => Promise<void>;
  selectPlayer: (playerId: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  players: [],
  activePlayer: null,
  progress: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      const players = await dependencies.playerRepository.list();
      const storedPlayerId = localStorage.getItem(ACTIVE_PLAYER_KEY);
      const activePlayer =
        players.find((player) => player.id === storedPlayerId) ?? players[0] ?? null;

      let progress: PlayerProgress | null = null;

      if (activePlayer) {
        progress =
          (await dependencies.progressRepository.getByPlayerId(activePlayer.id)) ??
          createInitialProgress(activePlayer.id);
        localStorage.setItem(ACTIVE_PLAYER_KEY, activePlayer.id);
      }

      set({ players, activePlayer, progress, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    }
  },

  createPlayer: async (name: string) => {
    const player = await createPlayerUseCase(name, dependencies);
    const players = [...get().players, player];
    const progress = createInitialProgress(player.id);
    localStorage.setItem(ACTIVE_PLAYER_KEY, player.id);
    set({ players, activePlayer: player, progress });
  },

  selectPlayer: async (playerId: string) => {
    const player = get().players.find((candidate) => candidate.id === playerId);

    if (!player) {
      throw new Error('Player was not found.');
    }

    const progress =
      (await dependencies.progressRepository.getByPlayerId(player.id)) ??
      createInitialProgress(player.id);

    localStorage.setItem(ACTIVE_PLAYER_KEY, player.id);
    set({ activePlayer: player, progress });
  },

  refreshProgress: async () => {
    const activePlayer = get().activePlayer;
    if (!activePlayer) return;

    const progress = await dependencies.progressRepository.getByPlayerId(activePlayer.id);
    set({ progress });
  },
}));
