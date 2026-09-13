import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { completeGameSession } from '@/application/game/completeGameSession';
import { useGameStore } from './gameStore';
import { LEVELS } from '@/domain/progression/levels';
import { calculateMasteryFeedback } from '@/domain/game/services/masteryFeedback';

vi.mock('@/app/dependencies', () => ({ dependencies: {} }));
vi.mock('@/application/game/completeGameSession', () => ({ completeGameSession: vi.fn() }));
const save = vi.mocked(completeGameSession);
const level = LEVELS[0]!;
const completion = { stars: 1, coinsEarned: 24, activityCoins: 5, mastery: calculateMasteryFeedback(1, { previousBestStars: 0, unlockedLevelId: 'addition-10' }) };

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  useGameStore.getState().reset();
  save.mockReset().mockResolvedValue(completion);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

async function answerQuestion() {
  const question = useGameStore.getState().currentQuestion!;
  const answer = useGameStore.getState().answer(question.correctAnswer);
  await vi.advanceTimersByTimeAsync(1500);
  return answer;
}

describe('game session lifecycle', () => {
  it('does not apply an old answer to a replacement session', async () => {
    useGameStore.getState().start('first', level);
    const answer = useGameStore.getState().answer(useGameStore.getState().currentQuestion!.correctAnswer);
    useGameStore.getState().start('second', level);
    const question = useGameStore.getState().currentQuestion;
    await vi.advanceTimersByTimeAsync(1500);
    await answer;
    expect(useGameStore.getState()).toMatchObject({ playerId: 'second', questionIndex: 0, attempts: [], currentQuestion: question });
    expect(save).not.toHaveBeenCalled();
  });
  it('ignores repeated clicks and cancelled sessions', async () => {
    useGameStore.getState().start('child', level);
    const answer = useGameStore.getState().answer(useGameStore.getState().currentQuestion!.correctAnswer);
    expect(await useGameStore.getState().answer(0)).toBe(false);
    useGameStore.getState().reset();
    await vi.advanceTimersByTimeAsync(1500);
    await answer;
    expect(useGameStore.getState().sessionId).toBeNull();
    expect(useGameStore.getState().attempts).toHaveLength(0);
  });
  it('retries failed saves with the same session and completion date', async () => {
    save.mockRejectedValueOnce(new Error('Storage unavailable'));
    useGameStore.getState().start('child', level);
    for (let index = 0; index < 10; index += 1) await answerQuestion();
    expect(useGameStore.getState()).toMatchObject({ error: 'Storage unavailable', isFinishing: false, result: null });
    const firstInput = save.mock.calls[0]![0];
    expect(firstInput.session.questionSetVersion).toBe('mixed-v1');
    vi.setSystemTime(new Date(2026, 8, 15));
    expect(await useGameStore.getState().retrySave()).toBe(true);
    expect(save.mock.calls[1]![0]).toEqual(firstInput);
    expect(useGameStore.getState().result?.stars).toBe(1);
    expect(useGameStore.getState().result?.mastery).toEqual(completion.mastery);
    expect(useGameStore.getState().attempts.filter(attempt => attempt.operation === 'subtraction')).toHaveLength(5);
  });
  it('does not publish a completed save into another game', async () => {
    let resolveSave!: (value: Awaited<ReturnType<typeof completeGameSession>>) => void;
    save.mockImplementationOnce(() => new Promise(resolve => { resolveSave = resolve; }));
    useGameStore.getState().start('first', level);
    for (let index = 0; index < 9; index += 1) await answerQuestion();
    const finalAnswer = useGameStore.getState().answer(useGameStore.getState().currentQuestion!.correctAnswer);
    await vi.advanceTimersByTimeAsync(1500);
    useGameStore.getState().start('second', level);
    resolveSave(completion);
    await finalAnswer;
    expect(useGameStore.getState()).toMatchObject({ playerId: 'second', result: null, attempts: [] });
  });
});
