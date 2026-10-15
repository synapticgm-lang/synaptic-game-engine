/**
 * Multi lap 7 — a settled fight told in plain win words is not re-asked, and the turn check reads it as
 * the blow (or the answer to the parley that forced it); fact-checker cases on saved lap 6–7 turns.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { terminalFightOutcome } from '../../game/engineResult';
import { checkActionFollowed } from '../../game/turnCheck';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL151 = '2026-10-11T15-43-57-017Z_summoned-pact_cold-system_s151';
const FL156 = '2026-10-11T15-44-02-702Z_summoned-pact_cold-system_s156';
const DS150 = '2026-10-11T15-43-13-543Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-11T15-43-53-918Z_summoned-pact_cold-system_s151';
const MINI150 = '2026-10-11T15-43-29-871Z_summoned-pact_cold-system_s150';
const DS150L6 = '2026-10-11T15-19-08-224Z_summoned-pact_cold-system_s150';
const DS153L5 = '2026-10-11T14-37-43-055Z_summoned-pact_cold-system_s153';

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

let F: Replay;
let G: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FL151));
  G = new Replay(await replayWhole(FL156));
}, 600_000);

describe('replay bank multi lap 7', () => {
  it('[m7 s151fl T19 | lap 7 Root A] "the flock defeated" states the won fight: the first draft commits and shows the blow', () => {
    expect(F.input(19)).toBe('Press the attack');
    const fight = terminalFightOutcome(F.after(19).completedEvent?.engineResult);
    expect(fight?.outcome).toBe('victory');
    expect(F.prose(19)).toMatch(/flock defeated/);
    const p0 = checkActionFollowed(F.before(19), F.after(19), F.input(19), F.prose(19)).p0.map((f) => f.kind);
    expect(p0).not.toContain('ignored-action');
  });

  it('[m7 s156fl T8 | lap 7 Root A] a parley that forced a won fight: "emerged victorious" commits, and the forced fight is the answer', () => {
    expect(G.input(8)).toBe('Talk your way past the thugs');
    const fight = terminalFightOutcome(G.after(8).completedEvent?.engineResult);
    expect(fight).toMatchObject({ outcome: 'victory', forced: true, forcedBy: 'parley' });
    expect(G.prose(8)).toMatch(/forced a fight/);
    const p0 = checkActionFollowed(G.before(8), G.after(8), G.input(8), G.prose(8)).p0.map((f) => f.kind);
    expect(p0).not.toContain('ignored-action');
  });

  it('[m7 | lap 7 Root A] a talk with no fight and no answer still flags', () => {
    const s = G.before(8);
    const p0 = checkActionFollowed(s, s, 'Talk your way past the thugs', 'Jax stood on the back streets. The road ahead was clear.').p0;
    expect(p0.map((f) => f.kind)).toContain('ignored-action');
  });

  it('[m7 s151ds T5 + mini150 T9 | lap 7 Root B] a contraction and a handed sheet stat are not names', async () => {
    for (const [run, turn] of [[DS151, 5], [MINI150, 9], [DS153L5, 11]] as const) {
      const { flags } = await factFlags(run, turn);
      expect(flags.filter((f) => f.kind === 'name'), `${run} T${turn}`).toEqual([]);
    }
  });

  it('[m7 s150ds T5 + s156fl T6 + L6 s150ds T3 | lap 7 Root C] exit claims read their own clause; "one…another" and "only ways out are the four" are no count', async () => {
    for (const [run, turn] of [[DS150, 5], [FL156, 6], [DS150L6, 3]] as const) {
      const { flags } = await factFlags(run, turn);
      expect(flags.filter((f) => f.kind.startsWith('exit')), `${run} T${turn}`).toEqual([]);
    }
  });
});
