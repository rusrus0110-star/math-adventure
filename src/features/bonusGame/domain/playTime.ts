import { MAX_BONUS_MS } from '@/domain/learning/learning';

export const CHECKPOINT_MS = 2000;
export const RUN_LEASE_MS = 10_000;
export function availableSessionDuration(balance: number): number {
  return Number.isFinite(balance) ? Math.min(MAX_BONUS_MS, Math.max(0, balance)) : 0;
}
export class ActivePlayTime {
  elapsedMs = 0;
  constructor(public limitMs: number) {}
  advance(deltaMs: number, active: boolean) {
    if (active && Number.isFinite(deltaMs)) this.elapsedMs = Math.min(this.limitMs, this.elapsedMs + Math.max(0, Math.min(250, deltaMs)));
  }
  get remainingMs() { return Math.max(0, this.limitMs - this.elapsedMs); }
}
export function formatPlayTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
