import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dependencies } from '@/app/dependencies';
import { usePlayerStore } from './playerStore';
import { createInitialProgress } from '@/domain/progression/progression.service';

vi.mock('@/app/dependencies', () => ({
  dependencies: { progressRepository: { getByPlayerId: vi.fn() } },
}));
const read = vi.mocked(dependencies.progressRepository.getByPlayerId);

beforeEach(() => {
  vi.stubGlobal('localStorage', { setItem: vi.fn(), getItem: vi.fn() });
  read.mockReset();
  usePlayerStore.setState({
    players: ['first', 'second'].map(id => ({ id, name: id, characterId: 'mia-cat', createdAt: '', updatedAt: '' })),
    activePlayer: null, progress: null,
  });
});

describe('player state races', () => {
  it('keeps the most recently selected player when reads finish out of order', async () => {
    let resolveFirst!: (value: ReturnType<typeof createInitialProgress>) => void;
    read.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    read.mockResolvedValueOnce(createInitialProgress('second'));
    const first = usePlayerStore.getState().selectPlayer('first');
    await usePlayerStore.getState().selectPlayer('second');
    resolveFirst(createInitialProgress('first'));
    await first;
    expect(usePlayerStore.getState().activePlayer?.id).toBe('second');
    expect(usePlayerStore.getState().progress?.playerId).toBe('second');
  });
  it('does not install stale progress after switching profiles', async () => {
    read.mockResolvedValueOnce(createInitialProgress('first'));
    await usePlayerStore.getState().selectPlayer('first');
    let resolveProgress!: (value: ReturnType<typeof createInitialProgress>) => void;
    read.mockImplementationOnce(() => new Promise(resolve => { resolveProgress = resolve; }));
    const refresh = usePlayerStore.getState().refreshProgress();
    read.mockResolvedValueOnce(createInitialProgress('second'));
    await usePlayerStore.getState().selectPlayer('second');
    resolveProgress(createInitialProgress('first'));
    await refresh;
    expect(usePlayerStore.getState().progress?.playerId).toBe('second');
  });
});
