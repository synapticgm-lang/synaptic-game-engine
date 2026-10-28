/**
 * T10AC — salt-road s8603: travel chips from recorded reachable places (no ghost place:),
 * arrival receipt names journey.from, typed "asking X if…" gets a spoken reply.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import {
  affordanceEntityPresent,
  collectSceneAffordances,
  recordedTravelDestinations,
} from './sceneAffordances';
import { chipProblem } from './chipLegality';
import { ensurePlaceOnMap, placeExitRows } from './placeRegistry';
import { emptySceneFacts } from './sceneFacts';
import { ensureSpokenAnswer } from './spokenAnswer';
import { commitTravel } from './travelJourney';
import { checkActionFollowed } from './turnCheck';

function waystation(over: Partial<GameState> = {}): GameState {
  let s = createInitialState(undefined, 'rpg', undefined, 't10ac-8603') as GameState;
  s.engineMode = 'rpg';
  s.campaignBibleId = 'salt-road-heist';
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'Salt Road Waystation';
  s.turn = 5;
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
  };
  s.sceneFacts = {
    ...emptySceneFacts(),
    crowd: 'sparse',
    present: ['Brannoc Rudd'],
    props: [],
    lastBeat: 'waystation',
    updatedTurn: 5,
    crowdCount: 1,
  };
  s.npcMemories = [
    {
      npcId: 'brannoc-rudd',
      npcName: 'Brannoc Rudd',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 4,
      present: true,
      location: 'Salt Road Waystation',
      introSpoken: true,
      completedTopics: ['intro'],
    },
  ];
  s.quests = [
    {
      id: 'salt-road-heist-quest-1',
      name: 'Case the Caravan',
      status: 'active',
      type: 'main',
      revealed: true,
      description: '',
      location: 'Consul Caravan Camp',
      objectives: [
        {
          id: 'case-1',
          description: 'Case the Consul caravan',
          completed: false,
          placeId: 'Consul Caravan Camp',
        },
      ],
    } as Quest,
  ];
  s = ensurePlaceOnMap(s, 'Salt Road Waystation');
  return { ...s, ...over };
}

describe('T10AC s8603 travel chips + Brannoc ask + arrival receipt', () => {
  it('a: Travel toward Consul is built from recorded exits; no place: ghost entityId', () => {
    const s = waystation();
    const dests = recordedTravelDestinations(s);
    expect(dests.some((r) => /Consul Caravan Camp/i.test(r.label))).toBe(true);
    expect(placeExitRows(s, 'Salt Road Waystation').some((r) => /Consul/i.test(r.label))).toBe(true);

    const travel = collectSceneAffordances(s).filter((a) => /^Travel toward /i.test(a.label));
    expect(travel.length).toBeGreaterThan(0);
    const consul = travel.find((a) => /Consul Caravan Camp/i.test(a.label));
    expect(consul).toBeTruthy();
    expect(consul!.entityId).not.toMatch(/^place:/);
    expect(consul!.actionId).toMatch(/^exit:/);
    expect(affordanceEntityPresent(s, consul!.entityId)).toBe(true);
    expect(chipProblem(s, consul!.label)?.kind).not.toBe('ghost-chip');

    for (const chip of travel) {
      expect(affordanceEntityPresent(s, chip.entityId)).toBe(true);
      expect(chipProblem(s, chip.label)?.kind).not.toBe('ghost-chip');
    }
  });

  it('a: chip builder and ghost gate read the same recordedTravelDestinations list', () => {
    const s = waystation();
    const destLabels = new Set(
      recordedTravelDestinations(s).map((r) => r.label.trim().toLowerCase()),
    );
    for (const a of collectSceneAffordances(s)) {
      if (a.slotKind !== 'exit' || !/^Travel toward /i.test(a.label)) continue;
      const dest = a.label.replace(/^Travel toward\s+/i, '').trim().toLowerCase();
      expect(destLabels.has(dest)).toBe(true);
      expect(affordanceEntityPresent(s, a.entityId)).toBe(true);
    }
  });

  it('b: multi-leg arrival STATUS names journey.from, not the ground label', () => {
    let s = waystation({
      currentLocation: 'Consul Caravan Camp',
      turn: 2,
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Vessa'],
        crowd: 'sparse',
        noise: 'quiet',
        props: [],
        lastBeat: '',
        updatedTurn: 2,
      },
    });
    s = ensurePlaceOnMap(s, 'Consul Caravan Camp');
    const first = commitTravel(s, 'Travel toward Salt Road Waystation');
    expect(first.underway || first.arrived).toBe(true);
    if (first.arrived) {
      expect(first.receipt ?? '').toMatch(/Consul Caravan Camp/);
      expect(first.receipt ?? '').not.toMatch(/^Travel: back streets to /i);
      return;
    }
    expect(first.state.journey?.from).toMatch(/Consul Caravan Camp/i);
    expect(first.state.journey?.to).toMatch(/Salt Road Waystation/i);
    const second = commitTravel(first.state, 'Walk on');
    expect(second.arrived).toBe(true);
    expect(second.receipt ?? '').toMatch(/Consul Caravan Camp/);
    expect(second.receipt ?? '').toMatch(/Salt Road Waystation/);
    expect(second.receipt ?? '').not.toMatch(/^Travel: back streets to /i);
  });

  it('c: asking Brannoc if… lands a quoted answer (not said nothing)', () => {
    const state = waystation();
    const ask =
      "I lean against the counter and tap my fingers, asking Brannoc if he's seen any new shipments of water skins lately.";
    const draft =
      'Jax leaned back against the counter at Salt Road Waystation and tapped their fingers on the worn wood.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/Brannoc Rudd said,\s*"/i);
    expect(out.prose).not.toMatch(/said nothing/i);
    const check = checkActionFollowed(state, state, ask, out.prose);
    expect(check.p0.some((f) => f.kind === 'ignored-action')).toBe(false);
  });

  it('c: ask Brannoc who is playing games with the board also answers', () => {
    const state = waystation({ turn: 8 });
    const ask =
      "I spin a copper coin across my knuckles and ask Brannoc if he knows who's been playing games with the inventory board.";
    const draft =
      'Jax rolled a copper coin back and forth across their knuckles, then turned their eyes up to face the man across the counter.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/Brannoc Rudd said,\s*"/i);
    expect(out.prose).not.toMatch(/said nothing|No one at the counter answered/i);
  });
});
