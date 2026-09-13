import { useState, type FormEvent } from 'react';
import type { MotivationSettings } from '@/domain/motivation/motivation.types';
import { WEEKLY_REWARD_OPTIONS } from '@/domain/motivation/realRewards';
import { useMotivationStore } from './motivationStore';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import styles from '@/pages/ParentPage/ParentPage.module.css';

export function WeeklyGoalForm({ settings }: { settings: MotivationSettings }) {
  const save = useMotivationStore(state => state.saveWeeklyGoal);
  const [enabled, setEnabled] = useState(settings.weeklyGoalEnabled);
  const [rewardId, setRewardId] = useState(settings.weeklyRewardId);
  const [days, setDays] = useState(settings.weeklyRequiredDays);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    try {
      await save(settings.playerId, { enabled, rewardId, requiredDays: days });
      setMessage('Wochenziel gespeichert.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Speichern fehlgeschlagen.'); }
    finally { setBusy(false); }
  }
  return (
    <form className={styles.panel} onSubmit={event => void submit(event)}>
      <h2>Wochenziel einstellen</h2>
      <label className={styles.toggleRow}>Wochenziel verwenden<input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /></label>
      <fieldset className={styles.fieldset} disabled={busy || !enabled}>
        <legend>Belohnung auswählen</legend>
        <div className={styles.rewardOptions}>{WEEKLY_REWARD_OPTIONS.map(reward => (
          <button type="button" key={reward.id} aria-pressed={rewardId === reward.id} className={rewardId === reward.id ? styles.selectedReward : ''} onClick={() => setRewardId(reward.id)}>
            <span aria-hidden="true">{reward.icon}</span><strong>{reward.name}</strong>
          </button>
        ))}</div>
        <label className={styles.inputGroup}>Aktive Trainingstage pro Woche
          <select value={days} onChange={event => setDays(Number(event.target.value))}>{[3, 4, 5, 6, 7].map(day => <option key={day} value={day}>{day} Tage</option>)}</select>
        </label>
      </fieldset>
      <p>Ein Trainingstag zählt nach 5 vollständigen Runden mit je 10 Aufgaben oder 20 Minuten aktiver Lernzeit. Fehler sind erlaubt. Jeder lokale Kalendertag zählt einmal.</p>
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <PrimaryButton type="submit" disabled={busy}>{busy ? 'Speichern…' : 'Wochenziel speichern'}</PrimaryButton>
    </form>
  );
}
