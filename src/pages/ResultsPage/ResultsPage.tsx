import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { dependencies } from '@/app/dependencies';
import {
  calculateWeeklyGoalProgress,
  coinsUntilReward,
  rewardProgressPercent,
} from '@/domain/motivation/motivation.service';
import { getRealRewardById } from '@/domain/motivation/realRewards';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';
import { Character } from '@/features/character/Character';
import { useGameStore } from '@/features/game/gameStore';
import { MasterySummary } from '@/features/game/MasterySummary';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { t } from '@/shared/i18n';
import styles from './ResultsPage.module.css';

export function ResultsPage() {
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weeklyGoalJustCompleted, setWeeklyGoalJustCompleted] = useState(false);
  const result = useGameStore((state) => state.result);
  const reset = useGameStore((state) => state.reset);
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);
  const motivationPlayerId = useMotivationStore((state) => state.playerId);
  const motivation = useMotivationStore((state) => state.settings);
  const weeklyProgress = useMotivationStore((state) => state.weeklyProgress);
  const loadMotivation = useMotivationStore((state) => state.loadForPlayer);

  useEffect(() => {
    if (player) void loadMotivation(player.id);
  }, [loadMotivation, player]);

  const activeMotivation = motivationPlayerId === player?.id ? motivation : null;
  const activeWeeklyProgress = motivationPlayerId === player?.id ? weeklyProgress : null;

  useEffect(() => {
    if (!player || !result || !activeMotivation?.weeklyGoalEnabled) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      dependencies.sessionRepository.listByPlayerId(player.id),
      dependencies.activityRepository.listByPlayerId(player.id),
    ]).then(([sessions, days]) => {
      if (cancelled) return;

      const session = sessions.find(candidate => candidate.id === result.sessionId);
      const current = calculateWeeklyGoalProgress(days, activeMotivation.weeklyRequiredDays);
      const before = calculateWeeklyGoalProgress(
        days.map(day => day.localDate === session?.localDate ? { ...day, completedSessions: Math.max(0, day.completedSessions - 1) } : day),
        activeMotivation.weeklyRequiredDays,
      );

      setWeeklyGoalJustCompleted(current.completed && !before.completed);
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Wochenziel konnte nicht geladen werden.');
    });

    return () => {
      cancelled = true;
    };
  }, [activeMotivation, player, result]);

  if (!result) return <Navigate to="/levels" replace />;
  if (!player || result.playerId !== player.id) return <Navigate to="/players" replace />;

  const seconds = (result.durationMs / 1000).toFixed(1).replace('.', ',');
  const totalCoins = progress?.coins ?? result.coinsEarned;
  const previousCoins = Math.max(0, totalCoins - result.coinsEarned);
  const wish = getVirtualRewardById(activeMotivation?.selectedVirtualRewardId);
  const equippedReward = getVirtualRewardById(activeMotivation?.equippedVirtualRewardId);
  const wishUnlockedNow = Boolean(
    wish && previousCoins < wish.thresholdCoins && totalCoins >= wish.thresholdCoins,
  );
  const weeklyReward = getRealRewardById(activeMotivation?.weeklyRewardId);
  const weeklyTitle = weeklyReward?.name ?? 'Wochenbelohnung';

  const leave = (path: string) => {
    reset();
    navigate(path);
  };

  return (
    <AppShell>
      <section className={styles.page}>
        <div className={styles.resultLayout}>
          <div className={styles.characterPanel} aria-hidden="true">
            <Character mood="happy" accessoryIcon={equippedReward?.icon} />
          </div>

          <div className={styles.content}>
            {loadError && <p role="alert">{loadError}</p>}
            <header className={styles.heading}>
              <h1>{t('results.title')} 🎉</h1>
              <p>{Math.round(result.correctAnswers / result.questionCount * 100)} % richtig</p>
            </header>

            <MasterySummary key={result.sessionId} mastery={result.mastery} />

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
                <strong>+{result.score} Pkt.</strong>
              </div>
            </div>

            <div className={styles.coinReward}>
              <span className={styles.coinIcon}>🪙</span>
              <div>
                <small>{t('results.coins')} · davon +{result.activityCoins} Tagesbonus</small>
                <strong>+{result.coinsEarned}</strong>
              </div>
              <span className={styles.coinTotal}>{previousCoins} → {totalCoins}</span>
            </div>

            <div className={styles.motivationRow}>
              {wish && (
                <button className={styles.goalMiniCard} onClick={() => leave('/rewards')}>
                  <span className={styles.miniIcon}>{wish.icon}</span>
                  <div>
                    <small>{t('motivation.myWish')}</small>
                    <strong>{wishUnlockedNow ? `✨ ${t('motivation.unlocked')}` : wish.name}</strong>
                    <div className={styles.goalProgress} aria-hidden="true">
                      <span style={{ width: `${rewardProgressPercent(wish, totalCoins)}%` }} />
                    </div>
                    <small>
                      {totalCoins >= wish.thresholdCoins
                        ? wish.name
                        : `${t('motivation.only')} ${coinsUntilReward(wish, totalCoins)} ${t('motivation.coinsLeft')}`}
                    </small>
                  </div>
                </button>
              )}

              {activeMotivation?.weeklyGoalEnabled && activeWeeklyProgress && (
                <div className={`${styles.goalMiniCard} ${styles.weeklyMiniCard}`}>
                  <span className={styles.miniIcon}>{weeklyReward?.icon ?? '⭐'}</span>
                  <div>
                    <small>{t('motivation.weeklyGoal')}</small>
                    <strong>
                      {weeklyGoalJustCompleted ? `🎉 ${t('motivation.weeklyCompleted')}` : weeklyTitle}
                    </strong>
                    <div className={styles.goalProgress} aria-hidden="true">
                      <span
                        className={styles.weekFill}
                        style={{
                          width: `${Math.min(100, Math.round((activeWeeklyProgress.completedDays / activeWeeklyProgress.requiredDays) * 100))}%`,
                        }}
                      />
                    </div>
                    <small>{activeWeeklyProgress.completedDays} / {activeWeeklyProgress.requiredDays} Trainingstage</small>
                  </div>
                </div>
              )}
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
