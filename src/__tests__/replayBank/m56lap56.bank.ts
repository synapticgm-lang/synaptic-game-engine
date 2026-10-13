/**
 * Multi lap 56 — a place the writer already named before its token is not doubled when the repeat is shortened
 * ("the circle at the circle", g5-150 T4); the answer repair is handed the sheets of the people who could answer, so
 * it has something new to say (fl151 T7); the checker reads "the gate road ran on toward Contract Hall" as the road
 * to a handed exit (ds151 T12) and "drew closer to the ring" as movement, not a thing drawn (g5-150 T4).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { LedgerRef } from '../../game/completedEventPacket';
import { varyRepeatMentions } from '../../game/mentionVariety';
import { Replay } from './bank';
import { replayRun } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const G5150 = '2026-10-13T09-58-46-652Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-13T09-59-12-916Z_summoned-pact_cold-system_s151';
const FL151 = '2026-10-13T09-59-11-212Z_summoned-pact_cold-system_s151';

async function factFlags(run: string, turn: number, gmText?: string): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(gmText ? { ...row, gmText } : row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
}

let G: Replay;
let F: Replay;
beforeAll(async () => {
  G = new Replay(await replayRun(G5150, 4));
  F = new Replay(await replayRun(FL151, 7));
}, 600_000);

describe('replay bank m56 (lap 56)', () => {
  it('[g5-150 T4 | m56 fix 1] "the circle at @t1" does not become "the circle at the circle"', () => {
    expect(G.input(4)).toBe('Look around');
    expect(G.before(4).currentLocation).toMatch(/harbor circle/);
    const prose = G.prose(4);
    expect(prose).toMatch(/waited in the circle\./);
    expect(prose).not.toMatch(/\bcircle (?:at|in|of|on) the circle\b/i);
  });

  it('[m56 fix 1] a later mention elsewhere still takes the short form', () => {
    const here = 'a harbor circle in the hold of a Valespire grain-ship';
    const refs = [{ id: 'here', display: here, klass: 'place' }] as unknown as LedgerRef[];
    const out = varyRepeatMentions(`Jax stood at ${here}. The crew waited near ${here}.`, refs);
    expect(out).toBe(`Jax stood at ${here}. The crew waited near the circle.`);
  });

  it('[fl151 T7 | m56 fix 3] the answer repair is handed the sheets of the people who could answer', () => {
    expect(F.input(7)).toBe('Talk to Nell Rudd');
    const request = F.at(7).writerPackets.find((p) => p.startsWith('Your story left out the answer'));
    expect(request, 'the answer repair ran on T7').toBeTruthy();
    expect(request).toMatch(/Who they are \(answer from this, in their own voice\): .*Nell Rudd \(informant\) — wants: protect vulnerable workers/);
    expect(request).toMatch(/Col Thatch \(keeper\) — wants: recover what was taken/);
    expect(request).not.toMatch(/@t\d/);
  });

  it('[ds151 T12 | m56 fix 2 checker] the road to a handed exit is that way out', async () => {
    expect((await factFlags(DS151, 12)).filter((f) => f.kind === 'exit-place')).toEqual([]);
    const off = await factFlags(DS151, 12, 'Far below, the gate road ran on toward Saltmere, and the exits stood open.');
    expect(off.map((f) => f.kind), 'a road toward an unhanded place still flags').toContain('exit-place');
  });

  it('[g5-150 T4 | m56 fix 2 checker] "drew closer to the ring" is movement, not a thing drawn', async () => {
    expect((await factFlags(G5150, 4)).filter((f) => f.kind === 'item')).toEqual([]);
    const drawn = await factFlags(G5150, 4, 'Jax drew a ring from the crate and turned it over.');
    expect(drawn.map((f) => f.kind), 'a ring drawn out still flags').toContain('item');
  });
});
