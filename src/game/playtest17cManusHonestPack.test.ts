/**
 * Batch 17c — Manus leftover onto live owners.
 * Catalog extras, bible roster/quests, topic banks. No new FSM / DialogueTree / SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { cursedKeep } from '@/data/campaigns/cursedKeep';
import { thornferryRoad } from '@/data/campaigns/thornferryRoad';
import { saltRoadHeist } from '@/data/campaigns/premades';
import { shatteredCoast } from '@/data/campaigns/shatteredCoast';
import {
  allCatalogEncounters,
  DND_ENCOUNTERS,
  LITRPG_ENCOUNTERS,
  PYOA_ENCOUNTERS,
  RPG_ENCOUNTERS,
} from '@/data/encounters';
import { selectCatalogEncounter } from './encounterBible';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { seedBibleNpcRoster } from './npcMemory';
import { pickAuthoredTopicLine } from './manusTopicBanks';
import { legalAddresseeFact, spokenTalkFallback } from './talkEnvelope';
import { SUMMONED_PACT_HUBS, CURSED_KEEP_HUBS, SALT_ROAD_HUBS } from './outdoorHubs';
import { revealQuestsFromBanks, seedLocalStarterQuest, syncQuestsFromPlay } from './questPlay';
import type { GameState } from './types';

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
      sceneWritten: true,
      aloneArrival: false,
    },
    character: { ...state.character, name: 'Jax' },
    sceneFacts: emptySceneFacts(8),
    ...partial,
  };
}

describe('playtest17c — Manus honest leftover', () => {
  it('HUD/BUILD are 17c, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-17i');
    expect(BUILD_STAMP).toBe('2026-09-17i');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('catalog extras are unique named foes on the live seed owner', () => {
    const all = allCatalogEncounters();
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LITRPG_ENCOUNTERS.some((s) => s.id === 'LITRPG-TRASH-017' && s.foeName === 'Ashknife Cell-Blade')).toBe(true);
    expect(DND_ENCOUNTERS.some((s) => s.foeName === 'Hollow Castellan')).toBe(true);
    expect(RPG_ENCOUNTERS.some((s) => s.foeName === 'Black Ledger Knife')).toBe(true);
    expect(PYOA_ENCOUNTERS.some((s) => s.id === 'PYOA-CRISIS-014')).toBe(true);
    expect(all.every((s) => s.foeName && s.premise)).toBe(true);
    expect(selectCatalogEncounter(openedPact())?.foeName).toBeTruthy();
    expect(selectCatalogEncounter(openedPact())?.mode).toBe('litrpg');
  });

  it('roster extras harvest as named people; generic archetypes stay out', () => {
    expect(summonedPact.keyNPCs.some((n) => n.id === 'sp-npc-35' && n.name === 'Harker Vale')).toBe(true);
    expect(cursedKeep.keyNPCs.some((n) => n.name === 'Dain Holt')).toBe(true);
    expect(thornferryRoad.keyNPCs.some((n) => n.name === 'Tomas Reed')).toBe(true);
    expect(saltRoadHeist.keyNPCs.some((n) => n.name === 'Yara Flint')).toBe(true);
    expect(shatteredCoast.keyNPCs.some((n) => n.name === 'Nessa Crow')).toBe(true);
    expect(canHarvestAsNamedPerson('Harker Vale', 'summoned-pact')).toBe(true);
    expect(canHarvestAsNamedPerson('Dain Holt', 'cursed-keep')).toBe(true);
    expect(canHarvestAsNamedPerson('The Fallen Noble', 'summoned-pact')).toBe(false);
    expect(cursedKeep.keyNPCs.some((n) => n.name === 'Mira Voss')).toBe(false);
    expect(cursedKeep.keyNPCs.some((n) => n.name === 'Mira the Apothecary' || n.name === 'Mira')).toBe(true);
  });

  it('Wren topic bank is Thornferry charter, not Greyhollow', () => {
    const line = pickAuthoredTopicLine('Wren Holt', 'Who are you');
    expect(line).toMatch(/Millstone Charter|Walk the road/i);
    expect(line).not.toMatch(/Greyhollow/i);
    const mira = pickAuthoredTopicLine('Mira', 'Who are you');
    expect(mira).toMatch(/remedies|journals/i);
    expect(mira).not.toMatch(/Mira Voss/i);
  });

  it('roster seed writes merchant stock + authored line without introSpoken', () => {
    const seeded = seedBibleNpcRoster(openedPact({ npcMemories: [] }), summonedPact);
    const fenn = seeded.npcMemories?.find((m) => /fenn lark/i.test(m.npcName));
    expect(fenn).toBeTruthy();
    expect(fenn?.introSpoken).toBeFalsy();
    expect(fenn?.facts.join(' ')).toMatch(/Health Tonic|Authored line|Bible roster/i);
  });

  it('talk leftover uses authored Wren line when CAST is Wren', () => {
    const state = openedPact({
      campaignBibleId: 'thornferry-road',
      engineMode: 'pyoa',
      currentLocation: 'the mill landing at Thornferry',
      sceneFacts: { ...emptySceneFacts(4), present: ['Wren Holt'] },
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax', where: 'the mill landing at Thornferry' },
        complete: true,
        sceneWritten: true,
        pickedHook: 'Who is here: Wren Holt waits with a sealed charter',
        pickedHookFallback: 'Wren Holt stands at the dock with a sealed charter.',
      },
    });
    const fact = legalAddresseeFact(state, 'Ask about this place');
    expect(fact.length).toBeGreaterThan(8);
    const spoken = spokenTalkFallback(state, 'Who are you');
    expect(spoken).toMatch(/Wren|charter|mill/i);
    expect(spoken).not.toMatch(/Greyhollow/i);
  });

  it('side quests seed hidden and hubs link leftover ids', () => {
    const quests = seedLocalStarterQuest([], summonedPact.starterQuests);
    expect(quests.some((q) => q.id === 'sp-quest-harbor-harker')).toBe(true);
    expect(quests.find((q) => q.id === 'sp-quest-harbor-harker')?.status ?? 'hidden').not.toBe('active');
    expect(SUMMONED_PACT_HUBS.find((h) => h.id === 'sp-hub-harbor')?.linkedQuestIds).toContain('sp-quest-harbor-harker');
    expect(CURSED_KEEP_HUBS.find((h) => h.id === 'ck-hub-gate')?.linkedQuestIds).toContain('ck-quest-dain-watch');
    expect(SALT_ROAD_HUBS.find((h) => h.id === 'sr-hub-waystation')?.linkedQuestIds).toContain('sr-quest-yara-page');
  });

  it('Thornferry leftover sides reveal from HERE / CAST, not hubs', () => {
    const seeded = seedLocalStarterQuest([], thornferryRoad.starterQuests);
    expect(seeded.find((q) => q.id === 'tf-quest-1')?.type ?? 'main').toBe('main');
    expect(seeded.find((q) => q.id === 'tf-quest-ferry-debt')?.type).toBe('side');
    expect(seeded.find((q) => q.id === 'tf-quest-clerk-copy')?.status).toBe('hidden');
    const locked = syncQuestsFromPlay(seeded, [], 'the mill landing at Thornferry', { locked: true });
    expect(locked.find((q) => q.id === 'tf-quest-ferry-debt')?.revealed).toBeFalsy();
    const here = revealQuestsFromBanks(seeded, 'the mill landing at Thornferry');
    expect(here.find((q) => q.id === 'tf-quest-ferry-debt')?.revealed).toBe(true);
    expect(here.find((q) => q.id === 'tf-quest-ferry-debt')?.status).toBe('active');
    const clerk = revealQuestsFromBanks(seeded, 'Orin Quill offers a duplicate seal');
    expect(clerk.find((q) => q.id === 'tf-quest-clerk-copy')?.revealed).toBe(true);
    expect(clerk.find((q) => q.id === 'tf-quest-1')?.revealed).toBeFalsy();
  });
});
