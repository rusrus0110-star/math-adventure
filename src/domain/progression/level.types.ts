import type { CarryMode, Operation } from '@/domain/game/game.types';

export interface GameLevel {
  id: string;
  order: number;
  titleKey: string;
  operation: Operation;
  minOperand: number;
  maxOperand: number;
  minResult: number;
  maxResult: number;
  questionCount: number;
  carryMode: CarryMode;
  unlockAccuracy: number;
}
