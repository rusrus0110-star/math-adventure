import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  coinsUntilReward,
  rewardProgressPercent,
} from '@/domain/motivation/motivation.service';
import { getRealRewardById } from '@/domain/motivation/realRewards';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';
import { Character } from '@/features/character/Character';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { t } from '@/shared/i18n';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);
  const motivationPlayerId = useMotivationStore((state) => state.playerId);
  const motivation = useMotivationStore((state) => state.settings);
  const weeklyProgress = useMotivationStore((state) => state.weeklyProgress);
  const refreshMotivation = useMotivationStore((state) => state.refresh);

  useEffect(() => {
    if (player) void refreshMotivation(player.id);
  }, [player, refreshMotivation]);

  if (!player) {
    return <Navigate to="/players" replace />;
  }

  const activeMotivation = motivationPlayerId === player.id ? motivation : null;
  const activeWeeklyProgress = motivationPlayerId === player.id ? weeklyProgress : null;
  const coins = progress?.coins ?? 0;
  const wish = getVirtualRewardById(activeMotivation?.selectedVirtualRewardId);
  const equippedReward = getVirtualRewardById(activeMotivation?.equippedVirtualRewardId);
  const realReward = getRealRewardById(activeMotivation?.weeklyRewardId);
  const realRewardTitle =
    activeMotivation?.weeklyRewardId === 'custom' && activeMotivation.weeklyCustomRewardTitle
      ? activeMotivation.weeklyCustomRewardTitle
      : realReward?.name ?? 'Wochenbelohnung';
  const wishPercent = wish ? rewardProgressPercent(wish, coins) : 0;
  const remainingCoins = wish ? coinsUntilReward(wish, coins) : 0;
  const weeklyPercent = activeMotivation?.weeklyGoalEnabled && activeWeeklyProgress
    ? Math.min(100, Math.round((activeWeeklyProgress.completedDays / activeWeeklyProgress.requiredDays) * 100))
    : 0;

  return (
    <AppShell>
      <section className={styles.page}>
        <header className={styles.topbar}>
          <div className={styles.scoreChip}>⭐ {progress?.totalScore ?? 0}</div>
          <button className={styles.coinChip} onClick={() => navigate('/rewards')}>
            <span aria-hidden="true">🪙</span>
            <strong>{coins}</strong>
            <span>Münzen</span>
          </button>
        </header>

        <main className={styles.mainGrid}>
          <section className={styles.heroPanel}>
            <Character accessoryIcon={equippedReward?.icon} />
            <div className={styles.welcome}>
              <p>{t('home.welcome')},</p>
              <h1>{player.name}!</h1>
            </div>
            <PrimaryButton onClick={() => navigate('/levels')}>▶ {t('common.play')}</PrimaryButton>
          </section>

          <section className={styles.goalsPanel}>
            <button className={styles.goalCard} onClick={() => navigate('/rewards')}>
              <div className={styles.goalHeader}>
                <span>{t('motivation.myWish')}</span>
                <strong>{wish?.icon ?? '🎁'} {wish?.name ?? 'Belohnung'}</strong>
              </div>

              {wish && (
                <>
                  <div className={styles.goalNumbers}>
                    <strong>{coins} / {wish.thresholdCoins} 🪙</strong>
                    <span>
                      {remainingCoins === 0
                        ? t('motivation.unlocked')
                        : `${t('motivation.only')} ${remainingCoins} ${t('motivation.coinsLeft')}`}
                    </span>
                  </div>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <div className={styles.coinProgress} style={{ width: `${wishPercent}%` }} />
                  </div>
                </>
              )}
            </button>

            <button
              className={`${styles.goalCard} ${styles.weeklyCard}`}
              onClick={() => navigate(activeMotivation?.weeklyGoalEnabled ? '/rewards' : '/parents')}
            >
              <div className={styles.goalHeader}>
                <span>{t('motivation.weeklyGoal')}</span>
                <strong>
                  {activeMotivation?.weeklyGoalEnabled ? `${realReward?.icon ?? '⭐'} ${realRewardTitle}` : '⭐ Ziel auswählen'}
                </strong>
              </div>

              {activeMotivation?.weeklyGoalEnabled && activeWeeklyProgress ? (
                <>
                  <div className={styles.goalNumbers}>
                    <strong>{activeWeeklyProgress.completedDays} / {activeWeeklyProgress.requiredDays} Tage</strong>
                    <span>
                      {activeWeeklyProgress.completed
                        ? t('motivation.weeklyCompleted')
                        : `${activeWeeklyProgress.requiredDays - activeWeeklyProgress.completedDays} ${t('motivation.trainingDaysLeft')}`}
                    </span>
                  </div>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <div className={styles.weekProgress} style={{ width: `${weeklyPercent}%` }} />
                  </div>
                </>
              ) : (
                <p className={styles.goalHint}>{t('motivation.parentSetsGoal')}</p>
              )}
            </button>
          </section>
        </main>

        <footer className={styles.actions}>
          <button onClick={() => navigate('/progress')}>📊 {t('home.progress')}</button>
          <button onClick={() => navigate('/rewards')}>🎁 {t('home.rewards')}</button>
          <button onClick={() => navigate('/parents')}>⚙ {t('motivation.parentArea')}</button>
          <button onClick={() => navigate('/players')}>{t('players.switch')}</button>
        </footer>
      </section>
    </AppShell>
  );
}
