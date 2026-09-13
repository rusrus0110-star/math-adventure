import { useState } from 'react';
import { VIRTUAL_REWARDS } from '@/domain/motivation/virtualRewards';
import { SUPER_PRIZES, rewardState } from '@/domain/motivation/superPrizes';
import { getRealRewardById } from '@/domain/motivation/realRewards';
import { weekDates } from '@/domain/activity/activity';
import { useMotivationStore } from './motivationStore';
import { RewardCard } from './RewardCard';
import styles from '@/features/progress/dashboard.module.css';

export type RewardTab = 'Accessoires' | 'Wochenziel' | 'Superpreise';

export function RewardCollection({ playerId, coins, tab, parent = false }: { playerId: string; coins: number; tab: RewardTab; parent?: boolean }) {
  const store = useMotivationStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (store.playerId !== playerId || !store.settings) return <p>Laden…</p>;
  const settings = store.settings;
  const perform = async (action: () => Promise<void>) => {
    setBusy(true); setError(null); setMessage(null);
    try { await action(); setMessage('Gespeichert!'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Speichern fehlgeschlagen.'); }
    finally { setBusy(false); }
  };
  const claimed = (key: string) => store.claims.find(claim => claim.rewardKey === key);
  const weeklyKey = `weekly:${weekDates()[0]}`;
  const weeklyClaim = claimed(weeklyKey);
  const weeklyReward = getRealRewardById(settings.weeklyRewardId);
  const weeklyName = weeklyClaim?.rewardName ?? weeklyReward?.name ?? 'Wochenbelohnung';
  return (
    <section aria-label={tab} className={styles.page}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {tab === 'Accessoires' && <>
        <p>Deine Münzen bleiben erhalten. Such dir einen Wunsch aus und zieh freigeschaltete Sachen an.</p>
        <div className={styles.grid}>{VIRTUAL_REWARDS.map(reward => {
          const unlocked = coins >= reward.thresholdCoins;
          const equipped = settings.equippedVirtualRewardId === reward.id;
          const selected = settings.selectedVirtualRewardId === reward.id;
          return <RewardCard key={reward.id} name={reward.name} icon={reward.icon} current={coins} target={reward.thresholdCoins}
            state={rewardState(unlocked, false)} equipped={equipped} disabled={busy || store.isLoading || (!equipped && !unlocked && selected)}
            actionLabel={equipped ? 'Ausziehen' : unlocked ? 'Anziehen' : selected ? '✓ Mein Wunsch' : 'Als Wunsch wählen'}
            onAction={() => void perform(() => equipped ? store.equipVirtualReward(playerId, null) : unlocked ? store.equipVirtualReward(playerId, reward.id) : store.selectVirtualWish(playerId, reward.id))} />;
        })}</div>
      </>}
      {tab === 'Wochenziel' && <>
        <p>Schaffe deinen täglichen Lernweg oder spiele fünf ganze Runden. Dann zählt dein Trainingstag — Fehler sind erlaubt!</p>
        {settings.weeklyGoalEnabled || weeklyClaim ? <RewardCard name={weeklyName} icon={weeklyReward?.icon ?? '⭐'}
          current={store.weeklyProgress?.completedDays ?? 0} target={settings.weeklyRequiredDays} unit="Trainingstage"
          state={rewardState(Boolean(settings.weeklyGoalEnabled && store.weeklyProgress?.completed), Boolean(weeklyClaim))}
          actionLabel={parent && !weeklyClaim && settings.weeklyGoalEnabled && store.weeklyProgress?.completed ? 'Als eingelöst bestätigen' : undefined}
          disabled={busy} onAction={() => void perform(() => store.claimReward(playerId, weeklyKey))} />
          : <p className={styles.notice}>Ein Elternteil kann im Elternbereich dein Wochenziel auswählen.</p>}
        {!parent && <p>Ein Elternteil bestätigt, wenn du deine Belohnung bekommen hast.</p>}
      </>}
      {tab === 'Superpreise' && <>
        <p>Große Wünsche für später. Deine Münzen werden beim Freischalten und Einlösen nicht abgezogen.</p>
        <div className={styles.grid}>{SUPER_PRIZES.map(prize => {
          const key = `super:${prize.id}`;
          const claim = claimed(key);
          const unlocked = coins >= prize.thresholdCoins;
          return <RewardCard key={prize.id} name={claim?.rewardName ?? prize.name} icon={prize.icon} current={coins} target={prize.thresholdCoins}
            state={rewardState(unlocked, Boolean(claim))} disabled={busy}
            actionLabel={parent && unlocked && !claim ? 'Als eingelöst bestätigen' : undefined}
            onAction={() => void perform(() => store.claimReward(playerId, key))} />;
        })}</div>
        {!parent && <p>Ein Elternteil bestätigt eingelöste Superpreise.</p>}
      </>}
    </section>
  );
}
