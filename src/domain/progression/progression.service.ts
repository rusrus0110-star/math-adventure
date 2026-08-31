import type { PlayerProgress } from '@/domain/player/player.types';
import { LEVELS } from './levels';

export function createInitialProgress(playerId: string): PlayerProgress {
  const firstLevel = LEVELS[0];

  if (!firstLevel) {
    throw new Error('At least one game level is required.');
  }

  return {
    playerId,
    totalScore: 0,
    coins: 0,
    unlockedLevelIds: [firstLevel.id],
    levelStars: {},
    bestStreak: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
  };
}

export function unlockNextLevel(
  progress: PlayerProgress,
  completedLevelId: string,
  accuracy: number,
): PlayerProgress {
  const currentIndex = LEVELS.findIndex((level) => level.id === completedLevelId);
  const currentLevel = LEVELS[currentIndex];
  const nextLevel = LEVELS[currentIndex + 1];

  if (!currentLevel || !nextLevel || accuracy < currentLevel.unlockAccuracy) {
    return progress;
  }

  if (progress.unlockedLevelIds.includes(nextLevel.id)) {
    return progress;
  }

  return {
    ...progress,
    unlockedLevelIds: [...progress.unlockedLevelIds, nextLevel.id],
  };
}
