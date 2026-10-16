/**
 * Multi lap 28 — a described opening place's prepositions ("a Crown archive stack behind iron mesh") are not
 * the place's own words, and quoted talk ("The priests told us…", "the Close steps") puts no opening pin in the
 * room, so Tilde Tew's answer in the Undercroft is not dropped as the archive acting here; a title may own a
 * seal ("under the Crown seal") though it cannot have hands; a role behind describing words ("the close-eyed
 * clerk") is still a person nobody declared.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { isPlaceTitleObjectGlue } from '../../game/slotGlue';
import { lineHasUnboundAnimate } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Repair = { sentence: string; flag: string; bug?: string };
const D177 = '2026-10-12T11-07-52-074Z_summoned-pact_cold-system_s177';
const G177 = '2026-10-12T11-07-52-142Z_summoned-pact_cold-system_s177';

const repairs = (X: Replay, n: number) =>
  (X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? [];

let D: Replay;
let G: Replay;
beforeAll(async () => {
  // One after the other: the recorded writer replies are one queue.
  D = new Replay(await replayWhole(D177));
  G = new Replay(await replayWhole(G177));
}, 1_800_000);

describe('replay bank multi lap 28', () => {
  it('[m28 ds177 T19 | lap 28 opening words and quoted talk] Tilde Tew answers in the Undercroft', () => {
    expect(D.input(19)).toBe('Talk to Tilde Tew');
    const s = D.before(19);
    expect(s.currentLocation).toBe('Cathedral Undercroft');
    expect(s.openingEstablishment?.answers?.where).toBe('a Crown archive stack behind iron mesh');
    expect(repairs(D, 19).filter((r) => r.bug)).toEqual([]);
    expect(D.prose(19)).toMatch(/Tilde said, "I was posted on the Close steps/);
    expect(D.prose(19)).toMatch(/what stood behind it was the question/);

    expect(sentenceGateProblem(s, 'Archivist Lene waits at the desk.'), 'the pin acting here still fails').toMatch(/already left/);
    expect(
      sentenceGateProblem(s, 'Jax stood among the archive shelves again, the mesh cold under one hand.'),
      'the archive as the camera still fails'
    ).toMatch(/already left/);
  });

  it('[m28 ds177 T16 | lap 28 a title owns a seal] "under the Crown seal" is not a title glued into an object slot', () => {
    expect(D.input(16)).toBe('Walk on');
    expect(repairs(D, 16).filter((r) => r.bug)).toEqual([]);
    expect(D.prose(16)).toMatch(/nailed up under the Crown seal/);

    expect(isPlaceTitleObjectGlue('Jax gripped the Crown hands and pulled.', ['Crown']), 'a title with hands still glues').toBe(true);
    expect(isPlaceTitleObjectGlue('Jax crouched beside the Sevenfold chest.', ['Sevenfold'])).toBe(true);  });

  it('[m28 g5-177 T7 | lap 28 role behind describing words] "the close-eyed clerk" is an undeclared person', () => {
    expect(G.input(7)).toBe('Check the exits');
    expect(G.verdicts(7)).toEqual(['action:ok', 'react:ok', 'hook:ok']); // P-5a/c: an invented role person is registered, not refused
    expect(G.prose(7)).toMatch(/clerk/);

    expect(lineHasUnboundAnimate('a tall guard watched the gate')).toBe(true);
    expect(lineHasUnboundAnimate('the clerk looked up')).toBe(true);
    expect(lineHasUnboundAnimate('the old official stamp lay on the desk'), 'a role word describing a thing').toBe(false);
    expect(lineHasUnboundAnimate('a word with Lene and the mesh'), 'no role word').toBe(false);
  });
});
