import { dailyGoalProgress, DAILY_PATH_SEGMENTS, type DailyActivity } from '@/domain/activity/dailyGoal';
import { VisualProgressPath } from './VisualProgressPath';
import styles from './LearningPath.module.css';

export function DailyLearningPath({ day }: { day: DailyActivity }) {
  const progress = dailyGoalProgress(day);
  return <section className={styles.card} aria-label="Dein Tagesziel">
    <strong role="status">{progress.completed ? 'Tagesziel geschafft! 🌟' : 'Dein Tagesziel mit Mia'}</strong>
    <span>Dein Lernweg heute</span>
    <VisualProgressPath progress={progress.timeProgress} completedSegments={progress.timeSegments} segments={DAILY_PATH_SEGMENTS} label={progress.timeProgress === 1 ? 'Lernweg geschafft' : 'Mia sammelt Lernzeit für heute'} goal="🌞" />
    <span className={styles.alternative}>oder ganze Spielrunden sammeln</span>
    <div className={styles.rounds} role="img" aria-label={progress.roundProgress === 1 ? 'Alle Spielrunden geschafft' : 'Deine gesammelten Spielrunden heute'}>
      {Array.from({ length: DAILY_PATH_SEGMENTS }, (_value, index) => <span key={index} data-complete={index < progress.roundSegments} aria-hidden="true">{index < progress.roundSegments ? '✓' : '⚑'}</span>)}
    </div>
    <small>{progress.completed ? 'Dieser Tag zählt für dein Wochenziel!' : 'Ein Weg bis zum Ziel reicht. Du schaffst das!'}</small>
  </section>;
}
