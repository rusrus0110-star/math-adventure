import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  coinsUntilReward,
  isRewardUnlocked,
  rewardProgressPercent,
} from '@/domain/motivation/motivation.service';
import { getRealRewardById } from '@/domain/motivation/realRewards';
import { VIRTUAL_REWARDS, getVirtualRewardById } from '@/domain/motivation/virtualRewards';
import { Character } from '@/features/character/Character';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';
import styles from './RewardsPage.module.css';

export function RewardsPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const player = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);
  const motivationPlayerId = useMotivationStore((state) => state.playerId);
  const settings = useMotivationStore((state) => state.settings);
  const weeklyProgress = useMotivationStore((state) => state.weeklyProgress);
  const refreshMotivation = useMotivationStore((state) => state.refresh);
  const selectVirtualWish = useMotivationStore((state) => state.selectVirtualWish);
  const equipVirtualReward = useMotivationStore((state) => state.equipVirtualReward);

  useEffect(() => {
    if (player) void refreshMotivation(player.id);
  }, [player, refreshMotivation]);

  if (!player) return <Navigate to="/players" replace />;

  const activeSettings = motivationPlayerId === player.id ? settings : null;
  const activeWeeklyProgress = motivationPlayerId === player.id ? weeklyProgress : null;
  const coins = progress?.coins ?? 0;
  const selectedReward = getVirtualRewardById(activeSettings?.selectedVirtualRewardId);
  const equippedReward = getVirtualRewardById(activeSettings?.equippedVirtualRewardId);
  const weeklyReward = getRealRewardById(activeSettings?.weeklyRewardId);
  const weeklyTitle =
    activeSettings?.weeklyRewardId === 'custom' && activeSettings.weeklyCustomRewardTitle
      ? activeSettings.weeklyCustomRewardTitle
      : weeklyReward?.name ?? 'Wochenbelohnung';

  const handleSelectWish = async (rewardId: string) => {
    await selectVirtualWish(player.id, rewardId);
    setMessage(t('motivation.wishSelected'));
  };

  const handleEquip = async (rewardId: string) => {
    await equipVirtualReward(player.id, rewardId, coins);
    setMessage(t('motivation.equipped'));
  };

  return (
    <AppShell>
      <section className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} onClick={() => navigate('/home')}>
            ← {t('common.back')}
          </button>
          <div className={styles.coinCounter}>🪙 <strong>{coins}</strong> Münzen</div>
        </header>

        <div className={styles.intro}>
          <Character size="small" accessoryIcon={equippedReward?.icon} />
          <div>
            <h1>{t('rewards.title')}</h1>
            <p>{t('motivation.rewardExplanation')}</p>
          </div>
        </div>

        {selectedReward && (
          <section className={styles.wishCard}>
            <div className={styles.wishIcon}>{selectedReward.icon}</div>
            <div className={styles.wishInfo}>
              <span>{t('motivation.myWish')}</span>
              <strong>{selectedReward.name}</strong>
              <div className={styles.progressTrack} aria-hidden="true">
                <div
                  className={styles.progressFill}
                  style={{ width: `${rewardProgressPercent(selectedReward, coins)}%` }}
                />
              </div>
              <small>
                {isRewardUnlocked(selectedReward, coins)
                  ? t('motivation.unlocked')
                  : `${coins} / ${selectedReward.thresholdCoins} 🪙 · ${t('motivation.only')} ${coinsUntilReward(selectedReward, coins)} ${t('motivation.coinsLeft')}`}
              </small>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>{t('motivation.virtualRewards')}</h2>
              <p>{t('motivation.noCoinSpending')}</p>
            </div>
          </div>

          <div className={styles.rewardGrid}>
            {VIRTUAL_REWARDS.map((reward) => {
              const unlocked = isRewardUnlocked(reward, coins);
              const selected = activeSettings?.selectedVirtualRewardId === reward.id;
              const equipped = activeSettings?.equippedVirtualRewardId === reward.id;
              const remaining = coinsUntilReward(reward, coins);

              return (
                <article
                  key={reward.id}
                  className={`${styles.rewardCard} ${unlocked ? styles.unlocked : styles.locked} ${selected ? styles.selected : ''}`}
                >
                  <div className={styles.rewardIcon}>{reward.icon}</div>
                  <div className={styles.rewardTitle}>
                    <strong>{reward.name}</strong>
                    <span>{unlocked ? '🔓' : '🔒'} {reward.thresholdCoins} 🪙</span>
                  </div>

                  <div className={styles.miniProgress} aria-hidden="true">
                    <div style={{ width: `${rewardProgressPercent(reward, coins)}%` }} />
                  </div>

                  <p>
                    {unlocked
                      ? equipped
                        ? t('motivation.equipped')
                        : t('motivation.unlocked')
                      : `${t('motivation.only')} ${remaining} ${t('motivation.coinsLeft')}`}
                  </p>

                  <div className={styles.cardActions}>
                    {!unlocked && (
                      <button
                        className={selected ? styles.activeButton : ''}
                        onClick={() => void handleSelectWish(reward.id)}
                      >
                        {selected ? `✓ ${t('motivation.myWish')}` : t('motivation.chooseWish')}
                      </button>
                    )}

                    {unlocked && (
                      <button
                        className={equipped ? styles.activeButton : ''}
                        disabled={equipped}
                        onClick={() => void handleEquip(reward.id)}
                      >
                        {equipped ? `✓ ${t('motivation.equipped')}` : t('motivation.putOn')}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`${styles.section} ${styles.realRewardSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>{t('motivation.weeklyGoal')}</h2>
              <p>{t('motivation.realRewardExplanation')}</p>
            </div>
            <button onClick={() => navigate('/parents')}>⚙ {t('motivation.parentArea')}</button>
          </div>

          {activeSettings?.weeklyGoalEnabled && activeWeeklyProgress ? (
            <div className={styles.realRewardCard}>
              <div className={styles.realRewardIcon}>{weeklyReward?.icon ?? '⭐'}</div>
              <div>
                <strong>{weeklyTitle}</strong>
                <p>{activeWeeklyProgress.completedDays} / {activeWeeklyProgress.requiredDays} Trainingstage</p>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div
                    className={styles.weekFill}
                    style={{
                      width: `${Math.min(100, Math.round((activeWeeklyProgress.completedDays / activeWeeklyProgress.requiredDays) * 100))}%`,
                    }}
                  />
                </div>
                <small>
                  {activeWeeklyProgress.completed
                    ? `🎉 ${t('motivation.weeklyCompleted')}`
                    : `${activeWeeklyProgress.requiredDays - activeWeeklyProgress.completedDays} ${t('motivation.trainingDaysLeft')}`}
                </small>
              </div>
            </div>
          ) : (
            <button className={styles.emptyWeeklyGoal} onClick={() => navigate('/parents')}>
              ⭐ {t('motivation.parentSetsGoal')}
            </button>
          )}
        </section>

        {message && (
          <div className={styles.toast} role="status" onAnimationEnd={() => setMessage(null)}>
            {message}
          </div>
        )}
      </section>
    </AppShell>
  );
}
