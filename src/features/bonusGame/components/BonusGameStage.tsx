import { useEffect, useRef, useState } from 'react';
import type { BonusSession } from '@/application/bonusGame/BonusSession';
import { BonusEngine, type BonusHud } from '../engine/BonusEngine';
import { loadSprites } from '../engine/assets';
import { level1 } from '../levels/level1';
import { formatPlayTime } from '../domain/playTime';
import { TouchControls } from './TouchControls';
import type { BonusInput } from '../engine/input';
import styles from './bonusGame.module.css';

export function BonusGameStage({ session, onExit, onReplay }: { session: BonusSession; onExit: () => void; onReplay: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null); const engine = useRef<BonusEngine | null>(null);
  const lifecycle = useRef({ generation: 0 });
  const [input, setInput] = useState<BonusInput | null>(null);
  const [hud, setHud] = useState<BonusHud | null>(null); const [error, setError] = useState(''); const [assetWarning, setAssetWarning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const lifetime = lifecycle.current; const generation = ++lifetime.generation;
    let disposed = false; let disconnect = () => {}; let observer: ResizeObserver | null = null;
    const changed = () => engine.current?.visibilityChanged();
    const pageHide = () => { void engine.current?.save(); };
    document.addEventListener('visibilitychange', changed); window.addEventListener('blur', changed); window.addEventListener('focus', changed); window.addEventListener('pagehide', pageHide);
    void loadSprites().then(sprites => {
      if (disposed || !canvas.current) return;
      if (!canvas.current.getContext('2d')) { setError('Canvas wird auf diesem Gerät nicht unterstützt.'); return; }
      setAssetWarning(Object.values(sprites).some(sprite => !sprite));
      const current = new BonusEngine(canvas.current, level1, session, sprites, snapshot => { if (!disposed) setHud(snapshot); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      engine.current = current; setInput(current.input); disconnect = current.input.connect(window);
      observer = new ResizeObserver(() => current.resize()); observer.observe(canvas.current); current.start(); canvas.current.focus();
    }).catch(() => { if (!disposed) setError('Das Spiel konnte nicht geladen werden.'); });
    return () => {
      disposed = true; disconnect(); observer?.disconnect();
      document.removeEventListener('visibilitychange', changed); window.removeEventListener('blur', changed); window.removeEventListener('focus', changed); window.removeEventListener('pagehide', pageHide);
      const current = engine.current; engine.current = null;
      queueMicrotask(() => {
        if (lifetime.generation === generation) void (current ? current.stop() : session.checkpoint(0, true)).catch(() => console.error('Bonuszeit-Abschluss konnte beim Verlassen nicht gespeichert werden.'));
      });
    };
  }, [session]);
  const leave = async (replay = false) => {
    setLeaving(true); setError('');
    try { if (engine.current) await engine.current.stop(); else await session.checkpoint(0, true); if (replay) onReplay(); else onExit(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Speichern fehlgeschlagen. Bitte erneut versuchen.'); }
    finally { setLeaving(false); }
  };
  const ended = hud?.status === 'finished' || hud?.status === 'expired';
  return <main className={styles.stage}>
    <header className={styles.hud}><span aria-label={`${hud?.hearts ?? 3} Herzen`}>{'❤️'.repeat(hud?.hearts ?? 3)}</span><strong>Punkte: {hud?.score ?? 0}</strong><span>Bonuszeit: {formatPlayTime(hud?.remainingMs ?? session.time.remainingMs)}</span>
      {session.test && <strong className={styles.test}>Eltern-Testmodus</strong>}
      <button disabled={!hud || ended || leaving} onClick={() => engine.current?.togglePause()}>{hud?.status === 'paused' ? 'Weiter' : 'Pause'}</button>
      <button aria-label="Bonus-Spiel verlassen" disabled={leaving} onClick={() => void leave()}>Beenden</button></header>
    <p className={styles.orientation}>Für das Bonus-Spiel bitte das Gerät drehen.</p>
    <div className={styles.viewport}><canvas ref={canvas} width={960} height={540} tabIndex={0} aria-label="Mias Sonnenpfad. Mit Pfeiltasten oder A und D bewegen, mit Leertaste, W oder Pfeil nach oben springen." />
      {(!hud || hud.status === 'paused') && <div className={styles.overlay}><strong>{hud ? 'Pause' : 'Mias Welt wird geladen…'}</strong></div>}
      {ended && <div className={styles.overlay}><section className={styles.result}><h1>{hud.status === 'finished' ? 'Geschafft! 🌟' : 'Deine Bonuszeit ist aufgebraucht.'}</h1>
        <p>Punkte: {hud.score} · Münzen gesammelt: {hud.coins}</p><p>Seltene Münze: {hud.rareCoins ? 'Gefunden!' : 'Noch nicht gefunden'}</p>
        {!session.test && <p>Beste Punkte: {hud.bestScore}</p>}<p>Bonuszeit übrig: {formatPlayTime(hud.remainingMs)}</p>
        <div className={styles.actions}><button disabled={leaving} onClick={() => void leave()}>Zurück zu Math Adventure</button>
          {!session.test && hud.remainingMs > 0 && <button disabled={leaving} onClick={() => void leave(true)}>Nochmal spielen</button>}</div>
      </section></div>}
      {hud?.status === 'error' && <div className={styles.overlay}><section className={styles.result}><p role="alert">{hud.error}</p><button onClick={() => void engine.current?.save(engine.current.world.finished || session.time.remainingMs <= 0)}>Erneut speichern</button></section></div>}
    </div>
    {!ended && <TouchControls input={input} />}
    {error && <p role="alert">{error}</p>}{assetWarning && <p role="status">Einige Bilder fehlen. Du kannst mit Ersatzformen weiterspielen.</p>}
    <p className={styles.hint}>← → / A D bewegen · Leertaste / W / ↑ springen · Blau fährt mit · Orange bröckelt · Oben warten Schätze!</p>
  </main>;
}
