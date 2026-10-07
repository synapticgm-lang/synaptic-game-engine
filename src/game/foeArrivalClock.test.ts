/**
 * s75 O — the waiting foe that never arrived. The engine owns arrival: a parked foe is pending, telegraphed,
 * then taken live on the arrival clock, never on a move turn and never because a prose word matched.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from './arcDirector';
import { commitTravel } from './travelJourney';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { ensureEncounterSpawnPreface } from './combatAuthority';
import { compileChoices } from './choiceCompiler';
import { peopleHere } from './chipLegality';
import { buildInfoSheet, peopleOnSheet } from './infoSheet';
import { compileNounAllowlist, compileRefEnum } from './completedEventPacket';
import { placeThreatKey } from './placeThreats';
import type { GameState } from './types';

const MARKET = 'Lowmarket';

function atTheMarket(): GameState {
  const base = createInitialState(undefined, 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    turn: 21,
    currentLocation: MARKET,
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: { ...base.openingEstablishment!, complete: true },
    activeEncounter: null,
    journey: null,
    arcDirector: {
      turnsSinceCombatReceipt: 21,
      committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'],
    },
    stateTxLog: [],
    sceneFacts: {
      crowd: 'present',
      noise: 'unknown',
      present: ['Osric Coyne'],
      props: [],
      lastBeat: '',
      updatedTurn: 21,
    },
  } as GameState;
}

/** One live turn: director, travel, travel trim, the writer's prose, the post-writer pass, then the turn counter. */
function playTurn(state: GameState, input: string, prose: string) {
  const arc = runArcDirectorBeforeGm(state, input);
  let next = arc.state;
  const before = next.currentLocation ?? '';
  const travel = commitTravel(next, input);
  next = travel.state;
  if (next.currentLocation && next.currentLocation !== before) {
    next = applyPresentTrimOnTravel(next, before, next.currentLocation);
  }
  const preWriter = next;
  const post = ensureEncounterSpawnPreface(next, prose);
  const status = [...formatArcStatusReceipts(arc), ...post.receipts];
  return { arc, travel, preWriter, status, state: { ...post.state, turn: post.state.turn + 1 } as GameState };
}

const QUIET = [
  'Osric Coyne counted coins under the awning and did not look up.',
  'A crate tipped over somewhere behind the stalls and rolled to a stop.',
  'The fence kept his hands in his sleeves while the market muttered.',
];

function parkAtMarket() {
  const park = playTurn(atTheMarket(), 'Look around', QUIET[0]!);
  const foe = park.state.sceneFacts?.pendingEncounter;
  return { park, foe };
}

describe('foe arrival clock (s75 O)', () => {
  it('a parked skirmish foe is saved pending with the turn it was parked', () => {
    const { park, foe } = parkAtMarket();
    expect(foe).toBeTruthy();
    expect(foe!.phase).toBe('pending');
    expect(foe!.parkedTurn).toBe(21);
    expect(foe!.arrivalTurn).toBeGreaterThan(21);
    expect(park.status.some((l) => /^Encounter:/.test(l))).toBe(false);
    expect(park.state.activeEncounter ?? null).toBeNull();
    const stored = park.state.placeThreats?.[placeThreatKey(MARKET)];
    expect(stored?.lastOutcome).toBe('pending');
    expect(stored?.encounter.phase).toBe('pending');
  });

  it('three non-move turns that never name it: live by the arrival turn, one Encounter receipt, one combat log entry', () => {
    const { park, foe } = parkAtMarket();
    const name = foe!.name;
    let s = park.state;
    const inputs = ['Talk to the contact', 'Wait', 'Look around'];
    const status: string[] = [...park.status];
    let liveAt: number | null = null;
    for (let i = 0; i < 3; i++) {
      const turnNo = s.turn;
      const t = playTurn(s, inputs[i]!, QUIET[(i + 1) % QUIET.length]!);
      expect(t.travel.arrived).toBeFalsy();
      status.push(...t.status);
      if (liveAt == null && t.preWriter.activeEncounter?.name === name) liveAt = turnNo;
      s = t.state;
    }
    expect(liveAt).not.toBeNull();
    expect(liveAt!).toBeLessThanOrEqual(foe!.arrivalTurn!);
    expect(s.activeEncounter?.name).toBe(name);
    expect(s.activeEncounter?.phase).not.toBe('pending');
    expect(s.sceneFacts?.pendingEncounter).toBeUndefined();
    expect(status.filter((l) => l === `Encounter: ${name}`)).toHaveLength(1);
    expect(status.filter((l) => /^Encounter:/.test(l))).toHaveLength(1);
    expect((s.stateTxLog ?? []).filter((t) => t.kind === 'combat')).toHaveLength(1);
  });

  it('the writer gets the arrival as a settled fact on the arrival turn', () => {
    const { park, foe } = parkAtMarket();
    let s = park.state;
    while (s.turn < foe!.arrivalTurn!) s = playTurn(s, 'Wait', QUIET[1]!).state;
    const arrival = runArcDirectorBeforeGm(s, 'Wait');
    expect(arrival.state.activeEncounter?.name).toBe(foe!.name);
    expect(arrival.mandate).toContain(`Encounter: ${foe!.name}`);
  });

  it('before arrival it is on the threat line only: no presence, no HERE, no person ref, no lock, no fight pads', () => {
    const { park, foe } = parkAtMarket();
    const name = foe!.name;
    const s = park.state;
    expect(s.sceneFacts?.pendingEncounter?.phase).toBe('pending');
    expect(peopleHere(s)).not.toContain(name);
    expect(peopleOnSheet(s)).not.toContain(name);
    const sheet = buildInfoSheet(s);
    expect(sheet.here.join('\n')).not.toContain(name);
    expect(sheet.open.join('\n')).toContain(`threat building: ${name}`);
    const refs = compileRefEnum(s);
    expect(refs.some((r) => r.display === name || r.id.startsWith('encounter:'))).toBe(false);
    expect(compileNounAllowlist(s)).not.toContain(name);
    const compiled = compileChoices(s, ['Look around', 'Wait', 'Talk to the contact'], undefined, 'Look around');
    expect(compiled.notes.some((n) => /Encounter lock/i.test(n))).toBe(false);
    expect(compiled.choices.some((c) => /attack from hiding|press the attack|try to flee|\bflee\b|parley/i.test(c))).toBe(false);
  });

  it('a move turn on the arrival turn does not bring it live; leaving takes it off the page and keeps it pending at the place', () => {
    const { park, foe } = parkAtMarket();
    let s = playTurn(park.state, 'Wait', QUIET[1]!).state;
    expect(s.turn).toBe(foe!.arrivalTurn);
    const move = playTurn(s, 'Travel to West Wall', 'Jax took the lane toward the wall.');
    expect(move.travel.arrived || !!move.travel.underway).toBe(true);
    expect(move.preWriter.activeEncounter ?? null).toBeNull();
    expect(move.status.some((l) => /^Encounter:/.test(l))).toBe(false);
    expect(move.state.sceneFacts?.pendingEncounter).toBeUndefined();
    const stored = move.state.placeThreats?.[placeThreatKey(MARKET)];
    expect(stored?.lastOutcome).toBe('pending');
    expect(stored?.encounter.phase).toBe('pending');
    expect((move.state.stateTxLog ?? []).some((t) => t.kind === 'combat')).toBe(false);
  });

  it('the writer naming a parked foe does not bring it live', () => {
    const { park, foe } = parkAtMarket();
    const post = ensureEncounterSpawnPreface(park.state, `The ${foe!.name} slid between the stalls.`);
    expect(post.state.activeEncounter ?? null).toBeNull();
    expect(post.state.sceneFacts?.pendingEncounter?.name).toBe(foe!.name);
    expect(post.receipts).toEqual([]);
  });
});
