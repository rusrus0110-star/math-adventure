import type { PlayerProfile } from '@/domain/player/player.types';

export interface PlayerRepository {
  list(): Promise<PlayerProfile[]>;
  getById(playerId: string): Promise<PlayerProfile | null>;
  save(player: PlayerProfile): Promise<void>;
}
