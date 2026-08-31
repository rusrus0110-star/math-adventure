import { Navigate, useNavigate } from 'react-router-dom';
import { Character } from '@/features/character/Character';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { t } from '@/shared/i18n';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);

  if (!player) {
    return <Navigate to="/players" replace />;
  }

  return (
    <AppShell>
      <section className={styles.page}>
        <header className={styles.stats}>
          <span>⭐ {progress?.totalScore ?? 0}</span>
          <span>🪙 {progress?.coins ?? 0}</span>
        </header>

        <div className={styles.hero}>
          <Character />
          <p>{t('home.welcome')},</p>
          <h1>{player.name}!</h1>
          <h2>{t('app.title')}</h2>
        </div>

        <div className={styles.actions}>
          <PrimaryButton onClick={() => navigate('/levels')}>▶ {t('common.play')}</PrimaryButton>
          <PrimaryButton onClick={() => navigate('/progress')}>📊 {t('home.progress')}</PrimaryButton>
          <PrimaryButton onClick={() => navigate('/rewards')}>🎁 {t('home.rewards')}</PrimaryButton>
          <button className={styles.link} onClick={() => navigate('/players')}>
            {t('players.switch')}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
