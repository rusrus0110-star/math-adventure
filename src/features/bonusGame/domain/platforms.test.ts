import { describe, expect, it } from 'vitest';
import { createWorld, respawn, updateWorld } from './world';
import { level1, gaps } from '../levels/level1';
import type { BonusLevel, Platform } from '../bonusGame.types';

const idle = { left: false, right: false, jump: false };
function fixture(platform: Platform): BonusLevel {
  return { ...level1, platforms: [platform], spawn: { x: platform.x + 30, y: platform.y - 48 }, collectibles: [], enemies: [], checkpoints: [] };
}

describe('moving and crumbling platforms', () => {
  it.each(['x', 'y'] as const)('carries Mia along the %s axis without slipping', axis => {
    const level = fixture({ x: 100, y: 400, width: 160, height: 22, motion: { axis, distance: 50, period: 4 } });
    const world = createWorld(level);
    world.player.grounded = true; world.player.standingPlatform = 0;
    for (let frame = 0; frame < 120; frame += 1) updateWorld(world, level, idle, 1 / 120, false);
    expect(world.player.x - world.platforms[0]!.x).toBeCloseTo(30);
    expect(world.player.y + world.player.height).toBeCloseTo(world.platforms[0]!.y);
    expect(world.player.grounded).toBe(true);
    expect(world.platforms[0]![axis]).toBeCloseTo(axis === 'x' ? 150 : 450);
    expect(level.platforms[0]![axis]).toBe(axis === 'x' ? 100 : 400);
  });
  it('lets Mia jump off without continuing to carry her', () => {
    const level = fixture({ x: 100, y: 400, width: 160, height: 22, motion: { axis: 'x', distance: 50, period: 4 } });
    const world = createWorld(level); world.player.grounded = true; world.player.standingPlatform = 0;
    updateWorld(world, level, { ...idle, jump: true }, 1 / 120, true);
    const position = world.player.x;
    for (let frame = 0; frame < 20; frame += 1) updateWorld(world, level, { ...idle, jump: true }, 1 / 120, false);
    expect(world.player.x).toBe(position); expect(world.player.standingPlatform).toBeNull();
  });
  it('warns after landing, disappears, releases Mia and returns without affecting other runs', () => {
    const level = fixture({ x: 100, y: 400, width: 160, height: 22, crumbleAfter: 1.1 });
    const world = createWorld(level); const other = createWorld(level);
    updateWorld(world, level, idle, 1 / 120, false);
    expect(world.platforms[0]!.collapseIn).toBe(1.1);
    for (let frame = 0; frame < 100; frame += 1) updateWorld(world, level, idle, 1 / 120, false);
    expect(world.player.grounded).toBe(true); expect(world.platforms[0]!.collapseIn).toBeGreaterThan(0);
    for (let frame = 0; frame < 35; frame += 1) updateWorld(world, level, idle, 1 / 120, false);
    expect(world.platforms[0]!.hiddenFor).toBeGreaterThan(0); expect(world.player.grounded).toBe(false);
    world.player.x = 500;
    for (let frame = 0; frame < 370; frame += 1) { world.player.y = 0; updateWorld(world, level, idle, 1 / 120, false); }
    expect(world.platforms[0]!.hiddenFor).toBe(0); expect(world.platforms[0]!.collapseIn).toBeNull();
    expect(other.platforms[0]!.collapseIn).toBeNull(); expect(other.elapsed).toBe(0);
  });
  it('never stores a temporary platform as a safe respawn', () => {
    const level = fixture({ x: 1000, y: 400, width: 160, height: 22, crumbleAfter: 1.1 });
    const world = createWorld(level); world.respawn = { x: 80, y: 432 };
    updateWorld(world, level, idle, 1 / 120, false); expect(world.respawn.x).toBe(80);
    respawn(world); expect(world.player.standingPlatform).toBeNull(); expect(world.player.jumpBuffer).toBe(0);
  });
  it('buffers a jump pressed just before landing', () => {
    const level = fixture({ x: 100, y: 400, width: 160, height: 22 }); const world = createWorld(level);
    world.player.y -= 3; world.player.velocityY = 100;
    updateWorld(world, level, { ...idle, jump: true }, 1 / 120, true);
    for (let frame = 0; frame < 12; frame += 1) updateWorld(world, level, { ...idle, jump: true }, 1 / 120, false);
    expect(world.player.velocityY).toBeLessThan(0); expect(world.player.y).toBeLessThan(level.spawn.y);
  });
  it('does not move platforms or advance collapse after completion', () => {
    const world = createWorld(level1); world.finished = true;
    updateWorld(world, level1, idle, 5, false); expect(world.elapsed).toBe(0);
    expect(world.platforms.every(platform => platform.x === platform.originX && platform.y === platform.originY)).toBe(true);
  });
});

describe('authored adventure routes', () => {
  it('has varied obstacles, five safe flags and valid enemy patrols', () => {
    expect(level1.sections).toHaveLength(6); expect(gaps).toHaveLength(30);
    expect(level1.platforms.filter(platform => platform.motion).length).toBeGreaterThanOrEqual(8);
    expect(level1.platforms.filter(platform => platform.crumbleAfter).length).toBeGreaterThanOrEqual(8);
    expect(level1.checkpoints).toHaveLength(4);
    for (const enemy of level1.enemies) expect(level1.platforms.some(platform => platform.ground && enemy.patrolMinX >= platform.x && enemy.patrolMaxX + enemy.width <= platform.x + platform.width)).toBe(true);
    expect(new Set(level1.collectibles.map(item => item.id)).size).toBe(level1.collectibles.length);
  });
  it('keeps every lower-route crossing within a reachable jump and offers permanent stepping stones', () => {
    const route = level1.platforms.filter(platform => platform.y >= 440 && !platform.motion && !platform.crumbleAfter).sort((left, right) => left.x - right.x);
    for (let index = 1; index < route.length; index += 1) {
      const previous = route[index - 1]!; const next = route[index]!;
      expect(next.x - previous.x - previous.width).toBeLessThanOrEqual(150);
      expect(Math.abs(next.y - previous.y)).toBeLessThanOrEqual(20);
    }
  });
  it('can reach the house along the lower route with real physics and no teleports', () => {
    const world = createWorld(level1); let jumpHeld = false; let respawns = 0;
    for (let frame = 0; frame < 120 * 240 && !world.finished; frame += 1) {
      const player = world.player; const previousX = player.x;
      const support = player.standingPlatform === null ? undefined : world.platforms[player.standingPlatform];
      const edge = support && player.x > support.x + support.width - 26;
      const enemy = world.enemies.some(enemy => !enemy.defeated && enemy.x > player.x && enemy.x - player.x < 85);
      const jump: boolean = player.grounded ? Boolean(edge || enemy) && !jumpHeld : jumpHeld;
      updateWorld(world, level1, { left: false, right: true, jump }, 1 / 120, jump && !jumpHeld);
      jumpHeld = jump;
      if (player.x < previousX - 100) respawns += 1;
    }
    expect({ position: world.player.x, respawns, finished: world.finished }).toMatchObject({ finished: true });
    expect(respawns).toBeLessThanOrEqual(3); expect(world.reachedCheckpoints.size).toBe(5);
  });
});
