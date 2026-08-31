import type { MotivationSettings } from '@/domain/motivation/motivation.types';

export interface MotivationRepository {
  getByPlayerId(playerId: string): Promise<MotivationSettings | null>;
  save(settings: MotivationSettings): Promise<void>;
}
