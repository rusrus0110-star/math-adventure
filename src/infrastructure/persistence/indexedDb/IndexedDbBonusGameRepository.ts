import type { BonusGameRepository } from '@/application/ports/BonusGameRepository';
import { createLearningAccount, spendBonusTime } from '@/domain/learning/learning';
import { availableSessionDuration, RUN_LEASE_MS } from '@/features/bonusGame/domain/playTime';
import { getDatabase, type DatabaseProvider } from './database';

export class IndexedDbBonusGameRepository implements BonusGameRepository {
  constructor(private databaseProvider: DatabaseProvider = getDatabase) {}
  async read(playerId: string) {
    return await (await this.databaseProvider()).get('bonusGames', playerId) ?? { playerId, bestBonusGameScore: 0, run: null };
  }
  async start(playerId: string, runId: string) {
    const database = await this.databaseProvider();
    const transaction = database.transaction(['bonusGames', 'learning'], 'readwrite');
    const progress = await transaction.objectStore('bonusGames').get(playerId);
    const account = await transaction.objectStore('learning').get(playerId);
    const limitMs = availableSessionDuration(account?.bonusTimeMs ?? 0);
    if (!limitMs || (progress?.run && !progress.run.closed && Date.now() - progress.run.lastSeenAt < RUN_LEASE_MS)) {
      await transaction.done;
      throw new Error(!limitMs ? 'Du hast noch keine Bonuszeit.' : 'Das Bonus-Spiel ist noch geöffnet. Bitte schließen oder kurz warten.');
    }
    const run = { id: runId, elapsedMs: 0, limitMs, lastSeenAt: Date.now(), closed: false };
    await transaction.objectStore('bonusGames').put({ playerId, bestBonusGameScore: progress?.bestBonusGameScore ?? 0, run });
    await transaction.done; return run;
  }
  async checkpoint(playerId: string, runId: string, elapsedMs: number, score: number, close: boolean) {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || !Number.isInteger(score) || score < 0) throw new Error('Ungültiger Spielstand.');
    const database = await this.databaseProvider();
    const transaction = database.transaction(['bonusGames', 'learning'], 'readwrite');
    try {
      const progress = await transaction.objectStore('bonusGames').get(playerId);
      const run = progress?.run;
      if (!progress || !run || run.id !== runId) throw new Error('Dieses Spiel wurde durch einen anderen Start ersetzt.');
      const account = await transaction.objectStore('learning').get(playerId) ?? createLearningAccount(playerId);
      const elapsed = run.closed ? run.elapsedMs : Math.max(run.elapsedMs, Math.min(run.limitMs, elapsedMs));
      const charge = Math.min(account.bonusTimeMs, elapsed - run.elapsedMs);
      const updated = spendBonusTime(account, charge);
      const bestScore = run.closed ? progress.bestBonusGameScore : Math.max(progress.bestBonusGameScore, score);
      await transaction.objectStore('learning').put(updated);
      await transaction.objectStore('bonusGames').put({ ...progress, bestBonusGameScore: bestScore,
        run: { ...run, elapsedMs: elapsed, lastSeenAt: Date.now(), closed: run.closed || close } });
      await transaction.done;
      return { balanceMs: updated.bonusTimeMs, remainingMs: Math.min(updated.bonusTimeMs, run.limitMs - elapsed), bestScore };
    } catch (error) {
      try { transaction.abort(); } catch { await transaction.done.catch(() => undefined); }
      await transaction.done.catch(() => undefined); throw error;
    }
  }
}
