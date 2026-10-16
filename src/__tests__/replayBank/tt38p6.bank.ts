/**
 * TT38-P6 — lap 38 quiet-leg pages. The fact checker already leaves them unmarked.
 * The names sit in that turn's writer prompt, so they are not invented places.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Row = { turn: number; gmText?: string };
type Flag = { kind: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const D = '2026-10-16T19-01-40-309Z_cursed-keep_chilled-gm_s18374';
const B = '2026-10-16T18-57-51-823Z_cursed-keep_chilled-gm_s18348';

async function factFlags(run: string, turn: number): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn).padStart(2, '0')}.txt`);
  return mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
}

describe('TT38-P6 lap 38 quiet legs still pass the fact checker', () => {
  it('D T14 Hollow Spring and B T10 Burned Farm add no exit-place or name flag', async () => {
    const kinds = async (run: string, turn: number) => (await factFlags(run, turn)).map((f) => f.kind);
    expect(await kinds(D, 14)).toEqual([]);
    expect(await kinds(B, 10)).toEqual([]);
  });
});
