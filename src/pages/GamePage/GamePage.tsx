import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';
import { getLevelById } from '@/domain/progression/levels';
import { Character } from '@/features/character/Character';
import { QuestionCard } from '@/features/game/QuestionCard';
import { useGameStore } from '@/features/game/gameStore';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';
import { LearningProgress } from '@/features/learning/LearningProgress';
import styles from './GamePage.module.css';

export function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const activePlayer = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);
  const refreshProgress = usePlayerStore((state) => state.refreshProgress);
  const motivationPlayerId = useMotivationStore((state) => state.playerId);
  const motivation = useMotivationStore((state) => state.settings);
  const loadMotivation = useMotivationStore((state) => state.loadForPlayer);
  const refreshMotivation = useMotivationStore((state) => state.refresh);
  const start = useGameStore((state) => state.start);
  const answer = useGameStore((state) => state.answer);
  const gameLevel = useGameStore((state) => state.level);
  const question = useGameStore((state) => state.currentQuestion);
  const questionIndex = useGameStore((state) => state.questionIndex);
  const score = useGameStore((state) => state.score);
  const streak = useGameStore((state) => state.currentStreak);
  const correctAnswers = useGameStore((state) => state.correctAnswers);
  const feedback = useGameStore((state) => state.feedback);
  const lastCorrectAnswer = useGameStore((state) => state.lastCorrectAnswer);
  const lastSelectedAnswer = useGameStore((state) => state.lastSelectedAnswer);
  const lastScore = useGameStore((state) => state.lastScore);
  const result = useGameStore((state) => state.result);
  const gameError = useGameStore((state) => state.error);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const retrySave = useGameStore((state) => state.retrySave);
  const isFinishing = useGameStore((state) => state.isFinishing);
  const attempts = useGameStore((state) => state.attempts);

  const level = levelId ? getLevelById(levelId) : undefined;
  const unlocked = level
    ? progress?.unlockedLevelIds.includes(level.id) ?? level.order === 1
    : false;

  useEffect(() => {
    if (activePlayer) void loadMotivation(activePlayer.id);
  }, [activePlayer, loadMotivation]);

  useEffect(() => {
    if (!activePlayer || !level || !unlocked) return;

    start(activePlayer.id, level);
    return () => {
      if (!useGameStore.getState().result) useGameStore.getState().reset();
    };
  }, [activePlayer, level, start, unlocked]);

  useEffect(() => {
    if (!result || !activePlayer || result.playerId !== activePlayer.id || useGameStore.getState().result !== result) return;
    let cancelled = false;
    void Promise.all([refreshProgress(), refreshMotivation(activePlayer.id)])
      .then(() => { if (!cancelled) navigate('/results', { replace: true }); })
      .catch((error: unknown) => {
        if (!cancelled) setRefreshError(error instanceof Error ? error.message : 'Fortschritt konnte nicht geladen werden.');
      });
    return () => { cancelled = true; };
  }, [activePlayer, navigate, refreshMotivation, refreshProgress, result]);

  if (!activePlayer) return <Navigate to="/players" replace />;
  if (!level || !unlocked) return <Navigate to="/levels" replace />;
  if (!question || !gameLevel) return <AppShell>{t('common.loading')}</AppShell>;

  const handleAnswer = async (selectedAnswer: number) => {
    await answer(selectedAnswer);
  };

  const getAnswerClassName = (option: number) => {
    if (feedback === null) return '';

    if (option === lastCorrectAnswer) {
      return styles.correctAnswer;
    }

    if (feedback === 'wrong' && option === lastSelectedAnswer) {
      return styles.wrongAnswer;
    }

    return styles.inactiveAnswer;
  };

  const progressPercent = (attempts.length / gameLevel.questionCount) * 100;
  const liveCoins = (progress?.coins ?? 0) + correctAnswers;
  const activeMotivation = motivationPlayerId === activePlayer.id ? motivation : null;
  const equippedReward = getVirtualRewardById(activeMotivation?.equippedVirtualRewardId);

  return (
    <AppShell>
      <section className={styles.page}>
        <header className={styles.header}>
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => navigate('/levels')}
          >
            ×
          </button>

          <div className={styles.status}>
            <span>✨ {score} Pkt.</span>
            <span className={styles.coinStatus}>🪙 <strong>{liveCoins}</strong></span>
            <span>
              {questionIndex + 1} / {gameLevel.questionCount}
            </span>
          </div>
        </header>

        <main className={styles.gameArea}>
          <div className={styles.characterArea}>
            <Character
              accessoryIcon={equippedReward?.icon}
              mood={
                feedback === 'correct'
                  ? 'happy'
                  : feedback === 'wrong'
                    ? 'almost'
                    : 'thinking'
              }
              size="large"
            />
          </div>

          <div className={styles.challengeArea}>
            <div className={styles.questionWrap}>
              <QuestionCard question={question} />
            </div>

            <div className={styles.answers}>
              {question.answerOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={getAnswerClassName(option)}
                  disabled={feedback !== null}
                  aria-pressed={lastSelectedAnswer === option}
                  onClick={() => void handleAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div
              className={`${styles.feedback} ${feedback ? styles.feedbackVisible : ''}`}
              aria-live="assertive"
              aria-atomic="true"
            >
              {gameError && <div role="alert"><strong>{gameError}</strong><button disabled={isFinishing} onClick={() => void retrySave()}>Erneut speichern</button></div>}
              {refreshError && <div role="alert">{refreshError}<button onClick={() => navigate('/results')}>Zum Ergebnis</button></div>}

              {feedback === 'correct' && (
                <div className={styles.correctFeedback}>
                  <strong>{t('game.correct')} +{lastScore?.total ?? 0} Pkt.</strong>
                  <span key={correctAnswers} className={styles.coinBurst}>+1 🪙</span>
                </div>
              )}

              {feedback === 'wrong' && (
                <strong className={styles.wrongFeedback}>
                  <span>{t('game.almost')}</span>
                  <span className={styles.correctEquation}>
                    {question.leftOperand} {question.operation === 'addition' ? '+' : '−'} {question.rightOperand} = {lastCorrectAnswer}
                  </span>
                </strong>
              )}

              {feedback === null && streak > 1 && (
                <span>
                  🔥 {streak} {t('game.streak')}
                </span>
              )}
            </div>
          </div>
        </main>

        <footer className={styles.progressArea}>
          <LearningProgress />
          <div className={styles.progressTrack} aria-hidden="true">
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </footer>
      </section>
    </AppShell>
  );
}
