import { Navigate, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';
import styles from './RewardsPage.module.css';

export function RewardsPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);

  if (!player) return <Navigate to="/players" replace />;

  return (
    <AppShell>
      <section className={styles.page}>
        <button onClick={() => navigate('/home')}>← {t('common.back')}</button>
        <div className={styles.content}>
          <div className={styles.gift}>🎁</div>
          <h1>{t('rewards.title')}</h1>
          <p>{t('rewards.comingSoon')}</p>
        </div>
      </section>
    </AppShell>
  );
}
