import { MAX_STARS } from '@/domain/game/services/calculateRewards';
import type { MasteryFeedback } from '@/domain/game/services/masteryFeedback';
import { t } from '@/shared/i18n';
import styles from './MasterySummary.module.css';

interface MasterySummaryProps {
  mastery: MasteryFeedback | null;
}

export function MasterySummary({ mastery }: MasterySummaryProps) {
  if (!mastery) return <p>Historisches Ergebnis — kein Fortschritt im aktuellen Sternesystem.</p>;
  return (
    <section className={`${styles.summary} ${mastery.fullMastery ? styles.complete : ''}`} aria-label={t('results.levelProgress')}>
      <strong>{t('results.levelProgress')}: {mastery.newBestStars} / {MAX_STARS}</strong>
      <div className={styles.stars} role="img" aria-label={`${mastery.newBestStars} von ${MAX_STARS} Sternen${mastery.newStarNumbers.length ? `; neu: ${mastery.newStarNumbers.join(', ')}` : ''}`}>
        {Array.from({ length: MAX_STARS }, (_value, index) => {
          const starNumber = index + 1;
          const isNew = mastery.newStarNumbers.includes(starNumber);
          return (
            <span key={starNumber} className={`${styles.star} ${isNew ? styles.newStar : ''}`} data-star={starNumber} data-new={isNew} aria-hidden="true">
              <span>{starNumber <= mastery.newBestStars ? '★' : '☆'}</span>
              {isNew && <small>{t('results.newStar')}</small>}
            </span>
          );
        })}
      </div>
      <div className={styles.comparison}>
          <span>{t('results.previousBest')}: <strong>{mastery.previousBestStars} / {MAX_STARS}</strong></span>
          <span>{t('results.currentBest')}: <strong>{mastery.newBestStars} / {MAX_STARS}</strong></span>
          {mastery.isNewBest && <span>{t('results.newStars')}: <strong>+{mastery.newStarNumbers.length}</strong></span>}
      </div>
      <div className={styles.messages} role="status" aria-live="polite">
        {mastery.isNewBest && <p>{t('results.starEarned')}</p>}
        {!mastery.isNewBest && !mastery.fullMastery && <p>Weiterüben! Deine Sterne bleiben erhalten.</p>}
        {mastery.unlockedLevelId && <p>{t('results.nextLevelUnlocked')}</p>}
        {mastery.fullMastery && <p className={styles.perfect}>{t('results.fullMastery')}</p>}
      </div>
    </section>
  );
}
