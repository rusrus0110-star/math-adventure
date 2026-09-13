import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { dependencies } from '@/app/dependencies';
import { AppShell } from '@/shared/components/AppShell';
import { BackButton } from '@/shared/components/BackButton';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import styles from './parents.module.css';

export function ParentGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(dependencies.parentAccess.unlocked);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { void dependencies.parentAccess.hasPin().then(setHasPin).catch(() => setError('PIN konnte nicht geladen werden. Bitte Seite neu laden.')); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (hasPin) await dependencies.parentAccess.unlock(pin); else await dependencies.parentAccess.setup(pin, confirmation);
      setPin(''); setConfirmation(''); setUnlocked(true);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Entsperren fehlgeschlagen.'); }
    finally { setBusy(false); }
  };
  if (unlocked) return <><div className={styles.lock}><button onClick={() => { dependencies.parentAccess.lock(); setUnlocked(false); setHasPin(true); }}>Elternbereich sperren</button></div>{children}</>;
  return <AppShell><main className={styles.panel}><BackButton to="/home" /><h1>Elternbereich</h1>
    {hasPin === null ? <p>Laden…</p> : <form onSubmit={event => void submit(event)}>
      <h2>{hasPin ? 'Bitte Eltern-PIN eingeben' : 'Eltern-PIN festlegen'}</h2>
      {!hasPin && <p>Liebe Eltern: Bitte legt eine eigene PIN mit 4–6 Ziffern fest. Sie gilt nur auf diesem Gerät. Merkt sie euch gut — es gibt keine Online-Wiederherstellung.</p>}
      <label>Eltern-PIN<input type="password" inputMode="numeric" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required autoComplete={hasPin ? 'current-password' : 'new-password'} value={pin} onChange={event => setPin(event.target.value)} /></label>
      {!hasPin && <label>PIN bestätigen<input type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} required autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
      <PrimaryButton disabled={busy}>{busy ? 'Bitte warten…' : hasPin ? 'Entsperren' : 'PIN festlegen'}</PrimaryButton>
    </form>}{error && <p role="alert">{error}</p>}
  </main></AppShell>;
}
