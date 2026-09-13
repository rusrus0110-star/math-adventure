import { localDateKey, weekDates, WEEKDAY_LABELS } from '@/domain/activity/activity';
import type { ActivityDay } from '@/domain/activity/activity';
import styles from './dashboard.module.css';

export function WeeklyActivity({ activities }: { activities: readonly ActivityDay[] }) {
  const active = new Set(activities.map(day => day.localDate));
  const today = localDateKey();
  return (
    <div className={styles.week} aria-label="Trainingstage dieser Woche">
      {weekDates().map((date, index) => (
        <div key={date} className={active.has(date) ? styles.activeDay : styles.inactiveDay} aria-current={date === today ? 'date' : undefined}>
          <strong>{WEEKDAY_LABELS[index]}</strong>
          <span aria-hidden="true">{active.has(date) ? '✓' : '○'}</span>
          <span className={styles.srOnly}>{active.has(date) ? 'aktiv' : 'noch nicht aktiv'}</span>
        </div>
      ))}
    </div>
  );
}
