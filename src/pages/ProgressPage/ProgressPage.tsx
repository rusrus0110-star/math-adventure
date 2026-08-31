import { Navigate, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';
import styles from './ProgressPage.module.css';

export function ProgressPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);

  if (!player) return <Navigate to="/players" replace />;

  const accuracy = progress && progress.totalQuestionsAnswered > 0
    ? Math.round((progress.totalCorrectAnswers / progress.totalQuestionsAnswered) * 100)
    : 0;

  return (
    <AppShell>
      <section className={styles.page}>
        <button className={styles.back} onClick={() => navigate('/home')}>← {t('common.back')}</button>
        <h1>{t('progress.title')}</h1>
        <div className={styles.card}>
          <div><span>{t('progress.questions')}</span><strong>{progress?.totalQuestionsAnswered ?? 0}</strong></div>
          <div><span>{t('progress.correct')}</span><strong>{progress?.totalCorrectAnswers ?? 0}</strong></div>
          <div><span>{t('progress.accuracy')}</span><strong>{accuracy} %</strong></div>
          <div><span>{t('progress.bestStreak')}</span><strong>🔥 {progress?.bestStreak ?? 0}</strong></div>
        </div>
      </section>
    </AppShell>
  );
}
