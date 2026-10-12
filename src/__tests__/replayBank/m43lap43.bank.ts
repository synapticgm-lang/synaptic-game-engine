/**
 * Multi lap 43 — a talk stage whose giver stands here comes before the trip to the quest's site, and at the
 * card place it keeps the card's talk chip (s80 Root A); a cast person's painted given name alone is that person
 * ("Ilyra said…"); a sentence that fails the draft's reason is found even when it also fails a check only out of
 * context, and its rewrite is judged in its draft ("Below, the Cinderflow Road ran west…").
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem, sentenceGateProblems } from '../../game/beatCommitGate';
import { storyChip } from '../../game/choiceRanking';
import { repairRejectedSentences, type DraftCheck, type SentenceRepair, type WriterTurnResult } from '../../game/writerTurn';
import type { CompletedEventPacket } from '../../game/completedEventPacket';
import { parsePlayerIntent } from '../../game/intentParser';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS151 = '2026-10-12T18-29-57-789Z_summoned-pact_cold-system_s151';
const DS192 = '2026-10-12T18-29-57-826Z_summoned-pact_cold-system_s192';
const S80 = '2026-10-10T23-51-52-084Z_summoned-pact_cold-system_s80';
const HOLD = 'a harbor circle in the hold of a Valespire grain-ship';

let A: Replay;
let B: Replay;
let S: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(DS151));
  B = new Replay(await replayWhole(DS192));
  S = new Replay(await replayWhole(S80));
}, 900_000);

const repairsOf = (X: Replay, n: number) => ((X.at(n).telemetry as { sentenceRepairs?: SentenceRepair[] }).sentenceRepairs ?? []);
const EXIT_PLACE = /^Names a way out West Wall does not have \(Cinderflow Road\)/;
const HOOK = 'Below, the Cinderflow Road ran west toward the Mireglass March, and something moved along the ash trail beyond the last gate.';

describe('replay bank m43 lap 43', () => {
  it('[s80 T4,T5 | m43 talk stage here] the giver here at the card place gets "Ask what they want", not the trip', () => {
    for (const n of [4, 5]) {
      const s = S.after(n - 1);
      expect(s.currentLocation, `T${n}`).toBe(HOLD);
      expect(s.sceneFacts?.present ?? [], `T${n} the smugglers are here`).toContain('the smugglers');
      expect(s.quests.find((q) => q.id === 'sp-quest-1')?.location, 'the quest site is still Cathedral Close').toBe('Cathedral Close');
      expect(storyChip(s), `T${n}`).toBe('Ask what they want');
      expect(S.chips(n), `T${n}`).toContain('Ask what they want');
    }
    // With nobody here the stage waits and the trip is the step.
    const away = S.after(7);
    expect(away.sceneFacts?.present ?? []).toEqual([]);
    expect(storyChip(away)).toBe('Travel toward Cathedral Close');
    expect(S.chips(8)).not.toContain('Ask what they want');
  });

  it('[ds192 T4 | m43 painted given name alone] "Ilyra said…" is Ilyra Fen, not a new person', () => {
    const s = B.after(4);
    expect(s.sceneFacts?.present ?? []).toContain('Ilyra Fen');
    const line = 'Ilyra said the March remembers every step a person takes twice, and that Jax had just taken their second.';
    expect(sentenceGateProblem(s, line, B.input(4))).toBeNull();
    expect(repairsOf(B, 4)).toEqual([]);
    expect(B.prose(4)).toContain('Ilyra said the March remembers');
    // A person nobody handed still fails.
    expect(sentenceGateProblem(s, 'Hollis Venn said the March remembers every step a person takes twice.', B.input(4))).toMatch(/^Invents a person/);
  });

  it('[ds151 T20 | m43 located repair] the Cinderflow Road hook is found and kept off the page', () => {
    const s = A.after(20);
    expect(s.currentLocation, 'ds151 reaches West Wall on T20').toBe('West Wall');
    const own = sentenceGateProblems(s, HOOK, A.input(20));
    expect(own.length, 'the hook also fails a check out of context').toBeGreaterThan(1);
    expect(own.some((p) => EXIT_PLACE.test(p))).toBe(true);
    const rep = repairsOf(A, 20);
    expect(rep.map((r) => r.sentence)).toEqual([HOOK]);
    expect(rep[0]!.bug ?? '').not.toMatch(/unlocated/);
    expect(A.prose(20)).not.toMatch(/Cinderflow Road/);
  });

  it('[ds151 T20 | m43 rewrite in its draft] a rewrite is judged by the reasons its draft fails too', async () => {
    const s = A.after(20);
    const draft = A.prose(20).replace(/\s*$/, ` ${HOOK}`);
    const check: DraftCheck = { state: s, playerInput: A.input(20), intent: parsePlayerIntent(A.input(20), s), engineFact: '', previousGm: '' };
    const turn = { prose: draft } as unknown as WriterTurnResult;
    const packet = s.completedEvent as CompletedEventPacket;
    const run = (line: string) => repairRejectedSentences(turn, { packet, check, repair: async () => line });
    const good = 'Below, the road ran west toward Cathedral Close, and far past the wall lay the Mireglass March.';
    expect(sentenceGateProblems(s, good, A.input(20)).some((p) => EXIT_PLACE.test(p))).toBe(false);
    const kept = await run(good);
    expect(kept.repairs?.[0]?.bug).toBeUndefined();
    expect(kept.prose).toContain(good);
    const bad = 'Below, the Cinderflow Road ran west out of the wall toward the far marsh.';
    const dropped = await run(bad);
    expect(dropped.repairs?.[0]?.bug ?? '').toMatch(/^repair failed the gate: Names a way out/);
    expect(dropped.prose).not.toMatch(/Cinderflow Road/);
  });
});
