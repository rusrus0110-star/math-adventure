import { IndexedDbActivityRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbActivityRepository';
import { IndexedDbRewardClaimRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbRewardClaimRepository';
import { IndexedDbMotivationRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbMotivationRepository';
import { IndexedDbAttemptRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbAttemptRepository';
import { IndexedDbGameCompletionRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbGameCompletionRepository';
import { IndexedDbPlayerRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbPlayerRepository';
import { IndexedDbProgressRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbProgressRepository';
import { IndexedDbSessionRepository } from '@/infrastructure/persistence/indexedDb/IndexedDbSessionRepository';

export const dependencies = {
  activityRepository: new IndexedDbActivityRepository(),
  rewardClaimRepository: new IndexedDbRewardClaimRepository(),
  motivationRepository: new IndexedDbMotivationRepository(),
  playerRepository: new IndexedDbPlayerRepository(),
  progressRepository: new IndexedDbProgressRepository(),
  attemptRepository: new IndexedDbAttemptRepository(),
  sessionRepository: new IndexedDbSessionRepository(),
  gameCompletionRepository: new IndexedDbGameCompletionRepository(),
};
