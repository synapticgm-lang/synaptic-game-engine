/**
 * Multi lap 16 — the checker reads "Exits: no way out … leads to a mapped place" as no count, as the gate does;
 * a lowercase word of a place name ("shrine", "grain-ship") followed by a verb is plain English, not the place
 * acting as a person; "lay still in the alley" is a body at rest, not a claim that the camera is still in the alley.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { factClosedViolationReason, sentenceGateProblem } from '../../game/beatCommitGate';
import { claimedHerePlace } from '../../game/completedEventPacket';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const D150 = '2026-10-11T22-33-14-119Z_summoned-pact_cold-system_s150';
const F150 = '2026-10-11T22-33-18-928Z_summoned-pact_cold-system_s150';
const D165 = '2026-10-11T22-33-44-001Z_summoned-pact_cold-system_s165';

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

let D: Replay;
let S: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(D150));
  S = new Replay(await replayWhole(D165));
}, 1_800_000);

const repairFlags = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: { sentence: string; flag: string }[] }).sentenceRepairs ?? []);

describe('replay bank multi lap 16', () => {
  it('[m16 ds150+fl150 T5 | lap 16 checker] in the grain-ship hold "no way out to a mapped place" hands no count; a named way out is still checked', async () => {
    for (const run of [D150, F150]) {
      expect((await factFlags(run, 5)).filter((f) => f.kind === 'exit-count'), run).toEqual([]);
    }
    const named = await factFlags(D150, 5, 'The only way out of the hold led up to Lowmarket.');
    expect(named.map((f) => f.kind)).toContain('exit-place');
  });

  it('[m16 ds165 T9 | lap 16 slot glue] "walked the shrine step by step" is not the shrine acting as a person', () => {
    expect(S.input(9)).toBeTruthy();
    const state = S.after(9);
    const sentence =
      'Jax walked the shrine step by step and checked every corner of a wayside shrine on the Valespire road with their own eyes.';
    expect(factClosedViolationReason(state, sentence)).toBeNull();
    expect(repairFlags(S, 9).filter((r) => /name or place title/.test(r.flag))).toEqual([]);
    expect(S.prose(9)).toMatch(/walked the shrine step by step/);
    expect(factClosedViolationReason(state, 'Valespire looks at Jax and waits.')).toMatch(/name or place title/);
  });

  it('[m16 ds150 T6 | lap 16 slot glue] "the grain-ship hold far behind them" is the hold, not the ship holding something; "the only way there" is one way to the Close', () => {
    expect(repairFlags(D, 6)).toEqual([]);
    expect(D.prose(6)).toMatch(/with the grain-ship hold far behind them/);
    // Fix B2: with the glue false positive gone, the gate reads "the only way there" as the one way to the Close it names.
    expect(D.prose(6)).toMatch(/Cathedral Close still waited beyond them, but the only way there ran/);
  });

  it('[m16 ds150 T13 | lap 16 still in] "Both thugs lay still in the alley" is a body at rest, not the camera still in the alley', () => {
    expect(D.input(13)).toBe('Face the thugs');
    const state = D.after(13);
    const sentence =
      'Both thugs lay still in the alley behind Lowmarket, and the road on to the Weighing Cup climbed away ahead, quiet and empty.';
    expect(claimedHerePlace(sentence)).toBe('');
    expect(repairFlags(D, 13)).toEqual([]);
    expect(D.prose(13)).toMatch(/lay still in the alley behind Lowmarket/);
    expect(claimedHerePlace('Jax was still in Cathedral Close when the bell rang.')).toBe('Cathedral Close');
    expect(sentenceGateProblem(state, sentence, 'Face the thugs')).toBeNull();
  });
});
