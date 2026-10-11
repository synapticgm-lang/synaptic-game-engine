/**
 * Seed 84 roots, replayed from the run's own picks
 * (runs/2026-10-11T07-49-04-384Z_summoned-pact_cold-system_s84) through the engine owners that move the
 * player: the card offer, travel, and the circling memory.
 * A — "Check the exits" names the same targets the travel chips offer.
 * B — a named redirect while underway sets out from the road, not from the trip's origin.
 * C — after a bounce, the underway chips rest "Turn back toward <origin>".
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { applyOpeningOfferChoice } from './openingOffer';
import { commitTravel, journeyPads, withJourneyPads } from './travelJourney';
import { recordCirclingTurn } from './choiceRanking';
import { advanceDungeonCard } from './dungeonCard';
import { engineResultFact } from './engineResult';
import { commitOfferedPad } from './playTranscript';
import { enumerateLegalEdges } from './graphChoices';
import type { GameState } from './types';

const SHRINE = 'a wayside shrine on the Valespire road';

function start(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 84, personality: 'cold-system' });
  return stampOpening(state);
}

/** One turn as the harness commits it before the writer: turn + 1, the offer or travel owner, then circling. */
function step(state: GameState, input: string): { state: GameState; receipt?: string } {
  const before: GameState = { ...state, turn: (state.turn ?? 0) + 1 };
  if (/^(?:accept|refuse) the offer$/i.test(input)) {
    const offered = applyOpeningOfferChoice(before, input);
    return { state: recordCirclingTurn(offered.state, input, [], before) };
  }
  const t = commitTravel(before, input);
  const after = t.handled ? t.state : before;
  return { state: recordCirclingTurn(after, input, t.receipt ? [t.receipt] : [], before), receipt: t.receipt };
}

function replay(picks: string[], from: GameState = start()): { state: GameState; receipts: Array<string | undefined> } {
  let state = from;
  const receipts: Array<string | undefined> = [];
  for (const pick of picks) {
    const r = step(state, pick);
    state = r.state;
    receipts.push(r.receipt);
  }
  return { state, receipts };
}

const T2_T5 = ['Refuse the offer', 'Ask the world', 'Search the area', 'Travel toward Cathedral Close'];
const BACK = `Turn back toward ${SHRINE}`;
/** s84 T8–T13: the turn-back ping-pong at the shrine, then an inspect (the T6 redirect and T7 fight are Root B's). */
const T8_T13 = [BACK, 'Travel toward Cathedral Close', BACK, 'Travel toward Cathedral Close', BACK, 'Inspect the immediate surroundings'];

describe('s84 Root A — the exits receipt reads the travel chips\' targets', () => {
  it('replayed T14 at the shrine: "Check the exits" names Cathedral Close and every offered travel chip', () => {
    const { state } = replay([...T2_T5, ...T8_T13]);
    expect(state.currentLocation).toBe(SHRINE);
    expect(state.journey ?? null).toBeNull();
    expect(state.discoveredLocations?.length ?? 0).toBeLessThanOrEqual(1);

    const prose = 'Jax looked over the shrine: a lichen-crusted saint, a dry offering bowl, the road running both ways.';
    const withBeat: GameState = {
      ...state,
      log: [...(state.log ?? []), { id: 'g13', turn: state.turn, role: 'gm', content: prose, timestamp: 0 }],
      choices: ['Travel toward Cathedral Close', 'Check the exits', 'Wait and watch'],
    };
    const offered = commitOfferedPad(withBeat, 'g13').choices ?? [];
    const edges = enumerateLegalEdges(withBeat).filter((e) => e.type === 'travel' && e.target).map((e) => e.label);
    const travelChips = [...new Set([...offered, ...edges].filter((c) => /^Travel toward /.test(c)))];
    expect(travelChips.length).toBeGreaterThan(0);

    const fact = engineResultFact(advanceDungeonCard({ ...state, turn: state.turn + 1 }, 'Check the exits').receipts);
    expect(fact).toMatch(/^Exits: the ways out of a wayside shrine on the Valespire road lead to /);
    expect(fact).toContain('Cathedral Close');
    for (const chip of travelChips) expect(fact).toContain(chip.replace(/^Travel toward /, ''));
  });

  it('underway, the receipt also names the trip origin', () => {
    const { state } = replay(T2_T5);
    expect(state.journey?.from).toBe(SHRINE);
    const fact = engineResultFact(advanceDungeonCard({ ...state, turn: state.turn + 1 }, 'Check the exits').receipts);
    expect(fact).toContain(SHRINE);
    expect(fact).toContain('Cathedral Close');
  });
});

describe('s84 Root B — a redirect while underway sets out from the road', () => {
  it('replayed T6 "Travel toward Contract Hall" never restarts leg 1 from the shrine', () => {
    const { state, receipts } = replay([...T2_T5, 'Travel toward Contract Hall']);
    const t6 = receipts[receipts.length - 1] ?? '';
    expect(t6).not.toMatch(/between a wayside shrine on the Valespire road and Contract Hall/);
    expect(t6).toMatch(/^Travel: off the .+ between a wayside shrine on the Valespire road and Cathedral Close/);
    if (state.journey) expect(state.journey.to).toBe('Contract Hall');
    else expect(state.currentLocation).toBe('Contract Hall');
  });
});

describe('s84 Root C — turn back rests after a bounce', () => {
  it('the first trip offers turn back; after the T8 bounce the T9 trip does not', () => {
    const first = replay(T2_T5).state;
    expect(journeyPads(first)).toContain(BACK);

    const again = replay([BACK, 'Travel toward Cathedral Close'], first).state;
    expect(again.journey?.to).toBe('Cathedral Close');
    expect(journeyPads(again)).not.toContain(BACK);
    expect(journeyPads(again)).toContain('Walk on');
    expect(withJourneyPads(again, ['Look around'])).not.toContain(BACK);
  });

  it('the turn back returns once the bounce has rested', () => {
    let s = replay([...T2_T5, BACK, 'Travel toward Cathedral Close']).state;
    for (let i = 0; i < 4; i++) s = step(s, 'Wait and watch').state;
    expect(s.journey?.to).toBe('Cathedral Close');
    expect(journeyPads(s)).toContain(BACK);
  });
});
