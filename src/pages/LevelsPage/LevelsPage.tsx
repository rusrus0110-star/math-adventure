import { Navigate, useNavigate } from 'react-router-dom';
import { LEVELS } from '@/domain/progression/levels';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';
import styles from './LevelsPage.module.css';

function renderStars(count: number): string {
  return `${'⭐'.repeat(count)}${'☆'.repeat(3 - count)}`;
}

export function LevelsPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);

  if (!player) return <Navigate to="/players" replace />;

  return (
    <AppShell>
      <section className={styles.page}>
        <button className={styles.back} onClick={() => navigate('/home')}>← {t('common.back')}</button>
        <h1>{t('levels.title')}</h1>
        <div className={styles.list}>
          {LEVELS.map((level) => {
            const unlocked = progress?.unlockedLevelIds.includes(level.id) ?? level.order === 1;
            const stars = progress?.levelStars[level.id] ?? 0;

            return (
              <button
                key={level.id}
                className={styles.card}
                disabled={!unlocked}
                onClick={() => navigate(`/game/${level.id}`)}
              >
                <span className={styles.number}>Level {level.order}</span>
                <strong>{t(level.titleKey)}</strong>
                <span>{unlocked ? renderStars(stars) : `🔒 ${t('levels.locked')}`}</span>
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
