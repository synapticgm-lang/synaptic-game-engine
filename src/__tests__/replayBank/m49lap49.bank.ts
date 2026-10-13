/**
 * Multi lap 49 — a dungeon room's HERE paints in prose words ("the Corridor in Cathedral Undercroft"), not as the
 * map key "Cathedral Undercroft — Corridor" (g5-150 T17/T18/T20); a line opening on a label this turn's facts use
 * ("Dungeon: …", "Travel: …") is engine record, not story (g5-150 T20, g5-198 T18); the checker reads "Two
 * strangers" as the two people handed here (ds198 T19).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { plainLineFactProblem } from '../../game/tokenProse';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const G5150 = '2026-10-13T04-06-00-889Z_summoned-pact_cold-system_s150';
const DS198 = '2026-10-13T04-06-16-987Z_summoned-pact_cold-system_s198';
const G5198 = '2026-10-13T04-06-25-207Z_summoned-pact_cold-system_s198';

async function checker() {
  return (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
}

/** The checker on one recorded turn, with the turn's prose swapped when `gmText` is given. */
async function factFlags(run: string, turn: number, gmText?: string): Promise<Flag[]> {
  const mod = await checker();
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(gmText ? { ...row, gmText } : row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
}

/** The page before turn n, with turn n's own packet. */
const atTurn = (R: Replay, n: number) => ({ ...R.before(n), completedEvent: R.after(n).completedEvent }) as GameState;

let A: Replay;
let B: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(G5150));
  B = new Replay(await replayWhole(G5198));
}, 1_800_000);

describe('replay bank m49 lap 49', () => {
  it('[g5-150 T18 | m49 room HERE in prose words] the Corridor paints as "the Corridor in Cathedral Undercroft"', () => {
    expect(A.input(18)).toBe('Next unexplored room');
    const here = (A.after(18).completedEvent?.refEnum ?? []).find((r) => r.id === 'here');
    expect(here?.display).toBe('the Corridor in Cathedral Undercroft');
    expect(A.prose(18)).toMatch(/the Corridor in Cathedral Undercroft/);
    for (const n of [17, 18, 20]) expect(A.prose(n)).not.toMatch(/Cathedral Undercroft\s+[—–-]\s+\w/);
  });

  it('[g5-150 T20 | m49 engine label] "Dungeon: Jax moved into the hall" is engine record; the plain move passes', () => {
    expect(A.input(20)).toBe('Next unexplored room');
    const s = atTurn(A, 20);
    const problem = (line: string) => plainLineFactProblem(line, s, s.completedEvent ?? undefined);
    expect(problem('Dungeon: Jax moved into the hall and the move finished this turn.')).toBe('an engine label pasted as story');
    expect(problem('Jax moved into the ruined hall and stopped under the arches.')).toBeNull();
    expect(A.prose(20)).not.toMatch(/^Dungeon:|[.!?]\s+Dungeon:/m);
  });

  it('[g5-198 T18 | m49 engine label] "Travel: back streets between …" is engine record', () => {
    const s = atTurn(B, 18);
    const problem = (line: string) => plainLineFactProblem(line, s, s.completedEvent ?? undefined);
    expect(s.completedEvent?.engineResult ?? '').toMatch(/^Travel:/);
    expect(problem('Travel: back streets between Cathedral Close and Contract Hall, leg one of two, and night fell.'))
      .toBe('an engine label pasted as story');
    expect(B.prose(18)).not.toMatch(/(?:^|[.!?]\s+)Travel:/m);
  });

  it('[ds198 T19 | m49 checker counted people] "Two strangers" with two people here is no invented person', async () => {
    expect((await factFlags(DS198, 19)).filter((f) => f.kind === 'person')).toEqual([]);
    const three = await factFlags(DS198, 19, 'Three strangers stood in the lamplight with their eyes on Jax.');
    expect(three.filter((f) => f.kind === 'person')).toHaveLength(1);
  });
});
