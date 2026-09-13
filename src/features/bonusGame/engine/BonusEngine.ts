import type { BonusLevel } from '../bonusGame.types';
import { createWorld, updateWorld } from '../domain/world';
import { CHECKPOINT_MS } from '../domain/playTime';
import type { BonusSession } from '@/application/bonusGame/BonusSession';
import { BonusInput } from './input';
import { renderWorld, resizeCanvas } from './render';
import type { Sprites } from './assets';

export interface BonusHud { hearts: number; score: number; coins: number; rareCoins: number; remainingMs: number; bestScore: number; status: 'playing' | 'paused' | 'saving' | 'finished' | 'expired' | 'error'; error: string | null }
export class BonusEngine {
  readonly world;
  readonly input = new BonusInput();
  private frame = 0;
  private previous = 0;
  private savedAt = 0;
  private lastHudAt = 0;
  private jumpHeld = false;
  private manualPause = false;
  private busy = 0;
  private disposed = false;
  private error: string | null = null;
  private closed = false;
  constructor(private canvas: HTMLCanvasElement, private level: BonusLevel, readonly session: BonusSession, private sprites: Sprites, private notify: (hud: BonusHud) => void, private reducedMotion: boolean) {
    this.world = createWorld(level); resizeCanvas(canvas);
  }
  private get stopped() { return this.world.finished || this.session.time.remainingMs <= 0; }
  private get visible() { return document.visibilityState === 'visible' && document.hasFocus(); }
  private emit() {
    this.notify({ hearts: this.world.player.hearts, score: this.world.score, coins: this.world.coins, rareCoins: this.world.rareCoins,
      remainingMs: this.session.time.remainingMs, bestScore: this.session.bestScore,
      status: this.error ? 'error' : this.busy ? 'saving' : this.world.finished ? 'finished' : !this.session.time.remainingMs ? 'expired' : this.manualPause || !this.visible ? 'paused' : 'playing', error: this.error });
  }
  render() { const context = this.canvas.getContext('2d'); if (context) renderWorld(context, this.world, this.level, this.sprites, this.reducedMotion); }
  start() { this.previous = performance.now(); this.render(); this.emit(); this.schedule(); }
  private schedule() {
    if (!this.frame && !this.disposed && !this.stopped && !this.manualPause && this.visible && !this.busy && !this.error) this.frame = requestAnimationFrame(this.loop);
  }
  private cancel() { cancelAnimationFrame(this.frame); this.frame = 0; }
  private loop = (timestamp: number) => {
    this.frame = 0;
    if (!this.visible || this.manualPause || this.disposed) return;
    const elapsed = Math.min(250, Math.max(0, timestamp - this.previous)); this.previous = timestamp;
    this.session.time.advance(elapsed, !this.stopped);
    const input = this.input.state;
    let remaining = Math.min(0.1, elapsed / 1000);
    let jumpPressed = input.jump && !this.jumpHeld; this.jumpHeld = input.jump;
    while (remaining > 0 && !this.stopped) {
      const step = Math.min(1 / 120, remaining); updateWorld(this.world, this.level, input, step, jumpPressed); jumpPressed = false; remaining -= step;
    }
    this.render();
    if (timestamp - this.lastHudAt >= 100 || this.stopped) { this.lastHudAt = timestamp; this.emit(); }
    if (this.stopped || this.session.time.elapsedMs - this.savedAt >= CHECKPOINT_MS) void this.save(this.stopped);
    else this.schedule();
  };
  async save(close = false) {
    this.cancel(); this.busy += 1; this.emit();
    try {
      await this.session.checkpoint(this.world.score, close);
      this.savedAt = this.session.time.elapsedMs; this.closed ||= close; this.error = null;
    } catch (error) { this.error = error instanceof Error ? error.message : 'Bonuszeit konnte nicht gespeichert werden.'; }
    finally { this.busy -= 1; this.previous = performance.now(); if (!this.disposed) { this.emit(); this.schedule(); } }
  }
  togglePause() { this.manualPause = !this.manualPause; if (this.manualPause) { this.input.clear(); this.jumpHeld = false; void this.save(); } else { this.previous = performance.now(); this.emit(); this.schedule(); } }
  visibilityChanged() { if (!this.visible) { this.input.clear(); this.jumpHeld = false; void this.save(); } else { this.previous = performance.now(); this.emit(); this.schedule(); } }
  async stop() { this.disposed = true; this.cancel(); if (!this.closed) await this.save(true); if (this.error) throw new Error(this.error); }
  resize() { resizeCanvas(this.canvas); this.render(); }
}
