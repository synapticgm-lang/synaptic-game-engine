/**
 * s77 Root C — the engine settles the result and one final chip legality pass runs last.
 * ENGINE RESULT carries this turn's world-change receipts (an arrival included), 'spawned' is only the
 * turn a foe goes live, the threat block is one engine sign from the foe, and the offered menu never
 * brings back a filtered chip, a stance nobody asked for, a walk-away that only turns back, or a quest
 * step no engine action carries out.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { runArcDirectorBeforeGm } from './arcDirector';
import { engineResultFact } from './engineResult';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { resolveOfferedChoices } from './playTranscript';
import { filterInventedContextChoices } from './choiceWarden';
import { applyStanceDensity } from './stanceDensity';
import { chipProblem } from './chipLegality';
import { storyChip } from './choiceRanking';
import { parkPendingEncounter } from './encounterTerminalFsm';
import { UNDERWAY_HERE } from './travelJourney';
import type { ActiveEncounter, GameState, LogEntry, Quest } from './types';

const BANDIT = 'Wardline Bandit';
const GROUND = 'back streets';

function seed77(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 77, personality: 'cold-system' });
  return stampOpening(state);
}

function bandit(): ActiveEncounter {
  return {
    name: BANDIT,
    level: 1,
    hp: 16,
    maxHp: 16,
    armorClass: 11,
    strength: 11,
    dexterity: 12,
    constitution: 11,
    xpReward: 40,
    goldReward: 7,
    phase: 'engaged',
  };
}

const gm = (turn: number, content: string): LogEntry => ({ id: `gm-${turn}`, turn, role: 'gm', content, timestamp: 0 });
const player = (turn: number, content: string): LogEntry => ({ id: `p-${turn}`, turn, role: 'player', content, timestamp: 0 });

/** Jax on the empty back streets between the infirmary and Lowmarket, nobody here, nothing offered. */
function emptyRoad(turn = 15, extra: Partial<GameState> = {}): GameState {
  const s = seed77();
  return {
    ...s,
    turn,
    currentLocation: UNDERWAY_HERE,
    openingEstablishment: { ...s.openingEstablishment!, complete: true, offerTaken: 'refused' },
    journey: {
      from: 'the cathedral infirmary',
      to: 'Lowmarket',
      ground: GROUND,
      terrain: 'streets',
      legsTotal: 2,
      legsDone: 1,
      hoursPerLeg: 1,
      startedTurn: turn - 2,
    },
    activeEncounter: undefined,
    sceneFacts: {
      ...(s.sceneFacts ?? { noise: 'unknown', props: [], lastBeat: '', updatedTurn: turn }),
      crowd: 'present',
      present: [],
      anonymousRoles: [],
      pendingEncounter: undefined,
    } as GameState['sceneFacts'],
    companions: [],
    log: [
      ...(s.log ?? []),
      player(turn - 1, 'Walk on'),
      gm(turn, 'Jax kept to the back streets. Shutters were drawn and the cobbles were wet; people somewhere further off were calling to each other.'),
    ],
    ...extra,
  } as GameState;
}

describe('s77 Root C: the engine settles the result, one final chip pass', () => {
  it('a pending foe plus "Offer help" is the player\'s own outcome, not spawned; the arrival turn is', () => {
    const road = emptyRoad(16);
    const pending: GameState = {
      ...road,
      sceneFacts: { ...road.sceneFacts!, pendingEncounter: parkPendingEncounter(bandit(), 15) },
    };
    const packet = buildCompletedEventPacket(pending, 'Offer help, honestly');
    expect(packet.outcome).not.toBe('spawned');
    expect(packet.phase).toBe('pending');

    const arrived: GameState = { ...road, turn: 17, activeEncounter: { ...bandit(), startedTurn: 17 } };
    expect(buildCompletedEventPacket(arrived, 'Brace yourself').outcome).toBe('spawned');
    expect(buildCompletedEventPacket(arrived, 'Look around').outcome).toBe('inspected');
    const later: GameState = { ...arrived, turn: 18 };
    expect(buildCompletedEventPacket(later, 'Look around').outcome).not.toBe('spawned');
  });

  it('the arrival turn\'s ENGINE RESULT states the foe stepping out, and chrome stays out', () => {
    const road = emptyRoad(17);
    const due: GameState = {
      ...road,
      sceneFacts: { ...road.sceneFacts!, pendingEncounter: parkPendingEncounter(bandit(), 14) },
    };
    const arc = runArcDirectorBeforeGm(due, 'Refuse and keep your own counsel');
    expect(arc.state.activeEncounter?.name).toBe(BANDIT);
    const engineResult = engineResultFact(arc.systemReceipts);
    expect(engineResult).toMatch(/Encounter: Wardline Bandit\. Wardline Bandit steps out onto the back streets ahead/);

    const packet = buildCompletedEventPacket(arc.state, 'Refuse and keep your own counsel', { engineResult });
    const prompt = formatWriterFacingEvent(packet);
    expect(prompt).toMatch(/ENGINE RESULT[^\n]*Encounter: Wardline Bandit[^\n]*steps out/);

    expect(engineResultFact(['XP Gained: 40 (defeated X)', 'HP: 20 → 14 (dealt 16, took 6)', 'Quest stage: tick', 'Threat building: X'])).toBe('');
    expect(engineResultFact(['Fight: VICTORY vs X in 2 rounds', 'Moved within Lowmarket: now on the stalls'])).toBe(
      'Fight: VICTORY vs X in 2 rounds. Moved within Lowmarket: now on the stalls.'
    );
  });

  it('the threat block names the foe here, and no catalog text reaches the writer', () => {
    const road = emptyRoad(15);
    const pending: GameState = {
      ...road,
      sceneFacts: { ...road.sceneFacts!, pendingEncounter: parkPendingEncounter(bandit(), 15) },
      arcDirector: {
        ...road.arcDirector,
        pendingTelegraph: 'TELEGRAPH (1-turn-before):\n[SCENE] Creates a suspicion cue for ambush or environmental danger.',
      } as GameState['arcDirector'],
    };
    const info = formatWriterInfoLayer(pending);
    expect(info).toMatch(/Threat building \(show a sign before the foe appears\):\nWardline Bandit, a person, is closing on the back streets/);
    expect(info).not.toMatch(/\[SCENE\]|TELEGRAPH|suspicion cue/);
  });

  it('a chip removed by the invented-context filter is not in the offered menu', () => {
    const road = emptyRoad(15);
    const gmChoices = ['Walk on', 'Inspect the crystals breaking the street', 'Inspect the immediate surroundings'];
    const filtered = filterInventedContextChoices(gmChoices, road);
    const removed = gmChoices.filter((c) => !filtered.includes(c));
    expect(removed.length).toBeGreaterThan(0);
    const offered = resolveOfferedChoices({ ...road, choices: gmChoices });
    for (const c of removed) expect(offered).not.toContain(c);
  });

  it('on an empty road with no offer: no "Offer help, honestly", no "Refuse and keep your own counsel", no walk-away turn back', () => {
    const road = emptyRoad(15);
    const stanceChips = ['Offer help, honestly', 'Refuse and keep your own counsel', 'Walk away / go another direction'];
    const offered = resolveOfferedChoices({ ...road, choices: ['Walk on', ...stanceChips] });
    for (const c of stanceChips) expect(offered).not.toContain(c);
    expect(chipProblem(road, 'Walk away / go another direction')?.detail).toMatch(/turns back|no other exit/);

    const padded = applyStanceDensity(['Walk on'], road, road.log[road.log.length - 1]!.content);
    expect(padded).not.toContain('Offer help, honestly');
    expect(padded).not.toContain('Refuse and keep your own counsel');

    const withBystanders: GameState = {
      ...road,
      turn: 16,
      sceneFacts: { ...road.sceneFacts!, anonymousRoles: ['bystanders'] },
    };
    expect(chipProblem(withBystanders, 'Refuse and keep your own counsel')).not.toBeNull();
    expect(chipProblem(withBystanders, 'Offer help, honestly')).not.toBeNull();
  });

  it('"Clear the infestation" is not offered while the quest has no reachable place', () => {
    const quest: Quest = {
      id: 'sp-spine-crown-meat-shield',
      name: "The Crown's Meat Shield",
      description: 'High Priest Arus wants you to clear the crypts.',
      status: 'active',
      revealed: true,
      location: 'Consecrated Sanctuary',
      objectives: [{ description: "Clear the infestation in the cathedral's lower crypts", completed: false }],
    } as Quest;
    const atLowmarket: GameState = {
      ...emptyRoad(21),
      currentLocation: 'Lowmarket',
      journey: null,
      quests: [quest],
    } as GameState;
    expect(storyChip(atLowmarket)).toBeNull();
    const offered = resolveOfferedChoices({ ...atLowmarket, choices: ['Look around'] });
    expect(offered.some((c) => /clear the infestation/i.test(c))).toBe(false);
  });
});
