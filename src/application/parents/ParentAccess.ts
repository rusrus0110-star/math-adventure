import type { ParentPinRepository } from '@/application/ports/ParentPinRepository';
import { createPinRecord, verifyPin } from '@/domain/parents/parentPin';

export interface ParentTestLaunch { id: string; mode: 'parent-test'; playerId: string; durationMs: number; startedAt: number }
export class ParentAccess {
  unlocked = false;
  private pending: ParentTestLaunch | null = null;
  private failures = 0;
  private retryAfter = 0;
  constructor(private repository: ParentPinRepository) {}
  async hasPin() { return Boolean(await this.repository.read()); }
  async setup(pin: string, confirmation: string) {
    if (pin !== confirmation) throw new Error('Die PINs stimmen nicht überein.');
    await this.repository.save(await createPinRecord(pin), null);
    this.unlocked = true;
  }
  async unlock(pin: string) {
    if (Date.now() < this.retryAfter) throw new Error('Bitte kurz warten und erneut versuchen.');
    const record = await this.repository.read();
    if (!record || !await verifyPin(pin, record)) {
      this.failures += 1;
      if (this.failures >= 5) this.retryAfter = Date.now() + 30_000;
      throw new Error('Die PIN ist nicht richtig.');
    }
    this.failures = 0; this.unlocked = true;
  }
  async change(pin: string, next: string, confirmation: string) {
    if (!this.unlocked) throw new Error('Bitte zuerst den Elternbereich entsperren.');
    const previous = await this.repository.read();
    if (!previous || !await verifyPin(pin, previous)) throw new Error('Die aktuelle PIN ist nicht richtig.');
    if (next !== confirmation) throw new Error('Die PINs stimmen nicht überein.');
    await this.repository.save(await createPinRecord(next), previous.hash);
  }
  lock() { this.unlocked = false; this.pending = null; }
  createTest(playerId: string, durationMs: number): ParentTestLaunch {
    if (!this.unlocked || ![5, 10, 20].some(minutes => minutes * 60_000 === durationMs)) throw new Error('Kein freigegebener Eltern-Testmodus.');
    this.pending = { id: crypto.randomUUID(), mode: 'parent-test', playerId, durationMs, startedAt: Date.now() };
    return this.pending;
  }
  peekTest(playerId: string, launchId: unknown) {
    return this.unlocked && this.pending?.playerId === playerId && this.pending.id === launchId && Date.now() - this.pending.startedAt < 60_000 ? this.pending : null;
  }
  takeTest(playerId: string, launchId: unknown) {
    const launch = this.peekTest(playerId, launchId);
    this.pending = null;
    return launch;
  }
  clearTest() { this.pending = null; }
}
