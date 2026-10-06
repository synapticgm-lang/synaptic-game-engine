/**
 * s72 G — a road meeting faced or fled through the fight engine, and the travel Outcome the writer gets.
 * No live GM call. Mid writer OFF.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import { resolveEngineFight } from './engineFight';
import { buildCompletedEventPacket } from './completedEventPacket';
import { countTurnReceipts } from './receiptTelemetry';
import { recordT12HookReceipt } from './freeT12Hook';
import { mulberry32 } from './fatePick';
import { commitTravel, journeyPads, roadEncounterLevel, travelOutcome } from './travelJourney';
import type { GameState, RoadEncounter } from './types';

function keepState(seed: string): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    quests: [],
    character: { ...s.character, level: 1 },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** On the ground between two places with thugs on this stretch. */
function thugsOnStretch(over: Partial<RoadEncounter> = {}): GameState {
  const trip = commitTravel(keepState('road-fight'), 'Travel toward Blackspine Treeline').state;
  const j = trip.journey!;
  const level = roadEncounterLevel(trip, j.areaTier ?? 1);
  return {
    ...trip,
    journey: { ...j, encounter: { kind: 'thugs', level, stretch: j.legsDone, dangerous: false, ...over } },
  };
}

/** One turn in caller order: the fight engine, then travel, then the packet built from the engine's results. */
function playTurn(state: GameState, input: string) {
  const next = { ...state, turn: (state.turn ?? 0) + 1 };
  const fight = resolveEngineFight(next, input);
  const afterFight = fight?.state ?? next;
  const travel = commitTravel(afterFight, input);
  const packet = buildCompletedEventPacket(travel.state, input, {
    engineResult: [...(fight?.receipts ?? []), travel.receipt ?? ''].join(' '),
    travel: travelOutcome(travel, next.currentLocation ?? '', travel.state),
  });
  return { turn: next.turn, fight, travel, packet, state: travel.state };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('s72 G — facing a road meeting', () => {
  it('Face the thugs rolls the fight the same turn: one combat receipt, HP moved, not "resolved"', () => {
    const rng = mulberry32(72);
    vi.spyOn(Math, 'random').mockImplementation(rng);
    const t = playTurn(thugsOnStretch(), 'Face the thugs');
    expect(t.fight).not.toBeNull();
    expect(t.packet.outcome).not.toBe('resolved');
    expect(['killed', 'defeated']).toContain(t.packet.outcome);
    expect(countTurnReceipts(t.state, t.turn + 1).combat).toBe(1);
    const hp = t.fight!.receipts.find((r) => r.startsWith('HP:'))!;
    const [, dealt, took] = hp.match(/dealt (\d+), took (\d+)/)!;
    expect(Number(dealt) + Number(took)).toBeGreaterThan(0);
    expect(t.travel.outcome).not.toBe('fight opened');
    expect(t.state.activeEncounter ?? null).toBeNull();
  });

  it('without the fight engine first, facing opens the fight and the packet says so', () => {
    const next = { ...thugsOnStretch(), turn: 5 };
    const travel = commitTravel(next, 'Face the thugs');
    const packet = buildCompletedEventPacket(travel.state, 'Face the thugs', {
      travel: travelOutcome(travel, next.currentLocation ?? '', travel.state),
    });
    expect(travel.outcome).toBe('fight opened');
    expect(packet.outcome).not.toBe('resolved');
  });
});

describe('s72 G — a successful flee slips past the meeting', () => {
  it('flee from the thugs in the lane: escaped, no "dealt with", no T12 hook, no victory XP, then Walk on arrives', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const start = { ...thugsOnStretch(), turn: 10 };
    const xpBefore = start.character.xp;
    const fled = playTurn(start, 'Try to flee');
    expect(fled.fight).not.toBeNull();
    expect(fled.fight!.receipts.some((r) => /Flee check: .* success/.test(r))).toBe(true);
    expect(fled.fight!.receipts.some((r) => /^XP Gained|^Loot|^Gold Gained/.test(r))).toBe(false);
    expect(fled.state.character.xp).toBe(xpBefore);
    expect(fled.state.journey?.encounter?.escaped).toBe(true);
    expect(fled.state.journey?.encounter?.engaged).toBeFalsy();
    expect(fled.travel.receipt).not.toMatch(/dealt with/);
    expect(fled.travel.receipt).toMatch(/got away/);
    expect(fled.packet.outcome).toBe('slipped away');
    expect(countTurnReceipts(fled.state, fled.turn + 1).combat).toBe(0);

    const t12 = recordT12HookReceipt({ ...fled.state, turn: 12 });
    expect(t12.arcDirector?.t12HookReceipt?.fired).toBe(false);
    expect(t12.arcDirector?.t12HookReceipt?.reason).not.toBe('encounterCleared');

    expect(journeyPads(fled.state)).toContain('Walk on');
    const on = playTurn(fled.state, 'Walk on');
    expect(on.travel.arrived).toBe(true);
    expect(on.packet.outcome).toBe('arrived');
  });

  it('flee from a live road fight (T11 face, T12 flee) marks the meeting escaped, not dealt with', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const live = commitTravel({ ...thugsOnStretch(), turn: 11 }, 'Face the thugs').state;
    expect(live.activeEncounter?.name).toBe('the thugs');
    const fled = playTurn(live, 'Try to flee');
    expect(fled.state.journey?.encounter?.escaped).toBe(true);
    expect(fled.travel.receipt).not.toMatch(/dealt with/);
    expect(fled.packet.outcome).not.toBe('resolved');
    const t12 = recordT12HookReceipt({ ...fled.state, turn: 12 });
    expect(t12.arcDirector?.t12HookReceipt?.fired).toBe(false);
  });
});

describe('s72 G — pushing at a blocked lane', () => {
  it('Force a path forward is unchanged or blocked, never resolved', () => {
    const t = playTurn(thugsOnStretch(), 'Force a path forward');
    expect(t.fight).toBeNull();
    expect(['unchanged', 'blocked']).toContain(t.packet.outcome);
    expect(t.state.journey?.encounter?.escaped).toBeFalsy();
  });
});
