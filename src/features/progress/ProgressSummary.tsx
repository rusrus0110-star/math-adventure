import type { PlayerProgress } from '@/domain/player/player.types';
import type { GameSessionRecord } from '@/domain/game/game.types';
import styles from './dashboard.module.css';

export function ProgressSummary({ progress, sessions }: { progress: PlayerProgress | null; sessions: readonly GameSessionRecord[] }) {
  const accuracy = progress?.totalQuestionsAnswered ? Math.round(progress.totalCorrectAnswers / progress.totalQuestionsAnswered * 100) : 0;
  const bestStars = Math.max(0, ...Object.values(progress?.levelStars ?? {}));
  const completed = sessions.filter(session => session.correctAnswers + session.wrongAnswers === 10);
  return (
    <dl className={styles.metrics}>
      <div><dt>Deine Münzen</dt><dd>🪙 {progress?.coins ?? 0}</dd></div>
      <div><dt>Höchster Level-Fortschritt</dt><dd>⭐ {bestStars} <small>von 7 Sternen</small></dd></div>
      <div><dt>Ganze Runden</dt><dd>{completed.length}</dd></div>
      <div><dt>Richtig beantwortet</dt><dd>{accuracy} %</dd></div>
    </dl>
  );
}
