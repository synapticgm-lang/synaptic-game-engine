/**
 * Multi lap 41 — a parked license wagon is not the moving-wagon spine (s82 Root F), a way out that names a
 * known place nobody handed fails the gate (Cinderflow Road / the war camp off West Wall), and "two more ways
 * out" adds to the count before it instead of being read as the total.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { handedExits } from '../../game/exitCount';
import { hookCtxFromState, matchLitRpgMainSpineFromCtx } from '../../data/quests/litrpgMainSpines';
import type { SentenceRepair } from '../../game/writerTurn';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS150 = '2026-10-12T17-27-29-895Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-12T17-27-30-220Z_summoned-pact_cold-system_s151';
const DS190 = '2026-10-12T17-27-30-518Z_summoned-pact_cold-system_s190';
const S82 = '2026-10-11T07-19-29-838Z_summoned-pact_cold-system_s82';

let A: Replay;
let B: Replay;
let C: Replay;
let W: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(DS150));
  B = new Replay(await replayWhole(DS151));
  C = new Replay(await replayWhole(DS190));
  W = new Replay(await replayWhole(S82));
}, 900_000);

const repairsOf = (X: Replay, n: number) => ((X.at(n).telemetry as { sentenceRepairs?: SentenceRepair[] }).sentenceRepairs ?? []);
/** The state the gate checked a move turn's prose against: arrived, with the turn's own packet. */
const gateState = (X: Replay, n: number): GameState => X.after(n);

describe('replay bank m41 lap 41', () => {
  it('[ds151 T7, ds190 T16 | m41 exit-place] a road out of West Wall to an unhanded hub fails the gate and never reaches the page', () => {
    expect(B.after(7).currentLocation, 'ds151 reaches West Wall on T7').toBe('West Wall');
    expect(C.after(16).currentLocation, 'ds190 reaches West Wall on T16').toBe('West Wall');
    expect(handedExits(gateState(B, 7)), 'Cinderflow Road is no handed way out').not.toContain('Cinderflow Road');
    expect(B.prose(7)).not.toMatch(/Cinderflow/);
    expect(repairsOf(B, 7).map((r) => r.flag)).toEqual([expect.stringMatching(/^Names a way out West Wall does not have \(Cinderflow Road\)/)]);
    expect(C.prose(16)).not.toMatch(/war camp/i);
    expect(repairsOf(C, 16).map((r) => r.flag)).toEqual([expect.stringMatching(/^Names a way out West Wall does not have \(war camp\)/)]);
    // A handed way out, the place here, and a place the road only passes stay legal.
    const s = gateState(B, 7);
    expect(sentenceGateProblem(s, 'Below the battlements the road ran on toward Lowmarket.', B.input(7))).toBeNull();
    expect(sentenceGateProblem(s, 'The West Wall road ran north past the Cinderflow Road and down to Contract Hall.', B.input(7))).toBeNull();
  });

  it('[ds150 T16 | m41 more ways] "two doors…, while two more ways out" is a total of four, not two', () => {
    const s = gateState(A, 16);
    expect(handedExits(s), 'Cathedral Close has 4 ways out on T16').toHaveLength(4);
    const recorded = repairsOf(A, 16).find((r) => /^Gives the wrong number of ways out/.test(r.flag));
    expect(recorded?.sentence, 'replay rejects the "Two doors stood open" sentence').toMatch(/^Two doors stood open off the yard/);
    const fixed =
      'Two doors stood open off the yard, one to the Contract Hall and one down toward the Cathedral Undercroft, while the Lowmarket road and the West Wall gate offered two more ways out for Jax to choose from.';
    expect(sentenceGateProblem(s, fixed, A.input(16))).toBeNull();
    expect(sentenceGateProblem(s, fixed.replace('two more', 'three more'), A.input(16))).toMatch(/^Gives the wrong number of ways out/);
    expect(sentenceGateProblem(s, recorded!.sentence, A.input(16))).toMatch(/^Gives the wrong number of ways out/);
  });

  it('[s82 T2-T20 | s82 Root F] the wagon desk of the Argent Ledger does not get the moving-wagon spine', () => {
    expect(W.before(2).currentLocation, 'replay opens at the wagon desk').toBe('the wagon desk of the Argent Ledger');
    expect(matchLitRpgMainSpineFromCtx(hookCtxFromState(W.before(2)))?.spineId ?? null).not.toBe('hollow-transit-glitch');
    for (const n of W.turns()) {
      expect((W.after(n).quests ?? []).map((q) => q.id), `T${n}`).not.toContain('sp-spine-hollow-transit-glitch');
      expect(W.receiptText(n), `T${n}`).not.toMatch(/highwaymen|moving wagon/i);
    }
    // A caravan opening still gets it.
    const caravan = { ...W.before(2), currentLocation: 'a caravan on the Merchant’s Road', openingEstablishment: undefined };
    expect(matchLitRpgMainSpineFromCtx(hookCtxFromState(caravan))?.spineId).toBe('hollow-transit-glitch');
  });
});
