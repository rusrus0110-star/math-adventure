import type { PlayerRepository } from '@/application/ports/PlayerRepository';
import type { PlayerProfile } from '@/domain/player/player.types';
import { createInitialProgress } from '@/domain/progression/progression.service';

export interface CreatePlayerDependencies {
  playerRepository: PlayerRepository;
}

export async function createPlayer(
  name: string,
  dependencies: CreatePlayerDependencies,
): Promise<PlayerProfile> {
  const normalizedName = name.trim();

  if (normalizedName.length < 1 || normalizedName.length > 30) {
    throw new Error('Player name must contain between 1 and 30 characters.');
  }

  const now = new Date().toISOString();
  const player: PlayerProfile = {
    id: crypto.randomUUID(),
    name: normalizedName,
    characterId: 'mia-cat',
    createdAt: now,
    updatedAt: now,
  };

  await dependencies.playerRepository.createWithProgress(player, createInitialProgress(player.id));

  return player;
}
