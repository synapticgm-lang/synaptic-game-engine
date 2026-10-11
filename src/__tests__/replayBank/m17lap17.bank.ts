/**
 * Multi lap 17 — the checker's exit count skips a number that does not count the ways out ("the taller one said
 * the road", "without a single door"); a place title glues into an object slot only as written ("the kitchen hand"
 * is a person, not the title Kitchen); a person's name inside a place name ("Pellane War Camp") is not that person
 * speaking.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { factClosedViolationReason } from '../../game/beatCommitGate';
import { isPlaceTitleObjectGlue } from '../../game/slotGlue';
import { checkPlayCrimes } from '../../game/turnCheck';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const D150 = '2026-10-11T22-50-49-385Z_summoned-pact_cold-system_s150';
const D166 = '2026-10-11T22-51-19-262Z_summoned-pact_cold-system_s166';
const F166 = '2026-10-11T22-51-24-854Z_summoned-pact_cold-system_s166';

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
let S: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(F166));
  S = new Replay(await replayWhole(D166));
}, 1_800_000);

const repairFlags = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: { sentence: string; flag: string }[] }).sentenceRepairs ?? []);

describe('replay bank multi lap 17', () => {
  it('[m17 ds150 T12+T19 | lap 17 checker] "the taller one said the road" and "without a single door" count no ways out; a real count is still checked', async () => {
    for (const turn of [12, 19]) {
      expect((await factFlags(D150, turn)).filter((f) => f.kind === 'exit-count'), `T${turn}`).toEqual([]);
    }
    const wrong = await factFlags(D150, 12, 'Three roads led on from the lane, and the thugs stood in the middle one.');
    expect(wrong.map((f) => f.kind)).toContain('exit-count');
  });

  it('[m17 fl166 T21 | lap 17 slot glue] "thanks to the kitchen hand" is a person, not the title Kitchen glued to a hand', () => {
    expect(F.input(21)).toBe('Thank the kitchen hand');
    const sentence = 'Jax offered thanks to the kitchen hand bustling past their table.';
    expect(factClosedViolationReason(F.before(21), sentence)).toBeNull();
    expect(repairFlags(F, 21).filter((r) => /name or place title/.test(r.flag))).toEqual([]);
    expect(F.prose(21)).toMatch(/thanks to the kitchen hand/);
    expect(isPlaceTitleObjectGlue('Jax grabbed the Kitchen hand and pulled.', ['Kitchen']), 'the title as written still glues').toBe(true);
  });

  it('[m17 ds166 T2 | lap 17 absent speaker] "at Pellane War Camp and asked" is the camp, not King Pellane speaking', () => {
    expect(S.input(2)).toBe('Ask what they want');
    expect((S.turnCheck(2)?.p0 ?? []).filter((f) => f.kind === 'absent-speaker')).toEqual([]);
    const crimes = checkPlayCrimes(S.before(2), S.after(2), S.input(2), 'King Pellane said, "Kneel before the Crown."');
    expect(crimes.p0.map((f) => f.kind)).toContain('absent-speaker');
  });
});
