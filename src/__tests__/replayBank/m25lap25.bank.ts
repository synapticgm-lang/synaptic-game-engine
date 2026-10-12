/**
 * Multi lap 25 — a job role word that only describes a thing ("the official stamp") puts no unbound person in the
 * line, so the present person's answer is kept; the checker reads a word naming what a handed thing is made of
 * ("the peeling paper notices" at the notice board) and a thing's own contents ("the Contract Hall and its papers")
 * as no new item.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { lineHasUnboundAnimate } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const F174 = '2026-10-12T10-15-22-070Z_summoned-pact_cold-system_s174';
const G174 = '2026-10-12T10-15-21-612Z_summoned-pact_cold-system_s174';

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
beforeAll(async () => {
  F = new Replay(await replayWhole(F174));
}, 1_800_000);

describe('replay bank multi lap 25', () => {
  it('[m25 fl174 T2 | lap 25 role word as a describer] "the official stamp" keeps the clerk\'s answer to "Refuse the work"', () => {
    expect(F.input(2)).toBe('Refuse the work');
    expect(F.verdicts(2)).toContain('react:ok');
    expect(F.prose(2)).toMatch(/Brin Holt clutched the official stamp/);
    expect(F.turnCheck(2)?.p0 ?? []).toEqual([]);
    expect(lineHasUnboundAnimate('Brin Holt clutched the official stamp in sudden panic.')).toBe(false);
    expect(lineHasUnboundAnimate('A clerk watched Jax from the desk.'), 'a role person still fails').toBe(true);
    expect(lineHasUnboundAnimate('Jax paid the vendor two coins.'), 'a role person as an object still fails').toBe(true);
  });

  it('[m25 fl174 T4 | lap 25 checker material word] "the peeling paper notices" at the notice board is no new item', async () => {
    expect(await factFlags(F174, 4)).toEqual([]);
    const bad = await factFlags(F174, 4, 'Jax searched the notice board. A paper tucked behind it held a map.');
    expect(bad.map((f) => f.missing).join(' | '), 'a found paper is still an item').toMatch(/"paper"/);
  });

  it('[m25 g5-174 T13 | lap 25 checker thing\'s contents] "the Contract Hall and its papers" is no new item', async () => {
    expect(await factFlags(G174, 13)).toEqual([]);
    const bad = await factFlags(G174, 13, 'Jax opened the crate and found its papers.');
    expect(bad.map((f) => f.missing).join(' | '), 'papers Jax finds are still an item').toMatch(/"papers"/);
  });
});
