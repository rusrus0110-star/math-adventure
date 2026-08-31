import type { PlayerProgress } from '@/domain/player/player.types';

export interface ProgressRepository {
  getByPlayerId(playerId: string): Promise<PlayerProgress | null>;
  save(progress: PlayerProgress): Promise<void>;
}
