import type { PlayerProgress } from '@/domain/player/player.types';
import type { GameSessionRecord } from '@/domain/game/game.types';
import { createInitialProgress, unlockNextLevel } from '@/domain/progression/progression.service';
import { isCurrentCurriculumSession } from '@/domain/game/curriculum';
import { MASTERY_VERSION } from './masteryFeedback';
import { calculateMasteryGain } from './calculateRewards';

export function applySessionProgress(previous: PlayerProgress | null, session: GameSessionRecord): PlayerProgress {
  const progress = previous ?? createInitialProgress(session.playerId);
  const questionCount = session.correctAnswers + session.wrongAnswers;
  const compatible = isCurrentCurriculumSession(session) && session.masteryVersion === MASTERY_VERSION;
  const previousStars = progress.levelStars[session.levelId] ?? 0;
  const updated = {
    ...progress,
    coins: progress.coins + session.coinsEarned,
    totalScore: progress.totalScore + session.score,
    bestStreak: Math.max(progress.bestStreak, session.bestStreak),
    totalQuestionsAnswered: progress.totalQuestionsAnswered + questionCount,
    totalCorrectAnswers: progress.totalCorrectAnswers + session.correctAnswers,
    levelStars: compatible ? { ...progress.levelStars, [session.levelId]: previousStars + calculateMasteryGain(previousStars, session.correctAnswers, questionCount) } : progress.levelStars,
  };
  return compatible ? unlockNextLevel(updated, session.levelId, session.correctAnswers / questionCount) : updated;
}
