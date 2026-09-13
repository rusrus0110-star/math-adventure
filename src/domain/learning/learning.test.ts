import { describe, expect, it } from 'vitest';
import { addActiveLearning, BONUS_GRANT_MS, createLearningAccount, learningPathProgress, MAX_BONUS_MS, REQUIRED_LEARNING_MS, spendBonusTime } from './learning';
import { ActiveLearningClock, INACTIVITY_MS, type LearningContext } from './ActiveLearningClock';

describe('one learning account for progress and Bonuszeit', () => {
  it.each([[0, 0], [0.2, 1], [0.4, 2], [0.8, 4], [1, 5]])('maps %s of the cycle to %s completed segments', (fraction, segments) => {
    expect(learningPathProgress({ ...createLearningAccount('child'), learningProgressMs: REQUIRED_LEARNING_MS * fraction! }).completedSegments).toBe(segments);
  });
  it('grants once at the threshold, presents completion, and resets the next cycle', () => {
    const before = addActiveLearning(createLearningAccount('child'), REQUIRED_LEARNING_MS - 1);
    expect(before.grantedMs).toBe(0);
    const completed = addActiveLearning(before.account, 1);
    expect(completed.grantedMs).toBe(BONUS_GRANT_MS);
    expect(completed.account.learningProgressMs).toBe(0);
    expect(learningPathProgress(completed.account, true)).toMatchObject({ progress: 1, completedSegments: 5, label: 'Bonus-Spiel freigeschaltet!' });
    expect(learningPathProgress(completed.account)).toMatchObject({ progress: 0, completedSegments: 0 });
  });
  it('allows multiple saved cycles, caps the bank and does not bank hidden overflow', () => {
    let account = createLearningAccount('child');
    for (let cycle = 1; cycle <= 5; cycle += 1) {
      const update = addActiveLearning(account, REQUIRED_LEARNING_MS);
      expect(update.grantedMs).toBe(cycle <= 4 ? BONUS_GRANT_MS : 0);
      account = update.account;
    }
    expect(account.bonusTimeMs).toBe(MAX_BONUS_MS);
    expect(learningPathProgress(account)).toMatchObject({ full: true, completedSegments: 5 });
    const spent = spendBonusTime(account, BONUS_GRANT_MS);
    expect(spent.learningProgressMs).toBe(0);
    expect(addActiveLearning(spent, REQUIRED_LEARNING_MS).account.bonusTimeMs).toBe(MAX_BONUS_MS);
  });
  it('preserves partial cycles and never awards coins or overspends saved time', () => {
    const update = addActiveLearning(createLearningAccount('child'), REQUIRED_LEARNING_MS + 1234);
    expect(update.account.learningProgressMs).toBe(1234);
    expect(update.account).not.toHaveProperty('coins');
    expect(() => spendBonusTime(update.account, MAX_BONUS_MS)).toThrow();
    expect(() => addActiveLearning(update.account, NaN)).toThrow();
  });
});

describe('active mathematics clock', () => {
  const active: LearningContext = { playerId: 'child', sessionId: 'round', mathematics: true, visible: true, focused: true };
  it.each(['Home', 'Rewards', 'Elternbereich', 'Bonus-Spiel'])('does not count %s', () => {
    const clock = new ActiveLearningClock();
    clock.sample({ ...active, mathematics: false }, 0);
    expect(clock.sample({ ...active, mathematics: false }, 1000, true)).toBeNull();
  });
  it('stops at inactivity and resumes only after a new interaction without backfill', () => {
    const clock = new ActiveLearningClock();
    clock.sample(active, 0);
    let elapsed = 0;
    for (let now = 1000; now <= INACTIVITY_MS + 10_000; now += 1000) {
      const interval = clock.sample(active, now);
      if (interval) elapsed += interval.end - interval.start;
    }
    expect(elapsed).toBe(INACTIVITY_MS);
    expect(clock.sample(active, INACTIVITY_MS + 11_000, true)).toBeNull();
    expect(clock.sample(active, INACTIVITY_MS + 12_000)).toMatchObject({ start: INACTIVITY_MS + 11_000, end: INACTIVITY_MS + 12_000 });
  });
  it('does not count hidden or unfocused intervals and never credits suspension gaps', () => {
    const clock = new ActiveLearningClock();
    clock.sample(active, 0);
    clock.sample({ ...active, visible: false }, 1000);
    expect(clock.sample(active, 2000)).toBeNull();
    clock.sample({ ...active, focused: false }, 3000);
    expect(clock.sample(active, 4000)).toBeNull();
    expect(clock.sample(active, 60_000)).toBeNull();
  });
  it('attributes the final interval to the original player when profiles change', () => {
    const clock = new ActiveLearningClock();
    clock.sample(active, 0);
    expect(clock.sample({ ...active, playerId: 'other', sessionId: 'other-round' }, 1000)?.playerId).toBe('child');
    expect(clock.sample({ ...active, playerId: 'other', sessionId: 'other-round' }, 2000)?.playerId).toBe('other');
  });
});
