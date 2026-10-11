/**
 * Multi lap 11 — the checker reads "the only path there" as the one way to a named exit, not the exit
 * count; a scene prop's lowercase name ("the wooden chest") is not a place title glued into an object
 * slot; and the commit gate tells the writer which closed-fact check failed instead of one label for all.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isPlaceTitleObjectGlue } from '../../game/slotGlue';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS150 = '2026-10-11T17-17-47-642Z_summoned-pact_cold-system_s150';
const S78 = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';

/** Fact-check one recorded turn with the page so far; `gmText` replaces the recorded prose when given. */
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

let R: Replay;
const problems = (n: number) =>
  ((R.at(n).telemetry as { draftProblems?: string[] }).draftProblems ?? []).join('\n');
beforeAll(async () => {
  R = new Replay(await replayWhole(S78));
}, 1_800_000);

describe('replay bank multi lap 11', () => {
  it('[m11 ds150 T6,T20 | lap 11 Root A] "the only path there" to a named exit is not a count of the exits', async () => {
    for (const n of [6, 20]) {
      expect((await factFlags(DS150, n)).filter((f) => f.kind === 'exit-count'), `T${n}`).toEqual([]);
    }
    const total = 'Only one road left the stretch, and the four men stood across it.';
    expect((await factFlags(DS150, 20, total)).map((f) => f.kind), 'a bare count of one still flags').toContain('exit-count');
  });

  it('[m11 s78 T7,T11 | lap 11 Root B] "the wooden chest" (a scene prop) is not a place title glued into an object slot', () => {
    expect(R.input(7)).toBe('Check the chest');
    expect(R.input(11)).toBe('Press the contact on the dispute');
    for (const n of [7, 11]) {
      expect(R.prose(n), `T${n} prose has the chest`).toMatch(/the wooden chest/);
      expect(problems(n), `T${n}`).not.toMatch(/name or place title|Reopens a closed fact/);
    }
    expect(isPlaceTitleObjectGlue('Jax crouched beside the Sevenfold chest.', ['Sevenfold']), 'a capitalised title still glues').toBe(true);
  });

  it('[m11 s78 T9,T10 | lap 11 Root C] a stale-place draft is told it names a place already left, not "Reopens a closed fact"', () => {
    expect(R.before(9).journey?.to, 'T9 is on the road to the Undercroft').toBe('Cathedral Undercroft');
    expect(problems(9)).toMatch(/a place or fight the player already left/);
    for (const n of [9, 10]) expect(problems(n), `T${n}`).not.toMatch(/Reopens a closed fact/);
  });
});
