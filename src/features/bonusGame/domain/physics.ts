import type { BonusPlayer, BonusLevel, InputState, PlatformState } from '../bonusGame.types';
import { overlaps } from './collisions';

export const PLAYER_COLLIDER = { width: 32, height: 48 };
export const MOVE_SPEED = 190;
export const JUMP_SPEED = 610;
export const GRAVITY = 1500;

export function movePlayer(player: BonusPlayer, input: InputState, level: BonusLevel, delta: number, jumpPressed: boolean, platforms: PlatformState[]) {
  player.invulnerable = Math.max(0, player.invulnerable - delta);
  player.coyote = player.grounded ? 0.1 : Math.max(0, player.coyote - delta);
  player.jumpBuffer = jumpPressed ? 0.12 : Math.max(0, player.jumpBuffer - delta);
  player.velocityX = (Number(input.right) - Number(input.left)) * MOVE_SPEED;
  if (player.velocityX) player.facing = Math.sign(player.velocityX);
  if (player.jumpBuffer > 0 && player.coyote > 0) { player.velocityY = -JUMP_SPEED; player.grounded = false; player.coyote = 0; player.jumpBuffer = 0; }
  if (!input.jump && player.velocityY < -240) player.velocityY = -240;
  player.x += player.velocityX * delta;
  for (const platform of platforms) {
    if (player.velocityX && platform.ground && overlaps(player, platform)) player.x = player.velocityX > 0 ? platform.x - player.width : platform.x + platform.width;
  }
  player.x = Math.max(0, Math.min(level.width - player.width, player.x));
  const previousFeet = player.y + player.height;
  player.velocityY = Math.min(900, player.velocityY + GRAVITY * delta);
  player.y += player.velocityY * delta;
  player.grounded = false;
  player.standingPlatform = null;
  platforms.forEach((platform, index) => {
    if (platform.hiddenFor <= 0 && player.velocityY >= 0 && previousFeet <= platform.y + 1 && overlaps(player, platform)) {
      player.y = platform.y - player.height; player.velocityY = 0; player.grounded = true;
      player.standingPlatform = index;
      if (platform.crumbleAfter && platform.collapseIn === null) platform.collapseIn = platform.crumbleAfter;
    }
  });
}
