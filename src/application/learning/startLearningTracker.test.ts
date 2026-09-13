import { expect, it, vi } from 'vitest';
import { startLearningTracker } from './startLearningTracker';
import type { LearningContext } from '@/domain/learning/ActiveLearningClock';

it('refreshes the local day at midnight and after resuming, even on Home', () => {
  let now = new Date(2026, 8, 7, 23, 59, 59).getTime();
  let tick = () => {};
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible', hasFocus: () => true });
  const window = Object.assign(new EventTarget(), { setInterval: (callback: () => void) => { tick = callback; return 1; }, clearInterval: vi.fn() });
  const onDayChanged = vi.fn();
  const record = vi.fn();
  const stop = startLearningTracker({ now: () => now, onDayChanged, record, subscribe: () => () => {},
    getContext: () => ({ playerId: 'child', sessionId: null, mathematics: false, visible: true, focused: true }),
    document: document as unknown as Document, window: window as unknown as Window });
  now += 1000; tick(); tick();
  expect(onDayChanged).toHaveBeenCalledOnce();
  now = new Date(2026, 8, 9, 9).getTime();
  document.dispatchEvent(new Event('visibilitychange'));
  expect(onDayChanged).toHaveBeenCalledTimes(2);
  expect(record).not.toHaveBeenCalled();
  stop();
});

it('uses visibility and game-state events, flushes on cleanup and removes its listeners', () => {
  let now = 0;
  let tick = () => {};
  let changed = () => {};
  let context: LearningContext = { playerId: 'child', sessionId: 'round', mathematics: true, visible: true, focused: true };
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible', hasFocus: () => true });
  const window = Object.assign(new EventTarget(), {
    setInterval: vi.fn((callback: () => void) => { tick = callback; return 1; }), clearInterval: vi.fn(),
  });
  const unsubscribe = vi.fn();
  const record = vi.fn();
  const stop = startLearningTracker({ getContext: () => context, record, now: () => now,
    subscribe: listener => { changed = listener; return unsubscribe; },
    document: document as unknown as Document, window: window as unknown as Window });
  now = 1000; tick();
  expect(record).toHaveBeenLastCalledWith({ playerId: 'child', start: 0, end: 1000 });
  now = 1500; document.visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange'));
  expect(record).toHaveBeenLastCalledWith({ playerId: 'child', start: 1000, end: 1500 });
  now = 2500; tick();
  now = 3500; document.visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange'));
  expect(record).toHaveBeenCalledTimes(2);
  now = 4500; tick();
  now = 5000; context = { ...context, mathematics: false }; changed();
  now = 6000; tick();
  expect(record).toHaveBeenCalledTimes(4);
  now = 6500; context = { ...context, mathematics: true }; changed();
  now = 7000; stop();
  expect(record).toHaveBeenLastCalledWith({ playerId: 'child', start: 6500, end: 7000 });
  expect(unsubscribe).toHaveBeenCalledOnce();
  expect(window.clearInterval).toHaveBeenCalledWith(1);
  now = 7500; document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('blur'));
  expect(record).toHaveBeenCalledTimes(5);
});
