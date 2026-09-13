import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppShell } from '@/shared/components/AppShell';
import { BackButton } from '@/shared/components/BackButton';
import { SecondaryNavButton } from '@/shared/components/SecondaryNavButton';
import { Character } from '@/features/character/Character';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';
import { useDashboard } from '@/features/progress/useDashboard';
import { RewardCollection, type RewardTab } from '@/features/motivation/RewardCollection';
import styles from '@/features/progress/dashboard.module.css';

export function RewardsPage() {
  const { player, progress, data, ready } = useDashboard();
  const [tab, setTab] = useState<RewardTab>('Accessoires');
  if (!player) return <Navigate to="/players" replace />;
  const accessory = getVirtualRewardById(ready ? data.settings?.equippedVirtualRewardId : null);
  return (
    <AppShell><main className={styles.page}>
      <header className={styles.header}><BackButton to="/home" /><strong>🪙 {progress?.coins ?? 0} Münzen</strong></header>
      <div className={styles.header}><div><h1>Deine Belohnungen</h1><p>Kleine Erfolge. Große Wünsche.</p></div><Character size="small" accessoryIcon={accessory?.icon} /></div>
      <nav className={styles.tabs} aria-label="Belohnungskategorien">
        {(['Accessoires', 'Wochenziel', 'Superpreise'] as const).map(label => <button key={label} type="button" aria-pressed={tab === label} onClick={() => setTab(label)}>{label}</button>)}
      </nav>
      {data.error && <p role="alert" className={styles.error}>{data.error}<button onClick={() => void data.refresh(player.id)}>Erneut laden</button></p>}
      {ready ? <RewardCollection key={player.id} playerId={player.id} coins={progress?.coins ?? 0} tab={tab} /> : <p>Laden…</p>}
      <SecondaryNavButton to="/parents" label="Elternbereich" icon="⚙" />
    </main></AppShell>
  );
}
