import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dependencies } from '@/app/dependencies';
import { formatPlayTime } from '../domain/playTime';
import styles from './bonusGame.module.css';

export function ParentBonusCard({ playerId }: { playerId: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ balance: 0, best: 0 }); const [duration, setDuration] = useState(5); const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void Promise.all([dependencies.learningRepository.getByPlayerId(playerId), dependencies.bonusGameRepository.read(playerId)])
      .then(([account, progress]) => { if (!cancelled) setData({ balance: account.bonusTimeMs, best: progress.bestBonusGameScore }); })
      .catch(() => { if (!cancelled) setError('Bonuszeit konnte nicht geladen werden.'); });
    return () => { cancelled = true; };
  }, [playerId]);
  const test = () => {
    try { const launch = dependencies.parentAccess.createTest(playerId, duration * 60_000); navigate('/bonus-game', { state: { parentLaunchId: launch.id } }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Bitte Elternbereich entsperren.'); }
  };
  return <section className={styles.card}><h2>Bonus-Spiel</h2><p>Bonuszeit: {formatPlayTime(data.balance)} · Beste Punkte: {data.best}</p>
    <div className={styles.actions}><button disabled={!data.balance} onClick={() => navigate('/bonus-game')}>Bonus-Spiel starten</button>
      <label>Testdauer <select value={duration} onChange={event => setDuration(Number(event.target.value))}>{[5, 10, 20].map(minutes => <option key={minutes} value={minutes}>{minutes} Minuten</option>)}</select></label>
      <button onClick={test}>Testmodus starten</button></div>
    <p>Eine Freigabe ohne Verbrauch der verdienten Bonuszeit. Testpunkte werden nicht gespeichert.</p>{error && <p role="alert">{error}</p>}
  </section>;
}
