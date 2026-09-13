import { describe, expect, it } from 'vitest';
import { isCurrentCurriculumSession } from './curriculum';
import { applySessionProgress } from './services/applySessionProgress';
import { sessionInput } from '@/test/fixtures';
import { createInitialProgress } from '@/domain/progression/progression.service';

describe('curriculum isolation', () => {
  it('does not treat a legacy perfect result as mixed mastery or a mixed unlock', () => {
    const { questionSetVersion, ...legacy } = sessionInput('child', 10).session;
    expect(questionSetVersion).toBe('mixed-v1');
    const session = { ...legacy, stars: 7, activityCoins: 0, coinsEarned: 19 };
    const previous = createInitialProgress('child');
    expect(isCurrentCurriculumSession(session)).toBe(false);
    expect(applySessionProgress(previous, session)).toMatchObject({ levelStars: {}, unlockedLevelIds: previous.unlockedLevelIds });
  });
  it('requires the explicit version and a complete round, not a matching level ID', () => {
    const session = { ...sessionInput().session, stars: 5, activityCoins: 0, coinsEarned: 13 };
    expect(isCurrentCurriculumSession(session)).toBe(true);
    expect(isCurrentCurriculumSession({ ...session, questionSetVersion: 'addition-v1' })).toBe(false);
    expect(isCurrentCurriculumSession({ ...session, correctAnswers: 7 })).toBe(false);
  });
});
