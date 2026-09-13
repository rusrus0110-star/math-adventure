import { useEffect } from 'react';
import { usePlayerStore } from '@/features/player/playerStore';
import { useMotivationStore } from '@/features/motivation/motivationStore';

export function useDashboard() {
  const player = usePlayerStore(state => state.activePlayer);
  const progress = usePlayerStore(state => state.progress);
  const data = useMotivationStore();
  const refresh = data.refresh;
  const refreshProgress = usePlayerStore(state => state.refreshProgress);
  useEffect(() => {
    if (!player) return;
    let cancelled = false;
    let midnightTimer: ReturnType<typeof setTimeout>;
    const update = () => {
      if (cancelled) return;
      void refresh(player.id);
      void refreshProgress().catch((error: unknown) => {
        if (!cancelled) useMotivationStore.setState({ error: error instanceof Error ? error.message : 'Fortschritt konnte nicht geladen werden.' });
      });
    };
    const scheduleMidnight = () => {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 50);
      midnightTimer = setTimeout(() => { update(); scheduleMidnight(); }, midnight.getTime() - Date.now());
    };
    update();
    scheduleMidnight();
    window.addEventListener('focus', update);
    return () => {
      cancelled = true;
      clearTimeout(midnightTimer);
      window.removeEventListener('focus', update);
    };
  }, [player, refresh, refreshProgress]);
  const ready = data.playerId === player?.id && Boolean(data.settings);
  return { player, progress, data, ready };
}
