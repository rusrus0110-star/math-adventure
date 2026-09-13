import { describe, expect, it } from 'vitest';
import { createWorld, respawn, updateWorld } from './world';
import { cameraPosition } from './collisions';
import { level1 } from '../levels/level1';
import { ActivePlayTime, availableSessionDuration, formatPlayTime } from './playTime';
import { BonusInput } from '../engine/input';
import type { BonusLevel } from '../bonusGame.types';

const idle = { left: false, right: false, jump: false };
function emptyLevel(): BonusLevel { return { ...level1, collectibles: [], enemies: [] }; }

describe('platformer world without Canvas', () => {
  it.each([['coin1', 1], ['coin100', 100], ['giftChest', 50]] as const)('%s grants %i isolated game points only once', (kind, score) => {
    const level = { ...emptyLevel(), collectibles: [{ id: 'item', kind, x: 90, y: 435, width: 30, height: 30 }] };
    const world = createWorld(level);
    updateWorld(world, level, idle, 1 / 60, false); updateWorld(world, level, idle, 1 / 60, false);
    expect(world.score).toBe(score); expect(world.collected.size).toBe(1);
    expect(world).not.toHaveProperty('totalScore'); expect(world).not.toHaveProperty('levelStars');
  });
  it('lands, moves, jumps and falls back onto the ground independently of frame rate', () => {
    const level = emptyLevel(); const world = createWorld(level);
    updateWorld(world, level, idle, 1 / 120, false); expect(world.player.grounded).toBe(true);
    updateWorld(world, level, { ...idle, right: true, jump: true }, 1 / 120, true);
    expect(world.player.y).toBeLessThan(level.spawn.y); expect(world.player.x).toBeGreaterThan(level.spawn.x);
    for (let frame = 0; frame < 200; frame += 1) updateWorld(world, level, idle, 1 / 120, false);
    expect(world.player.grounded).toBe(true); expect(world.player.y).toBe(432);
  });
  it('defeats an enemy from above, adds 25 points and bounces', () => {
    const world = createWorld(level1); const enemy = world.enemies[0]!;
    Object.assign(world.player, { x: enemy.x, y: enemy.y - world.player.height - 1, velocityY: 200 });
    updateWorld(world, level1, idle, 1 / 60, false);
    expect(enemy.defeated).toBe(true); expect(world.score).toBe(25); expect(world.player.velocityY).toBeLessThan(0);
  });
  it('side contact costs one heart with protection against immediate repeated damage', () => {
    const world = createWorld(level1); const enemy = world.enemies[0]!;
    Object.assign(world.player, { x: enemy.x, y: 432 });
    updateWorld(world, level1, idle, 1 / 120, false); expect(world.player.hearts).toBe(2);
    updateWorld(world, level1, idle, 1 / 120, false); expect(world.player.hearts).toBe(2);
  });
  it('zero hearts respawns with three hearts without changing time or points', () => {
    const world = createWorld(level1); const enemy = world.enemies[0]!;
    Object.assign(world.player, { x: enemy.x, y: 432, hearts: 1 });
    updateWorld(world, level1, idle, 1 / 120, false);
    expect(world.player.hearts).toBe(3); expect(world.player.x).toBe(level1.spawn.x); expect(world.score).toBe(0);
  });
  it('falling below the world uses the saved respawn point', () => {
    const world = createWorld(emptyLevel()); world.respawn = { x: 400, y: 432 }; world.player.y = 800;
    updateWorld(world, emptyLevel(), idle, 1 / 120, false);
    expect(world.player.x).toBe(400); expect(world.player.y).toBe(432);
  });
  it('checkpoint changes the respawn position', () => {
    const world = createWorld(level1); Object.assign(world.player, { x: 13000, y: 432 });
    updateWorld(world, level1, idle, 1 / 120, false); expect(world.checkpointReached).toBe(true);
    respawn(world); expect(world.player.x).toBe(13000);
  });
  it('the logical house trigger finishes and stops future physics', () => {
    const world = createWorld(level1); Object.assign(world.player, { x: level1.finish.x, y: 432 });
    updateWorld(world, level1, idle, 1 / 120, false); expect(world.finished).toBe(true);
    const previous = world.player.x; updateWorld(world, level1, { ...idle, right: true }, 1, false); expect(world.player.x).toBe(previous);
  });
  it.each([[-100, 0], [100, 0], [26000, 25040]])('clamps camera at %i to %i', (position, expected) => {
    expect(cameraPosition(position, 26000, 960)).toBe(expected); expect(cameraPosition(position, 500, 960)).toBe(0);
  });
  it('keyboard and touch share actions without releasing another held source', () => {
    const input = new BonusInput(); input.set('KeyD', 'right', true); input.set('pointer-1', 'right', true); input.set('KeyD', 'right', false);
    expect(input.state.right).toBe(true); input.clear(); expect(input.state).toEqual(idle);
  });
});
describe('active Bonuszeit clock', () => {
  it.each([[0, 0], [-1, 0], [60_000, 60_000], [30 * 60_000, 20 * 60_000]])('limits %i to %i', (balance, expected) => expect(availableSessionDuration(balance)).toBe(expected));
  it('counts only active play, preserves unused time on exit, and excludes background and completion', () => {
    const clock = new ActivePlayTime(12 * 60_000);
    for (let frame = 0; frame < 800; frame += 1) clock.advance(250, true);
    expect(formatPlayTime(clock.remainingMs)).toBe('08:40');
    clock.advance(60_000, false); clock.advance(10_000, false); expect(formatPlayTime(clock.remainingMs)).toBe('08:40');
  });
  it('caps stalls and never goes below zero', () => {
    const clock = new ActivePlayTime(300); clock.advance(5000, true); expect(clock.remainingMs).toBe(50); clock.advance(100, true); expect(clock.remainingMs).toBe(0);
  });
});
