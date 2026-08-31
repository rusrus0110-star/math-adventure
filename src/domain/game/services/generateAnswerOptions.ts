import { randomInt, shuffle, type RandomSource } from './random';

const OPTION_COUNT = 4;

export function generateAnswerOptions(
  correctAnswer: number,
  minAnswer: number,
  maxAnswer: number,
  random?: RandomSource,
): number[] {
  const answers = new Set<number>([correctAnswer]);
  const safeMin = Math.max(0, minAnswer);
  const safeMax = Math.max(safeMin + OPTION_COUNT, maxAnswer);
  let guard = 0;

  while (answers.size < OPTION_COUNT && guard < 100) {
    guard += 1;
    const offset = randomInt(-4, 4, random);
    const fallback = randomInt(safeMin, safeMax, random);
    const candidate = offset === 0 ? fallback : correctAnswer + offset;

    if (candidate >= safeMin && candidate <= safeMax) {
      answers.add(candidate);
    }
  }

  for (let candidate = safeMin; answers.size < OPTION_COUNT && candidate <= safeMax; candidate += 1) {
    answers.add(candidate);
  }

  if (answers.size < OPTION_COUNT) {
    throw new Error('Unable to generate enough unique answer options.');
  }

  return shuffle([...answers], random);
}
