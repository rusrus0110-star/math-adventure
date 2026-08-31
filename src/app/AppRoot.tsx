import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';

export function AppRoot() {
  const initialize = usePlayerStore((state) => state.initialize);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const error = usePlayerStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading) {
    return <AppShell>{t('common.loading')}</AppShell>;
  }

  if (error) {
    return (
      <AppShell>
        <h1>Fehler</h1>
        <p>{error}</p>
      </AppShell>
    );
  }

  return <Outlet />;
}
