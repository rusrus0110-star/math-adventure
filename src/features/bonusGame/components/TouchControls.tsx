import type { InputState } from '../bonusGame.types';
import type { BonusInput } from '../engine/input';
import styles from './bonusGame.module.css';

export function TouchControls({ input }: { input: BonusInput | null }) {
  return <div className={styles.controls} aria-label="Spielsteuerung">
    {([['left', '←', 'Nach links'], ['right', '→', 'Nach rechts'], ['jump', 'SPRINGEN', 'Springen']] as const).map(([action, label, ariaLabel]) =>
      <button key={action} className={action === 'jump' ? styles.jump : ''} type="button" aria-label={ariaLabel}
        onKeyDown={event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); input?.set(`button-${action}`, action as keyof InputState, true); } }}
        onKeyUp={event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); input?.set(`button-${action}`, action, false); } }}
        onBlur={() => input?.set(`button-${action}`, action, false)}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); input?.set(`pointer-${event.pointerId}`, action, true); }}
        onPointerUp={event => input?.set(`pointer-${event.pointerId}`, action, false)}
        onPointerCancel={event => input?.set(`pointer-${event.pointerId}`, action, false)}
        onLostPointerCapture={event => input?.set(`pointer-${event.pointerId}`, action, false)}>{label}</button>)}
  </div>;
}
