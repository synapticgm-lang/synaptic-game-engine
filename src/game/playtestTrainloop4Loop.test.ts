/**
 * TRAINLOOP4 A — Story RPG twin-lanterns s8113 LOOP STOP: dead Answer / Honour chips
 * with no forward Leave after director npc-act + empty speakable.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { compileChoices } from './choiceCompiler';
import { applyDirectorChipPolicy, planDirector } from './director';
import { collectOpenThreads, forwardThreadAffordance } from './openThreads';
import { peopleHere } from './scenePresence';
import type { GameState, Quest } from './types';

function twinLanternsStall(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  const quest: Quest = {
    id: 'gen-ds-trouble-6',
    name: "Ashin of Redwick's favour",
    description: 'Someone is captured',
    status: 'active',
    type: 'side',
    giver: 'Ashin of Redwick',
    location: 'Twin Lanterns stable',
    leadsTo: 'Twin Lanterns stable',
    revealed: true,
    objectives: [
      {
        id: 'gen-ds-trouble-6-obj-1',
        description: 'Learn where the Someone is captured threatens Twin Lanterns stable',
        completed: true,
        placeId: 'Twin Lanterns stable',
      },
      {
        id: 'gen-ds-trouble-6-obj-2',
        description: 'Confront the Someone is captured',
        completed: false,
        placeId: 'Twin Lanterns stable',
        routes: [
          {
            id: 'gen-ds-trouble-6-s2-person',
            kind: 'person',
            label: 'Ask Ashin of Redwick about the lead',
            entityId: 'npc:Ashin of Redwick',
          },
          {
            id: 'gen-ds-trouble-6-s2-place',
            kind: 'place',
            label: 'Search Twin Lanterns stable for signs',
            entityId: 'place:Twin Lanterns stable',
            placeId: 'Twin Lanterns stable',
          },
          {
            id: 'gen-ds-trouble-6-s2-contact',
            kind: 'contact',
            label: 'Call on Ashin of Redwick for the approach',
            entityId: 'contact:Ashin of Redwick',
            failed: true,
          },
        ],
      },
    ],
  };
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'twin-lanterns',
    seed: '8113',
    turn: 14,
    currentLocation: 'Twin Lanterns stable',
    places: [
      { id: 'place_lowgate', name: 'Lowgate', regionId: 'tl' },
      { id: 'place_yard', name: 'Twin Lanterns yard', regionId: 'tl' },
      {
        id: 'place_stable',
        name: 'Twin Lanterns stable',
        regionId: 'tl',
        lastVisitedTurn: 14,
        exits: ['Twin Lanterns yard', 'Lowgate'],
      },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    character: { ...s.character, name: 'Jax', hp: 26, maxHp: 26 },
    quests: [quest],
    commitments: [
      {
        promiseId: 'quest:gen-ds-trouble-6',
        madeTurn: 7,
        description: "Ashin of Redwick's favour",
        status: 'open',
        trustDeltaOnKeep: 5,
        trustDeltaOnBreak: -8,
        beneficiaries: ['Ashin of Redwick'],
        witnesses: [],
        kind: 'promise',
        by: 'player',
        to: 'Ashin of Redwick',
        condition: { type: 'quest-complete', questId: 'gen-ds-trouble-6' },
      },
    ],
    npcMemories: [
      {
        npcId: 'twin-lanterns-npc-1',
        npcName: 'Ashin of Redwick',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 12,
        present: false,
        shouldExit: true,
        exitReason: 'stall-pressure',
        location: 'Twin Lanterns stable',
        goal: { motivation: 'Reputation', target: 'outranking the player' },
      },
    ],
    sceneFacts: {
      ...emptySceneFacts(14),
      present: [],
      crowd: 'sparse',
      crowdCount: 1,
      lastKill: { name: 'Brine Scout', outcome: 'victory', turn: 6, remains: true },
    },
    openThreads: [
      {
        id: 'promise:quest:gen-ds-trouble-6',
        kind: 'promise',
        label: "Ashin of Redwick's favour",
        entityId: 'promise:quest:gen-ds-trouble-6',
        placeId: null,
        lastSeenTurn: 14,
        resolution: { type: 'commitment-kept', promiseId: 'quest:gen-ds-trouble-6' },
      },
    ],
    sceneThreadPlan: {
      forwardIds: ['promise:quest:gen-ds-trouble-6'],
      stallKind: 'thread',
      plannedTurn: 14,
    },
    directorPlan: {
      need: 'npc-act',
      development: {
        kind: 'npc-acting',
        fact: "Must narrate: Ashin of Redwick arrives and presses their agenda: Ashin of Redwick's favour.",
        npcId: 'twin-lanterns-npc-1',
        placeId: 'Twin Lanterns stable',
        questId: 'gen-ds-trouble-6',
      },
      chips: [
        { label: 'Answer Ashin of Redwick', reason: 'director-npc-act' },
        { label: "Follow up: Ashin of Redwick's favour", reason: 'director-thread' },
      ],
      turn: 14,
    },
    ...over,
  } as GameState;
}

describe('TRAINLOOP4 A — twin-lanterns s8113 dead social loop', () => {
  it('does not inject Answer when the named NPC is not speakable here', () => {
    const state = twinLanternsStall();
    expect(peopleHere(state)).toEqual([]);
    const pad = applyDirectorChipPolicy(state, [
      'Inspect the immediate surroundings',
      'Say something…',
      'Do something else…',
    ]);
    expect(
      pad.some((c) => /^Answer Ashin/i.test(c)),
      `twin-lanterns:Twin Lanterns stable: director injected Answer pad=[${pad.join(' | ')}]`,
    ).toBe(false);
  });

  it('compileChoices always keeps a Leave/Travel forward chip; never only dead Answer/Honour', () => {
    const state = twinLanternsStall();
    const compiled = compileChoices(
      state,
      [
        'Answer Ashin of Redwick',
        "Honour the promise: Ashin of Redwick's favour",
        'Inspect the immediate surroundings',
        'Say something…',
        'Do something else…',
      ],
      undefined,
      'Answer Ashin of Redwick',
    );
    const labels = compiled.choices;
    expect(
      labels.some((c) => /^Leave(?:\s+the\s+scene)?\b/i.test(c) || /^Travel\b/i.test(c) || /^Walk\b/i.test(c)),
      `twin-lanterns:Twin Lanterns stable: no forward move chips=[${labels.join(' | ')}]`,
    ).toBe(true);
    expect(
      labels.some((c) => /^Answer Ashin/i.test(c)),
      `twin-lanterns:Twin Lanterns stable: dead Answer stayed chips=[${labels.join(' | ')}]`,
    ).toBe(false);
  });

  it('quest-complete promise threads do not offer a no-op Honour the promise chip', () => {
    const state = twinLanternsStall();
    const threads = collectOpenThreads(state);
    expect(threads.some((t) => t.kind === 'promise')).toBe(true);
    const chip = forwardThreadAffordance(state);
    expect(
      chip && /^Honour the promise\b/i.test(chip.label),
      `twin-lanterns:promise: Honour chip must not be offered when only quest-complete can keep it chip=${chip?.label ?? 'null'} id=${chip?.actionId ?? ''}`,
    ).toBe(false);
  });

  it('forced npc-act development does not depart the stall actor before Answer could land', () => {
    let state = twinLanternsStall({
      sceneFacts: {
        ...emptySceneFacts(14),
        present: ['a witness who knows the lead'],
        crowd: 'sparse',
        crowdCount: 1,
      },
      npcMemories: [
        {
          npcId: 'twin-lanterns-npc-1',
          npcName: 'Ashin of Redwick',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 12,
          present: false,
          location: 'Twin Lanterns stable',
          goal: { motivation: 'Reputation', target: 'outranking the player' },
        },
        {
          npcId: 'person:a-witness-who-knows-the-lead',
          npcName: 'a witness who knows the lead',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 10,
          present: true,
          location: 'Twin Lanterns stable',
        },
      ],
      directorPlan: undefined,
      openThreads: [
        {
          id: 'quest:gen-ds-trouble-6',
          kind: 'quest',
          label: "Ashin of Redwick's favour",
          entityId: 'quest:gen-ds-trouble-6',
          placeId: 'Twin Lanterns stable',
          lastSeenTurn: 12,
          resolution: { type: 'quest-complete', questId: 'gen-ds-trouble-6' },
        },
      ],
      sceneThreadPlan: undefined,
      progressGovernor: {
        lastProgressTurn: 8,
        recentDeltas: [],
        turnsSinceProgress: 5,
      },
    });
    const planned = planDirector(state);
    state = planned.state;
    const ashinHere = peopleHere(state).some((n) => /ashin/i.test(n));
    if (planned.plan.need === 'npc-act') {
      expect(
        ashinHere,
        `twin-lanterns: npc-act seated Ashin then departed them present=[${peopleHere(state).join(',')}]`,
      ).toBe(true);
    }
  });
});
