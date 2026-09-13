import { MAX_STARS } from '@/domain/game/services/calculateRewards';
import type { MasteryFeedback } from '@/domain/game/services/masteryFeedback';
import { t } from '@/shared/i18n';
import styles from './MasterySummary.module.css';

interface MasterySummaryProps {
  sessionStars: number;
  mastery: MasteryFeedback | null;
}

export function MasterySummary({ sessionStars, mastery }: MasterySummaryProps) {
  return (
    <section className={`${styles.summary} ${sessionStars === MAX_STARS ? styles.complete : ''}`} aria-label={t('results.sessionStars')}>
      <strong>{t('results.sessionStars')}: {sessionStars} / {MAX_STARS}</strong>
      <div className={styles.stars} role="img" aria-label={`${sessionStars} von ${MAX_STARS} Sternen${mastery?.newStarNumbers.length ? `; neu: ${mastery.newStarNumbers.join(', ')}` : ''}`}>
        {Array.from({ length: MAX_STARS }, (_value, index) => {
          const starNumber = index + 1;
          const isNew = mastery?.newStarNumbers.includes(starNumber) ?? false;
          return (
            <span key={starNumber} className={`${styles.star} ${isNew ? styles.newStar : ''}`} data-star={starNumber} data-new={isNew} aria-hidden="true">
              <span>{starNumber <= sessionStars ? '★' : '☆'}</span>
              {isNew && <small>{t('results.newStar')}</small>}
            </span>
          );
        })}
      </div>
      {mastery && (
        <div className={styles.comparison}>
          <span>{t('results.previousBest')}: <strong>{mastery.previousBestStars} / {MAX_STARS}</strong></span>
          <span>{t('results.currentBest')}: <strong>{mastery.newBestStars} / {MAX_STARS}</strong></span>
          {mastery.isNewBest && <span>{t('results.newStars')}: <strong>+{mastery.newStarNumbers.length}</strong></span>}
        </div>
      )}
      <div className={styles.messages} role="status" aria-live="polite">
        {mastery?.isNewBest && <p>{t('results.newBest')} <span aria-hidden="true">⭐</span></p>}
        {mastery?.unlockedLevelId && <p>{t('results.nextLevelUnlocked')}</p>}
        {sessionStars === MAX_STARS && <p className={styles.perfect}>{t('results.fullMastery')}</p>}
      </div>
    </section>
  );
}
