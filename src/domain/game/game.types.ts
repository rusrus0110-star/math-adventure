export type Operation = 'addition';
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
