export const REQUIRED_LEARNING_MS = 15 * 60_000;
export const BONUS_GRANT_MS = 5 * 60_000;
export const MAX_BONUS_MS = 20 * 60_000;
export const LEARNING_SEGMENTS = 5;

export interface LearningAccount {
  playerId: string;
  learningProgressMs: number;
  bonusTimeMs: number;
  totalActiveMs: number;
  lastCreditedAt: number;
}

export interface LearningUpdate {
  account: LearningAccount;
  grantedMs: number;
}

export function createLearningAccount(playerId: string): LearningAccount {
  return { playerId, learningProgressMs: 0, bonusTimeMs: 0, totalActiveMs: 0, lastCreditedAt: 0 };
}

export function addActiveLearning(account: LearningAccount, activeMs: number): LearningUpdate {
  if (!Number.isFinite(activeMs) || activeMs < 0) throw new Error('Ungültige aktive Lernzeit.');
  const full = account.bonusTimeMs >= MAX_BONUS_MS;
  const accumulated = full ? 0 : account.learningProgressMs + activeMs;
  const cycles = Math.floor(accumulated / REQUIRED_LEARNING_MS);
  const grantedMs = Math.min(cycles * BONUS_GRANT_MS, Math.max(0, MAX_BONUS_MS - account.bonusTimeMs));
  const bonusTimeMs = account.bonusTimeMs + grantedMs;
  return {
    account: { ...account, bonusTimeMs, totalActiveMs: account.totalActiveMs + activeMs,
      learningProgressMs: bonusTimeMs >= MAX_BONUS_MS ? 0 : accumulated % REQUIRED_LEARNING_MS },
    grantedMs,
  };
}

export function spendBonusTime(account: LearningAccount, durationMs: number): LearningAccount {
  if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > account.bonusTimeMs) throw new Error('Nicht genügend Bonuszeit.');
  return { ...account, bonusTimeMs: account.bonusTimeMs - durationMs };
}

export function learningPathProgress(account: LearningAccount, justGranted = false) {
  const full = account.bonusTimeMs >= MAX_BONUS_MS;
  const progress = full || justGranted ? 1 : Math.max(0, Math.min(1, account.learningProgressMs / REQUIRED_LEARNING_MS));
  return {
    progress, completedSegments: Math.floor(progress * LEARNING_SEGMENTS), full,
    bonusAvailable: account.bonusTimeMs > 0,
    label: full ? 'Dein Bonus-Spiel-Speicher ist voll!' : justGranted ? 'Bonus-Spiel freigeschaltet!' : progress >= 0.8 ? 'Fast geschafft!' : 'Auf dem Weg zum Bonus-Spiel',
  };
}

export type LearningPathProgress = ReturnType<typeof learningPathProgress>;
