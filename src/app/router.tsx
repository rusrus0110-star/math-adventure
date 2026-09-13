import { ParentPage } from '@/pages/ParentPage/ParentPage';
import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '@/app/AppRoot';
import { BootstrapPage } from '@/pages/BootstrapPage';
import { GamePage } from '@/pages/GamePage/GamePage';
import { HomePage } from '@/pages/HomePage/HomePage';
import { LevelsPage } from '@/pages/LevelsPage/LevelsPage';
import { PlayersPage } from '@/pages/PlayersPage/PlayersPage';
import { ProgressPage } from '@/pages/ProgressPage/ProgressPage';
import { ResultsPage } from '@/pages/ResultsPage/ResultsPage';
import { RewardsPage } from '@/pages/RewardsPage/RewardsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    children: [
      { index: true, element: <BootstrapPage /> },
      { path: 'players', element: <PlayersPage /> },
      { path: 'home', element: <HomePage /> },
      { path: 'levels', element: <LevelsPage /> },
      { path: 'game/:levelId', element: <GamePage /> },
      { path: 'results', element: <ResultsPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'parents', element: <ParentPage /> },
      { path: 'rewards', element: <RewardsPage /> },
    ],
  },
]);
