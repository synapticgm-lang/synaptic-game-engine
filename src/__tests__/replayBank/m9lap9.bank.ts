/**
 * Multi lap 9 — the paste step paints whole sentences from valid writer JSON (a plural's possessive,
 * a speaker token used as the tag), a count nobody handed and the page never told fails its line
 * (the checker reads the page so far too), and a talk shape with no addressee still names who it is to.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { checkActionFollowed } from '../../game/turnCheck';
import { handedCountText, lineHasUnhandedCount } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS150 = '2026-10-11T16-33-11-088Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-11T16-33-11-702Z_summoned-pact_cold-system_s151';
const DS158 = '2026-10-11T16-33-11-305Z_summoned-pact_cold-system_s158';
const FL150 = '2026-10-11T16-33-12-889Z_summoned-pact_cold-system_s150';
const MINI150 = '2026-10-11T16-33-11-195Z_summoned-pact_cold-system_s150';
const MINI158 = '2026-10-11T16-33-11-636Z_summoned-pact_cold-system_s158';

/** Fact-check one recorded turn, with the page so far (page 1 and the earlier beats) unless `noPage`. */
async function factFlags(run: string, turn: number, noPage = false): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number; gmText?: string });
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', noPage ? '' : page);
}

let H: Replay;
let U: Replay;
let N: Replay;
let F: Replay;
let M: Replay;
let K: Replay;
beforeAll(async () => {
  H = new Replay(await replayWhole(DS150));
  U = new Replay(await replayWhole(DS151));
  N = new Replay(await replayWhole(DS158));
  F = new Replay(await replayWhole(FL150));
  M = new Replay(await replayWhole(MINI150));
  K = new Replay(await replayWhole(MINI158));
}, 1_800_000);

describe('replay bank multi lap 9', () => {
  it('[m9 mini150 T5 | lap 9 Root A] a plural display takes the bare apostrophe ("the smugglers\' silence")', () => {
    expect(M.input(5)).toBe('Check the exits');
    expect(M.prose(5), 'replay paints the hook line').toMatch(/smugglers['’] silence/);
    expect(M.prose(5)).not.toMatch(/smugglers['’]s/);
    expect((M.turnCheck(5)?.p0 ?? []).map((f) => f.kind)).not.toContain('broken-prose');
  });

  it('[m9 mini158 T7 | lap 9 Root A] a speech line headed by its own speaker token is that speaker\'s quoted words', () => {
    expect(K.input(7)).toBe('Ask what they want');
    expect(K.prose(7)).toMatch(/Sula said, "I require your living signature/);
    expect(K.prose(7)).not.toMatch(/Sula I require/);
    expect((K.turnCheck(7)?.p0 ?? []).map((f) => f.kind)).not.toContain('broken-prose');
  });

  it('[m9 ds150 T21, ds151 T4, ds158 T7 | lap 9 Root B] a count no fact holds and the page never told fails its line', () => {
    // Earned XP (xp-fix): ds158 holds 0 XP at T7 (no turn-5 First Steps), so its "one hundred and
    // twenty-five" window line is a count no fact holds too, and only the action line stays.
    const cases: [Replay, number, RegExp, number][] = [
      [H, 21, /six years/, 2],
      [U, 4, /three sides/, 2],
      [N, 7, /fifteen more points|one hundred and twenty-five/, 1],
    ];
    for (const [R, n, invented, beats] of cases) {
      expect(R.verdicts(n), `T${n} drops the counted line`).toContain(R.verdicts(n).find((v) => v.endsWith(':count')));
      expect(R.prose(n), `T${n}`).not.toMatch(invented);
      expect(R.prose(n).split(/(?<=[.!?]["”]?)\s+/).length, `T${n} keeps a beat`).toBeGreaterThanOrEqual(beats);
    }
    expect(N.before(7).character.xp).toBe(0);
    const handed0 = handedCountText(N.before(7), N.before(7).completedEvent);
    expect(lineHasUnhandedCount('The number had climbed to one hundred and twenty-five.', handed0)).toBe(true);
    // The handed count is fine: an info sheet holding 125 XP is the number the window line may use.
    const s7 = N.before(7);
    const handed = handedCountText(s7, { ...s7.completedEvent!, infoSheet: `${s7.completedEvent?.infoSheet ?? ''}\nXP: 125/150` });
    expect(lineHasUnhandedCount('The number had climbed to one hundred and twenty-five.', handed)).toBe(false);
    expect(lineHasUnhandedCount('The window showed fifteen more points.', handed)).toBe(true);
  });

  it('[m9 ds150 T2 | lap 9 Root B] a count page 1 already told ("Three sailors") stays, in game and checker', async () => {
    expect(H.input(2)).toBe('Ask what they want');
    expect(H.verdicts(2).some((v) => v.endsWith(':count'))).toBe(false);
    expect(H.prose(2)).toMatch(/the three figures/);
    expect((await factFlags(DS150, 2)).filter((f) => f.kind === 'number')).toEqual([]);
    expect((await factFlags(DS150, 2, true)).some((f) => f.kind === 'number'), 'without the page it still flags').toBe(true);
  });

  it('[m9 fl150 T7 | lap 9 Root C] talking your way past the thugs is answered when the thugs act in the prose', () => {
    expect(F.input(7)).toBe('Talk your way past the thugs');
    expect((F.turnCheck(7)?.p0 ?? []).map((f) => f.kind)).not.toContain('ignored-action');
    const silent = checkActionFollowed(F.before(7), F.after(7), F.input(7), 'Jax spoke and the road stayed quiet. The Cathedral Close waited ahead.');
    expect(silent.p0.map((f) => f.kind), 'nobody answering still flags').toContain('ignored-action');
  });
});
