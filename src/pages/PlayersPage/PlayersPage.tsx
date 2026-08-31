import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { t } from '@/shared/i18n';
import styles from './PlayersPage.module.css';

export function PlayersPage() {
  const navigate = useNavigate();
  const players = usePlayerStore((state) => state.players);
  const createPlayer = usePlayerStore((state) => state.createPlayer);
  const selectPlayer = usePlayerStore((state) => state.selectPlayer);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await createPlayer(name);
      navigate('/home');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Fehler');
    }
  };

  const handleSelect = async (playerId: string) => {
    await selectPlayer(playerId);
    navigate('/home');
  };

  return (
    <AppShell>
      <section className={styles.page}>
        <h1>{t('players.title')}</h1>

        {players.length > 0 && (
          <div className={styles.players}>
            {players.map((player) => (
              <button
                key={player.id}
                className={styles.playerCard}
                onClick={() => void handleSelect(player.id)}
              >
                <span className={styles.avatar}>🐱</span>
                <strong>{player.name}</strong>
              </button>
            ))}
          </div>
        )}

        <form className={styles.form} onSubmit={(event) => void handleCreate(event)}>
          <h2>{t('players.newProfile')}</h2>
          <label htmlFor="player-name">{t('players.nameLabel')}</label>
          <input
            id="player-name"
            value={name}
            maxLength={30}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
          {error && <p className={styles.error}>{error}</p>}
          <PrimaryButton type="submit" disabled={name.trim().length === 0}>
            {t('players.create')}
          </PrimaryButton>
        </form>
      </section>
    </AppShell>
  );
}
