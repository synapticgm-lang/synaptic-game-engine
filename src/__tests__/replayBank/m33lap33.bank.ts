/**
 * Multi lap 33 — opening hall talk is with the card's cast only while the player is still at the card's place,
 * a look-around after the covers gets the normal list, and the open card offer's chips are engine chips; the
 * checker reads the REF ENUM here label ("Entry") as HERE; underway from the opening place, naming it as the
 * road's start is not an occupancy reset.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isOpeningOccupancyReset } from '../../game/sceneContextTail';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL182 = '2026-10-12T13-06-12-417Z_summoned-pact_cold-system_s182';
const DS182 = '2026-10-12T13-06-12-612Z_summoned-pact_cold-system_s182';
const FL150 = '2026-10-12T13-06-12-599Z_summoned-pact_cold-system_s150';

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

let F: Replay;
let H: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FL182));
  H = new Replay(await replayWhole(FL150));
}, 1_800_000);

const repairs = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: { sentence: string; flag: string; bug?: string }[] }).sentenceRepairs ?? []);

describe('replay bank multi lap 33', () => {
  it('[m33 fl182 T10-T12 | lap 33 hall talk away from the card] after "Refuse Nell Rudd" at Cathedral Close the list is ordinary play', () => {
    expect(F.input(10), 'replay refused Nell on T9').toBe('Reach into the pocket');
    expect(F.before(10).currentLocation).toBe('Cathedral Close');
    for (const n of [10, 11, 12]) {
      const chips = F.chips(n);
      expect(chips, `T${n}`).not.toContain('Ask what they want');
      if (n === 10) expect(chips.some((c) => /^(Talk to|Ask) (Nell Rudd|Col Thatch)\b/.test(c)), `T${n}: ${chips.join(' / ')}`).toBe(true);
    }
  });

  it('[m33 ds182 T5,T6 | lap 33 checker here label] "Entry" (the REF ENUM here label) is HERE, not another place or a way out', async () => {
    expect((await factFlags(DS182, 5)).filter((f) => f.kind === 'move')).toEqual([]);
    expect((await factFlags(DS182, 6)).filter((f) => f.kind === 'exit-place')).toEqual([]);
    const away = await factFlags(DS182, 6, 'Jax took the only exit toward Contract Hall and left the stone outline behind.');
    expect(away.map((f) => f.kind), 'a real place named as a way out still flags').toContain('exit-place');
  });

  it('[m33 fl150 T7 | lap 33 trip start is the road] "the back streets from the grain-ship\'s hold" is the road, not the hold as HERE', () => {
    expect(H.input(7)).toBe('Talk your way past the thugs');
    expect(H.before(7).journey?.from, 'the trip set out from the hold').toMatch(/hold of a Valespire grain-ship/);
    expect(repairs(H, 7).filter((r) => /already left as if it were here/.test(r.flag))).toEqual([]);
    const st = H.before(7);
    expect(isOpeningOccupancyReset(st, 'Jax stood on the back streets from the Valespire grain-ship\'s hold.')).toBe(false);
    expect(isOpeningOccupancyReset(st, 'Jax stood on the back streets near the Valespire grain-ship\'s hold.')).toBe(false);
    expect(isOpeningOccupancyReset(st, 'Jax stood in the hold of the Valespire grain-ship again.'), 'the camera in the hold still resets').toBe(true);
  });
});
