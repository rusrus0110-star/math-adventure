import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { calculateMasteryFeedback } from '@/domain/game/services/masteryFeedback';
import { MasterySummary } from './MasterySummary';

function renderSummary(earned: number, previousBestStars: number, unlockedLevelId: string | null = null) {
  return renderToStaticMarkup(<MasterySummary mastery={calculateMasteryFeedback(earned, { previousBestStars, unlockedLevelId })} />);
}

describe('cumulative mastery presentation', () => {
  it('celebrates one star and renders cumulative level progress', () => {
    const markup = renderSummary(1, 2, 'addition-10');
    expect(markup).toContain('+1 Stern!');
    expect(markup).toContain('Level-Fortschritt: 3 / 7');
    expect([...markup.matchAll(/data-star="(\d)" data-new="true"/g)].map(match => Number(match[1]))).toEqual([3]);
    expect(markup).toContain('<p>Nächstes Level freigeschaltet!</p>');
  });
  it('keeps stars on failure without another unlock or star message', () => {
    const markup = renderSummary(0, 3);
    expect(markup).toContain('Level-Fortschritt: 3 / 7');
    expect(markup).not.toContain('+1 Stern!');
    expect(markup).not.toContain('data-new="true"');
    expect(markup).not.toContain('Nächstes Level freigeschaltet!');
  });
  it('celebrates full mastery only after seven stars have accumulated', () => {
    expect(renderSummary(1, 0)).not.toContain('Level gemeistert');
    expect(renderSummary(1, 6)).toContain('Perfekt! Level gemeistert!');
    expect(renderSummary(0, 7)).not.toContain('+1 Stern!');
  });
  it('does not interpret legacy session stars as cumulative progress', () => {
    const markup = renderToStaticMarkup(<MasterySummary mastery={null} />);
    expect(markup).toContain('Historisches Ergebnis');
    expect(markup).not.toContain('Level gemeistert');
  });
});
