import type { Question } from '@/domain/game/game.types';
import styles from './QuestionCard.module.css';

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className={styles.card}>
      <span>{question.leftOperand}</span>
      <span>+</span>
      <span>{question.rightOperand}</span>
      <span>=</span>
      <span>?</span>
    </div>
  );
}
