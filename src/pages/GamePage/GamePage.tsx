import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getLevelById } from '@/domain/progression/levels';
import { Character } from '@/features/character/Character';
import { QuestionCard } from '@/features/game/QuestionCard';
import { useGameStore } from '@/features/game/gameStore';
import { usePlayerStore } from '@/features/player/playerStore';
import { AppShell } from '@/shared/components/AppShell';
import { t } from '@/shared/i18n';
import styles from './GamePage.module.css';

export function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const activePlayer = usePlayerStore((state) => state.activePlayer);
  const progress = usePlayerStore((state) => state.progress);
  const refreshProgress = usePlayerStore((state) => state.refreshProgress);
  const start = useGameStore((state) => state.start);
  const answer = useGameStore((state) => state.answer);
  const gameLevel = useGameStore((state) => state.level);
  const question = useGameStore((state) => state.currentQuestion);
  const questionIndex = useGameStore((state) => state.questionIndex);
  const score = useGameStore((state) => state.score);
  const streak = useGameStore((state) => state.currentStreak);
  const feedback = useGameStore((state) => state.feedback);
  const lastCorrectAnswer = useGameStore((state) => state.lastCorrectAnswer);
  const lastSelectedAnswer = useGameStore((state) => state.lastSelectedAnswer);
  const lastScore = useGameStore((state) => state.lastScore);
  const result = useGameStore((state) => state.result);
  const gameError = useGameStore((state) => state.error);
  const startedRef = useRef<string | null>(null);

  const level = levelId ? getLevelById(levelId) : undefined;
  const unlocked = level
    ? progress?.unlockedLevelIds.includes(level.id) ?? level.order === 1
    : false;

  useEffect(() => {
    if (!activePlayer || !level || !unlocked) return;

    const key = `${activePlayer.id}:${level.id}`;
    if (startedRef.current === key) return;

    startedRef.current = key;
    start(activePlayer.id, level);
  }, [activePlayer, level, start, unlocked]);

  useEffect(() => {
    if (!result) return;

    void refreshProgress().then(() => navigate('/results'));
  }, [navigate, refreshProgress, result]);

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

  const progressPercent = (questionIndex / gameLevel.questionCount) * 100;

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
            <span>⭐ {score}</span>
            <span>
              {questionIndex + 1} / {gameLevel.questionCount}
            </span>
          </div>
        </header>

        <main className={styles.gameArea}>
          <div className={styles.characterArea}>
            <Character
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
              {gameError && <strong>{gameError}</strong>}

              {feedback === 'correct' && (
                <strong className={styles.correctFeedback}>
                  {t('game.correct')} +{lastScore?.total ?? 0} ⭐
                </strong>
              )}

              {feedback === 'wrong' && (
                <strong className={styles.wrongFeedback}>
                  <span>{t('game.almost')}</span>
                  <span className={styles.correctEquation}>
                    {question.leftOperand} + {question.rightOperand} = {lastCorrectAnswer}
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
