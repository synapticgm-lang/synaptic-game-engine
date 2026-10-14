/**
 * Multi lap 34 — an item is given away only when a give verb hands a carried item over (not when a gesture or
 * someone's own bag is set down); a place may wait ahead, like it may hold or stand; a repair for a sentence set
 * in a place already left is told where the scene is and which place is behind.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../game/types';
import { harvestGivenAwayFromProse } from '../../game/closedFactLedger';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { staleLocationRepairNote } from '../../game/sceneContextTail';
import { repairRejectedSentences } from '../../game/writerTurn';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const G183 = '2026-10-12T14-11-54-540Z_summoned-pact_cold-system_s183';
const G150 = '2026-10-12T14-11-56-903Z_summoned-pact_cold-system_s150';
const D150 = '2026-10-12T14-11-57-796Z_summoned-pact_cold-system_s150';
const GLUE = /name or place title/;
const repairFlags = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: { sentence: string; flag: string; bug?: string }[] }).sentenceRepairs ?? []);

let A: Replay;
let B: Replay;
let D: Replay;
beforeAll(async () => {
  [A, B, D] = (await Promise.all([replayWhole(G183), replayWhole(G150), replayWhole(D150)])).map((s) => new Replay(s));
}, 900_000);

describe('replay bank multi lap 34', () => {
  it('[m34 long-open s78 #29 + s79 Root H | lap 34 given away] only a carried item handed over is given away', () => {
    const st = D.after(13);
    const carried = (st.inventory ?? []).map((i) => i.name);
    expect(carried, 'replay carries the Bag').toContain('Bag');
    const withNell = { ...st, sceneFacts: { ...st.sceneFacts, givenAway: [] } } as GameState;
    expect(harvestGivenAwayFromProse(withNell, 'Nell set their own bag down and knelt to help Jax with the Bag.')).toEqual([]);
    expect(harvestGivenAwayFromProse(withNell, 'Jax raised one hand and called out to the riders.')).toEqual([]);
    expect(harvestGivenAwayFromProse(withNell, 'Jax set the Bag down beside the cart and checked the strap.')).toEqual([]);
    expect(harvestGivenAwayFromProse(withNell, 'Jax handed the Bag to Nell Rudd without a word.'), 'a carried item handed to someone').toEqual(['bag']);
    expect(
      harvestGivenAwayFromProse(withNell, 'Jax set the Bag down on the crate. Nell Rudd picked it up and tucked it under her arm.'),
      'set down and taken by someone else'
    ).toEqual(['bag']);
  });

  it('[m34 g5-150 T7 + g5-183 T7 | lap 34 a place waits] "Cathedral Close waits ahead" and "Integration waits" are not a place acting as a person', () => {
    expect(A.input(7)).toBe('Walk on');
    for (const n of [6, 7]) expect(repairFlags(A, n).filter((r) => GLUE.test(r.flag)), `T${n} no glue repair`).toEqual([]);
    expect(
      sentenceGateProblem(A.after(6), 'The outdoor seam of the Integration Scar waits behind and Cathedral Close lies ahead with decisions to make.') ?? '',
      'the recorded T6 line is not glue'
    ).not.toMatch(GLUE);
    expect(sentenceGateProblem(A.after(7), 'A small task from the Pact and Integration waits to draw them onward.') ?? '').not.toMatch(GLUE);
    const st = B.after(7);
    expect(B.input(7)).toBe('Talk your way past the thugs');
    for (const line of [
      'Cathedral Close waits ahead and the night stayed tense and dangerous.',
      'Cathedral Close waits ahead, and though the thugs now lie down and cannot fight on, the night stays tense and dangerous.',
    ]) {
      expect(sentenceGateProblem(st, line), line).toBeNull();
    }
    expect(sentenceGateProblem(st, 'Cathedral Close watches Jax and waits.'), 'a place watching still fails').toMatch(GLUE);
    expect(sentenceGateProblem(st, 'Valespire looks at Jax.'), 'a place looking still fails').toMatch(GLUE);
  });

  it('[m34 ds150 T13 | lap 34 repair names the place behind] the repair request says the fight was on the back streets and Lowmarket is behind', async () => {
    expect(D.input(13)).toBe('Face the thugs');
    const state = D.after(13);
    expect(state.journey?.from, 'replay is underway from Lowmarket').toBe('Lowmarket');
    const stale = 'The first thugs dropped fast and the second followed, and then both of them lay still in the dust of Lowmarket.';
    const before = 'Jax turned to face the two thugs and swung first, hard and low, before either of them was ready.';
    expect(sentenceGateProblem(state, stale, 'Face the thugs')).toMatch(/already left/);
    expect(staleLocationRepairNote(state, before), 'no note for a sentence on the road').toBe('');
    const draft = `${before} ${stale}`;
    const check = { state, playerInput: 'Face the thugs', intent: { type: 'other' } as never, engineFact: 'Fight: VICTORY vs the thugs.', previousGm: '' };
    const turn = { prose: draft, path: 'plain' as const, outcome: 'accepted' as const, problems: [], remaining: [], firstDraft: draft };
    const packet = state.completedEvent ?? ({} as never);
    let asked = '';
    const fixed = 'The first thugs dropped fast and the second followed, and then both of them lay still in the dust of the back streets.';
    const ok = await repairRejectedSentences(turn, { packet, check, repair: async (req) => ((asked = req), fixed) });
    expect(asked).toContain(stale);
    expect(asked).toContain('This happens on the back streets from Lowmarket toward The Weighing Cup; Lowmarket is a place the player already left, away from here: nothing in this sentence is in or at Lowmarket, and nothing from Lowmarket is within sight or reach.');
    expect(ok.prose).toBe(`${before} ${fixed}`);
    const back = 'The first thugs had dropped fast and now both of them lay still back in the dust of Lowmarket.';
    const kept = await repairRejectedSentences(turn, { packet, check, repair: async () => back });
    expect(kept.repairs?.[0]?.bug, 'keeping Lowmarket still fails').toMatch(/repair failed the gate/);
  });
});
