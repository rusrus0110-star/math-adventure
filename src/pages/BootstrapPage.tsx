import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/playerStore';

export function BootstrapPage() {
  const activePlayer = usePlayerStore((state) => state.activePlayer);
  return <Navigate to={activePlayer ? '/home' : '/players'} replace />;
}
