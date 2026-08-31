import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { REAL_REWARD_OPTIONS, getRealRewardById } from '@/domain/motivation/realRewards';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { t } from '@/shared/i18n';
import styles from './ParentPage.module.css';

export function ParentPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.activePlayer);
  const motivationPlayerId = useMotivationStore((state) => state.playerId);
  const settings = useMotivationStore((state) => state.settings);
  const weeklyProgress = useMotivationStore((state) => state.weeklyProgress);
  const refreshMotivation = useMotivationStore((state) => state.refresh);
  const saveWeeklyGoal = useMotivationStore((state) => state.saveWeeklyGoal);
  const [enabled, setEnabled] = useState(false);
  const [rewardId, setRewardId] = useState('ice-cream');
  const [customTitle, setCustomTitle] = useState('');
  const [requiredDays, setRequiredDays] = useState(4);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (player) void refreshMotivation(player.id);
  }, [player, refreshMotivation]);

  const activeSettings = motivationPlayerId === player?.id ? settings : null;
  const activeWeeklyProgress = motivationPlayerId === player?.id ? weeklyProgress : null;

  useEffect(() => {
    if (!activeSettings) return;
    setEnabled(activeSettings.weeklyGoalEnabled);
    setRewardId(activeSettings.weeklyRewardId);
    setCustomTitle(activeSettings.weeklyCustomRewardTitle ?? '');
    setRequiredDays(activeSettings.weeklyRequiredDays);
  }, [activeSettings]);

  const selectedReward = useMemo(() => getRealRewardById(rewardId), [rewardId]);

  if (!player) return <Navigate to="/players" replace />;

  const handleSave = async () => {
    await saveWeeklyGoal(player.id, {
      enabled,
      rewardId,
      customTitle: rewardId === 'custom' ? customTitle : null,
      requiredDays,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <AppShell>
      <section className={styles.page}>
        <header className={styles.header}>
          <button onClick={() => navigate('/home')}>← {t('common.back')}</button>
          <div>
            <span>{t('motivation.parentArea')}</span>
            <strong>{player.name}</strong>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.titleBlock}>
            <div className={styles.bigIcon}>⭐</div>
            <div>
              <h1>{t('motivation.weeklyGoal')}</h1>
              <p>{t('motivation.parentGoalExplanation')}</p>
            </div>
          </div>

          <label className={styles.toggleRow}>
            <div>
              <strong>{t('motivation.weeklyGoalEnabled')}</strong>
              <span>{enabled ? t('motivation.active') : t('motivation.inactive')}</span>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEnabled(event.target.checked)}
            />
          </label>

          <fieldset disabled={!enabled} className={styles.fieldset}>
            <legend>{t('motivation.chooseRealReward')}</legend>
            <div className={styles.rewardOptions}>
              {REAL_REWARD_OPTIONS.map((reward) => (
                <button
                  key={reward.id}
                  type="button"
                  className={rewardId === reward.id ? styles.selectedReward : ''}
                  onClick={() => setRewardId(reward.id)}
                >
                  <span>{reward.icon}</span>
                  <strong>{reward.name}</strong>
                </button>
              ))}
            </div>

            {selectedReward?.allowsCustomTitle && (
              <label className={styles.inputGroup}>
                <span>{t('motivation.customReward')}</span>
                <input
                  type="text"
                  maxLength={50}
                  value={customTitle}
                  placeholder="z. B. Tierpark"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomTitle(event.target.value)}
                />
              </label>
            )}

            <div className={styles.daysBlock}>
              <div>
                <strong>{t('motivation.trainingDays')}</strong>
                <p>{t('motivation.trainingDayExplanation')}</p>
              </div>
              <div className={styles.dayButtons}>
                {[3, 4, 5, 6, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={requiredDays === days ? styles.activeDay : ''}
                    onClick={() => setRequiredDays(days)}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          {enabled && activeWeeklyProgress && (
            <div className={styles.currentStatus}>
              <span>{t('motivation.thisWeek')}</span>
              <strong>{activeWeeklyProgress.completedDays} / {requiredDays} Tage</strong>
              <div aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min(100, Math.round((activeWeeklyProgress.completedDays / requiredDays) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          <PrimaryButton onClick={() => void handleSave()}>
            {saved ? `✓ ${t('motivation.saved')}` : t('motivation.saveGoal')}
          </PrimaryButton>
        </section>

        <aside className={styles.note}>
          <strong>{t('motivation.important')}</strong>
          <p>{t('motivation.parentNote')}</p>
        </aside>
      </section>
    </AppShell>
  );
}
