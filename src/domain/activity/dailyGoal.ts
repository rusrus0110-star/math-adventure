export const DAILY_ROUNDS_TARGET = 5;
export const DAILY_LEARNING_TARGET_MS = 20 * 60_000;
export const DAILY_PATH_SEGMENTS = 5;

export interface DailyActivity {
  playerId: string;
  localDate: string;
  completedSessions: number;
  activeLearningMs: number;
}

export function createDailyActivity(playerId: string, localDate: string): DailyActivity {
  return { playerId, localDate, completedSessions: 0, activeLearningMs: 0 };
}

export function isActiveDay(day: Pick<DailyActivity, 'completedSessions' | 'activeLearningMs'>): boolean {
  return day.completedSessions >= DAILY_ROUNDS_TARGET || day.activeLearningMs >= DAILY_LEARNING_TARGET_MS;
}

export function dailyGoalProgress(day: DailyActivity) {
  const timeProgress = Math.min(1, Math.max(0, day.activeLearningMs / DAILY_LEARNING_TARGET_MS));
  const roundProgress = Math.min(1, Math.max(0, day.completedSessions / DAILY_ROUNDS_TARGET));
  return {
    completed: isActiveDay(day), timeProgress, roundProgress,
    timeSegments: Math.floor(timeProgress * DAILY_PATH_SEGMENTS),
    roundSegments: Math.floor(roundProgress * DAILY_PATH_SEGMENTS),
  };
}
