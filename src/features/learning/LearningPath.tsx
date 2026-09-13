import { LEARNING_SEGMENTS, type LearningPathProgress } from '@/domain/learning/learning';
import { VisualProgressPath } from './VisualProgressPath';
import styles from './LearningPath.module.css';

export function LearningPath({ path }: { path: LearningPathProgress }) {
  return (
    <section className={styles.card} aria-label="Dein Weg zum Bonus-Spiel">
      <strong role="status">{path.label}</strong>
      <VisualProgressPath progress={path.progress} completedSegments={path.completedSegments} segments={LEARNING_SEGMENTS} label={path.label} goal="🎮" />
      {path.bonusAvailable && !path.full && path.label !== 'Bonus-Spiel freigeschaltet!' && <small>Bonus-Spiel freigeschaltet!</small>}
    </section>
  );
}
