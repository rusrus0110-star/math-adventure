import type { BonusGameRepository } from '@/application/ports/BonusGameRepository';
import type { ParentAccess } from '@/application/parents/ParentAccess';
import { ActivePlayTime } from '@/features/bonusGame/domain/playTime';

export class BonusSession {
  readonly time: ActivePlayTime;
  bestScore = 0;
  balanceMs = 0;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(readonly playerId: string, readonly id: string, readonly test: boolean, durationMs: number, private repository: BonusGameRepository) {
    this.time = new ActivePlayTime(durationMs); this.balanceMs = durationMs;
  }
  checkpoint(score: number, close = false): Promise<void> {
    const elapsed = this.time.elapsedMs;
    const save = async () => {
      if (this.test) { this.balanceMs = this.time.remainingMs; return; }
      const saved = await this.repository.checkpoint(this.playerId, this.id, elapsed, score, close);
      this.balanceMs = saved.balanceMs; this.bestScore = saved.bestScore;
      this.time.limitMs = Math.min(this.time.limitMs, this.time.elapsedMs + saved.remainingMs);
    };
    const task = this.queue.then(save, save); this.queue = task; return task;
  }
}
export async function openBonusSession(playerId: string, launchId: unknown, access: ParentAccess, repository: BonusGameRepository) {
  if (launchId !== undefined && launchId !== null) {
    const launch = access.takeTest(playerId, launchId);
    if (!launch) throw new Error('Bitte den Testmodus im Elternbereich starten.');
    return new BonusSession(playerId, launch.id, true, launch.durationMs, repository);
  }
  const id = crypto.randomUUID(); const run = await repository.start(playerId, id);
  return new BonusSession(playerId, id, false, run.limitMs, repository);
}
