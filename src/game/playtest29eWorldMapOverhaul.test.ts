import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { seedWorldAtlas, instantiateWorldAtlas } from './worldAtlas';
import { getWorldOutlineById } from '@/data/worldOutlines';
import {
  seedWorldMapPlaces,
  questFitsSettlement,
  pickQuestSiteForTags,
  isLegalMapPlace,
  looksLikeGeographyInvent,
  formatWorldMapAuthorityBlock,
} from './worldMapAuthority';
import { harvestNarrativeIntoLedger, scrubInventedGeography } from './narrativeHarvest';
import { placeAllowsDungeon, openDungeonAtSite, closeDungeon } from './dungeonLifecycle';
import { applyBiomeSaneQuestSites, revealQuestsFromHubLinks } from './questPlay';
import { hubsForBibleId } from './outdoorHubs';
import { formatSituationForPrompt } from './situationPacket';
import { upsertPlaceFromSheet } from './places';
import { seedStateFromCampaignBible } from './campaignSeed';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import type { Quest } from './types';

describe('playtest29e — world map overhaul', () => {
  it('stamp is 2026-08-29 and Mid writer stays OFF', () => {
    expect(BUILD_STAMP).toMatch(/^2026-08-29/);
    expect(HUD_BUILD_STAMP).toMatch(/^2026-08-29/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('LitRPG New Game always gets atlas + settlements on places', () => {
    let state = createInitialState(undefined, 'litrpg');
    const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'summoned-pact')!;
    state = seedStateFromCampaignBible(state, bible);
    state = seedWorldAtlas(state, bible);
    expect(state.worldAtlas?.settlements?.length).toBeGreaterThan(3);
    const places = seedWorldMapPlaces([], state.worldAtlas);
    expect(places.some((p) => p.mapCanonical)).toBe(true);
    expect(places.length).toBeGreaterThan(3);
  });

  it('hero-awakening null outline still gets a map in open modes', () => {
    let state = createInitialState(undefined, 'litrpg');
    state.seed = 'hero-test-seed';
    const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'hero-awakening');
    state = seedWorldAtlas(state, bible ?? null);
    expect(state.worldAtlas).not.toBeNull();
    expect(state.worldAtlas?.settlements?.length).toBeGreaterThan(0);
  });

  it('farming quest does not sit on ash/desert vent camp', () => {
    const outline = getWorldOutlineById('crescent-isles')!;
    const atlas = instantiateWorldAtlas(outline);
    const vent = atlas.settlements!.find((s) => s.id === 'vent-camp')!;
    expect(questFitsSettlement('farming', vent)).toBe(false);
    const site = pickQuestSiteForTags(atlas, ['farming']);
    expect(site).toBeTruthy();
    expect(questFitsSettlement('farming', site!)).toBe(true);
  });

  it('applyBiomeSaneQuestSites relocates farm quest off desert', () => {
    const outline = getWorldOutlineById('crescent-isles')!;
    let state = createInitialState(undefined, 'litrpg');
    state.worldAtlas = instantiateWorldAtlas(outline);
    const quests = applyBiomeSaneQuestSites(state, [
      {
        id: 'q1',
        name: 'Harvest wheat',
        description: 'Farm the crops before winter',
        status: 'active',
        type: 'side',
        revealed: true,
        location: 'Vent Camp',
        objectives: [],
      },
    ]);
    expect(quests[0]!.location).not.toMatch(/Vent Camp/i);
  });

  it('rejects inventing new city into place registry', () => {
    const outline = getWorldOutlineById('spine-marches')!;
    let state = createInitialState(undefined, 'dnd');
    state.worldAtlas = instantiateWorldAtlas(outline);
    state.places = seedWorldMapPlaces([], state.worldAtlas);
    const before = state.places.length;
    const next = upsertPlaceFromSheet(
      state.places,
      { name: 'City of Inventedonia', interactables: [], exits: [], presentNpcIds: [] },
      { state }
    );
    expect(next.length).toBe(before);
    expect(looksLikeGeographyInvent('City of Inventedonia')).toBe(true);
    expect(isLegalMapPlace(state, 'Lowgate')).toBe(true);
  });

  it('harvests NPC names into lorebook without inventing cities', () => {
    let state = createInitialState(undefined, 'rpg');
    state.worldAtlas = instantiateWorldAtlas(getWorldOutlineById('shatter-coast')!);
    state = harvestNarrativeIntoLedger(
      state,
      'A woman named Mara says hello. The city of Fakeopolis glitters.',
      5
    );
    expect(state.lorebook.some((c) => c.name === 'Mara' && c.type === 'npc')).toBe(true);
    expect(state.npcMemories?.some((n) => n.npcName === 'Mara')).toBe(true);
  });

  it('scrubInventedGeography rewrites unknown city-of names', () => {
    let state = createInitialState(undefined, 'litrpg');
    state.worldAtlas = instantiateWorldAtlas(getWorldOutlineById('crescent-isles')!);
    const out = scrubInventedGeography('You ride toward the city of Fakeopolis.', state);
    expect(out).not.toMatch(/Fakeopolis/);
  });

  it('dungeon opens only at allowsDungeon sites and can close', () => {
    let state = createInitialState(undefined, 'dnd');
    state.worldAtlas = instantiateWorldAtlas(getWorldOutlineById('shatter-coast')!);
    state.places = seedWorldMapPlaces([], state.worldAtlas);
    state.currentLocation = 'Brinewatch';
    expect(placeAllowsDungeon(state, 'Brinewatch')).toBe(false);
    expect(placeAllowsDungeon(state, 'Salt-Stained Keep')).toBe(true);
    state = openDungeonAtSite(state, { siteName: 'Salt-Stained Keep', seed: 't' });
    expect(state.activeDungeon).toBeTruthy();
    state = closeDungeon(state, { cleared: true });
    expect(state.activeDungeon).toBeNull();
  });

  it('situation packet includes WORLD MAP AUTHORITY', () => {
    let state = createInitialState(undefined, 'litrpg');
    state.worldAtlas = instantiateWorldAtlas(getWorldOutlineById('grid-metro')!);
    const block = formatWorldMapAuthorityBlock(state);
    expect(block).toMatch(/WORLD MAP AUTHORITY/);
    expect(block).toMatch(/do NOT invent new cities/i);
    const prompt = formatSituationForPrompt(state);
    expect(prompt).toMatch(/WORLD MAP AUTHORITY/);
  });

  it('shattered-coast has hub bank and hub links reveal quests', () => {
    const hubs = hubsForBibleId('shattered-coast');
    expect(hubs.length).toBeGreaterThanOrEqual(6);
    const saltmar = hubs.find((h) => /^saltmar$/i.test(h.name));
    expect(saltmar?.linkedQuestIds?.length).toBeGreaterThan(0);
    const quests: Quest[] = [
      {
        id: saltmar!.linkedQuestIds![0]!,
        name: 'Coast Hook',
        description: 'Start',
        status: 'hidden',
        type: 'main',
        revealed: false,
        objectives: [],
      },
    ];
    const next = revealQuestsFromHubLinks(quests, saltmar!.linkedQuestIds, saltmar!.name);
    expect(next[0]!.revealed).toBe(true);
    expect(next[0]!.status).toBe('active');
    const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'shattered-coast')!;
    expect(bible.worldOutlineId).toBe('shatter-coast');
    let state = createInitialState(undefined, 'dnd');
    state = seedStateFromCampaignBible(state, bible);
    state = seedWorldAtlas(state, bible);
    expect(state.worldAtlas?.outlineId).toBe('shatter-coast');
    expect(state.worldAtlas?.settlements?.some((s) => /saltmar/i.test(s.name))).toBe(true);
  });

  it('markDefeatedMobAtCurrentNode writes clearedNodeIds', async () => {
    const { markDefeatedMobAtCurrentNode } = await import('./dungeonMobLedger');
    let state = createInitialState(undefined, 'dnd');
    state.activeDungeon = {
      blueprintId: 'test-dungeon',
      dungeonName: 'Test Keep',
      siteName: 'Salt-Stained Keep',
      tier: 1,
      dangerTier: 1,
      currentZLevel: 0,
      currentNodeId: 'n1',
      visitedNodeIds: ['n1'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'n1',
          name: 'Hall',
          description: 'Hall',
          connections: [],
          hidden: {
            traps: [],
            lootables: [],
            secrets: [],
            mobs: [{ id: 'm1', name: 'Skeleton', spawned: true, defeated: false, hpRemaining: 10 }],
          },
        },
      ],
      edges: [],
    } as any;
    state = markDefeatedMobAtCurrentNode(state, 'Skeleton');
    expect(state.activeDungeon?.clearedNodeIds).toContain('n1');
  });
});
