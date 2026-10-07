/**
 * s74 L — phantom fight: the ArcDirector spawned a foe on a turn-back from the road and wrote
 * "Encounter started" for a foe that was only parked; a parked foe then went live with no prose.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from './arcDirector';
import { commitTravel, UNDERWAY_HERE } from './travelJourney';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { autoFightSpawnPreface, ensureEncounterSpawnPreface } from './combatAuthority';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { compileChoices } from './choiceCompiler';
import { placeThreatKey } from './placeThreats';
import type { ActiveEncounter, GameState } from './types';

const SQUARE = 'Valespire peace-festival square';

function jaxOnTheRoad(): GameState {
  const base = createInitialState(undefined, 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    turn: 9,
    currentLocation: UNDERWAY_HERE,
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: { ...base.openingEstablishment!, complete: true },
    activeEncounter: null,
    journey: {
      from: SQUARE,
      to: 'Lowmarket',
      ground: 'Open road',
      terrain: 'road',
      legsTotal: 3,
      legsDone: 1,
      hoursPerLeg: 2,
      startedTurn: 8,
      areaTier: 1,
      encounter: { kind: 'thugs', level: 1, stretch: 1, dangerous: false },
      quietStretches: 0,
    },
    arcDirector: {
      turnsSinceCombatReceipt: 9,
      committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'],
    },
    stateTxLog: [],
    sceneFacts: {
      crowd: 'unknown',
      noise: 'unknown',
      present: [],
      props: [],
      lastBeat: '',
      updatedTurn: 9,
    },
  } as GameState;
}

/** Pre-writer order the live turn uses: director, travel, travel trim. */
function preWriterTurn(state: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(state, input);
  let next = arc.state;
  const before = next.currentLocation ?? '';
  const travel = commitTravel(next, input);
  next = travel.state;
  if (next.currentLocation && next.currentLocation !== before) {
    next = applyPresentTrimOnTravel(next, before, next.currentLocation);
  }
  return { arc, travel, state: next, status: formatArcStatusReceipts(arc) };
}

function parkedFoe(state: GameState, name: string): GameState {
  const foe: ActiveEncounter = initEncounterTerminal(
    { name, hp: 12, maxHp: 12, level: 1, attack: 2, defense: 10 } as never,
    state
  );
  return {
    ...state,
    sceneFacts: { ...state.sceneFacts!, pendingEncounter: foe, pendingSpawnPreface: name },
  };
}

function atTheMarket(): GameState {
  const s = jaxOnTheRoad();
  return { ...s, journey: null, currentLocation: 'Lowmarket', turn: 21 };
}

describe('phantom fight (s74 L)', () => {
  it('turn back from a road meeting: no fight, no Encounter receipt, no foe at the square', () => {
    const turn = preWriterTurn(jaxOnTheRoad(), `Turn back toward ${SQUARE}`);
    expect(turn.travel.arrived).toBe(true);
    expect(turn.state.currentLocation).toBe(SQUARE);
    const turnTx = (turn.state.stateTxLog ?? []).filter((t) => t.kind === 'combat');
    expect(turnTx).toEqual([]);
    expect(turn.status.some((l) => /^Encounter:/.test(l))).toBe(false);
    expect(turn.state.activeEncounter ?? null).toBeNull();
    expect(turn.state.sceneFacts?.pendingEncounter).toBeUndefined();
    expect(turn.state.placeThreats?.[placeThreatKey(SQUARE)]).toBeUndefined();

    const post = ensureEncounterSpawnPreface(turn.state, 'Jax walked the open road back into the square.');
    expect(post.state.activeEncounter ?? null).toBeNull();
    expect((post.state.stateTxLog ?? []).some((t) => t.kind === 'combat')).toBe(false);
  });

  it('a road meeting is the threat the director sees: no second foe on the road', () => {
    const turn = preWriterTurn(jaxOnTheRoad(), 'Look around');
    expect(turn.state.activeEncounter ?? null).toBeNull();
    expect(turn.state.sceneFacts?.pendingEncounter).toBeUndefined();
    expect((turn.state.stateTxLog ?? []).some((t) => t.kind === 'combat')).toBe(false);
  });

  it('a parked foe the prose never names stays parked: not engaged, no fight pads', () => {
    const state = parkedFoe(atTheMarket(), 'Void-Touched Scavenger');
    const post = ensureEncounterSpawnPreface(state, 'A shadow slid along the stall awnings and was gone.');
    expect(post.state.activeEncounter ?? null).toBeNull();
    expect(post.state.sceneFacts?.pendingEncounter?.name).toBe('Void-Touched Scavenger');
    expect(post.prepended).toBe(false);
    expect(post.receipts).toEqual([]);
    expect((post.state.stateTxLog ?? []).some((t) => t.kind === 'combat')).toBe(false);
    const pads = compileChoices(post.state, ['Look around', 'Wait'], undefined, 'Look around').choices;
    expect(pads.some((c) => /press the attack|try to flee|parley/i.test(c))).toBe(false);
  });

  it('a parked foe goes live on the engine arrival clock with one Encounter receipt', () => {
    const parked = parkedFoe(atTheMarket(), 'Void-Touched Scavenger');
    const foe = parked.sceneFacts!.pendingEncounter!;
    const state = {
      ...parked,
      sceneFacts: { ...parked.sceneFacts!, pendingEncounter: { ...foe, phase: 'pending', parkedTurn: 19, arrivalTurn: 21 } },
    } as GameState;
    const turn = preWriterTurn(state, 'Wait');
    expect(turn.state.activeEncounter?.name).toBe('Void-Touched Scavenger');
    expect(turn.state.sceneFacts?.pendingEncounter).toBeUndefined();
    expect(turn.status.filter((l) => /^Encounter:/.test(l))).toHaveLength(1);
    expect((turn.state.stateTxLog ?? []).filter((t) => t.kind === 'combat')).toHaveLength(1);
  });

  it('spawn lines on a road never use the road label or "room"', () => {
    const lines = [
      autoFightSpawnPreface('Pact-Hunter Skirmisher', UNDERWAY_HERE),
      autoFightSpawnPreface('Void-Touched Scavenger', UNDERWAY_HERE),
      autoFightSpawnPreface('Pact-Hunter Skirmisher', UNDERWAY_HERE, 'Open road'),
      autoFightSpawnPreface('Hollow Hound', 'Forest path'),
    ];
    const onRoad = parkedFoe({ ...jaxOnTheRoad(), journey: { ...jaxOnTheRoad().journey!, encounter: null } }, 'Pact-Hunter Skirmisher');
    const shown = ensureEncounterSpawnPreface(
      {
        ...onRoad,
        activeEncounter: { ...onRoad.sceneFacts!.pendingEncounter!, phase: 'engaged' },
        sceneFacts: { ...onRoad.sceneFacts!, pendingEncounter: undefined },
      },
      'Steel rang on the open road.'
    );
    if (shown.spawnReceipt) lines.push(shown.spawnReceipt);
    expect(shown.spawnReceipt).toBeTruthy();
    for (const line of lines) {
      expect(line).not.toMatch(/On the road between places/i);
      expect(line).not.toMatch(/\broom\b/i);
    }
  });
});
