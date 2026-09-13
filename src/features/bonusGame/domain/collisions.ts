import type { Box } from '../bonusGame.types';

export function overlaps(first: Box, second: Box): boolean {
  return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
}
export function cameraPosition(playerX: number, worldWidth: number, viewportWidth: number): number {
  return Math.max(0, Math.min(Math.max(0, worldWidth - viewportWidth), playerX - viewportWidth * 0.38));
}
