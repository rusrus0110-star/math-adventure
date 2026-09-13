import { Navigate } from 'react-router-dom';
import { AppShell } from '@/shared/components/AppShell';
import { BackButton } from '@/shared/components/BackButton';
import { SecondaryNavButton } from '@/shared/components/SecondaryNavButton';
import { useDashboard } from '@/features/progress/useDashboard';
import { WeeklyActivity } from '@/features/progress/WeeklyActivity';
import { ProgressSummary } from '@/features/progress/ProgressSummary';
import { RewardCard } from '@/features/motivation/RewardCard';
import { VIRTUAL_REWARDS } from '@/domain/motivation/virtualRewards';
import { rewardState } from '@/domain/motivation/superPrizes';
import styles from '@/features/progress/dashboard.module.css';

export function ProgressPage() {
  const { player, progress, data, ready } = useDashboard();
  if (!player) return <Navigate to="/players" replace />;
  const coins = progress?.coins ?? 0;
  const selected = VIRTUAL_REWARDS.find(reward => reward.id === data.settings?.selectedVirtualRewardId && reward.thresholdCoins > coins);
  const nextReward = selected ?? VIRTUAL_REWARDS.find(reward => reward.thresholdCoins > coins) ?? VIRTUAL_REWARDS[VIRTUAL_REWARDS.length - 1];
  return (
    <AppShell><main className={styles.page}>
      <header className={styles.header}><BackButton to="/home" /><h1>Deine Woche, {player.name}!</h1></header>
      {data.error && <p role="alert" className={styles.error}>{data.error}<button onClick={() => void data.refresh(player.id)}>Erneut laden</button></p>}
      {!ready ? <p>Laden…</p> : <>
        <section className={styles.panel}><h2>Jeder Trainingstag zählt!</h2>
          <WeeklyActivity activities={data.activities} />
          <p>{data.weeklyProgress?.completedDays ?? 0} aktive Tage diese Woche · Eine ganze Runde bringt dir täglich +5 Münzen.</p>
        </section>
        <ProgressSummary progress={progress} sessions={data.sessions} />
        <section><h2>Dein nächster Wunsch</h2>
          {nextReward && <RewardCard name={nextReward.name} icon={nextReward.icon} current={coins} target={nextReward.thresholdCoins} state={rewardState(coins >= nextReward.thresholdCoins, false)} />}
          <p><SecondaryNavButton to="/rewards" label="Alle Belohnungen entdecken" icon="→" /></p>
        </section>
      </>}
    </main></AppShell>
  );
}
