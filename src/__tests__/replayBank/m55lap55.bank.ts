/**
 * Multi lap 55 — fact-checker false positives: "the older man" points back at a handed person (ds150 T2); the city the
 * handed places sit in is the view, not a way out (ds150 T17); "the bell gave one short ring" is a sound, not a handover
 * (ds204 T10).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS150 = '2026-10-13T09-01-12-032Z_summoned-pact_cold-system_s150';
const DS204 = '2026-10-13T09-01-34-158Z_summoned-pact_cold-system_s204';

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

describe('replay bank m55 (lap 55)', () => {
  it('[ds150 T2 | m55 fix 1 checker] "the older man" points back at a handed person', async () => {
    expect((await factFlags(DS150, 2)).filter((f) => f.kind === 'person')).toEqual([]);
    const fresh = await factFlags(DS150, 2, 'A tall man stepped out of the dark and watched Jax.');
    expect(fresh.map((f) => f.kind), '"a tall man" is still a new person').toContain('person');
  });

  it('[ds150 T17 | m55 fix 2 checker] the city around HERE is the view, not a way out', async () => {
    expect((await factFlags(DS150, 17)).filter((f) => f.kind === 'exit-place')).toEqual([]);
    const out = await factFlags(DS150, 17, 'The ash trail led out toward Valespire.');
    expect(out.map((f) => f.kind), 'a way out toward the city still flags').toContain('exit-place');
  });

  it('[ds204 T10 | m55 fix 3 checker] a thing that "gave" a sound hands no item', async () => {
    expect((await factFlags(DS204, 10)).filter((f) => f.kind === 'item')).toEqual([]);
    const handed = await factFlags(DS204, 10, 'Col gave Jax a ring and said nothing.');
    expect(handed.map((f) => f.kind), 'a ring handed to Jax still flags').toContain('item');
    const handedTo = await factFlags(DS204, 10, 'Col gave a ring to Nell and said nothing.');
    expect(handedTo.map((f) => f.kind), 'a ring handed to Nell still flags').toContain('item');
  });
});
