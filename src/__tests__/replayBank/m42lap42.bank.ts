/**
 * Multi lap 42 — a move leaves the old place's crowd behind (s80 Root D: the Undercroft door's crowd followed
 * Jax into Stair Descent), a sentence-start word in front of a cast person's painted given name is that
 * person ("Whatever Garth wanted…"), and "…; two more routes—A and B—lay beyond" adds to the count before it.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { handedExits } from '../../game/exitCount';
import type { SentenceRepair } from '../../game/writerTurn';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS150 = '2026-10-12T18-12-14-301Z_summoned-pact_cold-system_s150';
const DS191 = '2026-10-12T18-12-14-325Z_summoned-pact_cold-system_s191';
const S80 = '2026-10-10T23-51-52-084Z_summoned-pact_cold-system_s80';

let A: Replay;
let B: Replay;
let S: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(DS150));
  B = new Replay(await replayWhole(DS191));
  S = new Replay(await replayWhole(S80));
}, 900_000);

const repairsOf = (X: Replay, n: number) => ((X.at(n).telemetry as { sentenceRepairs?: SentenceRepair[] }).sentenceRepairs ?? []);

describe('replay bank m42 lap 42', () => {
  it('[s80 T15-T17 | m42 crowd move] a move seats no crowd from the last place or the arrival prose', () => {
    expect(S.after(15).currentLocation, 's80 arrives at Cathedral Undercroft on T15').toBe('Cathedral Undercroft');
    expect(S.prose(15), 'the T15 writer invents a crowd the packet never handed').toMatch(/A crowd of strangers/);
    expect(S.packet(15)).toMatch(/^NOW:.*with 1 here/m);
    expect(S.after(16).currentLocation ?? '', 's80 enters Stair Descent on T16').toMatch(/Stair Descent$/);
    for (const n of [15, 16, 17]) {
      expect(S.after(n).sceneFacts?.crowd, `T${n}`).not.toBe('present');
      expect(S.after(n).sceneFacts?.crowdCount, `T${n}`).toBeUndefined();
      expect(S.after(n).sceneFacts?.present ?? [], `T${n}`).not.toContain('bystanders');
    }
  });

  it('[ds150 T21 | m42 painted given name] "Whatever Garth wanted…" is Garth Barrow, not a new person', () => {
    expect(A.after(21).currentLocation, 'ds150 is back at Cathedral Undercroft on T21').toBe('Cathedral Undercroft');
    expect(A.after(21).sceneFacts?.present ?? []).toContain('Garth Barrow');
    const line = 'Whatever Garth wanted to say next, it was still waiting behind his teeth, and the undercroft kept its cold.';
    expect(sentenceGateProblem(A.after(21), line, A.input(21))).toBeNull();
    expect(repairsOf(A, 21)).toEqual([]);
    expect(A.prose(21)).toContain('Whatever Garth wanted to say next');
    // A person nobody handed still fails.
    expect(sentenceGateProblem(A.after(21), 'By the wall, Hollis Venn looks up and says nothing at all.', A.input(21))).toMatch(/^Invents a person/);
  });

  it('[ds191 T12 | m42 more routes] "Two paths…; two more routes—…—lay beyond" is four ways out of Lowmarket', () => {
    const s = B.after(12);
    expect(s.currentLocation, 'ds191 reaches Lowmarket on T12').toBe('Lowmarket');
    expect(handedExits(s), 'Lowmarket has 4 ways out').toHaveLength(4);
    const recorded = repairsOf(B, 12)[0];
    expect(recorded?.sentence, 'replay rejects "Two paths led on"').toMatch(/^Two paths led on from the stalls/);
    expect(sentenceGateProblem(s, recorded!.sentence, B.input(12))).toMatch(/^Gives the wrong number of ways out/);
    const fixed =
      'Two paths led on from the stalls, and both of them led somewhere Jax had never been; two more routes—Cathedral Close and Cathedral Undercroft—lay beyond the back streets.';
    expect(sentenceGateProblem(s, fixed, B.input(12))).toBeNull();
    expect(sentenceGateProblem(s, fixed.replace('two more', 'three more'), B.input(12))).toMatch(/^Gives the wrong number of ways out/);
    // An added count with no count of ways out before it is not about the exits.
    expect(sentenceGateProblem(s, 'Jax passed two more streets of stalls before the noise thinned.', B.input(12))).toBeNull();
  });
});
