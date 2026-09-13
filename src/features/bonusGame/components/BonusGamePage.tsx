import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { dependencies } from '@/app/dependencies';
import { openBonusSession, type BonusSession } from '@/application/bonusGame/BonusSession';
import { usePlayerStore } from '@/features/player/playerStore';
import { useLearningStore } from '@/features/learning/learningStore';
import { BackButton } from '@/shared/components/BackButton';
import { AppShell } from '@/shared/components/AppShell';
import { BonusGameStage } from './BonusGameStage';
import styles from './bonusGame.module.css';

export function BonusGamePage() {
  const player = usePlayerStore(state => state.activePlayer);
  return player ? <PlayerBonusGame key={player.id} playerId={player.id} /> : <Navigate to="/players" replace />;
}
function PlayerBonusGame({ playerId }: { playerId: string }) {
  const lifecycle = useRef({ generation: 0 }); const mounted = useRef(false);
  const navigate = useNavigate(); const location = useLocation();
  const launchId: unknown = (location.state as { parentLaunchId?: unknown } | null)?.parentLaunchId;
  const test = dependencies.parentAccess.peekTest(playerId, launchId);
  const [session, setSession] = useState<BonusSession | null>(null); const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const lifetime = lifecycle.current; const generation = ++lifetime.generation; mounted.current = true;
    let cancelled = false;
    void dependencies.learningRepository.getByPlayerId(playerId).then(account => { if (!cancelled) setBalance(account.bonusTimeMs); }).catch(() => { if (!cancelled) setError('Bonuszeit konnte nicht geladen werden.'); });
    return () => { cancelled = true; mounted.current = false; queueMicrotask(() => { if (lifetime.generation === generation) dependencies.parentAccess.clearTest(); }); };
  }, [playerId]);
  const start = async () => {
    setBusy(true); setError('');
    try {
      const started = await openBonusSession(playerId, launchId, dependencies.parentAccess, dependencies.bonusGameRepository);
      if (mounted.current) setSession(started); else await started.checkpoint(0, true);
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Spiel konnte nicht gestartet werden.'); }
    finally { setBusy(false); }
  };
  const exit = () => { void useLearningStore.getState().load(playerId); navigate('/home'); };
  if (session) return <BonusGameStage session={session} onExit={exit} onReplay={() => { setBalance(session.balanceMs); setSession(null); }} />;
  return <AppShell><main className={styles.card}><BackButton to="/home" /><h1>Mias Sonnenpfad</h1>
    <p>Ein kleines Abenteuer voller Schätze. Folge dem Weg bis zum gelben Häuschen!</p>
    <p>Hüpfe über Lücken und entdecke geheime Höhenwege! Blaue Plattformen fahren mit dir. Orange Plattformen bröckeln kurz nach dem Landen und kommen wieder zurück.</p>
    {test && <p className={styles.test}>Eltern-Testmodus — ohne Verbrauch deiner Bonuszeit</p>}
    {balance === null && !test ? <p>Laden…</p> : !balance && !test ? <p>Du hast noch keine Bonuszeit.</p> : <>
      <p>Bewegen: ← → oder A / D. Springen: Leertaste, W oder ↑. Auf dem Handy helfen dir die großen Spieltasten.</p>
      <p>Du kannst jederzeit aufhören. Nicht gespielte Bonuszeit bleibt erhalten. Spielpunkte sind keine Mathe-Münzen.</p>
      <button disabled={busy} onClick={() => void start()}>{busy ? 'Startet…' : 'Los geht’s!'}</button>
    </>}{error && <p role="alert">{error}</p>}
  </main></AppShell>;
}
