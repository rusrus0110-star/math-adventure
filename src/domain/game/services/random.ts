export type RandomSource = () => number;

export const systemRandom: RandomSource = Math.random;

export function randomInt(
  min: number,
  max: number,
  random: RandomSource = systemRandom,
): number {
  const normalizedMin = Math.ceil(min);
  const normalizedMax = Math.floor(max);

  return Math.floor(random() * (normalizedMax - normalizedMin + 1)) + normalizedMin;
}

export function shuffle<T>(
  values: readonly T[],
  random: RandomSource = systemRandom,
): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const current = result[index];
    const replacement = result[target];

    if (current === undefined || replacement === undefined) {
      continue;
    }

    result[index] = replacement;
    result[target] = current;
  }

  return result;
}
