import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDB, type IDBPDatabase } from 'idb';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import type * as DatabaseModule from './database';
import { getDatabase, openDatabase, type MathAdventureDb } from './database';
import { dependencies } from '@/app/dependencies';
import { completeGameSession } from '@/application/game/completeGameSession';
import { usePlayerStore } from '@/features/player/playerStore';
import { useMotivationStore } from '@/features/motivation/motivationStore';
import { createInitialProgress } from '@/domain/progression/progression.service';
import { createDefaultMotivationSettings, isRewardUnlocked } from '@/domain/motivation/motivation.service';
import { getVirtualRewardById } from '@/domain/motivation/virtualRewards';
import { LEVELS } from '@/domain/progression/levels';
import { LevelsPage } from '@/pages/LevelsPage/LevelsPage';
import { RewardsPage } from '@/pages/RewardsPage/RewardsPage';
import { ParentPage } from '@/pages/ParentPage/ParentPage';
import { ProgressPage } from '@/pages/ProgressPage/ProgressPage';
import { sessionInput } from '@/test/fixtures';
import { WeeklyGoalForm } from '@/features/motivation/WeeklyGoalForm';
import { RewardCollection } from '@/features/motivation/RewardCollection';

vi.mock('./database', async importOriginal => ({
  ...await importOriginal<typeof DatabaseModule>(), getDatabase: vi.fn(),
}));

const useSyncExternalStore = React.useSyncExternalStore;
let database: IDBPDatabase<MathAdventureDb>;
let name: string;

beforeEach(async () => {
  vi.spyOn(React, 'useSyncExternalStore').mockImplementation((subscribe, getSnapshot) => useSyncExternalStore(subscribe, getSnapshot, getSnapshot));
  name = crypto.randomUUID();
  database = await openDatabase(name);
  vi.mocked(getDatabase).mockImplementation(async () => database);
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
  await database.put('players', { id: 'child', name: 'Mia', characterId: 'placeholder-cat', createdAt: '2026-09-01', updatedAt: '2026-09-01' });
  await database.put('progress', { ...createInitialProgress('child'), coins: 100, unlockedLevelIds: LEVELS.map(level => level.id) });
  await database.put('motivation', { ...createDefaultMotivationSettings('child'), equippedVirtualRewardId: 'bow' });
  await usePlayerStore.getState().initialize();
  await useMotivationStore.getState().refresh('child');
});

afterEach(async () => {
  database.close();
  await deleteDB(name);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderRoute(path: string) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/levels" element={<LevelsPage />} />
    <Route path="/rewards" element={<RewardsPage />} />
    <Route path="/parents" element={<ParentPage />} />
    <Route path="/progress" element={<ProgressPage />} />
  </Routes></MemoryRouter>);
}

function characterMarkup(markup: string) {
  return markup.match(/<div class="[^"]*character[^"]*">[\s\S]*?<\/div>/)?.[0] ?? '';
}

describe('persisted equipment through the real rewards page', () => {
  it.each([
    ['/rewards', '/parents', 'Elternbereich'],
    ['/progress', '/rewards', 'Alle Belohnungen entdecken'],
  ])('%s uses styled forward navigation to %s', (path, destination, label) => {
    const markup = renderRoute(path);
    const links = [...markup.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
    const forward = links.find(link => link.includes(`href="${destination}"`));
    expect(forward).toContain(`>${label}</span>`);
    expect(forward).toContain('aria-hidden="true"');
    for (const link of links) expect(link).toMatch(/class="[^"]*button[^"]*"/);
  });
  it.each(['/parents', '/rewards', '/progress', '/levels'])('%s uses the shared back control', path => {
    const markup = renderRoute(path);
    expect(markup).toContain('<span>Zurück</span>');
    expect(markup).toContain('aria-hidden="true" focusable="false"');
    if (path !== '/levels') expect(markup).toContain('href="/home"');
    expect(markup).not.toContain('← Zurück');
  });
  it('shows disjoint weekly and super-prize options and rejects invalid weekly saves', async () => {
    const settings = useMotivationStore.getState().settings!;
    const weekly = renderToStaticMarkup(<WeeklyGoalForm settings={settings} />);
    const prizes = renderToStaticMarkup(<RewardCollection playerId="child" coins={100} tab="Superpreise" />);
    for (const reward of ['Eis essen', 'Spielplatz', 'Filmabend', 'Lieblingsessen']) {
      expect(weekly).toContain(reward);
      expect(prizes).not.toContain(reward);
    }
    for (const reward of ['Shopping', 'Ausflug', 'Ja-Tag']) {
      expect(prizes).toContain(reward);
      expect(weekly).not.toContain(reward);
    }
    expect(weekly).not.toContain('Eigene Belohnung');
    for (const rewardId of ['shopping', 'excursion', 'yes-day', 'custom']) {
      await expect(useMotivationStore.getState().saveWeeklyGoal('child', { enabled: true, rewardId, requiredDays: 3 })).rejects.toThrow('Wochenziel');
    }
    expect(await database.get('motivation', 'child')).toEqual(settings);
    await useMotivationStore.getState().saveWeeklyGoal('child', { enabled: true, rewardId: 'movie', requiredDays: 3 });
    expect(await database.get('motivation', 'child')).toMatchObject({ weeklyRewardId: 'movie', weeklyRequiredDays: 3 });
    expect((await database.get('progress', 'child'))?.coins).toBe(100);
    await expect(dependencies.rewardClaimRepository.claim('child', 'super:ice-cream')).rejects.toThrow();
  });
  it('offers Ausziehen, persists null, removes Mia’s bow, and keeps the bow unlocked', async () => {
    const before = renderRoute('/rewards');
    expect(before).toContain('✓ Angezogen');
    expect(before).toContain('<button type="button">Ausziehen</button>');
    expect(characterMarkup(before)).toContain('🎀');
    await useMotivationStore.getState().equipVirtualReward('child', null);
    expect(useMotivationStore.getState().settings?.equippedVirtualRewardId).toBeNull();
    expect((await dependencies.motivationRepository.getByPlayerId('child'))?.equippedVirtualRewardId).toBeNull();
    const after = renderRoute('/rewards');
    expect(characterMarkup(after)).toContain('<img');
    expect(characterMarkup(after)).not.toContain('<span');
    expect(after).not.toContain('✓ Angezogen');
    expect(after).not.toContain('Ausziehen');
    const bowCard = after.match(/<article[^>]*>[\s\S]*?Schleife[\s\S]*?<\/article>/)?.[0];
    expect(bowCard).toContain('Freigeschaltet!');
    expect(bowCard).toContain('Anziehen');
    const progress = (await dependencies.progressRepository.getByPlayerId('child'))!;
    expect(progress.coins).toBe(100);
    expect(isRewardUnlocked(getVirtualRewardById('bow')!, progress.coins)).toBe(true);

    database.close();
    database = await openDatabase(name);
    useMotivationStore.setState({ playerId: null, settings: null });
    await useMotivationStore.getState().loadForPlayer('child');
    expect(useMotivationStore.getState().settings?.equippedVirtualRewardId).toBeNull();
    expect(characterMarkup(renderRoute('/rewards'))).not.toContain('<span');
  });

  it('equips only one accessory and can remove it without depending on unlock state', async () => {
    await useMotivationStore.getState().equipVirtualReward('child', 'flower');
    expect((await database.get('motivation', 'child'))?.equippedVirtualRewardId).toBe('flower');
    expect(renderRoute('/rewards').match(/✓ Angezogen/g)).toHaveLength(1);
    await database.put('progress', createInitialProgress('child'));
    await useMotivationStore.getState().equipVirtualReward('child', null);
    expect((await database.get('motivation', 'child'))?.equippedVirtualRewardId).toBeNull();
    await expect(useMotivationStore.getState().equipVirtualReward('child', 'bow')).rejects.toThrow('gesperrt');
  });

  it('does not pretend to remove the accessory if saving fails', async () => {
    const save = vi.spyOn(dependencies.motivationRepository, 'save').mockRejectedValueOnce(new Error('Storage unavailable'));
    await expect(useMotivationStore.getState().equipVirtualReward('child', null)).rejects.toThrow('Storage unavailable');
    expect(useMotivationStore.getState().settings?.equippedVirtualRewardId).toBe('bow');
    expect((await database.get('motivation', 'child'))?.equippedVirtualRewardId).toBe('bow');
    save.mockRestore();
  });
});

describe('persisted progress through the real levels page', () => {
  it('renders zero stars for never-played levels despite all levels being unlocked', () => {
    const markup = renderRoute('/levels');
    expect(markup.match(/☆☆☆☆☆☆☆/g)).toHaveLength(5);
    expect(markup).not.toContain('★★★★★★★');
    expect(markup).not.toContain('disabled');
  });

  it('persists per-level 3/7, 5/7 and 7/7 and does not reduce mastery on a worse replay', async () => {
    for (const [levelId, correct] of [['addition-5', 6], ['addition-10', 8], ['addition-20', 10]] as const) {
      const input = sessionInput('child', correct);
      await completeGameSession({ session: { ...input.session, levelId }, attempts: input.attempts.map(attempt => ({ ...attempt, levelId })) }, dependencies);
    }
    await completeGameSession(sessionInput('child', 0), dependencies);
    database.close();
    database = await openDatabase(name);
    await usePlayerStore.getState().initialize();
    const progress = (await database.get('progress', 'child'))!;
    expect(progress.levelStars).toEqual({ 'addition-5': 3, 'addition-10': 5, 'addition-20': 7 });
    expect(usePlayerStore.getState().progress).toEqual(progress);
    const markup = renderRoute('/levels');
    expect(markup).toContain('aria-label="3 von 7 Sternen">★★★☆☆☆☆');
    expect(markup).toContain('aria-label="5 von 7 Sternen">★★★★★☆☆');
    expect(markup).toContain('aria-label="7 von 7 Sternen">★★★★★★★');
    expect(markup.match(/☆☆☆☆☆☆☆/g)).toHaveLength(2);
    expect((await database.getAll('sessions')).every(session => session.questionSetVersion === 'mixed-v1')).toBe(true);
  });

  it('shows seven empty slots on locked levels too, and unlocks at eight correct', async () => {
    await database.put('progress', createInitialProgress('child'));
    await usePlayerStore.getState().refreshProgress();
    expect(renderRoute('/levels').match(/☆☆☆☆☆☆☆/g)).toHaveLength(5);
    await completeGameSession(sessionInput('child', 8), dependencies);
    await usePlayerStore.getState().refreshProgress();
    expect(usePlayerStore.getState().progress).toMatchObject({ levelStars: { 'addition-5': 5 }, unlockedLevelIds: ['addition-5', 'addition-10'] });
    const markup = renderRoute('/levels');
    expect(markup).toContain('★★★★★☆☆');
    expect(markup.match(/disabled=""/g)).toHaveLength(3);
  });
});
