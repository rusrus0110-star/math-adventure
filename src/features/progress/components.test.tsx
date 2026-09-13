import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuestionCard } from '@/features/game/QuestionCard';
import { RewardCard } from '@/features/motivation/RewardCard';
import { WeeklyActivity } from './WeeklyActivity';
import { ProgressSummary } from './ProgressSummary';
import { AppShell } from '@/shared/components/AppShell';
import { weekDates } from '@/domain/activity/activity';
import { createInitialProgress } from '@/domain/progression/progression.service';

describe('child-facing components', () => {
  it('renders the actual operation instead of always showing plus', () => {
    const question = { id: 'question', operation: 'subtraction' as const, leftOperand: 5, rightOperand: 2, correctAnswer: 3, answerOptions: [1, 2, 3, 4] };
    expect(renderToStaticMarkup(<QuestionCard question={question} />)).toContain('−');
    expect(renderToStaticMarkup(<QuestionCard question={{ ...question, operation: 'addition' }} />)).toContain('+');
  });
  it('keeps locked rewards visible with exact remaining coins', () => {
    const html = renderToStaticMarkup(<RewardCard name="Krone" icon="👑" current={46} target={60} state="locked" />);
    expect(html).toContain('Krone');
    expect(html).toContain('46 / 60 Münzen');
    expect(html).toContain('Noch 14 Münzen');
    expect(html).toContain('data-state="locked"');
  });
  it.each(['locked', 'unlocked', 'claimed'] as const)('exposes the %s state', state => {
    const html = renderToStaticMarkup(<RewardCard name="Ausflug" icon="🌳" current={800} target={800} state={state} />);
    expect(html).toContain(`data-state="${state}"`);
    expect(html).toContain(state === 'claimed' ? 'Eingelöst' : state === 'unlocked' ? 'Freigeschaltet' : 'gesperrt');
    expect(html).not.toContain('<button');
  });
  it('labels all seven weekdays and marks activity independently of today', () => {
    const date = weekDates()[0]!;
    const html = renderToStaticMarkup(<WeeklyActivity activities={[{ playerId: 'child', localDate: date, completedSessions: 5, activeLearningMs: 0 }]} />);
    for (const label of ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']) expect(html).toContain(label);
    expect(html).toContain('noch nicht aktiv');
    expect(html).toContain('aria-current="date"');
  });
  it('shows mastery out of seven and uses only one main landmark', () => {
    const progress = { ...createInitialProgress('child'), coins: 46, levelStars: { 'addition-5': 5 }, totalQuestionsAnswered: 10, totalCorrectAnswers: 8 };
    const html = renderToStaticMarkup(<AppShell><main><ProgressSummary progress={progress} sessions={[]} /></main></AppShell>);
    expect(html).toContain('von 7');
    expect(html).toContain('80 %');
    expect(html.match(/<main>/g)).toHaveLength(1);
  });
});
