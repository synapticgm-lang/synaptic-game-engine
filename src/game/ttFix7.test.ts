/**
 * tt-fix-7 — one test per item of the mode-tt-lap-8 fix round.
 */
import { describe, expect, it } from 'vitest';
import { newGameState } from './newGameTestState';
import { writerTravelFact, writerEngineResult } from './travelJourney';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { movementFact, type CompletedEventPacket } from './completedEventPacket';
import { filterSystemLogForEngine } from './systemLog';
import { handedProperNames } from './tokenProse';
import { backedAnswerFacts, speaksOfSelf, withMoveDestination } from './writerTurn';
import { playerLineSpeaks } from './engineFactPatterns';
import { agencyProblem } from './engineFactGate';
import { placeBlurbForWriter } from './outdoorHubs';
import { tabletopStepKind } from './tabletopQuestProgress';
import type { GameState, TravelJourney } from './types';

const tabletop = (): GameState => {
  const s = newGameState('cursed-keep', { engineMode: 'dnd' });
  return { ...s, character: { ...s.character!, name: 'Jax' } } as GameState;
};

const READ_OUT = /some time passed|not there yet|on the way since|end of that walk|not arrived/i;

describe('tt-fix-7 item 1 — the writer gets a travel state, not a travel record to read out', () => {
  it('receipts become a place and a time, client and edge alike', () => {
    const arrived = 'Travel: Midnight Well to Greyhollow Inn — +30 min, now night.';
    const underway = 'Travel: open road between Keep Gate and Greyhollow Church — leg 1 of 2 — +2h, now dusk; Greyhollow Church still ahead; quiet stretch, nobody met on the road.';
    const still = 'Travel: still on the open road between Keep Gate and Greyhollow Church (dusk); the way on is blocked';
    expect(writerTravelFact(arrived)).toBe('Arrived at Greyhollow Inn. It is now night.');
    expect(writerTravelFact(underway)).toBe('On the open road toward Greyhollow Church. It is now dusk.');
    expect(writerTravelFact(still)).toBe('On the open road toward Greyhollow Church; the way on is blocked. It is now dusk.');
    expect(writerEngineResult(underway)).not.toMatch(READ_OUT);
    // The edge stub (gm-turn builds the live packet) carries the same writer form.
    const edge = readFileSync(join(process.cwd(), 'supabase/functions/_shared/gm/travelJourney.ts'), 'utf8');
    expect(edge).not.toMatch(/Some time passed|not there yet/);
    expect(edge).toContain('const on = ground ? `On the ${ground} toward ${to}` : `Toward ${to}`;');
  });

  it('the arrival line tells one arrival and no walk; the underway line no "not arrived"', () => {
    const base = tabletop();
    const arrival = {
      ...base,
      turn: 12,
      currentLocation: 'Greyhollow Inn',
      journey: null,
      circling: { movedTurn: 12, prevPlace: 'Midnight Well', lastLocation: 'Midnight Well', tripArrivalTurn: 12 },
    } as unknown as GameState;
    const line = movementFact(arrival);
    expect(line).toMatch(/Narrate one arrival at Greyhollow Inn/);
    expect(line).not.toMatch(READ_OUT);
    const journey = { from: 'Keep Gate', to: 'Greyhollow Church', ground: 'Open road', legsDone: 1, legsTotal: 2 } as TravelJourney;
    const road = movementFact({ ...arrival, journey, currentLocation: 'On the road between places' } as GameState);
    expect(road).toMatch(/^Moved this turn: on from Keep Gate toward Greyhollow Church/);
    expect(road).not.toMatch(READ_OUT);
  });
});

describe('tt-fix-7 TT01 — every travel-job roll reaches tabletop STATUS', () => {
  it('look-out, navigation and foraging dice lines stay', () => {
    const lines = [
      'Foraging: Wisdom (Survival) d20 (3) + 1 WIS = 4 vs DC 15 — failure',
      'Look-out: Wisdom (Perception) d20 (15) = 15 vs DC 15 — success',
      'Navigation: Wisdom (Survival) d20 (dis: 4, 12) + 2 WIS = 6 vs DC 10 — failure',
    ];
    expect(filterSystemLogForEngine(lines, 'dnd')).toEqual(lines);
  });
});

describe('tt-fix-7 TT02 — the engine’s own stops pass the gate; the destination is always named', () => {
  it('route-stop names are handed proper names', () => {
    const state = { ...tabletop(), routeStops: { 'greyhollow church|keep gate': [{ name: 'Leaning Gibbet', leg: 1, find: 'cache' }] } } as GameState;
    const packet = { engineResult: 'Travel: open road between Keep Gate and Greyhollow Church — leg 1 of 2.' } as unknown as CompletedEventPacket;
    expect(handedProperNames(state, packet)).toContain('Leaning Gibbet');
  });

  it('a beat that lost the destination line gets one plain sentence naming it', () => {
    const journey = { from: 'Keep Gate', to: 'Greyhollow Church', ground: 'Open road', legsDone: 1, legsTotal: 2 } as TravelJourney;
    const state = { ...tabletop(), turn: 9, journey, currentLocation: 'On the road between places', circling: { movedTurn: 9 } } as unknown as GameState;
    const prose = 'The road stayed quiet, and no one else walked it with them.';
    expect(withMoveDestination(state, prose)).toBe(`Jax was on the open road toward Greyhollow Church. ${prose}`);
    expect(withMoveDestination(state, 'Jax walked toward Greyhollow Church.')).toBe('Jax walked toward Greyhollow Church.');
    expect(withMoveDestination({ ...state, circling: { movedTurn: 8 } } as unknown as GameState, prose)).toBe(prose);
  });
});

describe('tt-fix-7 TT13 — a question chip is the player speaking', () => {
  it('"Who are you" lets the PC ask', () => {
    expect(playerLineSpeaks('Who are you')).toBe(true);
    expect(agencyProblem(tabletop(), 'Jax asked the innkeep who he was.', 'Who are you')).toBeNull();
    expect(agencyProblem(tabletop(), 'Jax asked the innkeep who he was.', 'Ready yourself and watch')).not.toBeNull();
  });
});

describe('tt-fix-7 TT18 — a place blurb never hands a person who is not there', () => {
  it('drops the absent person’s part, keeps it when they are here', () => {
    const state = {
      ...tabletop(),
      lorebook: [{ id: 'npc-aldous', name: 'Father Aldous', type: 'npc', keywords: ['Aldous'], summary: 'Priest.' }],
    } as unknown as GameState;
    const absent = { ...state, sceneFacts: { ...(state.sceneFacts ?? {}), present: ['Rosel Tew'] } } as GameState;
    expect(placeBlurbForWriter(absent, 'Father Aldous and six sleepless nights.')).toBe('');
    expect(placeBlurbForWriter(absent, 'Last coach stop — warm ale, cold silence.')).toBe('Last coach stop — warm ale, cold silence.');
    const here = { ...state, sceneFacts: { ...(state.sceneFacts ?? {}), present: ['Father Aldous'] } } as GameState;
    expect(placeBlurbForWriter(here, 'Father Aldous and six sleepless nights.')).toBe('Father Aldous and six sleepless nights.');
  });
});

describe('tt-fix-7 TT19 — a step whose purpose is a move ticks on arrival, not on the chip', () => {
  it('"to track its trail up the hill" is a move step', () => {
    expect(tabletopStepKind('Investigate the sludge to track its trail up the hill.')).toBe('move');
    expect(tabletopStepKind('Haul up the ruined, heavy bucket to examine the black sludge and severed rope.')).toBe('look');
    expect(tabletopStepKind('Review the crumbling old survey map.')).toBe('look');
  });
});

describe('tt-fix-7 item 3 / TT21 — the answer repair quotes speech only', () => {
  it('a harvest placeholder card is not a backed line', () => {
    const state = {
      ...tabletop(),
      lorebook: [{ id: 'harvest-npc-rosel-coyne', name: 'Rosel Coyne', type: 'npc', keywords: ['Rosel Coyne'], summary: 'Met in play. Details unfold through conversation.' }],
    } as unknown as GameState;
    expect(backedAnswerFacts(state, 'Rosel Coyne').join(' ')).not.toMatch(/Details unfold/);
  });

  it('a speaker talking about themselves by name is a note, not speech', () => {
    expect(speaksOfSelf('Aldous wants to know what answered from the shaft', 'Father Aldous')).toBe(true);
    expect(speaksOfSelf('A visiting scholar named Silas Thorne needs an armed escort', 'Silas Thorne')).toBe(true);
    expect(speaksOfSelf('I want to know what answered from the shaft', 'Father Aldous')).toBe(false);
  });
});
