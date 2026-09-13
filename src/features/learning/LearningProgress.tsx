import { usePlayerStore } from '@/features/player/playerStore';
import { useLearningStore } from './learningStore';
import { LearningPath } from './LearningPath';
import { DailyLearningPath } from './DailyLearningPath';
import { DAILY_LEARNING_TARGET_MS, DAILY_ROUNDS_TARGET } from '@/domain/activity/dailyGoal';

export function LearningProgress({ parent = false }: { parent?: boolean }) {
  const playerId = usePlayerStore(state => state.activePlayer?.id);
  const learning = useLearningStore();
  if (!playerId || learning.playerId !== playerId) return null;
  return <>
    {learning.error && <p role="alert">{learning.error} <button type="button" onClick={() => void learning.load(playerId)}>Erneut versuchen</button></p>}
    {learning.today && (parent
      ? <section><h2>Tagesziel</h2><p>Heute: {learning.today.completedSessions} / {DAILY_ROUNDS_TARGET} ganze Runden oder {Math.floor(learning.today.activeLearningMs / 60_000)} / {DAILY_LEARNING_TARGET_MS / 60_000} Min. aktive Lernzeit.</p></section>
      : <DailyLearningPath day={learning.today} />)}
    {learning.path && (parent && learning.account
      ? <section><h2>Lernzeit und Bonuszeit</h2><p>Aktive Lernzeit insgesamt: {Math.floor(learning.account.totalActiveMs / 60_000)} Min.</p><p>Bonuszeit verfügbar: {Math.floor(learning.account.bonusTimeMs / 60_000)} Min.</p></section>
      : <LearningPath path={learning.path} />)}
  </>;
}
