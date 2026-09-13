import type { BonusLevel, BonusWorld, InputState } from '../bonusGame.types';
import { cameraPosition, overlaps } from './collisions';
import { movePlayer, PLAYER_COLLIDER } from './physics';
import { createPlatforms, updatePlatforms } from './platforms';

export const COLLECTIBLE_POINTS = { coin1: 1, coin100: 100, giftChest: 50 };
export function createWorld(level: BonusLevel): BonusWorld {
  return { player: { ...level.spawn, ...PLAYER_COLLIDER, velocityX: 0, velocityY: 0, grounded: false, facing: 1, hearts: 3, invulnerable: 0, coyote: 0, jumpBuffer: 0, standingPlatform: null },
    platforms: createPlatforms(level.platforms), elapsed: 0, reachedCheckpoints: new Set(),
    enemies: level.enemies.map(enemy => ({ ...enemy })), collected: new Set(), score: 0, coins: 0, rareCoins: 0,
    respawn: { ...level.spawn }, checkpointReached: false, finished: false, cameraX: 0, effects: [] };
}
export function respawn(world: BonusWorld) {
  Object.assign(world.player, world.respawn, { hearts: 3, velocityX: 0, velocityY: 0, invulnerable: 1.2, grounded: false, coyote: 0, jumpBuffer: 0, standingPlatform: null });
}
export function updateWorld(world: BonusWorld, level: BonusLevel, input: InputState, delta: number, jumpPressed: boolean) {
  if (world.finished) return;
  const player = world.player;
  updatePlatforms(world, delta);
  const previousFeet = player.y + player.height;
  movePlayer(player, input, level, delta, jumpPressed, world.platforms);
  for (const item of level.collectibles) {
    if (!world.collected.has(item.id) && overlaps(player, item)) {
      world.collected.add(item.id); world.score += COLLECTIBLE_POINTS[item.kind];
      if (item.kind === 'coin1') world.coins += 1;
      if (item.kind === 'coin100') world.rareCoins += 1;
      world.effects.push({ x: item.x, y: item.y, label: `+${COLLECTIBLE_POINTS[item.kind]}`, life: 0.8 });
    }
  }
  for (const enemy of world.enemies) {
    if (enemy.defeated) continue;
    enemy.x += enemy.direction * 38 * delta;
    if (enemy.x < enemy.patrolMinX || enemy.x > enemy.patrolMaxX) {
      enemy.x = Math.max(enemy.patrolMinX, Math.min(enemy.patrolMaxX, enemy.x)); enemy.direction *= -1;
    }
    if (!overlaps(player, enemy)) continue;
    if (player.velocityY > 0 && previousFeet <= enemy.y + 12) {
      enemy.defeated = true; world.score += 25; player.velocityY = -360;
      world.effects.push({ x: enemy.x, y: enemy.y, label: '+25', life: 0.8 });
    } else if (player.invulnerable <= 0) {
      player.hearts -= 1; player.invulnerable = 1.2; player.velocityY = -220;
      if (player.hearts <= 0) respawn(world);
    }
  }
  for (const checkpoint of [level.checkpoint, ...(level.checkpoints ?? [])]) {
    if (overlaps(player, checkpoint) && !world.reachedCheckpoints.has(checkpoint.x)) {
      world.reachedCheckpoints.add(checkpoint.x);
      if (checkpoint === level.checkpoint) world.checkpointReached = true;
      if (checkpoint.x >= world.respawn.x) world.respawn = { x: checkpoint.x, y: checkpoint.y };
      world.effects.push({ x: player.x, y: player.y, label: 'Sicherer Platz!', life: 1.5 });
    }
  }
  const support = player.standingPlatform === null ? null : world.platforms[player.standingPlatform];
  if (player.grounded && support?.ground && player.x >= support.x + 60 && player.x + player.width <= support.x + support.width - 60 && player.x > world.respawn.x + 400 && !world.enemies.some(enemy => !enemy.defeated && Math.abs(enemy.x - player.x) < 180)) {
    world.respawn = { x: player.x, y: player.y };
  }
  if (player.y > level.height) respawn(world);
  if (overlaps(player, level.finish)) world.finished = true;
  world.cameraX = cameraPosition(player.x, level.width, 960);
  world.effects = world.effects.filter(effect => { effect.life -= delta; effect.y -= delta * 22; return effect.life > 0; });
}
