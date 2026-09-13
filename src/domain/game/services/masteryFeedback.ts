import { MAX_STARS } from './calculateRewards';

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
  const newBestStars = Math.max(previousBestStars, sessionStars);
  return {
    ...snapshot,
    sessionStars,
    newBestStars,
    isNewBest: sessionStars > previousBestStars,
    newStarNumbers: Array.from({ length: newBestStars - previousBestStars }, (_value, index) => previousBestStars + index + 1),
    fullMastery: sessionStars === MAX_STARS,
  };
}
