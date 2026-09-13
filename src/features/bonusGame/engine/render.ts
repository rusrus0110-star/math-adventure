import type { BonusLevel, BonusWorld, Box } from '../bonusGame.types';
import type { Sprite, Sprites } from './assets';
import { drawPlatform } from './drawPlatforms';

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
function drawSprite(context: CanvasRenderingContext2D, sprite: Sprite | null, box: Box, flip = false) {
  if (!sprite) { context.fillStyle = '#b27dd7'; context.fillRect(box.x, box.y, box.width, box.height); return; }
  const { crop } = sprite;
  context.save(); context.translate(box.x + box.width / 2, box.y + box.height / 2);
  if (flip) context.scale(-1, 1);
  context.drawImage(sprite.image, crop.x, crop.y, crop.width, crop.height, -box.width / 2, -box.height / 2, box.width, box.height); context.restore();
}
export function renderWorld(context: CanvasRenderingContext2D, world: BonusWorld, level: BonusLevel, sprites: Sprites, reducedMotion: boolean) {
  const section = level.sections?.filter(section => world.player.x >= section.x).at(-1);
  const sky = context.createLinearGradient(0, 0, 0, VIEW_HEIGHT); sky.addColorStop(0, section?.sky ?? '#c4e9f5'); sky.addColorStop(1, '#fff7d9');
  context.fillStyle = sky; context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  for (const decoration of level.decorations.filter(item => item.kind === 'cloud')) {
    drawSprite(context, sprites.cloud, { ...decoration, x: decoration.x - world.cameraX * 0.3 });
  }
  context.save(); context.translate(-world.cameraX, 0);
  for (const decoration of level.decorations.filter(item => item.kind === 'tree')) {
    if (decoration.x + decoration.width >= world.cameraX && decoration.x <= world.cameraX + VIEW_WIDTH) drawSprite(context, sprites.tree, decoration);
  }
  for (const platform of world.platforms) {
    if (platform.x + platform.width < world.cameraX || platform.x > world.cameraX + VIEW_WIDTH) continue;
    drawPlatform(context, platform);
  }
  for (const item of level.collectibles) if (!world.collected.has(item.id) && item.x > world.cameraX - 100 && item.x < world.cameraX + VIEW_WIDTH) drawSprite(context, sprites[item.kind], item);
  for (const checkpoint of [level.checkpoint, ...(level.checkpoints ?? [])]) {
    context.fillStyle = '#8663aa'; context.fillRect(checkpoint.x, 350, 5, 130);
    context.fillStyle = world.reachedCheckpoints.has(checkpoint.x) ? '#62a968' : '#ffbf61'; context.fillRect(checkpoint.x + 5, 350, 55, 32);
  }
  drawSprite(context, sprites.houseFinish, level.house);
  for (const enemy of world.enemies) if (!enemy.defeated && enemy.x > world.cameraX - 100 && enemy.x < world.cameraX + VIEW_WIDTH) drawSprite(context, sprites.enemy, { x: enemy.x - 17, y: enemy.y - 34, width: 70, height: 80 }, enemy.direction > 0);
  const player = world.player;
  context.globalAlpha = player.invulnerable > 0 ? 0.65 : 1;
  drawSprite(context, sprites.mia, { x: player.x - 23, y: player.y - 38, width: 78, height: 86 }, player.facing < 0);
  context.globalAlpha = 1;
  if (!reducedMotion) {
    context.font = 'bold 22px sans-serif'; context.fillStyle = '#603277';
    for (const effect of world.effects) context.fillText(effect.label, effect.x, effect.y);
  }
  context.restore();
  context.fillStyle = '#ffffffdd'; context.fillRect(20, 15, 440, 63);
  context.fillStyle = '#483653'; context.font = 'bold 19px sans-serif'; context.fillText(section?.title ?? level.name, 30, 38);
  context.font = '16px sans-serif'; context.fillText(section?.hint ?? 'Zum Häuschen!', 30, 62);
  context.fillStyle = '#ffffffdd'; context.fillRect(700, 24, 220, 12);
  context.fillStyle = '#8663aa'; context.fillRect(700, 24, 220 * Math.min(1, world.player.x / level.finish.x), 12);
}
export function resizeCanvas(canvas: HTMLCanvasElement) {
  const scale = Math.min(2, window.devicePixelRatio || 1) * Math.max(0.1, canvas.clientWidth / VIEW_WIDTH);
  canvas.width = Math.round(VIEW_WIDTH * scale); canvas.height = Math.round(VIEW_HEIGHT * scale);
  const context = canvas.getContext('2d');
  context?.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
}
