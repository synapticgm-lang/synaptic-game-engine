/**
 * Multi lap 18 — a place named only as the matter of talk ("asked about the Ledger", "a decision about the wagon
 * desk", or inside a quote) is not the camera back at the place left or the opening room; a quote tagged before it
 * ('Col said, "…?"') is not the player's words when "Jax said" follows; a gold receipt hands the coins.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isOpeningOccupancyReset, isStaleLocationBleed } from '../../game/sceneContextTail';
import { isPlaceTitleAsPersonSubject } from '../../game/slotGlue';
import { checkPlayCrimes } from '../../game/turnCheck';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const D150 = '2026-10-11T23-11-02-606Z_summoned-pact_cold-system_s150';
const D167 = '2026-10-11T23-11-32-532Z_summoned-pact_cold-system_s167';
const F167 = '2026-10-11T23-11-37-997Z_summoned-pact_cold-system_s167';
const G167 = '2026-10-11T23-11-42-806Z_summoned-pact_cold-system_s167';

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

const STALE = /already left as if it were here/;
let G: Replay;
let D: Replay;
let F: Replay;
let S: Replay;
beforeAll(async () => {
  G = new Replay(await replayWhole(G167));
  D = new Replay(await replayWhole(D167));
  F = new Replay(await replayWhole(F167));
  S = new Replay(await replayWhole(D150));
}, 1_800_000);

const repairFlags = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: { sentence: string; flag: string }[] }).sentenceRepairs ?? []);

describe('replay bank multi lap 18', () => {
  it('[m18 g5-167 T18+T20 | lap 18 talk about a place] asking Osric about the Ledger at Lowmarket is not the camera back at the wagon desk', () => {
    expect(G.input(18)).toBe('Talk to Osric Coyne');
    for (const n of [18, 20]) expect(repairFlags(G, n).filter((r) => STALE.test(r.flag)), `T${n}`).toEqual([]);
    for (const n of [18, 20]) expect(repairFlags(G, n), `T${n} no failed repair`).toEqual([]);
    expect(G.prose(18)).toMatch(/asked about the Ledger, and Osric answered/);
    expect(G.prose(18), 'Osric\'s answer is kept').toMatch(/The Ledger holds what we need/);
    expect(isPlaceTitleAsPersonSubject('The Argent Ledger holds out a hand to Jax.', ['Argent Ledger']), 'narration still fails').toBe(true);
    expect((G.turnCheck(20)?.p0 ?? []).filter((f) => f.kind === 'ignored-action')).toEqual([]);
    const s = G.before(18);
    expect(isOpeningOccupancyReset(s, 'Jax stood again at the wagon desk of the Argent Ledger.'), 'the camera back there still fails').toBe(true);
    expect(isOpeningOccupancyReset(s, 'Jax looked about the wagon desk of the Argent Ledger.'), '"looked about" is around the place').toBe(true);
  });

  it('[m18 fl167 T18 + ds167 T9 | lap 18 talk about a place] "asked about the contract for the Argent Ledger\'s wagon" and "talked about the wagon at Lowmarket" are topics', () => {
    expect(repairFlags(F, 18).filter((r) => STALE.test(r.flag))).toEqual([]);
    const talked = 'Jax talked about the wagon at Lowmarket and the road north, and the bigger thug looked at the smaller one and then stepped aside.';
    expect(isStaleLocationBleed(D.before(9), talked)).toBe(false);
    expect(isStaleLocationBleed(D.before(9), 'Jax stood in Lowmarket again by the wagon.'), 'the camera in the place left still fails').toBe(true);
  });

  it('[m18 ds150 T9 | lap 18 tagged quote] Col\'s tagged question followed by "Jax said they were neither" is not the player\'s words', () => {
    expect(S.input(9)).toBe('Talk to Col Thatch');
    expect((S.turnCheck(9)?.p0 ?? []).filter((f) => f.kind === 'plays-player')).toEqual([]);
    const crimes = checkPlayCrimes(S.before(9), S.after(9), S.input(9), 'Col frowned. "Which is it, friend?" Jax said, and stepped closer.');
    expect(crimes.p0.map((f) => f.kind), 'an untagged quote closed by "Jax said" is still the player').toContain('plays-player');
  });

  it('[m18 fl167 T15 | lap 18 checker] "Gold Gained: 16" hands "sixteen gold coins"; coins with no gold receipt still flag', async () => {
    expect((await factFlags(F167, 15)).filter((f) => f.kind === 'item' && /coins/.test(f.missing))).toEqual([]);
    const wrong = await factFlags(F167, 14, 'Jax found sixteen gold coins lying in the gutter.');
    expect(wrong.filter((f) => f.kind === 'item' && /coins/.test(f.missing)).length).toBeGreaterThan(0);
  });
});
