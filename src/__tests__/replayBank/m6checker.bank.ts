/**
 * Multi lap 6 — fact-checker cases on saved lap-5 turns: the recorded prose against the packet the writer was handed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');

async function factFlags(run: string, turn: number): Promise<{ input: string; flags: Flag[] }> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string) => Flag[];
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number; playerInput: string });
  const row = rows.find((r) => r.turn === turn)!;
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return { input: row.playerInput, flags: mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '') };
}

const FL152 = '2026-10-11T14-37-31-344Z_summoned-pact_cold-system_s152';
const DS152 = '2026-10-11T14-37-34-625Z_summoned-pact_cold-system_s152';
const FL153 = '2026-10-11T14-37-37-201Z_summoned-pact_cold-system_s153';
const DS153 = '2026-10-11T14-37-43-055Z_summoned-pact_cold-system_s153';

describe('replay bank multi lap 6 fact checker', () => {
  it('[m6 s152fl T5 | lap 5 Root 1] the place the exits receipt stands in is not one of its ways out', async () => {
    const { input, flags } = await factFlags(FL152, 5);
    expect(input).toBe('Check the exits');
    expect(flags.filter((f) => f.kind === 'exit-count')).toEqual([]);
  });

  it('[m6 s152ds T5 | lap 5 Root 1] four named ways out and "four ways out" give no exit-count flag', async () => {
    const { flags } = await factFlags(DS152, 5);
    expect(flags.filter((f) => f.kind === 'exit-count')).toEqual([]);
  });

  it('[m6 s153fl T21 | lap 5 Root 1] HERE written with its own article is not counted as a fifth exit', async () => {
    const { input, flags } = await factFlags(FL153, 21);
    expect(input).toBe('Check the exits');
    expect(flags.filter((f) => f.kind === 'exit-count')).toEqual([]);
  });

  it('[m6 s152fl T4 | lap 5 open] a subset of the exits named as all of them still flags', async () => {
    const { flags } = await factFlags(FL152, 4);
    expect(flags.some((f) => f.kind === 'exit-count')).toBe(true);
  });

  it('[m6 s153ds T5/T11 + s152ds T16 | lap 5 Root 3] worn garments are covered by the handed clothes', async () => {
    for (const [run, turn] of [[DS153, 5], [DS153, 11], [DS152, 16]] as const) {
      const { flags } = await factFlags(run, turn);
      expect(flags.filter((f) => f.kind === 'item'), `${run} T${turn}`).toEqual([]);
    }
  });
});
