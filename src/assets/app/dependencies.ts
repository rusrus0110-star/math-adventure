import { IndexedDbAttemptRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbAttemptRepository';
import { IndexedDbGameCompletionRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbGameCompletionRepository';
import { IndexedDbMotivationRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbMotivationRepository';
import { IndexedDbPlayerRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbPlayerRepository';
import { IndexedDbProgressRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbProgressRepository';
import { IndexedDbSessionRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbSessionRepository';

export const dependencies = {
  playerRepository: new IndexedDbPlayerRepository(),
  progressRepository: new IndexedDbProgressRepository(),
  attemptRepository: new IndexedDbAttemptRepository(),
  sessionRepository: new IndexedDbSessionRepository(),
  motivationRepository: new IndexedDbMotivationRepository(),
  gameCompletionRepository: new IndexedDbGameCompletionRepository(),
};
