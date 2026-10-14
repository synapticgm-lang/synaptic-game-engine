/**
 * Root A (seed 79) — the chips are compiled once per turn, on the final committed state. The GM log
 * entry, `state.choices`, the live ActionBar and Fate's next pick all read that one list.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { applyOpeningOfferChoice } from './openingOffer';
import { commitOfferedPad, resolveOfferedChoices, withOfferedChoices } from './playTranscript';
import { filterInventedContextChoices } from './choiceWarden';
import { sceneSafeFallbacks } from './choicePipeline';
import { commitTravel, roadEncounterLevel } from './travelJourney';
import type { GameState, LogEntry } from './types';

function seed79(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 79, personality: 'cold-system' });
  return stampOpening(state);
}

/** Commit one turn the way the harness does: player line + GM beat, turn + 1, raw pad as `choices`. */
function commitTurn(state: GameState, input: string, prose: string, raw: string[]): { state: GameState; gm: LogEntry } {
  const turn = (state.turn ?? 0) + 1;
  const gm: LogEntry = { id: `g${turn}`, turn, role: 'gm', content: prose, timestamp: 0 };
  const next: GameState = {
    ...state,
    turn,
    log: [...(state.log ?? []), { id: `p${turn}`, turn: state.turn, role: 'player', content: input, timestamp: 0 }, gm],
    choices: raw,
  };
  return { state: commitOfferedPad(next, gm.id), gm };
}

const ROUGH_MEN =
  'Jax walked the back streets toward Contract Hall. Three rough men stepped off a doorstep and spread across the lane, one of them tapping a cudgel against his palm.';

/** T14: on the road to Contract Hall with the engine's thugs on this stretch. */
function t14Road(): GameState {
  const trip = commitTravel({ ...seed79(), turn: 13 }, 'Travel toward Contract Hall').state;
  const j = trip.journey!;
  return {
    ...trip,
    journey: { ...j, encounter: { kind: 'thugs', level: roadEncounterLevel(trip, j.areaTier ?? 1), stretch: j.legsDone, dangerous: false } },
  };
}

describe('s79 Root A — one chip list per turn', () => {
  it('T14 replay: the log, the stored pad and the next-turn Fate list are one list', () => {
    const raw = ['Turn back toward Cathedral Close', 'Call out to a bystander', 'Wait and listen carefully', 'Face the thugs', 'Talk your way past the thugs'];
    const { state: committed, gm } = commitTurn(t14Road(), 'Travel toward Contract Hall', ROUGH_MEN, raw);
    const logged = committed.log.find((e) => e.id === gm.id)?.offeredChoices;
    expect(logged?.length).toBeGreaterThan(0);
    expect(committed.choices).toEqual(logged);
    expect(withOfferedChoices(gm, committed).offeredChoices).toEqual(resolveOfferedChoices(committed));
    expect(resolveOfferedChoices(committed)).toEqual(logged);
    // A newer recentChoices (what moved the second run before) does not change the turn's list.
    const later = { ...committed, recentChoices: [...(committed.recentChoices ?? []), { turn: committed.turn, choices: logged! }] };
    expect(resolveOfferedChoices(later)).toEqual(logged);
  });

  it('a chip the commit removed is not in the next call', () => {
    const invented = 'Inspect the crystals breaking the street';
    const raw = ['Turn back toward Cathedral Close', invented, 'Wait and listen carefully'];
    const { state: committed } = commitTurn(t14Road(), 'Travel toward Contract Hall', ROUGH_MEN, raw);
    expect(committed.offeredPad?.choices).not.toContain(invented);
    expect(resolveOfferedChoices(committed)).not.toContain(invented);
    expect(resolveOfferedChoices({ ...committed, recentChoices: [] })).not.toContain(invented);
  });

  it('the engine placed the thugs: "Face the thugs" is grounded though the prose says "three rough men"', () => {
    const road = t14Road();
    const state: GameState = {
      ...road,
      log: [...road.log, { id: 'g', turn: road.turn, role: 'gm', content: ROUGH_MEN, timestamp: 0 }],
    };
    expect(filterInventedContextChoices(['Face the thugs', 'Talk your way past the thugs, but fail and they attack'], state)).toEqual([
      'Face the thugs',
      'Talk your way past the thugs, but fail and they attack',
    ]);
    const { state: committed } = commitTurn(road, 'Walk on', ROUGH_MEN, ['Face the thugs', 'Talk your way past the thugs', 'Turn back toward Cathedral Close']);
    expect(resolveOfferedChoices(committed)).toContain('Face the thugs');
  });

  it('after the card offer is accepted, neither list holds "Refuse and keep your own counsel"', () => {
    const s = seed79();
    const taken = applyOpeningOfferChoice(s, 'Accept the offer').state;
    expect(taken.openingEstablishment?.offerTaken).toBe('accepted');
    const prose = 'Ila handed over the visitor\'s tabard and the pass-token. "Tabard for the street, token for the gate," she says, and the pike-guards watched the stair.';
    const withBeat: GameState = {
      ...taken,
      turn: (taken.turn ?? 0) + 1,
      log: [...taken.log, { id: 'gb', turn: (taken.turn ?? 0) + 1, role: 'gm', content: prose, timestamp: 0 }],
    };
    const raw = sceneSafeFallbacks(withBeat, prose, 'Accept the offer');
    expect(raw).not.toContain('Refuse and keep your own counsel');
    const { state: committed, gm } = commitTurn(taken, 'Accept the offer', prose, raw);
    const logged = committed.log.find((e) => e.id === gm.id)?.offeredChoices ?? [];
    expect(logged).not.toContain('Refuse and keep your own counsel');
    expect(resolveOfferedChoices(committed)).not.toContain('Refuse and keep your own counsel');
    expect(resolveOfferedChoices(committed)).toEqual(logged);
  });

  it('an old save with no stored pad still compiles (opening, Continue)', () => {
    const s = seed79();
    expect(s.offeredPad ?? null).toBeNull();
    expect(resolveOfferedChoices(s)).toEqual(expect.arrayContaining(['Accept the offer', 'Refuse the offer']));
    const stale = { ...s, offeredPad: { turn: (s.turn ?? 0) - 1, choices: ['Old chip'] } };
    expect(resolveOfferedChoices(stale)).not.toContain('Old chip');
  });
});
