import type { GameSessionRecord } from './game.types';

export const CURRENT_QUESTION_SET_VERSION = 'mixed-v1';

export function isCurrentCurriculumSession(session: GameSessionRecord): boolean {
  return session.questionSetVersion === CURRENT_QUESTION_SET_VERSION &&
    Number.isInteger(session.correctAnswers) && session.correctAnswers >= 0 &&
    Number.isInteger(session.wrongAnswers) && session.wrongAnswers >= 0 &&
    session.correctAnswers + session.wrongAnswers === 10;
}
