import { describe, expect, it } from 'vitest';
import { createInitialProgress, unlockNextLevel } from './progression.service';

describe('unlockNextLevel', () => {
  it('unlocks the next level after reaching the required accuracy', () => {
    const progress = createInitialProgress('player-1');
    const updated = unlockNextLevel(progress, 'addition-5', 0.8);
    expect(updated.unlockedLevelIds).toContain('addition-10');
  });

  it('does not unlock the next level below the threshold', () => {
    const progress = createInitialProgress('player-1');
    const updated = unlockNextLevel(progress, 'addition-5', 0.7);
    expect(updated.unlockedLevelIds).not.toContain('addition-10');
  });
});
