/**
 * T10AR — RPG s9601 T157–T165: Waystation ↔ Caravan Camp ping-pong LOOP STOP,
 * Search re-offer after found-nothing, Vessa "buyer who pays" on a twig snap,
 * arrival pages that say nothing changed.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { emptySceneFacts } from './sceneFacts';
import { collectSceneAffordances, applyOptionCooldown } from './sceneAffordances';
import { recordEmptySearch, normalizeSearchTarget } from './searchContinuity';
import { ensureSpokenAnswer } from './spokenAnswer';
import { movementFact } from './completedEventPacket';
import { chipProgressScore, movedOn, turnProgress } from './choiceRanking';
import { stallPressureActive, STALL_N } from './openThreads';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    introSpoken: true,
    ...over,
  } as NpcMemory;
}

function waystation(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...s.character, name: 'Jax', origin: 'criminal' },
    turn: 157,
    currentLocation: 'Salt Road Waystation',
    sceneFacts: {
      ...emptySceneFacts(157),
      crowd: 'sparse',
      present: ['Vessa'],
      props: [],
      lastBeat: 'waystation',
      crowdCount: 1,
    },
    npcMemories: [
      mem({
        npcName: 'Vessa',
        roleHint: 'handler',
        need: 'a buyer who pays',
        location: 'Salt Road Waystation',
      }),
    ],
    places: [
      { id: 'hub-waystation', name: 'Salt Road Waystation', lastVisitedTurn: 150 },
      { id: 'hub-camp', name: 'Consul Caravan Camp', lastVisitedTurn: 155 },
      { id: 'hub-alley', name: 'Safehouse Alley', lastVisitedTurn: 140 },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

function camp(over: Partial<GameState> = {}): GameState {
  const s = waystation({
    turn: 160,
    currentLocation: 'Consul Caravan Camp',
    sceneFacts: {
      ...emptySceneFacts(160),
      crowd: 'sparse',
      present: ['Ysolde Sallow'],
      props: [],
      lastBeat: 'camp',
      crowdCount: 1,
    },
    npcMemories: [
      mem({
        npcName: 'Ysolde Sallow',
        roleHint: 'contact',
        goal: { motivation: 'Protection', target: 'the next safe door' },
        location: 'Consul Caravan Camp',
      }),
    ],
  });
  return { ...s, ...over } as GameState;
}

describe('T10AR empty search chip starve (s9601 T158→T162)', () => {
  it('Search the area is not re-offered after this place found nothing', () => {
    const place = 'Salt Road Waystation';
    const key = normalizeSearchTarget('Search the area', place);
    let s = waystation({
      sceneFacts: recordEmptySearch(emptySceneFacts(158), key, 158),
    });
    s = {
      ...s,
      sceneFacts: {
        ...s.sceneFacts!,
        present: ['Vessa'],
        crowd: 'sparse',
        crowdCount: 1,
      },
      currentLocation: place,
      turn: 162,
    };
    const labels = collectSceneAffordances(s).map((a) => a.label);
    expect(labels).not.toContain('Search the area');
  });

  it('Search the area is offered when the place has not been searched empty', () => {
    const s = waystation({ turn: 157 });
    expect(collectSceneAffordances(s).some((a) => a.label === 'Search the area')).toBe(true);
  });
});

describe('T10AR buyer stock line source (s9601 T157)', () => {
  it('twig-snap free act does not dump Vessa ledger need', () => {
    const s = waystation({ turn: 157 });
    const act =
      'I snap a twig from the roadside brush and toss it into the mud, watching the dark wind ripple through my hair.';
    const out = ensureSpokenAnswer(
      'Jax snapped a dry twig off the brush beside the waystation road and threw it down into the wet mud. Vessa said nothing.',
      s,
      act,
    );
    expect(out.prose).not.toMatch(/I need a buyer who pays/i);
    expect(out.prose).not.toMatch(/buyer who pays/i);
  });

  it('Talk to Vessa still may speak a fresh need as a sentence', () => {
    const s = waystation({ turn: 10 });
    const out = ensureSpokenAnswer(
      'Jax turned to Vessa.',
      s,
      'Talk to Vessa',
    );
    expect(out.prose).toMatch(/I need a buyer who pays/i);
  });
});

describe('T10AR short-return arrival cue (s9601 T160 / T165)', () => {
  it('bounce return is same-scene turn-back, not a null-delta page', () => {
    // Owner: 29z9j return-not-new-arrival. T10AR only bans null-delta writer language.
    const s = camp({
      turn: 165,
      circling: {
        lastLocation: 'Consul Caravan Camp',
        prevPlace: 'Salt Road Waystation',
        movedTurn: 165,
        shortReturnTurn: 165,
        recentPlaces: ['Consul Caravan Camp', 'Salt Road Waystation', 'Consul Caravan Camp'],
        lastProgressTurn: 150,
        stale: {},
        tried: {},
      },
    });
    const fact = movementFact(s, 'Walk on');
    expect(fact).toMatch(/^Turned back this turn:/);
    expect(fact).toMatch(/Not a new arrival/);
    expect(fact).toMatch(/never say nothing changed/i);
    expect(fact).not.toMatch(/still an arrival/i);
  });
});

describe('T10AR LOOP STOP vs picker bias (s9601 T165)', () => {
  it('bounce between two recent hubs is not turnProgress moved', () => {
    // recentPlaces are placeKey lowercase (recordCirclingTurn).
    const before = waystation({
      turn: 164,
      currentLocation: 'Salt Road Waystation',
      circling: {
        lastLocation: 'salt road waystation',
        prevPlace: 'consul caravan camp',
        recentPlaces: ['consul caravan camp', 'salt road waystation'],
        lastProgressTurn: 150,
        stale: {},
        tried: {},
      },
    });
    const after = camp({
      turn: 165,
      circling: {
        ...before.circling!,
        lastLocation: 'consul caravan camp',
        prevPlace: 'salt road waystation',
        recentPlaces: ['salt road waystation', 'consul caravan camp'],
        movedTurn: 165,
      },
    });
    expect(movedOn(before, after)).toBe(false);
    // Same cast/quest/XP: bounce alone is not progress (LOOP STOP meaning).
    const sameCast = {
      ...after,
      npcMemories: before.npcMemories,
      places: before.places,
      character: before.character,
      quests: before.quests,
    };
    expect(turnProgress(before, sameCast, []).progressed).toBe(false);
    expect(turnProgress(before, sameCast, []).reasons).not.toContain('moved');
  });

  it('LOOP STOP threshold stays at 5; stall fires earlier (STALL_N < 5)', () => {
    expect(STALL_N).toBeLessThan(5);
    const s = camp({
      turn: 160,
      circling: {
        lastLocation: 'Consul Caravan Camp',
        lastProgressTurn: 160 - STALL_N,
        recentPlaces: ['Salt Road Waystation', 'Consul Caravan Camp'],
        stale: {},
        tried: {},
      },
      progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: 159, recentDeltas: [] },
    });
    expect(stallPressureActive(s)).toBe(true);
  });

  it('under stall, untried talk outranks bounce travel on chip score and pad lead', () => {
    const ysoldeId = 'npc-ysolde-sallow';
    const s = camp({
      turn: 160,
      circling: {
        lastLocation: 'consul caravan camp',
        prevPlace: 'salt road waystation',
        recentPlaces: ['salt road waystation', 'consul caravan camp'],
        lastProgressTurn: 160 - STALL_N,
        stale: {},
        tried: {},
      },
      progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: 159, recentDeltas: [] },
      npcMemories: [
        mem({
          npcName: 'Ysolde Sallow',
          npcId: ysoldeId,
          roleHint: 'contact',
          goal: { motivation: 'Protection', target: 'the next safe door' },
          location: 'Consul Caravan Camp',
          present: true,
        }),
      ],
    });
    expect(stallPressureActive(s)).toBe(true);
    const ask = 'Ask Ysolde Sallow about the next safe door';
    const bounce = 'Travel toward Salt Road Waystation';
    expect(chipProgressScore(s, ask)).toBeLessThan(chipProgressScore(s, bounce));

    const pad = applyOptionCooldown(s, [
      {
        label: bounce,
        actionId: 'exit:hub-waystation:travel',
        kind: 'exit',
        slotKind: 'exit' as const,
        slotCategory: 'move' as const,
        entityId: 'Salt Road Waystation',
        required: true,
        rank: 70,
      },
      {
        label: ask,
        actionId: `person:${ysoldeId}:agenda`,
        kind: 'affordance',
        slotKind: 'person' as const,
        slotCategory: 'talk' as const,
        entityId: ysoldeId,
        required: true,
        rank: 80,
      },
      {
        label: 'Press your standing with Ysolde Sallow',
        actionId: `person:${ysoldeId}:standing`,
        kind: 'affordance',
        slotKind: 'person' as const,
        slotCategory: 'act' as const,
        entityId: ysoldeId,
        rank: 60,
      },
      { label: 'Say something…', actionId: 'free-input:say', kind: 'free-input' },
    ]);
    const labels = pad.map((c) => c.label);
    const talkAt = labels.findIndex((l) => /Ysolde/i.test(l) && !/^Travel/i.test(l));
    const bounceAt = labels.findIndex((l) => /Travel toward Salt Road Waystation/i.test(l));
    expect(labels.join(' | ')).toMatch(/Ysolde/);
    expect(talkAt).toBeGreaterThanOrEqual(0);
    expect(bounceAt).toBeGreaterThanOrEqual(0);
    expect(talkAt).toBeLessThan(bounceAt);
  });
});
