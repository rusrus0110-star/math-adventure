import type { MasterySnapshot } from './services/masteryFeedback';

export type Operation = 'addition' | 'subtraction';
export type CarryMode = 'any' | 'no-carry' | 'carry' | 'tens-only';

export interface Question {
  id: string;
  leftOperand: number;
  rightOperand: number;
  operation: Operation;
  correctAnswer: number;
  answerOptions: number[];
}

export interface QuestionAttempt {
  operation: Operation;
  id: string;
  playerId: string;
  sessionId: string;
  levelId: string;
  leftOperand: number;
  rightOperand: number;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  createdAt: string;
}

export interface GameSessionRecord {
  questionSetVersion?: string;
  mastery?: MasterySnapshot;
  stars: number;
  activityCoins: number;
  localDate: string;
  id: string;
  playerId: string;
  levelId: string;
  score: number;
  coinsEarned: number;
  correctAnswers: number;
  wrongAnswers: number;
  bestStreak: number;
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

export interface ScoreBreakdown {
  base: number;
  speed: number;
  streak: number;
  total: number;
}
