/**
 * q38-G1a — TT-G1 + OPT-4 schema and runtime (acceptance from acceptance-tests-new-orders.md).
 * G1b owns the full bible data pass; this file covers schema/runtime + validator shape.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { enrichQuestJournalFields } from './questJournalEnrich';
import {
  applyQuestRouteOutcome,
  openRouteView,
  placeIdForStep,
  validateQuestStepRoutes,
} from './questRoutes';
import { collectSceneAffordances } from './sceneAffordances';
import { applyStoryRpgTurn, placeForStep, storyRpgDecisionChip } from './storyRpgProgress';
import { buildInfoSheet } from './infoSheet';
import type { GameState, Quest, QuestObjective, QuestRoute } from './types';

const APPROACH_ROUTES: QuestRoute[] = [
  { id: 'r-person', kind: 'person', label: 'Ask Vessa which approach fits the crew', entityId: 'npc:Vessa' },
  {
    id: 'r-place',
    kind: 'place',
    label: 'Scout the caravan camp fence line',
    entityId: 'place:camp',
    placeId: 'Consul Caravan Camp',
  },
  { id: 'r-contact', kind: 'contact', label: 'Call on a standing contact for the approach', entityId: 'contact:favor' },
];

function saltBase(): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn: 5,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    currentLocation: 'Waystation',
    places: [{ name: 'Waystation' }, { name: 'Consul Caravan Camp' }, { name: "Olenna's Warehouse" }],
    npcMemories: [],
  } as unknown as GameState;
}

function approachQuest(routes = APPROACH_ROUTES): Quest {
  return {
    id: 'salt-road-heist-quest-1',
    name: 'Case the Caravan',
    description: 'Case it.',
    status: 'active',
    revealed: true,
    type: 'main',
    objectives: [
      { id: 'o0', description: 'Scout the caravan', completed: true, placeId: 'Consul Caravan Camp' },
      {
        id: 'o1',
        description: 'Pick an approach',
        completed: false,
        placeId: null,
        routes,
      },
      { id: 'o2', description: 'Commit to the heist night', completed: false, placeId: null },
    ],
  } as Quest;
}

describe('q38-G1a TT-G1 + OPT-4', () => {
  it('G1-1 / OPT4-1: validator fails a step with fewer than three routes (all modes; never PYOA)', () => {
    const thin: QuestObjective = {
      id: 'thin',
      description: 'Find the key',
      completed: false,
      routes: [{ id: 'a', kind: 'person', label: 'Ask the clerk' }],
    };
    expect(validateQuestStepRoutes(thin, 'dnd').length).toBeGreaterThan(0);
    expect(validateQuestStepRoutes(thin, 'litrpg').length).toBeGreaterThan(0);
    expect(validateQuestStepRoutes(thin, 'rpg').length).toBeGreaterThan(0);
    expect(validateQuestStepRoutes(thin, 'pyoa')).toEqual([]);

    const okTt: QuestObjective = {
      id: 'ok',
      description: 'Find the key',
      completed: false,
      placeId: 'Keep Gate',
      routes: [
        { id: 'p', kind: 'person', label: 'Ask Oskar' },
        { id: 'o', kind: 'object', label: 'Search the gate latch' },
        { id: 'c', kind: 'study', label: 'Study the chain marks' },
      ],
    };
    expect(validateQuestStepRoutes(okTt, 'dnd')).toEqual([]);
    expect(validateQuestStepRoutes(okTt, 'litrpg').some((e) => /mode third/.test(e))).toBe(true);

    const okLit: QuestObjective = {
      ...okTt,
      routes: [
        { id: 'p', kind: 'person', label: 'Ask the handler' },
        { id: 'o', kind: 'place', label: 'Check the panel alcove' },
        { id: 's', kind: 'system', label: 'Ping the System for the Mark trail' },
      ],
    };
    expect(validateQuestStepRoutes(okLit, 'litrpg')).toEqual([]);
  });

  it('G1-2: fail person and check routes; object route still reveals; siblings remain after failure', () => {
    const routes: QuestRoute[] = [
      { id: 'npc', kind: 'person', label: 'Ask Helga about the latch' },
      { id: 'obj', kind: 'object', label: 'Inspect the overturned basket' },
      { id: 'chk', kind: 'check', label: 'Investigate the gate chain' },
    ];
    const quest: Quest = {
      id: 'plea',
      name: "The Woodcutter's Plea",
      description: 'Find Lina.',
      status: 'active',
      revealed: true,
      type: 'main',
      objectives: [{ id: 's1', description: 'Learn where Lina went', completed: false, placeId: 'Keep Gate', routes }],
    } as Quest;
    let state: GameState = {
      ...saltBase(),
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      quests: [quest],
    };

    state = applyQuestRouteOutcome(state, 'npc', 'failure').state;
    state = applyQuestRouteOutcome(state, 'chk', 'failure').state;
    const afterFail = state.quests![0]!.objectives![0]!.routes!;
    expect(afterFail.find((r) => r.id === 'npc')!.failed).toBe(true);
    expect(afterFail.find((r) => r.id === 'chk')!.failed).toBe(true);
    expect(afterFail.find((r) => r.id === 'obj')!.revealed).toBeFalsy();
    expect(afterFail.length).toBe(3);

    const win = applyQuestRouteOutcome(state, 'obj', 'success');
    expect(win.state.quests![0]!.objectives![0]!.completed).toBe(true);
    expect(win.receipts.join('\n')).toMatch(/Inspect the overturned basket/);
    expect(win.state.quests![0]!.objectives![0]!.routes!.find((r) => r.id === 'npc')!.failed).toBe(true);
  });

  it('G1-3: journal lists open leads matching the engine routes', () => {
    const q = approachQuest();
    const enriched = enrichQuestJournalFields(q);
    expect(enriched.openLeads).toEqual([
      'Ask Vessa which approach fits the crew',
      'Scout the caravan camp fence line',
      'Call on a standing contact for the approach',
    ]);
  });

  it('OPT4-2: salt-road Pick an approach with no Friendly contact offers approach routes; pick ticks on outcome', () => {
    const s = { ...saltBase(), quests: [approachQuest()] } as GameState;
    expect(storyRpgDecisionChip(s)).toBeNull();
    const view = openRouteView(s)!;
    const labels = view.rows.map((r) => r.label);
    expect(labels).toContain('Ask Vessa which approach fits the crew');
    expect(labels).toContain('Scout the caravan camp fence line');
    expect(labels).toContain('Call on a standing contact for the approach');

    const chips = collectSceneAffordances(s).filter((a) => a.slotKind === 'quest').map((a) => a.label);
    expect(chips).toEqual(expect.arrayContaining(labels));

    // Contact route fails with nobody Friendly here; siblings stay.
    const miss = applyStoryRpgTurn(s, 'Call on a standing contact for the approach');
    expect(miss.state.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(miss.state.quests![0]!.objectives![1]!.routes!.find((r) => r.id === 'r-contact')!.failed).toBe(true);
    expect(miss.state.quests![0]!.objectives![1]!.routes!.length).toBe(3);

    // Person approach succeeds as engine outcome → step ticks.
    const hit = applyStoryRpgTurn(miss.state, 'Ask Vessa which approach fits the crew');
    expect(hit.state.quests![0]!.objectives![1]!.completed).toBe(true);
    expect(hit.receipts.join('\n')).toMatch(/Ask Vessa/);
  });

  it('OPT4-3: placeForStep word match and STEP_STOP are gone; placeId is explicit or none', () => {
    const s = saltBase();
    // Legacy description string never word-matches a place.
    expect(placeForStep(s, 'Scout the caravan at Consul Caravan Camp')).toBeNull();
    expect(placeIdForStep({ placeId: 'Consul Caravan Camp' })).toBe('Consul Caravan Camp');
    expect(placeIdForStep({ placeId: null })).toBeNull();
    expect(placeIdForStep({ place: 'Waystation' })).toBe('Waystation');
    expect(placeForStep(s, { id: 'x', description: 'Scout', completed: false, placeId: 'Consul Caravan Camp' })).toBe(
      'Consul Caravan Camp',
    );
  });

  it('writer packet remaining routes are facts', () => {
    const s = { ...saltBase(), quests: [approachQuest()] } as GameState;
    const facts = openRouteView(s)?.facts ?? [];
    expect(facts[0]).toMatch(/Open leads \(Case the Caravan\)/);
    expect(facts[0]).toMatch(/Ask Vessa/);
    const sheet = buildInfoSheet(s);
    const open = sheet.open?.join('\n') ?? '';
    expect(open).toMatch(/Open leads/);
  });
});
