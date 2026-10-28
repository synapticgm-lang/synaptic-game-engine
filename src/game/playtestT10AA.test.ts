/**
 * T10AA — salt-road s9401: typed asks to road companions (Hale/Wenna) get answers;
 * Edda Ask/Press/Call loop yields to a quest outcome or travel, not a non-outcome repeat.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { collectSceneAffordances, stampRecentOfferedActions } from './sceneAffordances';
import { applyStoryRpgTurn } from './storyRpgProgress';
import { openRouteView, presentPersonForRoute } from './questRoutes';
import { emptySceneFacts } from './sceneFacts';
import { checkActionFollowed } from './turnCheck';

function rpgRoad(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg', undefined, 't10aa-9401') as GameState;
  s.engineMode = 'rpg';
  s.campaignBibleId = 'salt-road-heist';
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'On the road between places';
  s.turn = 5;
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
    pickedHook: 'Location: Safehouse Alley\nWho is here: the muscle\nWhy: the dry-run went loud\n',
    card: {
      place: 'Safehouse Alley',
      cast: 'the muscle',
      castNames: ['the muscle'],
      props: [],
      names: [],
    },
  };
  s.sceneFacts = {
    ...emptySceneFacts(),
    crowd: 'none',
    present: ['Hale Merrow'],
    props: [],
    lastBeat: 'road',
    updatedTurn: 5,
    crowdCount: 1,
  };
  s.npcMemories = [
    {
      npcId: 'hale-merrow',
      npcName: 'Hale Merrow',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 3,
      location: 'On the road between places',
      introSpoken: true,
      completedTopics: ['intro'],
    },
  ];
  return { ...s, ...over };
}

function checkpointQuest(): Quest {
  return {
    id: 'sr-spine-loud-rehearsal',
    name: 'The Botched Dry-Run',
    status: 'active',
    type: 'main',
    revealed: true,
    description: '',
    objectives: [
      {
        id: 'sr-spine-loud-rehearsal-obj-1',
        description:
          'Talk down the angry locals at the front door without letting them see the smoke in the parlor.',
        completed: false,
        placeId: 'Front Door of the Safehouse',
        routes: [
          {
            id: 'sr-spine-loud-rehearsal-s1-person',
            kind: 'person',
            label: 'Ask a witness who knows the lead about the lead',
            entityId: 'npc:a witness who knows the lead',
          },
          {
            id: 'sr-spine-loud-rehearsal-s1-place',
            kind: 'place',
            label: 'Search Front Door of the Safehouse for signs',
            entityId: 'place:Front Door of the Safehouse',
            placeId: 'Front Door of the Safehouse',
            failed: true,
          },
          {
            id: 'sr-spine-loud-rehearsal-s1-contact',
            kind: 'contact',
            label: 'Call on a standing contact for the lead',
            entityId: 'contact:sr-spine-loud-rehearsal-s1',
            failed: true,
          },
        ],
      },
    ],
  } as Quest;
}

function checkpoint(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg', undefined, 't10aa-edda') as GameState;
  s.engineMode = 'rpg';
  s.campaignBibleId = 'salt-road-heist';
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'Checkpoint Rise';
  s.turn = 96;
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
  };
  s.quests = [checkpointQuest()];
  s.sceneFacts = {
    ...emptySceneFacts(),
    crowd: 'present',
    present: ['Edda Tew'],
    props: [],
    lastBeat: 'checkpoint',
    updatedTurn: 96,
    crowdCount: 1,
  };
  s.npcMemories = [
    {
      npcId: 'edda-tew',
      npcName: 'Edda Tew',
      disposition: 'unknown',
      facts: [],
      lastSeenTurn: 80,
      location: 'Checkpoint Rise',
      introSpoken: true,
      completedTopics: ['intro'],
      sheet: { job: 'witness', motive: 'Tell the truth safely', fear: '', speech: '', secret: '', place: 'town' },
      goal: { motivation: 'Knowledge', target: 'what they saw' },
      need: 'to be believed',
      offer: 'their testimony',
      roleHint: 'witness',
    },
  ];
  return { ...s, ...over };
}

describe('T10AA salt-road s9401 Hale answers + Edda loop', () => {
  it('a. T5/T8: kick/ask and shout at Hale land a quoted answer (not said nothing / ignored-action)', () => {
    const state = rpgRoad();
    const ask =
      "I kick a loose stone into the ditch and ask Hale if he's ready to keep moving.";
    const shout =
      'I kick the puddle to scatter the ripples and shout at Hale to keep his eyes peeled for anything that looks like trouble.';

    const asked = ensureSpokenAnswer(
      'Jax kicked a loose stone off the road and watched it hop into the ditch.',
      state,
      ask,
    );
    expect(asked.answer.status).toBe('added');
    expect(asked.prose).toMatch(/Hale Merrow said,\s*"/i);
    expect(asked.prose).not.toMatch(/said nothing/i);
    const askCheck = checkActionFollowed(state, state, ask, asked.prose);
    expect(askCheck.p0.some((f) => f.kind === 'ignored-action')).toBe(false);

    const shouted = ensureSpokenAnswer(
      'Jax kicked the puddle on the back streets, and the brown water jumped.',
      state,
      shout,
    );
    expect(shouted.answer.status).toBe('added');
    expect(shouted.prose).toMatch(/Hale Merrow said,\s*"/i);
    expect(shouted.prose).not.toMatch(/said nothing/i);
  });

  it('a. T19: tell Hale while Wenna is present answers Hale, not a silent page', () => {
    const state = rpgRoad({
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Hale Merrow', 'Wenna Barrow'],
        crowd: 'none',
        props: [],
        lastBeat: 'road',
        updatedTurn: 19,
        crowdCount: 2,
      },
      npcMemories: [
        {
          npcId: 'hale-merrow',
          npcName: 'Hale Merrow',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 3,
          location: 'On the road between places',
          introSpoken: true,
          completedTopics: ['intro'],
        },
        {
          npcId: 'wenna-barrow',
          npcName: 'Wenna Barrow',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 18,
          location: 'On the road between places',
          introSpoken: true,
          completedTopics: ['intro'],
        },
      ],
      turn: 19,
    });
    const line =
      "I grab Wenna's arm to stop her from collapsing and tell Hale to hold position while I check her wound.";
    const out = ensureSpokenAnswer(
      'Jax caught Wenna Barrow by the arm before her knees could fold.',
      state,
      line,
    );
    expect(out.answer.status).toBe('added');
    if (out.answer.status === 'added') expect(out.answer.speaker).toMatch(/Hale/i);
    expect(out.prose).toMatch(/Hale Merrow said,\s*"/i);
  });

  it('b. failed place/contact routes are not re-offered; person route binds Edda; Ask ticks the step', () => {
    const state = checkpoint();
    const personRoute = state.quests?.[0]?.objectives?.[0]?.routes?.[0];
    expect(personRoute).toBeTruthy();
    const bound = presentPersonForRoute(state, personRoute!);
    expect(bound?.name).toBe('Edda Tew');

    const labels = collectSceneAffordances(state).map((a) => a.label);
    expect(labels.some((l) => /Search Front Door of the Safehouse for signs/i.test(l))).toBe(false);
    expect(labels.some((l) => /Call on a standing contact for the lead/i.test(l))).toBe(false);
    expect(labels.some((l) => /Ask Edda Tew about the lead/i.test(l))).toBe(true);
    expect(labels.some((l) => /Travel toward Front Door of the Safehouse/i.test(l))).toBe(true);

    const open = openRouteView(state, 'Ask Edda Tew about what they saw');
    expect(open?.routeByLabel?.kind).toBe('person');
    const hit = applyStoryRpgTurn(state, 'Ask Edda Tew about what they saw');
    expect(hit.receipts.some((r) => /Quest stage/i.test(r))).toBe(true);
    expect(hit.state.quests?.[0]?.objectives?.[0]?.completed).toBe(true);
  });

  it('b. after Ask-about is picked once in-scene, the same non-outcome chip is not re-offered', () => {
    let state = checkpoint();
    const agendaId = 'person:edda-tew:agenda';
    const before = collectSceneAffordances(state).map((a) => a.actionId);
    expect(before).toContain(agendaId);

    state = stampRecentOfferedActions(
      state,
      collectSceneAffordances(state).map((a) => a.actionId),
      agendaId,
    );
    state = { ...state, turn: (state.turn ?? 96) + 1 };
    const after = collectSceneAffordances(state).map((a) => a.actionId);
    expect(after).not.toContain(agendaId);
    expect(collectSceneAffordances(state).some((a) => /Travel toward Front Door/i.test(a.label))).toBe(true);
  });
});
