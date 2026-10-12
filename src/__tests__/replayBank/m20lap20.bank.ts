/**
 * Multi lap 20 — "the only way on" is the one way ahead, not every way out; a capitalised sentence-start word in
 * front of a known name ("Now Jax waits") is that name, not an invented person; a place may hold what is in it
 * ("Cathedral Close holds questions") — only the person verbs are a place acting.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const D150 = '2026-10-12T05-26-59-462Z_summoned-pact_cold-system_s150';
const G151 = '2026-10-12T05-27-06-892Z_summoned-pact_cold-system_s151';

type Repair = { sentence: string; flag: string; bug?: string };
const repairs = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? []);

let D: Replay;
let G: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(D150));
  G = new Replay(await replayWhole(G151));
}, 1_800_000);

describe('replay bank multi lap 20', () => {
  it('[m20 ds150 T19 | lap 20 one way on] "the only way on ran past the traveler" is not a count of the ways out', () => {
    expect(D.input(19)).toBe('Travel toward Cathedral Undercroft');
    expect(repairs(D, 19).filter((r) => /wrong number of ways out/.test(r.flag))).toEqual([]);
    const s = D.before(19);
    expect(sentenceGateProblem(s, 'The lane narrowed between two high walls, and the only way on ran straight past the traveler.')).toBeNull();
    expect(sentenceGateProblem(s, 'Only one road led out of the close.'), 'a total count is still checked').toMatch(
      /wrong number of ways out/,
    );
  });

  it('[m20 g5-151 T2 | lap 20 Now Jax] "Now Jax waits inside a treaty tent" names Jax, not an invented person', () => {
    expect(G.input(2)).toBe('Accept the offer');
    expect(repairs(G, 2).filter((r) => /Invents a person or place/.test(r.flag))).toEqual([]);
    const s = G.before(2);
    expect(sentenceGateProblem(s, 'Now Jax waits inside a treaty tent on the Cinderflow road in tense quiet for the next orders.')).toBeNull();
    expect(sentenceGateProblem(s, 'Orel Vane waits inside the tent for the next orders.'), 'a new name still fails').toMatch(
      /Invents a person or place/,
    );
  });

  it('[m20 g5-151 T15 | lap 20 place holds] "Cathedral Close holds questions" is a place holding, not a place acting', () => {
    expect(G.input(15)).toBe('Walk on');
    expect(repairs(G, 15).filter((r) => /name or place title/.test(r.flag))).toEqual([]);
    const s = G.before(15);
    expect(sentenceGateProblem(s, 'Now Cathedral Close holds questions and a quiet threat that will need answers.')).toBeNull();
    expect(sentenceGateProblem(s, 'Cathedral Close watches Jax come in from the back streets.'), 'a place acting still fails').toMatch(
      /name or place title/,
    );
  });
});
