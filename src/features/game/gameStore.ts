import { localDateKey } from '@/domain/activity/activity';
import type { MasteryFeedback } from '@/domain/game/services/masteryFeedback';
import { CURRENT_QUESTION_SET_VERSION } from '@/domain/game/curriculum';
import { create } from 'zustand';
import { completeGameSession, type CompleteGameSessionInput } from '@/application/game/completeGameSession';
import { dependencies } from '@/app/dependencies';
import type { Question, QuestionAttempt, ScoreBreakdown } from '@/domain/game/game.types';
import { calculateScore } from '@/domain/game/services/calculateScore';
import { generateSessionQuestions, SESSION_QUESTION_COUNT } from '@/domain/game/services/generateQuestion';
import type { GameLevel } from '@/domain/progression/level.types';
import { delay } from '@/shared/utils/delay';

export interface GameResult {
  mastery: MasteryFeedback | null;
  sessionId: string;
  playerId: string;
  levelId: string;
  score: number;
  coinsEarned: number;
  activityCoins: number;
  stars: number;
  correctAnswers: number;
  questionCount: number;
  bestStreak: number;
  durationMs: number;
}

interface GameData {
  sessionId: string | null;
  playerId: string | null;
  level: GameLevel | null;
  questions: Question[];
  currentQuestion: Question | null;
  questionIndex: number;
  score: number;
  currentStreak: number;
  bestStreak: number;
  correctAnswers: number;
  attempts: QuestionAttempt[];
  questionStartedAt: number | null;
  sessionStartedAt: number | null;
  startedAt: string | null;
  pendingCompletion: CompleteGameSessionInput | null;
  feedback: 'correct' | 'wrong' | null;
  lastScore: ScoreBreakdown | null;
  lastCorrectAnswer: number | null;
  lastSelectedAnswer: number | null;
  isFinishing: boolean;
  result: GameResult | null;
  error: string | null;
}

interface GameState extends GameData {
  start: (playerId: string, level: GameLevel) => void;
  answer: (selectedAnswer: number) => Promise<boolean>;
  retrySave: () => Promise<boolean>;
  reset: () => void;
}

function initialState(): GameData {
  return {
    sessionId: null, playerId: null, level: null, questions: [], currentQuestion: null,
    questionIndex: 0, score: 0, currentStreak: 0, bestStreak: 0, correctAnswers: 0,
    attempts: [], questionStartedAt: null, sessionStartedAt: null, startedAt: null,
    pendingCompletion: null, feedback: null, lastScore: null, lastCorrectAnswer: null,
    lastSelectedAnswer: null, isFinishing: false, result: null, error: null,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState(),
  start: (playerId, level) => {
    const questions = generateSessionQuestions(level);
    const now = performance.now();
    set({
      ...initialState(), sessionId: crypto.randomUUID(), playerId,
      level: { ...level, questionCount: SESSION_QUESTION_COUNT }, questions,
      currentQuestion: questions[0] ?? null, questionStartedAt: now,
      sessionStartedAt: now, startedAt: new Date().toISOString(),
    });
  },
  answer: async (selectedAnswer) => {
    const state = get();
    const { sessionId, playerId, level, currentQuestion, questionStartedAt, sessionStartedAt, startedAt } = state;
    if (!sessionId || !playerId || !level || !currentQuestion || questionStartedAt === null ||
        sessionStartedAt === null || !startedAt || state.feedback || state.isFinishing || state.result ||
        !currentQuestion.answerOptions.includes(selectedAnswer)) return false;
    const answeredAt = performance.now();
    const responseTimeMs = Math.max(0, answeredAt - questionStartedAt);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const currentStreak = isCorrect ? state.currentStreak + 1 : 0;
    const bestStreak = Math.max(state.bestStreak, currentStreak);
    const lastScore = calculateScore(isCorrect, responseTimeMs, currentStreak);
    const completedAt = new Date().toISOString();
    const attempt: QuestionAttempt = {
      id: crypto.randomUUID(), playerId, sessionId, levelId: level.id,
      operation: currentQuestion.operation, leftOperand: currentQuestion.leftOperand,
      rightOperand: currentQuestion.rightOperand, selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer, isCorrect, responseTimeMs, createdAt: completedAt,
    };
    const attempts = [...state.attempts, attempt];
    const correctAnswers = state.correctAnswers + Number(isCorrect);
    const score = state.score + lastScore.total;
    const finished = attempts.length === SESSION_QUESTION_COUNT;
    const pendingCompletion: CompleteGameSessionInput | null = finished ? {
      session: {
        id: sessionId, playerId, levelId: level.id, score, correctAnswers, questionSetVersion: CURRENT_QUESTION_SET_VERSION,
        wrongAnswers: SESSION_QUESTION_COUNT - correctAnswers, bestStreak,
        durationMs: Math.max(0, answeredAt - sessionStartedAt), startedAt, completedAt, localDate: localDateKey(new Date(completedAt)),
      }, attempts,
    } : null;
    set({
      feedback: isCorrect ? 'correct' : 'wrong', lastScore,
      lastCorrectAnswer: currentQuestion.correctAnswer, lastSelectedAnswer: selectedAnswer,
      attempts, correctAnswers, score, currentStreak, bestStreak, pendingCompletion,
    });
    await delay(isCorrect ? 900 : 1400);
    if (get().sessionId !== sessionId) return false;
    if (finished) return get().retrySave();
    set({
      currentQuestion: state.questions[attempts.length] ?? null, questionIndex: attempts.length,
      questionStartedAt: performance.now(), feedback: null, lastScore: null,
      lastCorrectAnswer: null, lastSelectedAnswer: null,
    });
    return false;
  },
  retrySave: async () => {
    const { sessionId, pendingCompletion, isFinishing, result } = get();
    if (!sessionId || !pendingCompletion || isFinishing || result) return false;
    set({ isFinishing: true, error: null });
    try {
      const completion = await completeGameSession(pendingCompletion, dependencies);
      if (get().sessionId !== sessionId) return false;
      const { session } = pendingCompletion;
      set({
        isFinishing: false,
        result: {
          sessionId, playerId: session.playerId, levelId: session.levelId, score: session.score,
          ...completion, correctAnswers: session.correctAnswers, questionCount: SESSION_QUESTION_COUNT,
          bestStreak: session.bestStreak, durationMs: session.durationMs,
        },
      });
      return true;
    } catch (error) {
      if (get().sessionId !== sessionId) return false;
      set({ isFinishing: false, error: error instanceof Error ? error.message : 'Spielstand konnte nicht gespeichert werden.' });
      return false;
    }
  },
  reset: () => set(initialState()),
}));
