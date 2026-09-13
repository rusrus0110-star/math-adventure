import { useState, type FormEvent } from 'react';
import { dependencies } from '@/app/dependencies';
import styles from './parents.module.css';

export function ChangePin() {
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await dependencies.parentAccess.change(current, next, confirmation); setMessage('Eltern-PIN geändert.'); setCurrent(''); setNext(''); setConfirmation(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'PIN konnte nicht geändert werden.'); }
    finally { setBusy(false); }
  };
  return <details className={styles.panel}><summary>Eltern-PIN ändern</summary><form onSubmit={event => void submit(event)}>
    <label>Aktuelle PIN<input type="password" inputMode="numeric" required maxLength={6} autoComplete="current-password" value={current} onChange={event => setCurrent(event.target.value)} /></label>
    <label>Neue PIN<input type="password" inputMode="numeric" pattern="[0-9]{4,6}" required maxLength={6} autoComplete="new-password" value={next} onChange={event => setNext(event.target.value)} /></label>
    <label>Neue PIN bestätigen<input type="password" inputMode="numeric" required maxLength={6} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
    <button disabled={busy}>PIN ändern</button>{message && <p role="status">{message}</p>}
  </form></details>;
}
