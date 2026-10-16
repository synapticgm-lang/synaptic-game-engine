/**
 * Multi lap 45 — the same person doing the same thing again in a later beat is a repeat however the tail reads
 * ("Nell Rudd looked up from a crate…", s83 T9/T11); a counted way out is read when the sentence later says the
 * ways lead on ("Two doors waited…, and both of them led…") or says "the only way in and out" (ds194 T20,
 * ds151 T19); a role the turn's own engine result names ("Go with the handler…") is not a person who is not here
 * (gpt-5-mini s194 T3).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { plainLineFactProblem } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const S83 = '2026-10-11T07-32-23-189Z_summoned-pact_cold-system_s83';
const DS194 = '2026-10-12T20-54-30-340Z_summoned-pact_cold-system_s194';
const DS151 = '2026-10-12T20-54-18-237Z_summoned-pact_cold-system_s151';
const G5194 = '2026-10-12T20-54-38-821Z_summoned-pact_cold-system_s194';

let T: Replay;
let D: Replay;
let C: Replay;
let G: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(S83));
  D = new Replay(await replayWhole(DS194));
  C = new Replay(await replayWhole(DS151));
  G = new Replay(await replayWhole(G5194));
}, 900_000);

/** The state the writer's gate reads: the turn's move and event already committed. */
const gateState = (X: Replay, n: number) => X.after(n);
const WRONG_COUNT = /^Gives the wrong number of ways out/;

describe('replay bank m45 lap 45', () => {
  it('[s83 T9,T11 | m45 same opening clause] Nell looking up from a crate is told once; T11 keeps its new lines', () => {
    expect(T.after(11).currentLocation, 'replay returns to Cathedral Close on T11').toBe('Cathedral Close');
    expect(T.prose(9)).toMatch(/Nell Rudd looked up from a crate/);
    expect(T.prose(11)).not.toMatch(/Nell Rudd looked up from a crate/);
    expect(T.prose(11), 'the turn-back line stays').toMatch(/^Jax turned at the end of the lane/);
    expect(T.prose(11)).toMatch(/wiped her hands on her apron/);
  });

  it('[ds194 T20 | m45 counted ways that lead on] "Two doors waited…, and both of them led…" is a count of the ways out', () => {
    const state = gateState(D, 20);
    const line = 'Two doors waited at the edge of the close, and both of them led somewhere Jax had not been yet.';
    expect(sentenceGateProblem(state, line, D.input(20))).toMatch(WRONG_COUNT);
    expect(D.prose(20)).not.toMatch(/Two doors waited/);
    expect(sentenceGateProblem(state, 'Two doors waited at the edge of the close, and the wind pushed at both.', D.input(20))).toBeNull();
  });

  it('[ds151 T19 | m45 the only way in and out] an answer line calling one road the only way in and out fails the count', () => {
    const state = gateState(C, 19);
    const line = '"The Cinderflow road\'s the only way in and out of this close, so I\'ll ask you plain: what\'s your business with the Cathedral?" Oda Dunmore said.';
    expect(sentenceGateProblem(state, line, C.input(19))).toMatch(WRONG_COUNT);
    expect(C.prose(19)).not.toMatch(/only way in and out/);
  });

  it('[g5-194 T3 | m45 handed role] refusing the offer keeps the refusal line that names the handler from the engine result', () => {
    expect(G.input(3)).toBe('Refuse the offer');
    expect(G.after(3).completedEvent?.engineResult ?? '', 'the engine result names the handler').toMatch(/the handler/);
    expect(G.verdicts(3).filter((v) => /unbound-animate/.test(v))).toEqual([]);
    expect(G.prose(3)).toMatch(/Jax refused the handler's offer/);
    expect((G.turnCheck(3)?.p0 ?? []).filter((f) => f.kind === 'ignored-action')).toEqual([]);
    const s = gateState(G, 3);
    expect(plainLineFactProblem('The handler watched Jax from the doorway.', s, s.completedEvent ?? undefined)).toBeNull();
    // P-5a/c (John, 2026-10-16): the writer may invent a fitting person or thing; it is registered, not refused.
    expect(plainLineFactProblem('A clerk watched Jax from the doorway.', s, s.completedEvent ?? undefined), 'an invented role person passes').toBeNull();
  });
});
