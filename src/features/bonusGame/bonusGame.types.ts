export interface Position { x: number; y: number }
export interface Box extends Position { width: number; height: number }
export interface InputState { left: boolean; right: boolean; jump: boolean }
export interface Platform extends Box {
  ground?: boolean;
  motion?: { axis: 'x' | 'y'; distance: number; period: number };
  crumbleAfter?: number;
}
export interface PlatformState extends Platform {
  originX: number; originY: number; collapseIn: number | null; hiddenFor: number;
}
export interface Collectible extends Box { id: string; kind: 'coin1' | 'coin100' | 'giftChest' }
export interface Enemy extends Box { id: string; patrolMinX: number; patrolMaxX: number; direction: number; defeated: boolean }
export interface Decoration extends Box { kind: 'tree' | 'cloud' }
export interface BonusLevel {
  id: string; name: string; width: number; height: number; spawn: Position;
  platforms: Platform[]; collectibles: Collectible[]; enemies: Enemy[]; decorations: Decoration[];
  checkpoint: Box; finish: Box; house: Box;
  checkpoints?: Box[];
  sections?: { x: number; title: string; hint: string; sky: string }[];
}
export interface BonusPlayer extends Box { velocityX: number; velocityY: number; grounded: boolean; facing: number; hearts: number; invulnerable: number; coyote: number; jumpBuffer: number; standingPlatform: number | null }
export interface BonusWorld {
  platforms: PlatformState[]; elapsed: number; reachedCheckpoints: Set<number>;
  player: BonusPlayer; enemies: Enemy[]; collected: Set<string>; score: number; coins: number; rareCoins: number;
  respawn: Position; checkpointReached: boolean; finished: boolean; cameraX: number;
  effects: { x: number; y: number; label: string; life: number }[];
}
export interface BonusRun { id: string; elapsedMs: number; limitMs: number; lastSeenAt: number; closed: boolean }
export interface BonusProgress { playerId: string; bestBonusGameScore: number; run: BonusRun | null }
export interface BonusCheckpoint { balanceMs: number; remainingMs: number; bestScore: number }
