import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/domain/progression/levels';
import { generateSessionQuestions } from './generateQuestion';

function pseudoRandom(seed = 42): () => number {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('mixed session generation', () => {
  it.each(LEVELS)('$id has exactly five additions and five nonnegative subtractions', level => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const questions = generateSessionQuestions(level, pseudoRandom(seed));
      expect(questions).toHaveLength(10);
      expect(questions.filter(question => question.operation === 'addition')).toHaveLength(5);
      expect(questions.filter(question => question.operation === 'subtraction')).toHaveLength(5);
      expect(new Set(questions.map(question => `${question.operation}:${question.leftOperand}:${question.rightOperand}`)).size).toBe(10);
      for (const question of questions) {
        expect(question.leftOperand).toBeGreaterThanOrEqual(level.minOperand);
        expect(question.leftOperand).toBeLessThanOrEqual(level.maxOperand);
        expect(question.rightOperand).toBeGreaterThanOrEqual(level.minOperand);
        expect(question.rightOperand).toBeLessThanOrEqual(level.maxOperand);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(question.operation === 'subtraction' ? 0 : level.minResult);
        expect(question.correctAnswer).toBeLessThanOrEqual(level.maxResult);
        expect(question.correctAnswer).toBe(question.operation === 'addition' ? question.leftOperand + question.rightOperand : question.leftOperand - question.rightOperand);
        expect(new Set(question.answerOptions).size).toBe(4);
        expect(question.answerOptions).toContain(question.correctAnswer);
        if (level.carryMode === 'tens-only') {
          expect(question.leftOperand % 10).toBe(0);
          expect(question.rightOperand % 10).toBe(0);
        }
      }
    }
  });
  it('varies the operation sequence across random seeds', () => {
    const level = LEVELS[0]!;
    const sequences = Array.from({ length: 8 }, (_value, index) => generateSessionQuestions(level, pseudoRandom(index + 1)).map(question => question.operation).join(','));
    expect(new Set(sequences).size).toBeGreaterThan(1);
  });
});
