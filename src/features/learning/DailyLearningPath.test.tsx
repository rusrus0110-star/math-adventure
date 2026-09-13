import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createDailyActivity, DAILY_LEARNING_TARGET_MS } from '@/domain/activity/dailyGoal';
import { DailyLearningPath } from './DailyLearningPath';

describe('child daily goal presentation', () => {
  it('shows two separate visual paths without a numeric timer', () => {
    const day = { ...createDailyActivity('child', '2026-09-07'), completedSessions: 2, activeLearningMs: DAILY_LEARNING_TARGET_MS * 0.4 };
    const markup = renderToStaticMarkup(<DailyLearningPath day={day} />);
    expect(markup).toContain('Dein Tagesziel mit Mia');
    expect(markup).toContain('oder ganze Spielrunden sammeln');
    expect(markup.match(/data-complete="true"/g)).toHaveLength(4);
    expect(markup.match(/data-complete=/g)).toHaveLength(10);
    expect(markup).toContain('<img');
    expect(markup.replace(/<[^>]*>/g, '')).not.toMatch(/\d|Minuten|Sekunden/);
    expect(markup).not.toContain('Tagesziel geschafft!');
  });
  it.each([{ completedSessions: 5, activeLearningMs: 0 }, { completedSessions: 0, activeLearningMs: DAILY_LEARNING_TARGET_MS }])('celebrates either completed path', values => {
    expect(renderToStaticMarkup(<DailyLearningPath day={{ ...createDailyActivity('child', '2026-09-07'), ...values }} />)).toContain('Tagesziel geschafft!');
  });
});
