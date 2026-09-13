import type { Operation, Question } from '@/domain/game/game.types';
import type { GameLevel } from '@/domain/progression/level.types';
import { generateAnswerOptions } from './generateAnswerOptions';
import { shuffle, type RandomSource } from './random';

export const SESSION_QUESTION_COUNT = 10;
export const QUESTIONS_PER_OPERATION = 5;

type OperandPair = { left: number; right: number };

function candidatePairs(level: GameLevel, operation: Operation): OperandPair[] {
  const pairs: OperandPair[] = [];
  for (let left = level.minOperand; left <= level.maxOperand; left += 1) {
    for (let right = level.minOperand; right <= level.maxOperand; right += 1) {
      const result = operation === 'addition' ? left + right : left - right;
      if (operation === 'addition' && (left > right || result < level.minResult)) continue;
      if (result < 0 || result > level.maxResult) continue;
      if (level.carryMode === 'tens-only' && (left % 10 !== 0 || right % 10 !== 0)) continue;
      const carries = operation === 'addition' ? left % 10 + right % 10 >= 10 : left % 10 < right % 10;
      if (level.carryMode === 'carry' && !carries) continue;
      if (level.carryMode === 'no-carry' && carries) continue;
      pairs.push({ left, right });
    }
  }
  if (!pairs.length) throw new Error(`No valid ${operation} questions for level: ${level.id}`);
  return pairs;
}

function makeQuestion(pair: OperandPair, operation: Operation, level: GameLevel, random?: RandomSource): Question {
  const correctAnswer = operation === 'addition' ? pair.left + pair.right : pair.left - pair.right;
  return {
    id: crypto.randomUUID(),
    leftOperand: pair.left,
    rightOperand: pair.right,
    operation,
    correctAnswer,
    answerOptions: generateAnswerOptions(correctAnswer, operation === 'subtraction' ? 0 : level.minResult, level.maxResult, random),
  };
}

export function generateQuestion(level: GameLevel, random?: RandomSource, operation: Operation = 'addition'): Question {
  const pair = shuffle(candidatePairs(level, operation), random)[0];
  if (!pair) throw new Error('No question available.');
  return makeQuestion(pair, operation, level, random);
}

export function generateSessionQuestions(level: GameLevel, random?: RandomSource): Question[] {
  const questions: Question[] = [];
  for (const operation of ['addition', 'subtraction'] as const) {
    const candidates = shuffle(candidatePairs(level, operation), random);
    for (let index = 0; index < QUESTIONS_PER_OPERATION; index += 1) {
      const pair = candidates[index % candidates.length];
      if (!pair) throw new Error('No question available.');
      questions.push(makeQuestion(pair, operation, level, random));
    }
  }
  return shuffle(questions, random);
}
