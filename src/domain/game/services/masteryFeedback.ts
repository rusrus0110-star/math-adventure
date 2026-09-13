import { MAX_STARS } from './calculateRewards';

export const MASTERY_VERSION = 'successful-rounds-v1';

export interface MasterySnapshot {
  previousBestStars: number;
  unlockedLevelId: string | null;
}

export interface MasteryFeedback extends MasterySnapshot {
  sessionStars: number;
  newBestStars: number;
  isNewBest: boolean;
  newStarNumbers: number[];
  fullMastery: boolean;
}

export function calculateMasteryFeedback(sessionStars: number, snapshot: MasterySnapshot): MasteryFeedback {
  const { previousBestStars } = snapshot;
  const newBestStars = Math.min(MAX_STARS, previousBestStars + Math.min(1, Math.max(0, sessionStars)));
  return {
    ...snapshot,
    sessionStars,
    newBestStars,
    isNewBest: newBestStars > previousBestStars,
    newStarNumbers: Array.from({ length: newBestStars - previousBestStars }, (_value, index) => previousBestStars + index + 1),
    fullMastery: newBestStars === MAX_STARS,
  };
}
