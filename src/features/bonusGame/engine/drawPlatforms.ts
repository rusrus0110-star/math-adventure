import type { PlatformState } from '../bonusGame.types';

export function drawPlatform(context: CanvasRenderingContext2D, platform: PlatformState) {
  context.save();
  if (platform.motion) {
    const { axis, distance } = platform.motion;
    const centerX = platform.originX + platform.width / 2;
    const centerY = platform.originY + platform.height / 2;
    context.strokeStyle = '#5a96ad'; context.lineWidth = 3; context.setLineDash([6, 8]);
    context.beginPath(); context.moveTo(centerX - (axis === 'x' ? distance : 0), centerY - (axis === 'y' ? distance : 0));
    context.lineTo(centerX + (axis === 'x' ? distance : 0), centerY + (axis === 'y' ? distance : 0)); context.stroke(); context.setLineDash([]);
  }
  if (platform.hiddenFor > 0) {
    context.strokeStyle = '#b77b42'; context.setLineDash([5, 7]); context.lineWidth = 2;
    context.strokeRect(platform.x, platform.y, platform.width, platform.height); context.restore(); return;
  }
  context.fillStyle = platform.ground ? '#cc9f76' : platform.motion ? '#65bddc' : platform.crumbleAfter ? '#efb65e' : '#d7b5e6';
  context.beginPath(); context.roundRect(platform.x, platform.y, platform.width, platform.height, platform.ground ? 0 : 7); context.fill();
  context.fillStyle = platform.ground ? '#80b87c' : platform.motion ? '#d2f7ff' : platform.crumbleAfter ? '#ffe3a8' : '#b9dca2';
  context.fillRect(platform.x, platform.y, platform.width, 8);
  context.strokeStyle = platform.crumbleAfter ? '#925b2e' : '#598d60'; context.lineWidth = 2;
  context.strokeRect(platform.x, platform.y, platform.width, platform.ground ? 10 : platform.height);
  context.fillStyle = '#304955'; context.font = 'bold 18px sans-serif'; context.textAlign = 'center';
  if (platform.motion) context.fillText(platform.motion.axis === 'x' ? '↔' : '↕', platform.x + platform.width / 2, platform.y + 19);
  if (platform.crumbleAfter) {
    context.beginPath(); context.moveTo(platform.x + 40, platform.y + 3); context.lineTo(platform.x + 50, platform.y + 10);
    context.lineTo(platform.x + 44, platform.y + 17); context.stroke();
    if (platform.collapseIn !== null) {
      context.fillStyle = '#75402e'; context.fillRect(platform.x, platform.y - 7, platform.width * platform.collapseIn / platform.crumbleAfter, 4);
    }
  }
  context.restore();
}
