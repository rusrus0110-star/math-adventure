import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BonusEngine, type BonusHud } from './BonusEngine';
import { BonusSession } from '@/application/bonusGame/BonusSession';
import { level1 } from '../levels/level1';
import type { Sprites } from './assets';

vi.mock('./render', () => ({ renderWorld: vi.fn(), resizeCanvas: vi.fn() }));

let visible: boolean;
let serial: number;
let callbacks: Map<number, FrameRequestCallback>;
beforeEach(() => {
  visible = true; serial = 0; callbacks = new Map();
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal('document', { get visibilityState() { return visible ? 'visible' : 'hidden'; }, hasFocus: () => visible });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++serial, callback); return serial; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function fixture(duration = 300_000) {
  const repository = { read: vi.fn(), start: vi.fn(), checkpoint: vi.fn().mockResolvedValue({ balanceMs: duration, remainingMs: duration, bestScore: 0 }) };
  const session = new BonusSession('child', 'run', false, duration, repository);
  const snapshots: BonusHud[] = [];
  const canvas = { getContext: () => ({}) } as unknown as HTMLCanvasElement;
  const engine = new BonusEngine(canvas, level1, session, {} as Sprites, snapshot => snapshots.push(snapshot), false);
  engine.start();
  return { engine, session, repository, latest: () => snapshots.at(-1)! };
}
function frame(timestamp: number) {
  const scheduled = [...callbacks.values()]; callbacks.clear();
  for (const callback of scheduled) callback(timestamp);
}

describe('game loop and persistence boundaries', () => {
  it('pauses physics and spending while hidden and resumes without charging background time', async () => {
    const { engine, session } = fixture(); engine.input.set('KeyD', 'right', true); frame(100);
    const elapsed = session.time.elapsedMs; const position = engine.world.player.x; const worldTime = engine.world.elapsed;
    visible = false; engine.visibilityChanged(); await engine.save(); frame(60_000);
    expect(session.time.elapsedMs).toBe(elapsed); expect(engine.world.player.x).toBe(position); expect(callbacks.size).toBe(0);
    expect(engine.world.elapsed).toBe(worldTime);
    visible = true; vi.mocked(performance.now).mockReturnValue(60_000); engine.visibilityChanged(); frame(60_100);
    expect(session.time.elapsedMs).toBe(elapsed + 100); await engine.stop();
  });
  it('does not charge or move after the finish trigger', async () => {
    const { engine, session, latest } = fixture();
    Object.assign(engine.world.player, { x: level1.finish.x, y: 432 }); frame(100); await engine.save(true);
    const elapsed = session.time.elapsedMs; frame(1000);
    expect(engine.world.finished).toBe(true); expect(session.time.elapsedMs).toBe(elapsed);
    expect(latest().status).toBe('finished'); expect(callbacks.size).toBe(0); await engine.stop();
  });
  it('freezes at zero time and closes the normal run', async () => {
    const { engine, session, repository, latest } = fixture(100); frame(100); await engine.save(true);
    expect(session.time.remainingMs).toBe(0); expect(latest().status).toBe('expired'); expect(callbacks.size).toBe(0);
    expect(repository.checkpoint).toHaveBeenCalledWith('child', 'run', 100, 0, true); await engine.stop();
  });
  it('save failures freeze play, retain elapsed time and can be retried without a new session', async () => {
    const { engine, session, repository, latest } = fixture(); frame(100);
    repository.checkpoint.mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'));
    await engine.save(); expect(latest().status).toBe('error'); frame(1000); expect(session.time.elapsedMs).toBe(100);
    await engine.save(); expect(latest().status).toBe('playing'); expect(callbacks.size).toBe(1);
    expect(repository.checkpoint.mock.calls[0]).toEqual(repository.checkpoint.mock.calls[1]); await engine.stop();
  });
  it('manual pause clears held input and exit checkpoints only the elapsed active time', async () => {
    const { engine, session, repository } = fixture(); engine.input.set('KeyD', 'right', true); frame(100);
    engine.togglePause(); await engine.save(); frame(2000);
    expect(session.time.elapsedMs).toBe(100); expect(engine.input.state.right).toBe(false);
    await engine.stop(); expect(repository.checkpoint).toHaveBeenLastCalledWith('child', 'run', 100, 0, true); expect(callbacks.size).toBe(0);
  });
});
