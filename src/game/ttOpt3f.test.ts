/**
 * q37-OPT3f — OPT-3 fields only (split from C2b).
 * Acceptance OPT3-1: every NPC created in a new game (tabletop / LitRPG / Story RPG)
 * has goal, need, offer, attitude; merchant offer is stock; quest-patron goal can seed OPT-2.
 * OPT3-2 → q38-OPT2; OPT3-3 → ttC2a; OPT3-4/5 → q37-OPT3.
 */
import { describe, expect, it } from 'vitest';
import { cursedKeep } from '../data/campaigns/cursedKeep';
import { summonedPact } from '../data/campaigns/summonedPact';
import { saltRoadHeist } from '../data/campaigns/premades';
import { createInitialState } from './defaults';
import {
  MERCHANT_OFFER_STOCK,
  agendaFromRole,
  ensureNpcAgenda,
  seedBibleNpcRoster,
} from './npcMemory';
import { pickNpcSheet } from './npcSheet';
import { seedTownsfolkHere } from './townsfolk';
import type { DoranMotivation, GameState, NpcMemory } from './types';
import { seedStateFromCampaignBible } from './campaignSeed';

const DORAN: readonly DoranMotivation[] = [
  'Knowledge', 'Comfort', 'Reputation', 'Serenity', 'Protection', 'Conquest', 'Wealth', 'Ability', 'Equipment',
];

function assertAgenda(m: NpcMemory, label: string) {
  expect(m.goal, `${label} goal`).toBeTruthy();
  expect(DORAN.includes(m.goal!.motivation), `${label} motivation`).toBe(true);
  expect(m.goal!.target.trim().length, `${label} target`).toBeGreaterThan(0);
  expect(m.need?.trim().length, `${label} need`).toBeGreaterThan(0);
  expect(m.offer?.trim().length, `${label} offer`).toBeGreaterThan(0);
  expect(['friendly', 'indifferent', 'hostile'], `${label} attitude`).toContain(m.attitude);
  expect(m.traits?.length, `${label} traits`).toBeGreaterThanOrEqual(1);
  expect(m.traits!.length, `${label} traits cap`).toBeLessThanOrEqual(2);
  expect(m.speechRegister?.trim().length, `${label} speechRegister`).toBeGreaterThan(0);
}

function seedMode(
  mode: 'dnd' | 'litrpg' | 'rpg',
  bible: typeof cursedKeep,
): GameState {
  const base = createInitialState(undefined, mode) as GameState;
  return seedStateFromCampaignBible(
    {
      ...base,
      engineMode: mode,
      campaignBibleId: bible.id,
      npcMemories: [],
    } as GameState,
    bible,
  );
}

describe('OPT-3 fields (q37-OPT3f)', () => {
  it('OPT3-1: every NPC from a new-game seed in tabletop, LitRPG and Story RPG has agenda fields', () => {
    const packs: Array<{ mode: 'dnd' | 'litrpg' | 'rpg'; bible: typeof cursedKeep }> = [
      { mode: 'dnd', bible: cursedKeep },
      { mode: 'litrpg', bible: summonedPact },
      { mode: 'rpg', bible: saltRoadHeist },
    ];
    for (const { mode, bible } of packs) {
      const state = seedMode(mode, bible);
      const memories = state.npcMemories ?? [];
      expect(memories.length, mode).toBeGreaterThan(0);
      for (const m of memories) assertAgenda(m, `${mode}:${m.npcName}`);
    }
  });

  it('OPT3-1: a merchant offer is its stock; a quest-patron goal can seed OPT-2', () => {
    const merchant = agendaFromRole({ role: 'merchant', disposition: 'neutral' });
    expect(merchant.offer).toBe(MERCHANT_OFFER_STOCK);
    expect(merchant.goal.motivation).toBe('Wealth');

    const patron = agendaFromRole({
      role: 'quest-patron',
      disposition: 'friendly',
      bindTarget: 'eyes on the keep gate',
    });
    expect(patron.goal.motivation).toBe('Protection');
    expect(patron.goal.target).toBe('eyes on the keep gate');
    expect(patron.need).toMatch(/job/i);
    expect(patron.attitude).toBe('friendly');

    const seeded = seedBibleNpcRoster(
      { ...createInitialState(undefined, 'litrpg'), npcMemories: [] } as GameState,
      summonedPact,
    );
    const merchants = (seeded.npcMemories ?? []).filter((m) => m.roleHint === 'merchant');
    expect(merchants.length).toBeGreaterThan(0);
    for (const m of merchants) {
      expect(m.offer).toBe(MERCHANT_OFFER_STOCK);
    }
    const patrons = (seeded.npcMemories ?? []).filter((m) => m.roleHint === 'quest-patron');
    expect(patrons.length).toBeGreaterThan(0);
    for (const m of patrons) {
      expect(m.goal?.motivation).toBeTruthy();
      expect(m.need?.length).toBeGreaterThan(0);
    }
  });

  it('OPT3-1: townsfolk and ensure paths set agenda once; never overwrite', () => {
    const sheet = pickNpcSheet('Wat Miller', 'inn', { campaignId: 'cursed-keep', roleHint: 'merchant' });
    expect(sheet.offer).toBe(MERCHANT_OFFER_STOCK);
    expect(sheet.goal?.motivation).toBe('Wealth');

    let state = createInitialState(undefined, 'dnd') as GameState;
    state = {
      ...state,
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Greyhollow Inn',
      townsfolkPlaces: ['elsewhere'],
      openingEstablishment: { ...(state.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
      npcMemories: [],
    };
    state = seedTownsfolkHere(state);
    const folk = state.npcMemories ?? [];
    expect(folk.length).toBeGreaterThan(0);
    for (const m of folk) assertAgenda(m, m.npcName);

    const locked = ensureNpcAgenda(folk[0]!, { role: 'rival', disposition: 'hostile', bindTarget: 'overwrite-me' });
    expect(locked.goal).toEqual(folk[0]!.goal);
    expect(locked.need).toBe(folk[0]!.need);
    expect(locked.offer).toBe(folk[0]!.offer);
    expect(locked.attitude).toBe(folk[0]!.attitude);
  });
});
