/**
 * T10AG — scenes never move on in long runs (travel free-text freeze, hub loops, class pad).
 * Evidence: LitRPG s9701 T18–T24; story RPG s9601 T95–T97 / T126–T150; tabletop s9501 T124–T131.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, TravelJourney } from './types';
import { turnProgress } from './choiceRanking';
import { planSceneThreads, stallPressureActive, STALL_N } from './openThreads';
import { commitTravel, isJourneyOnwardLine, journeyPads } from './travelJourney';
import { settleClassChoice, classChip, CLASS_QUICK_START_CHIP } from './rules/characterClass';
import { resolveOfferedChoices, commitOfferedPad } from './playTranscript';
import { applyOptionCooldown } from './sceneAffordances';

function lit(over: Partial<GameState> = {}): GameState {
  return {
    ...(createInitialState(undefined, 'litrpg') as GameState),
    engineMode: 'litrpg',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 10,
      level: 1,
      xp: 0,
      attributes: { STR: 12, DEX: 12, CON: 12, INT: 10, WIS: 10, CHA: 12 },
    },
    turn: 21,
    currentLocation: 'On the road between places',
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

function roadJourney(over: Partial<TravelJourney> = {}): TravelJourney {
  return {
    from: 'the stone outline of a building that is gone',
    to: 'Cathedral Close',
    ground: 'back streets',
    terrain: 'streets',
    legsDone: 1,
    legsTotal: 2,
    hoursPerLeg: 0.5,
    startedTurn: 18,
    ...over,
  };
}

describe('T10AG stall keyed to turnProgress (not soft timeline noise)', () => {
  it('stall fires from circling.lastProgressTurn after STALL_N even when governor is 0', () => {
    expect(STALL_N).toBeLessThan(5);
    const s = lit({
      turn: 23,
      progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: 22, recentDeltas: [] },
      circling: {
        lastLocation: 'On the road between places',
        lastProgressTurn: 19,
        recentPlaces: [],
        tried: {},
        stale: {},
      },
      journey: roadJourney(),
    });
    expect(stallPressureActive(s)).toBe(true);
  });
});

describe('T10AG travel free text spends exploration time (s9701 T19–T21)', () => {
  it('typed free text on the road advances the clock and can complete a leg without Walk on', () => {
    let s = lit({
      turn: 20,
      worldHour: 8,
      journey: roadJourney({ legsDone: 1, legsTotal: 2, hoursPerLeg: 0.5, legHoursSpent: 0 }),
    });
    const first = commitTravel(s, 'I snatch the dull grey mace from the cloth and swing it hard against the stone pillar');
    expect(first.handled).toBe(true);
    expect(first.arrived).toBe(false);
    expect(first.state.journey?.legsDone).toBe(1);
    expect((first.state.journey?.legHoursSpent ?? 0) > 0).toBe(true);
    expect(first.receipt).toMatch(/on the road/i);

    const second = commitTravel(
      first.state,
      'I toss the mace lightly in the air and catch it, asking if he knows where else the loot might be hidden.',
    );
    // streets hoursPerLeg 0.5 + two STEP_HOURS (0.25) → leg completes
    expect((second.state.journey?.legsDone ?? 0) > 1 || second.arrived).toBe(true);
  });

  it('Walk on still advances one full leg in one step', () => {
    const s = lit({ turn: 19, journey: roadJourney({ legsDone: 1, legsTotal: 2 }) });
    const out = commitTravel(s, 'Walk on');
    expect(out.handled).toBe(true);
    expect(out.arrived || (out.state.journey?.legsDone ?? 0) > 1).toBe(true);
  });
});

describe('T10AG stall Walk on even with companions / open threads (s9601 T95–T97)', () => {
  it('stall on a journey Walks on before LOOP STOP even when someone is present', () => {
    let s = lit({
      engineMode: 'rpg',
      turn: 97,
      currentLocation: 'On the road between places',
      progressGovernor: { turnsSinceProgress: STALL_N, lastProgressTurn: 94, recentDeltas: [] },
      circling: {
        lastLocation: 'On the road between places',
        lastProgressTurn: 94,
        recentPlaces: [],
        tried: {},
        stale: {},
      },
      journey: {
        from: 'Bribe Market',
        to: 'Checkpoint Rise',
        ground: 'open road',
        terrain: 'road',
        legsDone: 1,
        legsTotal: 2,
        hoursPerLeg: 2,
        startedTurn: 95,
      },
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Bertil Pike'],
        props: [],
        lastBeat: '',
        updatedTurn: 97,
      },
      openThreads: [
        {
          id: 'q-main',
          kind: 'quest',
          label: 'Salt Road delivery',
          placeId: 'Bribe Market',
          lastSeenTurn: 90,
          resolution: { type: 'quest-complete', questId: 'salt-main' },
        },
      ],
      quests: [],
      sceneThreadPlan: undefined,
    });
    expect(stallPressureActive(s)).toBe(true);
    const before = s.journey!.legsDone;
    s = planSceneThreads(s);
    expect(s.sceneThreadPlan?.stallEventId).toMatch(/stall-road|stall-/);
    expect((s.journey?.legsDone ?? before) > before || !!s.sceneFacts?.stallWorldFact).toBe(true);
  });
});

describe('T10AG hub stall moves the world (s9601 T126–T150 / s9501 T124–T131)', () => {
  it('stall at a hub records a world act and a present NPC leaves', () => {
    let s = lit({
      engineMode: 'rpg',
      turn: 130,
      currentLocation: 'Bribe Market',
      journey: null,
      progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: 120, recentDeltas: [] },
      circling: {
        lastLocation: 'Bribe Market',
        lastProgressTurn: 126,
        recentPlaces: ['Bribe Market'],
        tried: {},
        stale: {},
      },
      sceneFacts: {
        crowd: 'present',
        noise: 'voices',
        present: ['Dunn Rudd', 'Osric Wyle'],
        props: [],
        lastBeat: '',
        updatedTurn: 130,
      },
      npcMemories: [
        {
          npcId: 'dunn',
          npcName: 'Dunn Rudd',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 129,
          met: true,
          present: true,
        },
        {
          npcId: 'osric',
          npcName: 'Osric Wyle',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 129,
          met: true,
          present: true,
        },
      ],
      openThreads: [],
      quests: [],
      sceneThreadPlan: undefined,
    });
    expect(stallPressureActive(s)).toBe(true);
    s = planSceneThreads(s);
    expect(s.sceneThreadPlan?.stallEventId).toBeTruthy();
    expect(s.sceneFacts?.stallWorldFact || s.sceneFacts?.placeWorldFact).toBeTruthy();
    expect((s.sceneFacts?.present ?? []).length).toBeLessThan(2);
  });
});

describe('T10AG class pick is progress; Walk on stays on the pad (s9701 T21–T23)', () => {
  it('Choose Sorcerer counts as turnProgress', () => {
    const before = lit({
      turn: 22,
      classOffer: { turn: 21, choices: ['fighter', 'barbarian', 'sorcerer'] },
      journey: roadJourney(),
    });
    const settled = settleClassChoice(before, 'Choose Sorcerer');
    expect(settled.settled).toBe(true);
    const p = turnProgress(before, settled.state, settled.receipts);
    expect(p.progressed).toBe(true);
    expect(p.reasons).toContain('class');
  });

  it('Walk on stays ahead of class chips while a journey is underway', () => {
    expect(isJourneyOnwardLine('Walk on')).toBe(true);
    const s = lit({
      turn: 21,
      classOffer: { turn: 21, choices: ['fighter', 'barbarian', 'sorcerer'] },
      journey: roadJourney(),
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 21,
      },
    });
    const pads = journeyPads(s);
    expect(pads.some((c) => isJourneyOnwardLine(c))).toBe(true);
    const offered = resolveOfferedChoices({ ...s, offeredPad: null });
    expect(offered[0]).toMatch(/^Walk on$/i);
    expect(offered.some((c) => c === classChip('fighter') || c === CLASS_QUICK_START_CHIP)).toBe(true);

    const cooled = applyOptionCooldown(s, [
      { label: 'Choose Warrior', actionId: 'system:class:fighter', kind: 'system', slotCategory: 'act', rank: 90 },
      { label: 'Choose Berserker', actionId: 'system:class:barbarian', kind: 'system', slotCategory: 'act', rank: 89 },
      { label: 'Choose Sorcerer', actionId: 'system:class:sorcerer', kind: 'system', slotCategory: 'act', rank: 88 },
      { label: CLASS_QUICK_START_CHIP, actionId: 'system:class:quick', kind: 'system', slotCategory: 'act', rank: 87 },
      { label: 'Walk on', actionId: 'label:walk on', kind: 'journey', slotCategory: 'move', rank: 10 },
      {
        label: 'Turn back toward the stone outline of a building that is gone',
        actionId: 'label:turn back',
        kind: 'journey',
        slotCategory: 'move',
        rank: 5,
      },
    ]);
    expect(cooled.some((c) => isJourneyOnwardLine(c.label))).toBe(true);

    const committed = commitOfferedPad({ ...s, offeredPad: null });
    expect(committed.offeredPad?.choices?.some((c) => isJourneyOnwardLine(c))).toBe(true);
  });
});
