import { localDateKey, weekDates, WEEKDAY_LABELS } from '@/domain/activity/activity';
import { isActiveDay, type DailyActivity } from '@/domain/activity/dailyGoal';
import styles from './dashboard.module.css';

export function WeeklyActivity({ activities }: { activities: readonly DailyActivity[] }) {
  const active = new Set(activities.filter(isActiveDay).map(day => day.localDate));
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
