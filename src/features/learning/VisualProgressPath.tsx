import { defaultCharacter } from '@/features/character/characters';
import styles from './LearningPath.module.css';

interface VisualProgressPathProps {
  progress: number;
  completedSegments: number;
  segments: number;
  label: string;
  goal: string;
}

export function VisualProgressPath({ progress, completedSegments, segments, label, goal }: VisualProgressPathProps) {
  return <div className={styles.journey} role="img" aria-label={label}>
    <div className={styles.track} aria-hidden="true">
      <div className={styles.marker} style={{ left: `${progress * 100}%` }}><img src={defaultCharacter.assets.idle} alt="" /></div>
      <div className={styles.segments}>
        {Array.from({ length: segments }, (_value, index) => <span key={index} data-complete={index < completedSegments} />)}
      </div>
    </div>
    <span className={styles.goal} aria-hidden="true">{goal}</span>
  </div>;
}
