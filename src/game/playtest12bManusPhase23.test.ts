/**
 * Batch 12b — Manus Phase 2 encounter catalog + Phase 3 Summoned Pact hubs.
 * Extends 12a npcMemories[]. No new FSM. No SNAPSHOT/CRAFT. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { summonedPact } from '@/data/campaigns/summonedPact';
import {
  allCatalogEncounters,
  isCatalogFoeName,
  LITRPG_ENCOUNTERS,
} from '@/data/encounters';
import {
  isCatalogFoeTalkForbidden,
  livingCatalogTalkTargets,
  selectCatalogEncounter,
} from './encounterBible';
import { droughtSkirmishTable, runArcDirectorBeforeGm, shouldSpawnCombat } from './arcDirector';
import { compileGraphChoiceLabels, enumerateLegalEdges } from './graphChoices';
import { hubsForBibleId, SUMMONED_PACT_HUBS } from './outdoorHubs';
import { canHarvestAsNamedPerson, getRegisteredNpcs } from './entityRegistry';
import {
  hasMetBefore,
  seedBibleNpcRoster,
  upsertHarvestedNpcMemory,
} from './npcMemory';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { revealQuestsFromHubLinks, seedLocalStarterQuest, visibleJournalQuests } from './questPlay';
import { seedStateFromCampaignBible } from './campaignSeed';
import type { GameState } from './types';

const PHASE23_HUBS = [
  'Mireglass March',
  'Cinderwake Trail',
  'The Sump Court',
  'Hollow Engine',
  'The Argent Ledger',
  "Saint Vhal's Reliquary",
  'The Integration Scar',
] as const;

function openedPact(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 8,
    currentLocation: 'West Wall',
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: 'West Wall' },
      complete: true,
      aloneArrival: false,
    },
    character: { ...state.character, name: 'Jax' },
    arcDirector: { turnsSinceCombatReceipt: 8, committedBeatIds: ['sp-beat-orient'] },
    sceneFacts: emptySceneFacts(8),
    ...partial,
  };
}

describe('playtest12b — Manus Phase 2+3 stamps', () => {
  it('HUD/BUILD are 12b, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Phase 2: encounter catalog', () => {
  it('catalog has named seeds per combat mode; director picks one of them', () => {
    expect(LITRPG_ENCOUNTERS.length).toBeGreaterThanOrEqual(16);
    expect(allCatalogEncounters().every((s) => s.id && s.foeName)).toBe(true);
    const state = openedPact();
    expect(shouldSpawnCombat(state)).toBe(true);
    const seed = selectCatalogEncounter(state);
    expect(seed).toBeTruthy();
    expect(isCatalogFoeName(seed!.foeName, 'litrpg')).toBe(true);
    expect(droughtSkirmishTable(state)).toContain(seed!.foeName);
    const result = runArcDirectorBeforeGm(state, 'Look around');
    const encounterName =
      result.state.activeEncounter?.name ?? result.state.sceneFacts?.pendingEncounter?.name;
    expect(encounterName).toBeTruthy();
    expect(isCatalogFoeName(String(encounterName), 'litrpg')).toBe(true);
  });

  it('after lastKill, catalog does not re-offer that foe as living Talk', () => {
    const seed = selectCatalogEncounter(openedPact())!;
    const state = openedPact({
      turn: 12,
      activeEncounter: undefined,
      sceneFacts: {
        ...emptySceneFacts(12),
        present: [seed.foeName, 'Ilyra Fen'],
        lastKill: { name: seed.foeName, outcome: 'victory', turn: 11, remains: true },
      },
    });
    expect(isCatalogFoeTalkForbidden(state, seed.foeName)).toBe(true);
    expect(livingCatalogTalkTargets(state)).not.toContain(seed.foeName);
    const labels = compileGraphChoiceLabels(state);
    expect(labels.some((l) => /talk to/i.test(l) && l.toLowerCase().includes(seed.foeName.toLowerCase()))).toBe(
      false
    );
    expect(labels.some((l) => /loot|leave/i.test(l))).toBe(true);
  });
});

describe('Phase 3: Summoned Pact hubs / NPCs / quests', () => {
  it('seven new hubs exist and travel graph lists them after opening complete', () => {
    const hubs = hubsForBibleId('summoned-pact');
    for (const name of PHASE23_HUBS) {
      expect(hubs.some((h) => h.name === name)).toBe(true);
    }
    expect(SUMMONED_PACT_HUBS.length).toBeGreaterThanOrEqual(18);
    const quests = seedLocalStarterQuest([], summonedPact.starterQuests);
    const mire = SUMMONED_PACT_HUBS.find((h) => h.id === 'sp-hub-mireglass')!;
    const revealed = revealQuestsFromHubLinks(quests, mire.linkedQuestIds, mire.name);
    const state = openedPact({ currentLocation: 'West Wall', quests: revealed });
    const travel = enumerateLegalEdges(state).filter((e) => e.type === 'travel').map((e) => e.label);
    expect(travel.some((l) => l.includes('Mireglass March'))).toBe(true);
  });

  it('bible NPCs seed into registry + dormant memory without Title-Case soup', () => {
    const registered = getRegisteredNpcs('summoned-pact');
    expect(registered).toContain('Ilyra Fen');
    expect(registered).toContain('Yara Quill');
    expect(canHarvestAsNamedPerson('Ilyra Fen', 'summoned-pact')).toBe(true);
    expect(canHarvestAsNamedPerson('The Bell', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Mireglass March', 'summoned-pact')).toBe(false);
    const seeded = seedBibleNpcRoster(openedPact({ npcMemories: [] }), summonedPact);
    const ilyra = seeded.npcMemories?.find((m) => m.npcName === 'Ilyra Fen');
    expect(ilyra).toBeTruthy();
    expect(ilyra?.facts.some((f) => /Bible roster/i.test(f))).toBe(true);
    expect(hasMetBefore(seeded, 'Ilyra Fen')).toBe(false);
    const fromCampaign = seedStateFromCampaignBible(openedPact({ npcMemories: [], lorebook: [] }), summonedPact);
    expect(fromCampaign.npcMemories?.some((m) => m.npcName === 'Kessa Cinder')).toBe(true);
    expect(hasMetBefore(fromCampaign, 'Kessa Cinder')).toBe(false);
    expect(summonedPact.keyNPCs.filter((n) => n.id.startsWith('sp-npc-')).length).toBeGreaterThanOrEqual(30);
  });

  it('hub linkedQuestIds reveal journal-visible quests', () => {
    const quests = seedLocalStarterQuest([], summonedPact.starterQuests);
    const mire = SUMMONED_PACT_HUBS.find((h) => h.id === 'sp-hub-mireglass')!;
    expect(mire.linkedQuestIds?.length).toBeGreaterThan(0);
    const hidden = quests.find((q) => q.id === 'sp-quest-price-calling');
    expect(hidden?.revealed).toBe(false);
    const revealed = revealQuestsFromHubLinks(quests, mire.linkedQuestIds, mire.name);
    const shown = revealed.find((q) => q.id === 'sp-quest-price-calling');
    expect(shown?.revealed).toBe(true);
    expect(shown?.status).toBe('active');
    const journal = visibleJournalQuests(
      openedPact({
        quests: revealed,
        openingEstablishment: {
          pending: [],
          answers: { name: 'Jax' },
          complete: true,
          aloneArrival: false,
        },
      })
    );
    expect(journal.some((q) => q.id === 'sp-quest-price-calling')).toBe(true);
    expect(summonedPact.starterQuests.filter((q) => q.id.startsWith('sp-quest-')).length).toBeGreaterThanOrEqual(16);
  });
});

describe('12a first-meet still holds on roster seed', () => {
  it('first harvest of a seeded NPC is stranger; later meet is acquaintance', () => {
    const seeded = seedBibleNpcRoster(openedPact({ npcMemories: [], turn: 2 }), summonedPact);
    expect(hasMetBefore(seeded, 'Ilyra Fen')).toBe(false);
    const first = harvestNarrativeIntoLedger(
      { ...seeded, turn: 2 },
      'Ilyra Fen waits in the reeds. I am Ilyra Fen, and the water remembers.',
      2
    );
    const memory = first.npcMemories?.find((n) => n.npcName === 'Ilyra Fen');
    expect(hasMetBefore(first, 'Ilyra Fen')).toBe(true);
    expect(memory?.introSpoken).toBe(true);
    expect(memory?.meetCount).toBe(1);
    expect(memory?.relationshipStatus).toBe('stranger');
    const second = harvestNarrativeIntoLedger(
      { ...first, turn: 8 },
      'Ilyra Fen nods toward the March.',
      8
    );
    const again = second.npcMemories?.find((n) => n.npcName === 'Ilyra Fen');
    expect(again?.meetCount).toBe(2);
    expect(again?.relationshipStatus).toBe('acquaintance');
    const emptyFirst = upsertHarvestedNpcMemory([], 'Father Aldous', 2);
    expect(emptyFirst[0]?.relationshipStatus).toBe('stranger');
    expect(emptyFirst[0]?.meetCount).toBe(1);
  });
});
