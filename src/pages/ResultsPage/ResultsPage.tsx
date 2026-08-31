import { Navigate, useNavigate } from 'react-router-dom';
import { Character } from '@/features/character/Character';
import { useGameStore } from '@/features/game/gameStore';
import { AppShell } from '@/shared/components/AppShell';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { t } from '@/shared/i18n';
import styles from './ResultsPage.module.css';

export function ResultsPage() {
  const navigate = useNavigate();
  const result = useGameStore((state) => state.result);
  const reset = useGameStore((state) => state.reset);

  if (!result) return <Navigate to="/levels" replace />;

  const seconds = (result.durationMs / 1000).toFixed(1).replace('.', ',');

  const leave = (path: string) => {
    reset();
    navigate(path);
  };

  return (
    <AppShell>
      <section className={styles.page}>
        <div className={styles.resultLayout}>
          <div className={styles.characterPanel} aria-hidden="true">
            <Character mood="happy" />
          </div>

          <div className={styles.content}>
            <header className={styles.heading}>
              <h1>{t('results.title')} 🎉</h1>
              <div className={styles.stars} aria-label={`${result.stars} von 3 Sternen`}>
                <span aria-hidden="true">
                  {'⭐'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}
                </span>
              </div>
            </header>

            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span>{t('results.correct')}</span>
                <strong>{result.correctAnswers} / {result.questionCount}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>{t('results.bestStreak')}</span>
                <strong>{result.bestStreak}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>{t('results.time')}</span>
                <strong>{seconds} {t('results.seconds')}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>{t('results.score')}</span>
                <strong>+{result.score} ⭐</strong>
              </div>

              <div className={`${styles.summaryItem} ${styles.coinsItem}`}>
                <span>{t('results.coins')}</span>
                <strong>+{result.coinsEarned} 🪙</strong>
              </div>
            </div>

            <div className={styles.actions}>
              <PrimaryButton onClick={() => leave(`/game/${result.levelId}`)}>
                {t('common.retry')}
              </PrimaryButton>

              <PrimaryButton onClick={() => leave('/levels')}>
                {t('home.levels')}
              </PrimaryButton>

              <button className={styles.homeLink} onClick={() => leave('/home')}>
                {t('common.home')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
