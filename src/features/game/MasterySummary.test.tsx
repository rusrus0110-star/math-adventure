import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { calculateMasteryFeedback } from '@/domain/game/services/masteryFeedback';
import { MasterySummary } from './MasterySummary';

function renderSummary(sessionStars: number, previousBestStars: number, unlockedLevelId: string | null = null) {
  return renderToStaticMarkup(<MasterySummary sessionStars={sessionStars} mastery={calculateMasteryFeedback(sessionStars, { previousBestStars, unlockedLevelId })} />);
}

describe('mastery result presentation', () => {
  it('celebrates improvement and visibly marks only new stars five and six', () => {
    const markup = renderSummary(6, 4);
    expect(markup).toContain('Neue Bestleistung!');
    expect(markup).toContain('Sterne in dieser Runde: 6 / 7');
    expect(markup).toContain('Bisherige Bestleistung: <strong>4 / 7</strong>');
    expect(markup).toContain('Deine Bestleistung jetzt: <strong>6 / 7</strong>');
    expect([...markup.matchAll(/data-star="(\d)" data-new="true"/g)].map(match => Number(match[1]))).toEqual([5, 6]);
    expect(markup).toContain('neu: 5, 6');
    expect(markup).not.toContain('Nächstes Level freigeschaltet!');
  });
  it.each([4, 3])('does not celebrate an equal or worse session of %i stars', sessionStars => {
    const markup = renderSummary(sessionStars, 4);
    expect(markup).not.toContain('Neue Bestleistung!');
    expect(markup).not.toContain('data-new="true"');
    expect(markup).toContain('Deine Bestleistung jetzt: <strong>4 / 7</strong>');
  });
  it('shows improvement and a first unlock as separate messages', () => {
    const markup = renderSummary(5, 4, 'addition-10');
    expect(markup).toContain('Neue Bestleistung!');
    expect(markup).toContain('<p>Nächstes Level freigeschaltet!</p>');
    expect(renderSummary(5, 5)).not.toContain('Nächstes Level freigeschaltet!');
  });
  it('celebrates seven stars even on a replay without claiming another best or unlock', () => {
    const markup = renderSummary(7, 7);
    expect(markup).toContain('Perfekt! 7 von 7 Sternen!');
    expect(markup).not.toContain('Neue Bestleistung!');
    expect(markup).not.toContain('Nächstes Level freigeschaltet!');
    expect(renderSummary(6, 7)).not.toContain('Perfekt!');
  });
  it('does not invent previous bests or unlocks for legacy results', () => {
    const markup = renderToStaticMarkup(<MasterySummary sessionStars={5} mastery={null} />);
    expect(markup).toContain('Sterne in dieser Runde: 5 / 7');
    expect(markup).not.toContain('Bisherige Bestleistung');
    expect(markup).not.toContain('Neue Bestleistung!');
    expect(markup).not.toContain('Nächstes Level freigeschaltet!');
  });
});
