import type { InputState } from '../bonusGame.types';

export class BonusInput {
  private sources = new Map<string, keyof InputState>();
  set(source: string, action: keyof InputState, pressed: boolean) { if (pressed) this.sources.set(source, action); else this.sources.delete(source); }
  clear() { this.sources.clear(); }
  get state(): InputState {
    const actions = [...this.sources.values()];
    return { left: actions.includes('left'), right: actions.includes('right'), jump: actions.includes('jump') };
  }
  connect(target: Window) {
    const mappings: Record<string, keyof InputState> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' };
    const down = (event: KeyboardEvent) => {
      const action = mappings[event.code];
      if (!action || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName))) return;
      event.preventDefault(); this.set(event.code, action, true);
    };
    const up = (event: KeyboardEvent) => { const action = mappings[event.code]; if (action) this.set(event.code, action, false); };
    const clear = () => this.clear();
    target.addEventListener('keydown', down); target.addEventListener('keyup', up); target.addEventListener('blur', clear);
    return () => { clear(); target.removeEventListener('keydown', down); target.removeEventListener('keyup', up); target.removeEventListener('blur', clear); };
  }
}
