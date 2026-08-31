import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/domain/progression/levels';
import { generateQuestion } from './generateQuestion';

function pseudoRandom(): () => number {
  let seed = 42;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('generateQuestion', () => {
  it('respects result boundaries and creates four unique answer options', () => {
    const random = pseudoRandom();

    for (const level of LEVELS) {
      for (let index = 0; index < 50; index += 1) {
        const question = generateQuestion(level, random);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(level.minResult);
        expect(question.correctAnswer).toBeLessThanOrEqual(level.maxResult);
        expect(new Set(question.answerOptions).size).toBe(4);
        expect(question.answerOptions).toContain(question.correctAnswer);
      }
    }
  });
});
