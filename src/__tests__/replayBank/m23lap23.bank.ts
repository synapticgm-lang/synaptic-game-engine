/**
 * Multi lap 23 — names in the People here notes the writer is handed ("Sells: Health Tonic; Iron Nail; Reed Salve")
 * are not invented capitals; a past-perfect sentence about the place just left ("Jax had just finished their business
 * in Lowmarket") tells the time before the move, not the camera; a typed ref id with a class prefix and the display
 * name ("present:Nell Rudd") is that REF ENUM row, not an unknown id.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { classifyTokenLine, handedProperNames, refEnumOf, type TokenBeat } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Repair = { sentence: string; flag: string; bug?: string };
const F150 = '2026-10-12T06-21-53-405Z_summoned-pact_cold-system_s150';
const F151 = '2026-10-12T06-22-26-198Z_summoned-pact_cold-system_s151';
const G172 = '2026-10-12T06-22-29-514Z_summoned-pact_cold-system_s172';
const F172 = '2026-10-12T06-22-31-738Z_summoned-pact_cold-system_s172';

const failedRepairs = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? []).filter((r) => r.bug);

let A: Replay;
let B: Replay;
let G: Replay;
let C: Replay;
beforeAll(async () => {
  [A, B, G, C] = (await Promise.all([replayWhole(F150), replayWhole(F151), replayWhole(G172), replayWhole(F172)])).map(
    (s) => new Replay(s)
  );
}, 1_800_000);

describe('replay bank multi lap 23', () => {
  it('[m23 ds172 T5 | lap 23 people-here names] Nox Kade naming his handed wares is spoken, not cut as invented capitals', () => {
    // The hosted DeepSeek replay drifts from T1, so the state is the same seed's opening hall with Nox Kade here.
    const s = G.before(2);
    expect(s.currentLocation).toBe('the hearing pit of the Sump Court');
    const names = handedProperNames(s);
    expect(names).toEqual(expect.arrayContaining(['Health Tonic', 'Iron Nail', 'Reed Salve']));
    const beat: TokenBeat = { refs: [{ tok: 't3', id: 'cast:nox-kade', use: 'speaker' }], lines: [] };
    const speech = (text: string) => ({ fn: 'speech' as const, text, speaker_tok: 't3', spoken: true });
    expect(
      classifyTokenLine(speech('Back again, are you. Same three wares, same copper prices. Health Tonic, Iron Nail, Reed Salve. Which one do you want?'), beat, refEnumOf(s), names)
    ).toEqual({ ok: true });
    expect(
      classifyTokenLine(speech('Back again, are you. I have a Silver Lantern for you today.'), beat, refEnumOf(s), names),
      'a name nobody handed still fails'
    ).toEqual({ ok: false, reason: 'capital' });
  });

  it('[m23 fl150 T12 + T15, fl151 T15 | lap 23 past perfect] "Jax had just finished their business in Lowmarket" is not the place left acting as here', () => {
    expect(A.input(12)).toBe('Travel toward The Weighing Cup');
    expect(failedRepairs(A, 12)).toEqual([]);
    expect(failedRepairs(A, 15)).toEqual([]);
    expect(B.input(15)).toBe('Travel toward Cathedral Undercroft');
    expect(failedRepairs(B, 15)).toEqual([]);
    const s = A.after(12);
    expect(sentenceGateProblem(s, 'Jax had just finished their business in Lowmarket.')).toBeNull();
    expect(sentenceGateProblem(s, 'Jax stood in Lowmarket again, among the stalls.'), 'the place left as HERE still fails')
      .toMatch(/already left/);
    expect(sentenceGateProblem(s, 'Jax had returned and stood in Lowmarket among the stalls.'), 'going back is still a move')
      .toMatch(/already left/);
  });

  it('[m23 fl172 T14 | lap 23 typed display-name id] refs typed "present:Nell Rudd" bind to the Nell Rudd row, so the beat is not cut to one bare line', () => {
    expect(C.input(14)).toBe('Refuse Nell Rudd and keep your own counsel');
    expect(C.verdicts(14).filter((v) => /unknown/.test(v))).toEqual([]);
    expect(C.prose(14)).toMatch(/Nell/);
    expect((C.turnCheck(14)?.p0 ?? []).filter((p) => p.kind === 'ignored-action')).toEqual([]);
  });
});
