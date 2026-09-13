import { localDateKey } from '@/domain/activity/activity';
import type { CompleteGameSessionInput } from '@/application/game/completeGameSession';
import { CURRENT_QUESTION_SET_VERSION } from '@/domain/game/curriculum';

export function sessionInput(playerId = 'child', correct = 8, date = new Date(2026, 8, 7, 12)): CompleteGameSessionInput {
  const sessionId = crypto.randomUUID();
  const completedAt = date.toISOString();
  return {
    session: {
      questionSetVersion: CURRENT_QUESTION_SET_VERSION,
      id: sessionId, playerId, levelId: 'addition-5', localDate: localDateKey(date), score: correct * 100,
      correctAnswers: correct, wrongAnswers: 10 - correct, bestStreak: correct,
      durationMs: 30_000, startedAt: new Date(date.getTime() - 30_000).toISOString(), completedAt,
    },
    attempts: Array.from({ length: 10 }, (_value, index) => ({
      id: crypto.randomUUID(), playerId, sessionId, levelId: 'addition-5',
      operation: index % 2 === 0 ? 'addition' : 'subtraction',
      leftOperand: 3, rightOperand: 1, selectedAnswer: index < correct ? index % 2 === 0 ? 4 : 2 : 0,
      correctAnswer: index % 2 === 0 ? 4 : 2, isCorrect: index < correct, responseTimeMs: 1000, createdAt: completedAt,
    })),
  };
}
