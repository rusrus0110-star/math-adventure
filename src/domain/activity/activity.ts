import { isActiveDay, type DailyActivity } from './dailyGoal';

export const DAILY_ACTIVITY_COINS = 5;
export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

export interface ActivityDay {
  playerId: string;
  localDate: string;
  firstSessionId: string;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function weekDates(now = new Date()): string[] {
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return WEEKDAY_LABELS.map((_value, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return localDateKey(date);
  });
}

export function weeklyActivity(days: readonly Pick<DailyActivity, 'localDate' | 'completedSessions' | 'activeLearningMs'>[], now = new Date()): string[] {
  const week = new Set(weekDates(now));
  return [...new Set(days.filter(isActiveDay).map(day => day.localDate).filter(date => week.has(date)))].sort();
}

export function dailyActivityBonus(alreadyActive: boolean, questionCount: number): number {
  return !alreadyActive && questionCount === 10 ? DAILY_ACTIVITY_COINS : 0;
}
