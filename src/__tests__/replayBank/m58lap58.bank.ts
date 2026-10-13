/**
 * Multi lap 58 — a reported question about a place left behind ("asked her straight what the circle outside the
 * west wall was for") and "the question of the circle" are talk, not the camera back there (ds207 T10 / T13);
 * a speech line said to another person by name ("…come out quiet, @t8?") keeps its quotes and speaker (ds207 T10);
 * a thing Jax handles as their own that no fact hands ("set down their pack") fails its line (g5-151 T14).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblems } from '../../game/beatCommitGate';
import { handedCountText, lineHasUnhandedOwnThing, parseTokenBeat } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayRun } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS207 = '2026-10-13T10-36-01-746Z_summoned-pact_cold-system_s207';
const G5151 = '2026-10-13T10-35-58-609Z_summoned-pact_cold-system_s151';
const STALE = /already left as if it were here/;

let D: Replay;
let G: Replay;
beforeAll(async () => {
  D = new Replay(await replayRun(DS207, 13));
  G = new Replay(await replayRun(G5151, 14));
}, 600_000);

describe('replay bank m58 (lap 58)', () => {
  it('[ds207 T10 | m58 fix 1] asking what the circle was for is talk, not the camera back at the circle', () => {
    expect(D.input(10)).toBe('Talk to Nell Rudd');
    const asked = 'Jax stepped close to Nell Rudd and asked her straight what the circle outside the west wall was for.';
    expect(sentenceGateProblems(D.after(10), asked, 'Talk to Nell Rudd').filter((p) => STALE.test(p))).toEqual([]);
    expect(D.prose(10)).toMatch(/asked her straight what the circle outside the west wall was for/);
  });

  it('[ds207 T13 | m58 fix 1] "the question of the circle" is talk; the line commits as written', () => {
    const line = 'The question of the circle still sat between them, and now both of them were watching Jax to see what they would do.';
    expect(sentenceGateProblems(D.after(13), line, D.input(13)).filter((p) => STALE.test(p))).toEqual([]);
    expect(D.prose(13)).not.toMatch(/even here on the back streets/);
  });

  it('[m58 fix 1] narration that puts Jax back in the circle still fails', () => {
    const s = D.after(10);
    const sent = 'Jax stood in the circle outside the west wall again, the stones cold underfoot.';
    expect(sentenceGateProblems(s, sent, 'Talk to Nell Rudd').some((p) => STALE.test(p))).toBe(true);
  });

  it('[ds207 T10 | m58 fix 2] Nell\'s second line, said to Col by name, keeps its quotes and speaker', () => {
    expect(D.prose(10)).toMatch(/"Then why do the ones who go in come out quiet, Col\?/);
    expect(D.prose(10)).not.toMatch(/me\. Then why do/);
  });

  it('[m58 fix 2] a line that tells what the speaker did to someone stays indirect', () => {
    const beat = parseTokenBeat(JSON.stringify({
      refs: [{ tok: 't7', use: 'speaker' }, { tok: 't8', use: 'actor' }],
      lines: [{ fn: 'speech', speaker_tok: 't7', text: 'She told @t8 the weighing was a lie.' }],
    }));
    expect(beat?.lines[0]?.spoken ?? false).toBe(false);
  });

  it('[g5-151 T14 | m58 fix 3] "set down their pack" with no pack handed fails; the beat drops it', () => {
    expect(G.input(14)).toBe('Walk on');
    const handed = handedCountText(G.before(14));
    expect(lineHasUnhandedOwnThing('Jax set down their pack and smoothed the clothes they wore.', handed, 'Jax')).toBe(true);
    expect(G.prose(14)).not.toMatch(/\bpack\b/);
    expect(G.prose(14)).toMatch(/Cathedral Close/);
  });

  it('[m58 fix 3] clothes, a handed bag, the body, or another person\'s own tool are not new kit', () => {
    const handed = handedCountText(G.before(14));
    const own = (line: string, h = handed) => lineHasUnhandedOwnThing(line, h, 'Jax');
    expect(own('Jax shrugged off their clothes and set them aside.')).toBe(false);
    expect(own('Jax set down their hands on the rail.')).toBe(false);
    expect(own('Jax set down their pack.', `inventory: bag x1\n${handed}`)).toBe(false);
    expect(own('Nell unslung her crossbow and set it on the table.')).toBe(false);
    expect(own('Jax unslung their crossbow and set it on the table.')).toBe(true);
    expect(own("Nell watched as Jax's satchel hit the floor; Jax opened Jax's satchel.")).toBe(true);
  });
});
