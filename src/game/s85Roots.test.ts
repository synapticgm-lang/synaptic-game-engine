/**
 * Seed 85 roots, replayed from the run's own picks
 * (runs/2026-10-11T09-44-06-552Z_summoned-pact_cold-system_s85) through the owners the harness runs
 * before the writer, in its order: the arc director, the card offer, travel, the dungeon card, circling,
 * then the arc commit after the turn. The replay matches the live run's trips, meetings and the T17 drought park.
 * A — a foe parked on the road keeps the road chips (Walk on) as the list.
 * B — the quest resume chip: "Travel toward" for a pin never visited, never a second chip to the same place,
 *     never while the trip already heads there.
 * C — a speaker is a person here (the road meeting counts), never a place, and does not just say their own name.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { applyOpeningOfferChoice } from './openingOffer';
import { commitTravel } from './travelJourney';
import { recordCirclingTurn } from './choiceRanking';
import { applyArcDirectorCommit, runArcDirectorBeforeGm } from './arcDirector';
import { advanceDungeonCard } from './dungeonCard';
import { commitOfferedPad } from './playTranscript';
import { buildCompletedEventPacket } from './completedEventPacket';
import { acceptTokenOrLedgerStory } from './tokenProse';
import type { GameState } from './types';

function start(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 85, personality: 'cold-system' });
  return stampOpening(state);
}

/** One harness turn before the writer, then the arc commit; the turn counter moves last. */
function step(state: GameState, input: string): GameState {
  let s: GameState = { ...state };
  const receipts: string[] = [];
  if (s.openingEstablishment?.complete) {
    const arc = runArcDirectorBeforeGm(s, input);
    s = arc.state;
    receipts.push(...arc.systemReceipts);
  }
  const offer = applyOpeningOfferChoice(s, input);
  s = offer.state;
  receipts.push(...offer.receipts);
  const t = commitTravel(s, input);
  if (t.handled) s = t.state;
  if (t.receipt) receipts.push(t.receipt);
  const d = advanceDungeonCard(s, input, receipts);
  s = d.state;
  const next: GameState = { ...recordCirclingTurn(s, input, [...receipts, ...d.receipts], state), turn: (state.turn ?? 0) + 1 };
  return { ...next, ...applyArcDirectorCommit(state, next, []) };
}

function replay(picks: string[]): GameState {
  return picks.reduce(step, start());
}

/** The chips offered after a writer beat that proposed `proposed` (the harness compiles them once on the final state). */
function offered(state: GameState, proposed: string[]): string[] {
  const id = `g${state.turn}`;
  const beat: GameState = {
    ...state,
    log: [...(state.log ?? []), { id, turn: state.turn, role: 'gm', content: 'The back streets ran on between shuttered stalls.', timestamp: 0 }],
    choices: proposed,
  };
  return commitOfferedPad(beat, id).choices ?? [];
}

/** s85 T2–T16 as Fate picked them. */
const T2_T8 = ['Refuse the offer', 'Ask what they want', 'Who are you', 'Read the device', 'Search the area', 'Inspect the immediate surroundings', 'Travel toward Cathedral Close'];
const T2_T10 = [...T2_T8, 'Walk on', 'Travel toward West Wall'];
const T2_T16 = [...T2_T10, 'Call out to a bystander', 'Greet whoever is coming', 'Walk on', 'Travel toward The Weighing Cup', 'Walk on', 'Travel toward Lowmarket'];
/** What the writer proposed on the road at T17 in the live run. */
const ROAD_PROPOSED = ['Force a path forward', 'Wait and listen carefully', 'Call out to a bystander'];

describe('s85 Root A — a foe parked on the road keeps the road chips', () => {
  it('replayed T17–T18 toward Lowmarket: the drought parks, and the list keeps Walk on and two more chips', () => {
    let s = replay(T2_T16);
    expect(s.journey?.to).toBe('Lowmarket');
    expect(s.journey?.encounter ?? null).toBeNull();
    s = step(s, 'Wait and listen carefully');
    expect(s.sceneFacts?.pendingEncounter).toBeTruthy();
    expect(s.activeEncounter ?? null).toBeNull();
    for (const turn of [17, 18]) {
      const list = offered(s, ROAD_PROPOSED);
      expect(list[0]).toBe('Walk on');
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(list).not.toContain('Force a path forward');
      expect(list).not.toContain('Call out to a bystander');
      if (turn === 17) s = step(s, 'Call out to a bystander');
    }
    // The live fight still takes its own chips when the arrival clock runs out.
    s = step(s, 'Wait and listen carefully');
    expect(s.activeEncounter).toBeTruthy();
    expect(offered(s, ROAD_PROPOSED)).not.toContain('Walk on');
  });
});

describe('s85 Root B — the quest resume chip', () => {
  it('replayed T7 before the trip: one chip for Cathedral Close, and it is not "Return to"', () => {
    const s = replay(T2_T8.slice(0, -1));
    expect(s.places?.some((p) => p.name === 'Cathedral Close' && p.lastVisitedTurn != null)).toBe(false);
    const list = offered(s, ['Inspect the immediate surroundings', 'Look around']);
    expect(list.filter((c) => /Cathedral Close$/.test(c))).toEqual(['Travel toward Cathedral Close']);
  });

  it('replayed T8 underway toward Cathedral Close: Walk on, and no other chip to Cathedral Close', () => {
    const s = replay(T2_T8);
    expect(s.journey?.to).toBe('Cathedral Close');
    const list = offered(s, ['Inspect the immediate surroundings']);
    expect(list).toContain('Walk on');
    expect(list).not.toContain('Return to Cathedral Close');
    expect(list.filter((c) => /Cathedral Close$/.test(c))).toEqual([]);
  });
});

describe('s85 Root C — the speaker is a person here', () => {
  it('replayed T11 on the road toward West Wall: the destination as speaker fails, the road meeting as speaker stands', () => {
    const s = step(replay(T2_T10), 'Call out to a bystander');
    expect(s.journey?.to).toBe('West Wall');
    expect(s.journey?.encounter?.kind).toBe('meeting');
    const packet = buildCompletedEventPacket(s, 'Call out to a bystander');
    const refs = packet.refEnum ?? [];
    const dest = refs.find((r) => r.display === 'West Wall');
    const person = refs.find((r) => r.id.startsWith('road:'));
    expect(dest?.klass).toBe('place');
    expect(person?.klass).toBe('person');

    const beat = (speaker: string, speakerUse: string, words: string) =>
      JSON.stringify({
        refs: [
          { tok: `@${dest!.tok}`, id: dest!.id, use: 'place' },
          { tok: `@${speaker}`, id: refs.find((r) => r.tok === speaker)!.id, use: speakerUse },
        ],
        lines: [
          { fn: 'place', text: `The back streets toward @${dest!.tok} ran on between shuttered stalls.` },
          { fn: 'action', text: 'Jax called out along the street.' },
          { fn: 'speech', text: words, speaker_tok: `@${speaker}` },
        ],
      });
    const run = (raw: string) => acceptTokenOrLedgerStory(raw, s, packet, { lenient: true, noLedgerFallback: true });

    const asPlace = run(beat(dest!.tok, 'speaker', '"West Wall?"'));
    expect(asPlace.speech ?? []).toEqual([]);
    expect(asPlace.prose).not.toMatch(/West Wall said/);

    const echo = run(beat(person!.tok, 'speaker', `"${person!.display}. You carry the mark."`));
    expect((echo.speech ?? []).length).toBe(0);

    const asPerson = run(beat(person!.tok, 'speaker', '"The gate shuts at dusk."'));
    expect(asPerson.speech?.[0]?.speakerId).toBe(person!.id);
    expect(asPerson.prose).toMatch(/said, "The gate shuts at dusk\."/);
  });
});
