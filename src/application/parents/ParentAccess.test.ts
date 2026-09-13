import { describe, expect, it, vi } from 'vitest';
import type { ParentPinRecord } from '@/domain/parents/parentPin';
import { ParentAccess } from './ParentAccess';
import { openBonusSession } from '@/application/bonusGame/BonusSession';
import type { BonusGameRepository } from '@/application/ports/BonusGameRepository';

function fixture() {
  let stored: ParentPinRecord | undefined;
  const repository = { read: async () => stored, save: async (record: ParentPinRecord, expected: string | null) => { if ((stored?.hash ?? null) !== expected) throw new Error('Changed'); stored = record; } };
  return { repository, access: new ParentAccess(repository) };
}
describe('local parent access', () => {
  it('requires initial setup and persists only salted derived hash, never the PIN', async () => {
    const { access, repository } = fixture(); expect(await access.hasPin()).toBe(false);
    await access.setup('573829', '573829'); const record = await repository.read();
    expect(Object.keys(record!)).toEqual(['id', 'salt', 'hash', 'iterations']); expect(JSON.stringify(record)).not.toContain('573829');
    expect(access.unlocked).toBe(true); expect(await access.hasPin()).toBe(true);
  });
  it('rejects a wrong PIN and unlocks with the correct PIN', async () => {
    const { access } = fixture(); await access.setup('573829', '573829'); access.lock();
    await expect(access.unlock('2222')).rejects.toThrow(); expect(access.unlocked).toBe(false);
    await access.unlock('573829'); expect(access.unlocked).toBe(true);
  });
  it('reload creates a locked session and changing PIN requires the old one', async () => {
    const { access, repository } = fixture(); await access.setup('573829', '573829');
    const reloaded = new ParentAccess(repository); expect(reloaded.unlocked).toBe(false);
    await expect(reloaded.change('573829', '6789', '6789')).rejects.toThrow();
    await reloaded.unlock('573829'); await expect(reloaded.change('1111', '6789', '6789')).rejects.toThrow();
    await reloaded.change('573829', '6789', '6789'); reloaded.lock();
    await expect(reloaded.unlock('573829')).rejects.toThrow(); await reloaded.unlock('6789');
  });
  it('rejects invalid setup and a child cannot create a test launch', async () => {
    const { access } = fixture(); await expect(access.setup('abc', 'abc')).rejects.toThrow(); await expect(access.setup('1234', '4321')).rejects.toThrow();
    expect(() => access.createTest('child', 300_000)).toThrow();
  });
  it('an authorized test bypasses zero balance without any persistence, and its token is single-use', async () => {
    const { access } = fixture(); await access.setup('573829', '573829');
    const repository: BonusGameRepository = { start: vi.fn().mockRejectedValue(new Error('Du hast noch keine Bonuszeit.')), checkpoint: vi.fn(), read: vi.fn() };
    await expect(openBonusSession('child', undefined, access, repository)).rejects.toThrow('keine Bonuszeit');
    const launch = access.createTest('child', 300_000);
    const session = await openBonusSession('child', launch.id, access, repository);
    expect(session.test).toBe(true); expect(access.peekTest('child', launch.id)).toBeNull();
    session.time.advance(200, true); await session.checkpoint(176, true);
    expect(repository.checkpoint).not.toHaveBeenCalled(); expect(session.bestScore).toBe(0);
    await expect(openBonusSession('child', launch.id, access, repository)).rejects.toThrow();
  });
  it('query-like launch values, wrong player and locked parents cannot bypass the gate', async () => {
    const { access } = fixture(); const repository: BonusGameRepository = { start: vi.fn(), checkpoint: vi.fn(), read: vi.fn() };
    for (const token of ['test=true', 'free=true', true, 'parent=true']) await expect(openBonusSession('child', token, access, repository)).rejects.toThrow();
    await access.setup('573829', '573829'); const launch = access.createTest('child', 300_000);
    expect(access.peekTest('other', launch.id)).toBeNull(); access.lock();
    await expect(openBonusSession('child', launch.id, access, repository)).rejects.toThrow(); expect(repository.start).not.toHaveBeenCalled();
  });
});
