import type { BonusWorld, Platform, PlatformState } from '../bonusGame.types';

export const PLATFORM_RETURN_SECONDS = 3;
export function createPlatforms(platforms: Platform[]): PlatformState[] {
  return platforms.map(platform => ({ ...platform, originX: platform.x, originY: platform.y, collapseIn: null, hiddenFor: 0 }));
}
export function updatePlatforms(world: BonusWorld, delta: number) {
  world.elapsed += delta;
  world.platforms.forEach((platform, index) => {
    const previousX = platform.x; const previousY = platform.y;
    if (platform.motion) {
      const offset = Math.sin(world.elapsed * Math.PI * 2 / platform.motion.period) * platform.motion.distance;
      platform.x = platform.originX + (platform.motion.axis === 'x' ? offset : 0);
      platform.y = platform.originY + (platform.motion.axis === 'y' ? offset : 0);
    }
    if (platform.hiddenFor > 0) {
      platform.hiddenFor = Math.max(0, platform.hiddenFor - delta);
    } else if (platform.collapseIn !== null) {
      platform.collapseIn = Math.max(0, platform.collapseIn - delta);
      if (platform.collapseIn === 0) { platform.hiddenFor = PLATFORM_RETURN_SECONDS; platform.collapseIn = null; }
    }
    if (world.player.standingPlatform !== index) return;
    if (platform.hiddenFor > 0) {
      world.player.standingPlatform = null; world.player.grounded = false;
    } else {
      world.player.x += platform.x - previousX;
      world.player.y += platform.y - previousY;
    }
  });
}
