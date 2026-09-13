import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createLearningAccount, learningPathProgress, MAX_BONUS_MS, REQUIRED_LEARNING_MS } from '@/domain/learning/learning';
import { LearningPath } from './LearningPath';

describe('non-numeric child learning path', () => {
  it.each([0, 0.2, 0.4, 0.8, 1])('renders %s progress with Mia and a controller, without a countdown', fraction => {
    const path = learningPathProgress({ ...createLearningAccount('child'), learningProgressMs: fraction * REQUIRED_LEARNING_MS });
    const markup = renderToStaticMarkup(<LearningPath path={path} />);
    expect(markup.match(/data-complete=/g)).toHaveLength(5);
    expect(markup.match(/data-complete="true"/g) ?? []).toHaveLength(path.completedSegments);
    expect(markup).toContain('<img');
    expect(markup).toContain('🎮');
    const visibleText = markup.replace(/<[^>]+>/g, '');
    expect(visibleText).not.toMatch(/\d|Minuten|Sekunden/);
    expect(markup).not.toContain('aria-valuenow');
  });
  it('announces an earned bonus and a full bank without showing bank minutes', () => {
    const account = { ...createLearningAccount('child'), bonusTimeMs: MAX_BONUS_MS };
    const markup = renderToStaticMarkup(<LearningPath path={learningPathProgress(account)} />);
    expect(markup).toContain('Speicher ist voll!');
    expect(markup.match(/data-complete="true"/g)).toHaveLength(5);
    expect(markup.replace(/<[^>]+>/g, '')).not.toMatch(/\d/);
  });
});
