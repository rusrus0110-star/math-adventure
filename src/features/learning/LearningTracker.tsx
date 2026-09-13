import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startLearningTracker } from '@/application/learning/startLearningTracker';
import { useGameStore } from '@/features/game/gameStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { useLearningStore } from './learningStore';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { isActiveDay } from '@/domain/activity/dailyGoal';

export function LearningTracker() {
  const { pathname } = useLocation();
  const playerId = usePlayerStore(state => state.activePlayer?.id);
  const today = useLearningStore(state => state.today);
  const day = today && today.playerId === playerId ? today.localDate : null;
  const achieved = Boolean(today && today.playerId === playerId && isActiveDay(today));
  useEffect(() => {
    if (playerId && day) void useMotivationStore.getState().refresh(playerId);
  }, [playerId, day, achieved]);
  useEffect(() => {
    if (!playerId) return;
    void useLearningStore.getState().load(playerId);
    return startLearningTracker({
      getContext: () => {
        const game = useGameStore.getState();
        return {
          playerId, sessionId: game.sessionId, visible: true, focused: true,
          mathematics: pathname === `/game/${game.level?.id}` && game.playerId === playerId &&
            Boolean(game.currentQuestion) && !game.feedback && !game.pendingCompletion && !game.result,
        };
      },
      record: interval => { void useLearningStore.getState().record(interval); },
      onDayChanged: () => { void useLearningStore.getState().load(playerId); },
      subscribe: listener => useGameStore.subscribe(listener), document, window,
    });
  }, [pathname, playerId]);
  return null;
}
