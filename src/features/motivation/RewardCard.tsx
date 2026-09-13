import type { RewardState } from '@/domain/motivation/superPrizes';
import styles from '@/features/progress/dashboard.module.css';

interface RewardCardProps {
  name: string;
  icon: string;
  current: number;
  target: number;
  unit?: string;
  state: RewardState;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  disabled?: boolean;
  equipped?: boolean;
}

export function RewardCard({ name, icon, current, target, unit = 'Münzen', state, actionLabel, onAction, disabled = false, equipped = false }: RewardCardProps) {
  const remaining = Math.max(0, target - current);
  return (
    <article className={styles.card} data-state={state}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <h3>{name}</h3>
      <strong>{state === 'claimed' ? '✓ Eingelöst' : state === 'unlocked' ? '🔓 Freigeschaltet!' : '🔒 Noch gesperrt'}</strong>
      {equipped && <span>✓ Angezogen</span>}
      <progress aria-label={`Fortschritt: ${name}`} value={Math.min(current, target)} max={target} />
      <p>{current} / {target} {unit}</p>
      {remaining > 0 && <p>Noch {remaining} {unit}</p>}
      {actionLabel && <button type="button" disabled={disabled} onClick={onAction}>{actionLabel}</button>}
    </article>
  );
}
