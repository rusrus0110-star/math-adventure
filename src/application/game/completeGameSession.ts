import type { GameCompletionRepository } from '@/application/ports/GameCompletionRepository';
import type { ProgressRepository } from '@/application/ports/ProgressRepository';
import type { GameSessionRecord, QuestionAttempt } from '@/domain/game/game.types';
import { calculateCoins, calculateStars } from '@/domain/game/services/calculateRewards';
import {
  createInitialProgress,
  unlockNextLevel,
} from '@/domain/progression/progression.service';

export interface CompleteGameSessionInput {
  session: Omit<GameSessionRecord, 'coinsEarned'>;
  attempts: readonly QuestionAttempt[];
}

export interface CompleteGameSessionDependencies {
  gameCompletionRepository: GameCompletionRepository;
  progressRepository: ProgressRepository;
}

export async function completeGameSession(
  input: CompleteGameSessionInput,
  dependencies: CompleteGameSessionDependencies,
): Promise<{ stars: number; coinsEarned: number }> {
  const questionCount = input.attempts.length;

  if (questionCount === 0) {
    throw new Error('A completed game session must contain at least one attempt.');
  }

  const accuracy = input.session.correctAnswers / questionCount;
  const stars = calculateStars(accuracy);
  const coinsEarned = calculateCoins(input.session.correctAnswers, questionCount);
  const existingProgress =
    (await dependencies.progressRepository.getByPlayerId(input.session.playerId)) ??
    createInitialProgress(input.session.playerId);

  let updatedProgress = {
    ...existingProgress,
    totalScore: existingProgress.totalScore + input.session.score,
    coins: existingProgress.coins + coinsEarned,
    levelStars: {
      ...existingProgress.levelStars,
      [input.session.levelId]: Math.max(
        existingProgress.levelStars[input.session.levelId] ?? 0,
        stars,
      ),
    },
    bestStreak: Math.max(existingProgress.bestStreak, input.session.bestStreak),
    totalQuestionsAnswered:
      existingProgress.totalQuestionsAnswered + questionCount,
    totalCorrectAnswers:
      existingProgress.totalCorrectAnswers + input.session.correctAnswers,
  };

  updatedProgress = unlockNextLevel(
    updatedProgress,
    input.session.levelId,
    accuracy,
  );

  const persistedSession: GameSessionRecord = {
    ...input.session,
    coinsEarned,
  };

  await dependencies.gameCompletionRepository.saveCompletion({
    session: persistedSession,
    attempts: input.attempts,
    progress: updatedProgress,
  });

  return { stars, coinsEarned };
}
