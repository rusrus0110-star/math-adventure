import type { DailyActivity } from '@/domain/activity/dailyGoal';

export interface ActivityRepository {
  listByPlayerId(playerId: string): Promise<DailyActivity[]>;
  getByDate(playerId: string, localDate: string): Promise<DailyActivity>;
}
