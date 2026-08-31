import { de } from './de';

type TranslationNode = string | { readonly [key: string]: TranslationNode };

function resolveTranslation(path: string): string {
  const segments = path.split('.');
  let current: TranslationNode = de;

  for (const segment of segments) {
    if (typeof current === 'string') {
      return path;
    }

    const next: TranslationNode | undefined = current[segment];

    if (next === undefined) {
      return path;
    }

    current = next;
  }

  return typeof current === 'string' ? current : path;
}

export const t = resolveTranslation;
