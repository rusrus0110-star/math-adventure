import type { ActivityDay } from '@/domain/activity/activity';

export interface ActivityRepository {
  listByPlayerId(playerId: string): Promise<ActivityDay[]>;
}
