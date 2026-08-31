import type { Question } from '@/domain/game/game.types';
import type { GameLevel } from '@/domain/progression/level.types';
import { generateAnswerOptions } from './generateAnswerOptions';
import { randomInt, type RandomSource } from './random';

function isValidPair(level: GameLevel, left: number, right: number): boolean {
  const result = left + right;

  if (result < level.minResult || result > level.maxResult) {
    return false;
  }

  if (level.carryMode === 'tens-only') {
    return left % 10 === 0 && right % 10 === 0;
  }

  const crossesTen = left < 10 && right < 10 && result > 10;

  if (level.carryMode === 'carry') {
    return crossesTen;
  }

  if (level.carryMode === 'no-carry') {
    return !crossesTen;
  }

  return true;
}

export function generateQuestion(
  level: GameLevel,
  random?: RandomSource,
): Question {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    let left = randomInt(level.minOperand, level.maxOperand, random);
    let right = randomInt(level.minOperand, level.maxOperand, random);

    if (level.carryMode === 'tens-only') {
      left = randomInt(1, 9, random) * 10;
      right = randomInt(1, 9, random) * 10;
    }

    if (!isValidPair(level, left, right)) {
      continue;
    }

    const correctAnswer = left + right;

    return {
      id: crypto.randomUUID(),
      leftOperand: left,
      rightOperand: right,
      operation: 'addition',
      correctAnswer,
      answerOptions: generateAnswerOptions(
        correctAnswer,
        level.minResult,
        level.maxResult,
        random,
      ),
    };
  }

  throw new Error(`Unable to generate a valid question for level: ${level.id}`);
}
