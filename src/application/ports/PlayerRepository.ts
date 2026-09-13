import type { PlayerProfile, PlayerProgress } from '@/domain/player/player.types';

export interface PlayerRepository {
  createWithProgress(player: PlayerProfile, progress: PlayerProgress): Promise<void>;
  list(): Promise<PlayerProfile[]>;
  getById(playerId: string): Promise<PlayerProfile | null>;
  save(player: PlayerProfile): Promise<void>;
}
