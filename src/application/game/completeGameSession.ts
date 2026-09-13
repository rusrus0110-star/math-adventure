import type { GameCompletionRepository } from '@/application/ports/GameCompletionRepository';
import type { GameSessionRecord, QuestionAttempt } from '@/domain/game/game.types';
import { calculateCoins, calculateMasteryGain } from '@/domain/game/services/calculateRewards';
import { applySessionProgress } from '@/domain/game/services/applySessionProgress';
import { dailyActivityBonus } from '@/domain/activity/activity';
import { createInitialProgress } from '@/domain/progression/progression.service';
import { calculateMasteryFeedback, MASTERY_VERSION } from '@/domain/game/services/masteryFeedback';
import { CURRENT_QUESTION_SET_VERSION, isCurrentCurriculumSession } from '@/domain/game/curriculum';

export interface CompleteGameSessionInput {
  session: Omit<GameSessionRecord, 'coinsEarned' | 'stars' | 'activityCoins' | 'mastery' | 'masteryVersion'>;
  attempts: readonly QuestionAttempt[];
}

export interface CompleteGameSessionDependencies {
  gameCompletionRepository: GameCompletionRepository;
}

export async function completeGameSession(input: CompleteGameSessionInput, dependencies: CompleteGameSessionDependencies) {
  const { session, attempts } = input;
  if (session.questionSetVersion !== CURRENT_QUESTION_SET_VERSION ||
      attempts.filter(attempt => attempt.operation === 'addition').length !== 5 ||
      attempts.filter(attempt => attempt.operation === 'subtraction').length !== 5) {
    throw new Error('Eine gemischte Runde benötigt 5 Plus- und 5 Minus-Aufgaben.');
  }
  const correctAnswers = attempts.filter(attempt => attempt.isCorrect).length;
  if (attempts.length !== 10 || session.correctAnswers !== correctAnswers || session.wrongAnswers !== 10 - correctAnswers ||
      new Set(attempts.map(attempt => attempt.id)).size !== 10 ||
      attempts.some(attempt => attempt.playerId !== session.playerId || attempt.sessionId !== session.id || attempt.levelId !== session.levelId)) {
    throw new Error('Eine vollständige Runde muss genau 10 gültige Antworten enthalten.');
  }
  const completedAt = new Date(session.completedAt);
  if (!Number.isFinite(completedAt.getTime())) throw new Error('Ungültiges Abschlussdatum.');
  const localDate = session.localDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error('Ungültiger lokaler Trainingstag.');
  const persisted = await dependencies.gameCompletionRepository.saveCompletion(session.id, session.playerId, localDate, (progress, alreadyActive) => {
    const activityCoins = dailyActivityBonus(alreadyActive, attempts.length);
    const previousProgress = progress ?? createInitialProgress(session.playerId);
    const record: GameSessionRecord = {
      ...session,
      localDate,
      masteryVersion: MASTERY_VERSION,
      stars: calculateMasteryGain(previousProgress.levelStars[session.levelId] ?? 0, correctAnswers),
      activityCoins,
      coinsEarned: calculateCoins(correctAnswers, 10) + activityCoins,
    };
    const updatedProgress = applySessionProgress(previousProgress, record);
    const mastery = {
      previousBestStars: previousProgress.levelStars[session.levelId] ?? 0,
      unlockedLevelId: updatedProgress.unlockedLevelIds.find(levelId => !previousProgress.unlockedLevelIds.includes(levelId)) ?? null,
    };
    return {
      session: { ...record, mastery },
      attempts,
      progress: updatedProgress,
      activity: { playerId: session.playerId, localDate, firstSessionId: session.id },
    };
  });
  return {
    stars: persisted.stars,
    coinsEarned: persisted.coinsEarned,
    activityCoins: persisted.activityCoins,
    mastery: persisted.mastery && persisted.masteryVersion === MASTERY_VERSION && isCurrentCurriculumSession(persisted) ? calculateMasteryFeedback(persisted.stars, persisted.mastery) : null,
  };
}
