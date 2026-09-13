import { beforeEach, expect, it, vi } from 'vitest';
import { dependencies } from '@/app/dependencies';
import { addActiveLearning, createLearningAccount, REQUIRED_LEARNING_MS, type LearningAccount } from '@/domain/learning/learning';
import { useLearningStore } from './learningStore';
import { createDailyActivity } from '@/domain/activity/dailyGoal';

it('loads a fresh daily goal on the next local day without resetting saved Bonuszeit', async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date(2026, 8, 7, 23, 59));
    read.mockResolvedValue({ ...createLearningAccount('child'), bonusTimeMs: 300_000 });
    vi.mocked(dependencies.activityRepository.getByDate).mockImplementation(async (playerId, date) => ({ ...createDailyActivity(playerId, date), completedSessions: date === '2026-09-07' ? 5 : 0 }));
    await useLearningStore.getState().load('child');
    expect(useLearningStore.getState().today?.completedSessions).toBe(5);
    vi.setSystemTime(new Date(2026, 8, 8, 0, 1));
    await useLearningStore.getState().load('child');
    expect(useLearningStore.getState().today).toMatchObject({ localDate: '2026-09-08', completedSessions: 0, activeLearningMs: 0 });
    expect(useLearningStore.getState().account?.bonusTimeMs).toBe(300_000);
  } finally { vi.useRealTimers(); }
});

vi.mock('@/app/dependencies', () => ({ dependencies: { learningRepository: { getByPlayerId: vi.fn(), record: vi.fn() }, activityRepository: { getByDate: vi.fn() } } }));
const read = vi.mocked(dependencies.learningRepository.getByPlayerId);
const record = vi.mocked(dependencies.learningRepository.record);
beforeEach(() => {
  vi.resetAllMocks();
  useLearningStore.setState({ playerId: null, account: null, today: null, path: null, error: null });
  vi.mocked(dependencies.activityRepository.getByDate).mockImplementation(async (playerId, date) => createDailyActivity(playerId, date));
  read.mockImplementation(async playerId => createLearningAccount(playerId));
  record.mockImplementation(async interval => addActiveLearning(createLearningAccount(interval.playerId), interval.end - interval.start));
});

it('does not replace the selected child with a stale loaded learning account', async () => {
  let resolveFirst!: (account: LearningAccount) => void;
  read.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
  const first = useLearningStore.getState().load('first');
  await vi.waitFor(() => expect(read).toHaveBeenCalledWith('first'));
  await useLearningStore.getState().load('second');
  resolveFirst(createLearningAccount('first'));
  await first;
  expect(useLearningStore.getState().account?.playerId).toBe('second');
});

it('retains failed writes for retry without pretending to grant a bonus', async () => {
  await useLearningStore.getState().load('child');
  record.mockRejectedValueOnce(new Error('Storage unavailable'));
  const interval = { playerId: 'child', start: 0, end: REQUIRED_LEARNING_MS };
  await useLearningStore.getState().record(interval);
  expect(useLearningStore.getState()).toMatchObject({ error: 'Storage unavailable', path: { progress: 0 } });
  await useLearningStore.getState().flush();
  expect(record).toHaveBeenNthCalledWith(2, interval);
  expect(useLearningStore.getState()).toMatchObject({ error: null, account: { learningProgressMs: 0 }, path: { progress: 1, completedSegments: 5, bonusAvailable: true } });
  await useLearningStore.getState().record({ playerId: 'child', start: REQUIRED_LEARNING_MS, end: REQUIRED_LEARNING_MS + 1000 });
  expect(useLearningStore.getState().path?.completedSegments).toBe(0);
});
