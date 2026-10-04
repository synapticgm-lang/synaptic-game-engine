import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { buildContextPrompt } from './systemPrompt';
import { formatWriterInfoLayer, WRITER_INFO_LAYER_CHAR_CAP } from './writerInfoLayer';
import { formatHiddenRoomLedger } from './dungeonSeed';
import { rememberPlayerName, seedBibleNpcRoster, upsertHarvestedNpcMemory } from './npcMemory';
import { openingSpokenIdentityQuote, openingWhoAskLine } from './openingEstablishment';
import { ledgerActionStitch } from './completedEventPacket';
import { buildNewGameState } from './fateAutoplay';
import { sealedCastNames } from './beatContract';
import { namedPeopleForTest } from './stanceDensity';
import { repairSaveSchema } from './saveMigration';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { clampSystemHousing, SYSTEM_PART_IDS } from './systemHousing';
import type { ActiveDungeonState } from './mapEngine';
import type { GameState, NpcMemory } from './types';

/** Seed that rolls private_window, so the starter kit is built for that housing. */
const PRIVATE_WINDOW_SEED = 'pin-pw-4';
const PRIVATE_WINDOW_WITH_QUESTS = clampSystemHousing({
  housing: 'private_window',
  parts: { ...Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])), quest_list: true } as never,
});

function spState(partial: Partial<GameState> = {}): GameState {
  const base = createInitialState(undefined, 'litrpg', undefined, PRIVATE_WINDOW_SEED) as GameState;
  const state: GameState = {
    ...base,
    systemHousing: PRIVATE_WINDOW_WITH_QUESTS,
    campaignBibleId: 'summoned-pact',
    openingEstablishment: {
      pending: [],
      answers: { where: 'Harbor Quay' },
      complete: true,
      aloneArrival: false,
    },
    currentLocation: 'Harbor Quay',
    turn: 12,
    sceneFacts: emptySceneFacts(12),
    npcMemories: [],
    ...partial,
  };
  return seedBibleNpcRoster(state, summonedPact);
}

function recordCount(state: GameState, name: string): number {
  return (state.npcMemories ?? []).filter((m) => m.npcName === name).length;
}

describe('27d info layer restored to the writer', () => {
  const state = spState({
    inventory: [{ id: 'lantern-27d', name: 'Tide Lantern', rarity: 'Common', quantity: 1 }],
    quests: [
      {
        id: 'q-27d',
        name: 'Grain Ledger Errand',
        description: 'Carry the ledger to the quay-master.',
        status: 'active',
        type: 'main',
        revealed: true,
      } as GameState['quests'][number],
    ],
    timeline: [
      { id: 't1', turn: 9, kind: 'discovery', text: 'Salt circle washed off the quay boards', at: 1 },
      { id: 't2', turn: 10, kind: 'discovery', text: 'Grain-hands left for the warehouse', at: 2 },
      { id: 't3', turn: 11, kind: 'discovery', text: 'Lantern handed over at the rail', at: 3 },
    ],
    sceneFacts: { ...emptySceneFacts(12), present: ['Pell Wren'] },
    lorebook: [
      {
        id: 'lore-pell-wren',
        name: 'Pell Wren',
        type: 'npc',
        keywords: ['pell wren', 'quay-master'],
        summary: 'Quay-master who wants strangers off the boards before a clerk sees.',
        lastSeenTurn: 11,
        revealed: true,
      },
    ],
  });

  it('buildContextPrompt prepends WORLD FACTS and keeps the packet', () => {
    const context = buildContextPrompt(state, 'Look around');
    expect(context).toContain('WORLD FACTS (this turn):');
    expect(context).toContain('Tide Lantern');
    expect(context).toContain('Grain Ledger Errand');
    expect(context).toMatch(/Salt circle washed off the quay boards|Grain-hands left for the warehouse|Lantern handed over at the rail/);
    expect(context).toContain('Pell Wren');
    expect(context).toContain('COMPLETED EVENT:');
    expect(context).toContain('PLAYER:');
  });

  it('facts block carries no instruction words', () => {
    const context = buildContextPrompt(state, 'Look around');
    const facts = context.slice(0, context.indexOf('COMPLETED EVENT:'));
    expect(facts).not.toMatch(/\b(MUST|NEVER|Do not|AUTHORITY|BINDING|MANDATORY|RAILS)\b/);
  });

  it('compact info layer carries no rule text on a tabletop save', () => {
    const tabletop = formatWriterInfoLayer({ ...state, engineMode: 'dnd' });
    expect(tabletop).toContain(`Level: ${state.character.level}`);
    expect(tabletop).not.toMatch(/Do not|MUST|NEVER/);
  });

  it('formatWriterInfoLayer stays under the char cap on a heavy save', () => {
    const heavy = spState({
      inventory: Array.from({ length: 40 }, (_, i) => ({
        id: `it-${i}`,
        name: `Heavy Crate Item ${i}`,
        rarity: 'Common' as const,
        quantity: 1,
      })),
      timeline: Array.from({ length: 30 }, (_, i) => ({
        id: `tl-${i}`,
        turn: i,
        kind: 'discovery' as const,
        text: `Timeline fact number ${i} about the quay and its long boards`,
        at: i,
      })),
      lorebook: Array.from({ length: 10 }, (_, i) => ({
        id: `lc-${i}`,
        name: `Lore Card ${i}`,
        type: 'lore' as const,
        keywords: [`lore ${i}`],
        summary: `A long lore summary ${i} `.repeat(12),
        lastSeenTurn: i,
        revealed: true,
      })),
    });
    const out = formatWriterInfoLayer(heavy, heavy.lorebook);
    expect(out.length).toBeLessThanOrEqual(WRITER_INFO_LAYER_CHAR_CAP);
  });

  it('formatHiddenRoomLedger factsOnly hides unrevealed secrets and carries no emit/MUST', () => {
    const dungeon: ActiveDungeonState = {
      blueprintId: 'bp-27d',
      dungeonName: 'Quay Cellar',
      tier: 4,
      currentZLevel: 0,
      currentNodeId: 'n1',
      visitedNodeIds: ['n1'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'n1',
          name: 'Brine Cellar',
          description: 'Wet stone.',
          connections: [],
          hidden: {
            traps: [],
            lootables: [{ id: 'l1', label: 'Salt chest', opened: false, loot: { rarity: 'Uncommon', qty: 1 } }],
            secrets: [{ id: 's1', clue: 'HIDDEN-CLUE-27D', revealed: false }],
            mobs: [],
          },
        },
      ],
    };
    const out = formatHiddenRoomLedger(dungeon, { factsOnly: true });
    expect(out).toContain('Salt chest');
    expect(out).not.toContain('HIDDEN-CLUE-27D');
    expect(out).not.toMatch(/emit|MUST/);
  });
});

describe('27d one record per NPC', () => {
  it('seeding yields exactly one record for each card-named person', () => {
    const state = spState();
    for (const name of ['Pell Wren', 'Venn Scale', 'Ila Pellane', 'Sister Pell', 'Brother Oren', 'Kessa Cinder']) {
      expect(recordCount(state, name)).toBe(1);
    }
  });

  it('compound present entry splits into canonical record names', () => {
    const state = spState({
      sceneFacts: { ...emptySceneFacts(12), present: ['Brother Oren and tracker Kessa Cinder'] },
    });
    const names = sealedCastNames(state);
    expect([...names].sort()).toEqual(['Brother Oren', 'Kessa Cinder']);
    expect(names.some((n) => /\band\b/.test(n))).toBe(false);
  });

  it('aliases collapse to one canonical cast entry', () => {
    const state = spState({
      sceneFacts: { ...emptySceneFacts(12), present: ['Oren', 'Brother Oren'] },
    });
    expect(sealedCastNames(state)).toEqual(['Brother Oren']);
  });

  it('harvest never creates a record for an unknown name', () => {
    const memories = spState().npcMemories ?? [];
    const next = upsertHarvestedNpcMemory(memories, 'Totally Newname', 3);
    expect(next.length).toBe(memories.length);
  });

  it('stanceDensity skips unmet roster rows', () => {
    const roster: NpcMemory = {
      npcId: 'sp-npc-pell-wren',
      npcName: 'Pell Wren',
      disposition: 'neutral',
      facts: ['Bible roster: quay-master'],
      lastSeenTurn: 0,
      met: false,
    };
    const state = spState({ npcMemories: [roster], lorebook: [] });
    expect(namedPeopleForTest({ ...state, npcMemories: [roster] })).not.toContain('Pell Wren');
  });

  it('repairSaveSchema upgrades old npc records and splits compound present', () => {
    const base = createInitialState(undefined, 'litrpg') as GameState;
    const old: GameState = {
      ...base,
        campaignBibleId: 'summoned-pact',
      saveRepairRevision: 2,
      turn: 8,
      npcMemories: [
        { npcId: 'sp-npc-9', npcName: 'Brother Oren', disposition: 'neutral', facts: [], lastSeenTurn: 4, introSpoken: true },
        { npcId: 'sp-npc-10', npcName: 'Kessa Cinder', disposition: 'hostile', facts: [], lastSeenTurn: 4 },
      ],
      sceneFacts: { ...emptySceneFacts(8), present: ['Brother Oren and tracker Kessa Cinder'] },
    };
    const { state } = repairSaveSchema(old);
    const oren = state.npcMemories?.find((m) => m.npcName === 'Brother Oren');
    const kessa = state.npcMemories?.find((m) => m.npcName === 'Kessa Cinder');
    expect(oren?.aliases).toBeDefined();
    expect(oren?.met).toBe(true);
    expect(oren?.present).toBe(false);
    expect(kessa?.met).toBe(false);
    expect(state.sceneFacts?.present).toEqual(['Brother Oren', 'Kessa Cinder']);
  });

  it('Pell Wren on the SP seed-28 Harbor Quay card answers from her record, not a charter line', () => {
    const { state } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 28,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    expect(state.openingEstablishment?.castNpcIds).toContain('sp-npc-pell-wren');
    const quote = openingSpokenIdentityQuote('Pell Wren', { state });
    expect(quote).toBe('"Pell Wren. You asked who."');
    expect(openingWhoAskLine(state)).toContain('"Pell Wren. You asked who."');
    expect(openingWhoAskLine(state)).not.toMatch(/charter/i);
  });

  it('left-behind stitch names exactly Brother Oren and Kessa Cinder', () => {
    const entries = ['Brother Oren and tracker Kessa Cinder', 'Brother Oren', 'Kessa Cinder', 'Oren and Kessa'];
    const behind = spState({
      turn: 6,
      currentLocation: 'Cinderwake Trail',
      sceneFacts: { ...emptySceneFacts(6), present: [], leftBehind: entries, indoor: false },
    });
    const fromLeftBehind = ledgerActionStitch(behind, 'Travel toward Lowmarket');
    expect(fromLeftBehind.match(/([A-Z][^.]*?) stayed/)?.[1]).toBe('Brother Oren and Kessa Cinder');

    const atOrigin = spState({
      turn: 6,
      currentLocation: 'Cinderwake Trail',
      sceneFacts: { ...emptySceneFacts(6), present: entries, indoor: false },
    });
    const fromPresent = ledgerActionStitch(atOrigin, 'Travel toward Lowmarket');
    expect(fromPresent.match(/([A-Z][^.]*?) stayed/)?.[1]).toBe('Brother Oren and Kessa Cinder');
  });

  it('rememberPlayerName leaves unmet records unchanged', () => {
    const state = spState();
    const before = state.npcMemories ?? [];
    const after = rememberPlayerName(state, 'Jax').npcMemories ?? [];
    for (const m of after) {
      const prior = before.find((b) => b.npcId === m.npcId);
      if (!prior?.met && !prior?.introSpoken && !prior?.meetCount) expect(m).toBe(prior);
    }
    const met = before.map((m) => (m.npcName === 'Pell Wren' ? { ...m, met: true } : m));
    const named = rememberPlayerName({ ...state, npcMemories: met }, 'Jax').npcMemories ?? [];
    expect(named.find((m) => m.npcName === 'Pell Wren')?.knownPlayerName).toBe('Jax');
  });

  it('stanceFallbacks does not name a met NPC who is not present', () => {
    const base = spState({ lorebook: [] });
    const npcMemories = (base.npcMemories ?? []).map((m) => (m.npcName === 'Venn Scale' ? { ...m, met: true } : m));
    const away = { ...base, npcMemories, sceneFacts: { ...emptySceneFacts(12), present: ['Pell Wren'] } };
    expect(namedPeopleForTest(away)).not.toContain('Venn Scale');
    const here = { ...away, sceneFacts: { ...emptySceneFacts(12), present: ['Venn Scale'] } };
    expect(namedPeopleForTest(here)).toContain('Venn Scale');
  });

  it('entityRegistry no longer carries per-bible NPC name lists', () => {
    const src = readFileSync(resolve(__dirname, 'entityRegistry.ts'), 'utf8');
    expect(src).not.toContain('NPC_REGISTRY_BY_BIBLE');
  });
});
