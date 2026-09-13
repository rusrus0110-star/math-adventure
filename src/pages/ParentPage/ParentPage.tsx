import { requestStorageRetention } from '@/infrastructure/persistence/storageRetention';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppShell } from '@/shared/components/AppShell';
import { BackButton } from '@/shared/components/BackButton';
import { useDashboard } from '@/features/progress/useDashboard';
import { ProgressSummary } from '@/features/progress/ProgressSummary';
import { WeeklyActivity } from '@/features/progress/WeeklyActivity';
import { WeeklyGoalForm } from '@/features/motivation/WeeklyGoalForm';
import { RewardCollection } from '@/features/motivation/RewardCollection';
import { usePlayerStore } from '@/features/player/playerStore';
import { getLevelById } from '@/domain/progression/levels';
import { t } from '@/shared/i18n';
import styles from '@/features/progress/dashboard.module.css';

export function ParentPage() {
  const { player, progress, data, ready } = useDashboard();
  const players = usePlayerStore(state => state.players);
  const selectPlayer = usePlayerStore(state => state.selectPlayer);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  if (!player) return <Navigate to="/players" replace />;
  const switchPlayer = async (playerId: string) => {
    setSelectionError(null);
    try { await selectPlayer(playerId); }
    catch (error) { setSelectionError(error instanceof Error ? error.message : 'Profil konnte nicht geladen werden.'); }
  };
  const protectStorage = async () => {
    try {
      const retained = await requestStorageRetention();
      setStorageMessage(retained ? 'Der Browser schützt die Daten vor automatischer Speicherbereinigung.' : 'Der Browser hat dauerhaften Speicher nicht zugesagt. Bitte Website-Daten nicht löschen.');
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Speicherschutz konnte nicht angefragt werden.');
    }
  };
  return (
    <AppShell><main className={styles.page}>
      <header className={styles.header}><BackButton to="/home" /><h1>Elternbereich</h1></header>
      <label>Kind auswählen <select value={player.id} onChange={event => void switchPlayer(event.target.value)}>{players.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
      {selectionError && <p role="alert">{selectionError}</p>}
      {data.error && <p role="alert" className={styles.error}>{data.error}<button onClick={() => void data.refresh(player.id)}>Erneut laden</button></p>}
      {!ready ? <p>Laden…</p> : <>
        <ProgressSummary progress={progress} sessions={data.sessions} />
        <section className={styles.panel}><h2>Aktivität von {player.name}</h2>
          <p>{progress?.totalQuestionsAnswered ?? 0} Aufgaben · {progress?.totalCorrectAnswers ?? 0} richtig · Beste Serie: {progress?.bestStreak ?? 0}</p>
          <WeeklyActivity activities={data.activities} />
          <p>{data.weeklyProgress?.completedDays ?? 0} aktive Tage diese Woche · {data.activities.length} Trainingstage insgesamt</p>
          <p>Wochenziel: {data.settings?.weeklyGoalEnabled ? data.weeklyProgress?.completed ? 'Erreicht ✓' : `${data.weeklyProgress?.completedDays ?? 0} / ${data.settings.weeklyRequiredDays} Tage` : 'Nicht aktiviert'}</p>
        </section>
        <section className={styles.panel}><h2>Letzte Ergebnisse</h2>
          {!data.sessions.length ? <p>Noch keine abgeschlossene Runde.</p> : <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th>Datum</th><th>Level</th><th>Richtig</th><th>Sterne</th><th>Münzen</th></tr></thead>
            <tbody>{data.sessions.slice(0, 10).map(session => <tr key={session.id}>
              <td>{new Date(session.completedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>{t(getLevelById(session.levelId)?.titleKey ?? session.levelId)}</td>
              <td>{session.correctAnswers} / {session.correctAnswers + session.wrongAnswers}</td><td>{session.stars} / 7</td><td>+{session.coinsEarned}</td>
            </tr>)}</tbody>
          </table></div>}
        </section>
        {data.settings && <WeeklyGoalForm key={player.id} settings={data.settings} />}
        <section><h2>Wochenbelohnung bestätigen</h2><RewardCollection key={`weekly:${player.id}`} playerId={player.id} coins={progress?.coins ?? 0} tab="Wochenziel" parent /></section>
        <section><h2>Superpreise</h2><RewardCollection key={`super:${player.id}`} playerId={player.id} coins={progress?.coins ?? 0} tab="Superpreise" parent /></section>
        <section className={styles.panel}><h2>Daten auf diesem Gerät</h2><p>Fortschritt bleibt beim Schließen erhalten. Das Löschen von Website-Daten entfernt ihn; es gibt keine Cloud-Sicherung.</p>
          <button type="button" onClick={() => void protectStorage()}>Gerätespeicher schützen</button>
          {storageMessage && <p role="status">{storageMessage}</p>}
        </section>
        <p>Belohnungen werden erst nach deiner Bestätigung als eingelöst markiert. Münzen bleiben erhalten.</p>
      </>}
    </main></AppShell>
  );
}
