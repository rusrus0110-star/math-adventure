import { localDateKey } from '@/domain/activity/activity';

export function splitLearningByLocalDay(start: number, end: number): { localDate: string; activeLearningMs: number }[] {
  const intervals = [];
  let cursor = start;
  while (cursor < end) {
    const date = new Date(cursor);
    const midnight = new Date(date);
    midnight.setHours(24, 0, 0, 0);
    const boundary = Math.min(end, midnight.getTime());
    intervals.push({ localDate: localDateKey(date), activeLearningMs: boundary - cursor });
    cursor = boundary;
  }
  return intervals;
}
