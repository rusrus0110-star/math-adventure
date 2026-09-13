import { Navigate, useNavigate } from 'react-router-dom';
import { MAX_STARS } from '@/domain/game/services/calculateRewards';
import { LEVELS } from '@/domain/progression/levels';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { BackButton } from '@/shared/components/BackButton';
import { t } from '@/shared/i18n';
import styles from './LevelsPage.module.css';

function renderStars(count: number): string {
  const safeCount = Math.max(0, Math.min(MAX_STARS, count));
  return `${'★'.repeat(safeCount)}${'☆'.repeat(MAX_STARS - safeCount)}`;
}

export function LevelsPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);

  if (!player) return <Navigate to="/players" replace />;

  return (
    <AppShell>
      <section className={styles.page}>
        <BackButton onClick={() => navigate('/home')} />
        <h1>{t('levels.title')}</h1>
        <p>10 Aufgaben: 5 Plus und 5 Minus. Mit 8 richtigen Antworten (5/7 Sterne) öffnet sich das nächste Level.</p>
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
                <span aria-label={`${stars} von ${MAX_STARS} Sternen`}>{renderStars(stars)}</span>
                {!unlocked && <span>🔒 {t('levels.locked')}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
