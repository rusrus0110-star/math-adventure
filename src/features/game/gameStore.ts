import { create } from 'zustand';
import { completeGameSession } from '@/application/game/completeGameSession';
import { dependencies } from '@/app/dependencies';
import type { Question, QuestionAttempt, ScoreBreakdown } from '@/domain/game/game.types';
import { calculateScore } from '@/domain/game/services/calculateScore';
import { generateQuestion } from '@/domain/game/services/generateQuestion';
import type { GameLevel } from '@/domain/progression/level.types';
import { delay } from '@/shared/utils/delay';

export interface GameResult {
  sessionId: string;
  levelId: string;
  score: number;
  coinsEarned: number;
  stars: number;
  correctAnswers: number;
  questionCount: number;
  bestStreak: number;
  durationMs: number;
}

interface GameState {
  sessionId: string | null;
  playerId: string | null;
  level: GameLevel | null;
  currentQuestion: Question | null;
  questionIndex: number;
  score: number;
  currentStreak: number;
  bestStreak: number;
  correctAnswers: number;
  attempts: QuestionAttempt[];
  questionStartedAt: number | null;
  sessionStartedAt: number | null;
  feedback: 'correct' | 'wrong' | null;
  lastScore: ScoreBreakdown | null;
  lastCorrectAnswer: number | null;
  lastSelectedAnswer: number | null;
  isFinishing: boolean;
  result: GameResult | null;
  error: string | null;
  start: (playerId: string, level: GameLevel) => void;
  answer: (selectedAnswer: number) => Promise<boolean>;
  reset: () => void;
}

function nextQuestion(level: GameLevel): Question {
  return generateQuestion(level);
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  playerId: null,
  level: null,
  currentQuestion: null,
  questionIndex: 0,
  score: 0,
  currentStreak: 0,
  bestStreak: 0,
  correctAnswers: 0,
  attempts: [],
  questionStartedAt: null,
  sessionStartedAt: null,
  feedback: null,
  lastScore: null,
  lastCorrectAnswer: null,
  lastSelectedAnswer: null,
  isFinishing: false,
  result: null,
  error: null,

  start: (playerId, level) => {
    const now = performance.now();
    set({
      sessionId: crypto.randomUUID(),
      playerId,
      level,
      currentQuestion: nextQuestion(level),
      questionIndex: 0,
      score: 0,
      currentStreak: 0,
      bestStreak: 0,
      correctAnswers: 0,
      attempts: [],
      questionStartedAt: now,
      sessionStartedAt: now,
      feedback: null,
      lastScore: null,
      lastCorrectAnswer: null,
      lastSelectedAnswer: null,
      isFinishing: false,
      result: null,
      error: null,
    });
  },

  answer: async (selectedAnswer) => {
    const state = get();
    const {
      sessionId,
      playerId,
      level,
      currentQuestion,
      questionStartedAt,
      sessionStartedAt,
    } = state;

    if (
      !sessionId ||
      !playerId ||
      !level ||
      !currentQuestion ||
      questionStartedAt === null ||
      sessionStartedAt === null ||
      state.feedback !== null ||
      state.isFinishing
    ) {
      return false;
    }

    const answeredAt = performance.now();
    const responseTimeMs = Math.max(0, answeredAt - questionStartedAt);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const nextStreak = isCorrect ? state.currentStreak + 1 : 0;
    const bestStreak = Math.max(state.bestStreak, nextStreak);
    const scoreBreakdown = calculateScore(isCorrect, responseTimeMs, nextStreak);
    const attempt: QuestionAttempt = {
      id: crypto.randomUUID(),
      playerId,
      sessionId,
      levelId: level.id,
      leftOperand: currentQuestion.leftOperand,
      rightOperand: currentQuestion.rightOperand,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      responseTimeMs,
      createdAt: new Date().toISOString(),
    };

    const attempts = [...state.attempts, attempt];
    const correctAnswers = state.correctAnswers + (isCorrect ? 1 : 0);
    const score = state.score + scoreBreakdown.total;
    const isLastQuestion = attempts.length >= level.questionCount;

    set({
      feedback: isCorrect ? 'correct' : 'wrong',
      lastScore: scoreBreakdown,
      lastCorrectAnswer: currentQuestion.correctAnswer,
      lastSelectedAnswer: selectedAnswer,
      attempts,
      correctAnswers,
      score,
      currentStreak: nextStreak,
      bestStreak,
      isFinishing: isLastQuestion,
    });

    const feedbackDelayMs = isCorrect ? 900 : 1400;
    await delay(feedbackDelayMs);

    if (isLastQuestion) {
      const completedAt = performance.now();
      const durationMs = Math.max(0, completedAt - sessionStartedAt);

      try {
        const completion = await completeGameSession(
          {
            session: {
              id: sessionId,
              playerId,
              levelId: level.id,
              score,
              correctAnswers,
              wrongAnswers: attempts.length - correctAnswers,
              bestStreak,
              durationMs,
              startedAt: new Date(Date.now() - durationMs).toISOString(),
              completedAt: new Date().toISOString(),
            },
            attempts,
          },
          dependencies,
        );

        set({
          result: {
            sessionId,
            levelId: level.id,
            score,
            coinsEarned: completion.coinsEarned,
            stars: completion.stars,
            correctAnswers,
            questionCount: attempts.length,
            bestStreak,
            durationMs,
          },
        });

        return true;
      } catch (error) {
        set({
          isFinishing: false,
          error: error instanceof Error ? error.message : 'Spielstand konnte nicht gespeichert werden.',
        });
        return false;
      }
    }

    set({
      currentQuestion: nextQuestion(level),
      questionIndex: attempts.length,
      questionStartedAt: performance.now(),
      feedback: null,
      lastScore: null,
      lastCorrectAnswer: null,
      lastSelectedAnswer: null,
    });

    return false;
  },

  reset: () => {
    set({
      sessionId: null,
      playerId: null,
      level: null,
      currentQuestion: null,
      questionIndex: 0,
      score: 0,
      currentStreak: 0,
      bestStreak: 0,
      correctAnswers: 0,
      attempts: [],
      questionStartedAt: null,
      sessionStartedAt: null,
      feedback: null,
      lastScore: null,
      lastCorrectAnswer: null,
      lastSelectedAnswer: null,
      isFinishing: false,
      result: null,
      error: null,
    });
  },
}));
