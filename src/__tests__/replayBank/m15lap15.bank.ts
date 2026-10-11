/**
 * Multi lap 15 — a sentence that counts the ways out must match the ways out the writer was handed, and a
 * wrong count goes back for the one-sentence repair with the right list ("no way out" to a mapped place has no
 * count); accepting the opening offer tells the writer who made it, not terms the engine never settled; the checker reads
 * "neither man" / "the two men" as the handed people here, not a new person.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { wrongExitCountProblem } from '../../game/exitCount';
import { sheetExitNames } from '../../game/infoSheet';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const D150 = '2026-10-11T21-58-04-912Z_summoned-pact_cold-system_s150';
const D164 = '2026-10-11T21-58-34-289Z_summoned-pact_cold-system_s164';
const F164 = '2026-10-11T21-58-39-573Z_summoned-pact_cold-system_s164';
const G164 = '2026-10-11T22-21-40-769Z_summoned-pact_cold-system_s164';

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
let E: Replay;
let F: Replay;
let G: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(D150));
  E = new Replay(await replayWhole(D164));
  F = new Replay(await replayWhole(F164));
  G = new Replay(await replayWhole(G164));
}, 1_800_000);

const repairFlags = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: { sentence: string; flag: string }[] }).sentenceRepairs ?? []);

describe('replay bank multi lap 15', () => {
  it('[m15 ds150 T15 | lap 15 exit count] "three numbered doors led off" at Cathedral Undercroft goes back for repair with its 4 ways out', () => {
    const state = D.after(15);
    const exits = sheetExitNames(state);
    expect(exits, 'the gate counts the same list the PLACES line handed').toHaveLength(4);
    expect(D.packet(15)).toContain(`exits: ${exits.join(', ')}`);
    const bad = 'Below the steps, three numbered doors led off into the dark, and the middle one stood open a hand\'s width.';
    expect(wrongExitCountProblem(state, bad)).toMatch(/has 4 \(/);
    expect(repairFlags(D, 15).some((r) => /three numbered doors/.test(r.sentence) && /wrong number of ways out/.test(r.flag))).toBe(true);
    for (const ok of [
      `Four ways out of Cathedral Undercroft led on to ${exits.join(', ')}.`,
      'Jax walked two streets and stepped out of the wind.',
      'One passage led toward Lowmarket, and another toward West Wall.',
      'The only road to Lowmarket ran past the stalls.',
      'The other two doors stayed shut.',
    ]) {
      expect(wrongExitCountProblem(state, ok), ok).toBeNull();
    }
  });

  it('[m15 ds164 T5 | lap 15 exit count] on the road, "the only way left to go" is wrong: the way back is a way too', () => {
    const state = E.after(5);
    expect(sheetExitNames(state)).toHaveLength(2);
    const bad = 'Lowmarket still waits ahead, and the main road down to it is the only way left to go.';
    expect(wrongExitCountProblem(state, bad)).toMatch(/has 2 \(/);
    expect(repairFlags(E, 5).some((r) => /only way left/.test(r.sentence))).toBe(true);
  });

  it('[m15 fl164b T4 | lap 15 exit count] in the barred cell no way out reaches a mapped place, but the cell still has its one door', () => {
    const state = G.after(4);
    expect(G.receiptText(4)).toMatch(/Exits:[^\n]*no way out/);
    const sentence = 'Jax examined the barred cell\'s only exit, finding no way leading to any mapped place.';
    expect(wrongExitCountProblem(state, sentence)).toBeNull();
    expect(repairFlags(G, 4).filter((r) => /ways? out/.test(r.flag))).toEqual([]);
  });

  it('[m15 fl164 T2 | lap 15 offer from] accepting the cell offer tells the writer who made it, not an unbarred door the engine never opened', () => {
    expect(F.input(2)).toBe('Accept the offer');
    expect(F.receiptText(2)).toMatch(/Offer accepted: the offer from the handler\b/);
    expect(F.packet(2)).toMatch(/ENGINE RESULT[^\n]*Offer accepted: the offer from the handler\b/);
    expect(F.packet(2)).not.toMatch(/ENGINE RESULT[^\n]*unbar the door/);
  });

  it('[m15 ds150 T3 | lap 15 checker] "neither man" is one of the two smugglers handed here; "a man" is still a new person', async () => {
    expect((await factFlags(D150, 3)).filter((f) => f.kind === 'person')).toEqual([]);
    const invented = await factFlags(D150, 3, 'A man stepped down the ladder and watched Jax from the dark.');
    expect(invented.map((f) => f.kind)).toContain('person');
  });
});
