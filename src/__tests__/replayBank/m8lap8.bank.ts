/**
 * Multi lap 8 — the exits of HERE (a ship's hold is no crossroads of the city hubs; a dungeon room's
 * exits are its own ways on), one owner of who is here (the records placed here, minus anyone who left),
 * and a fact-checker case: a "pack" is the handed Bag.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { checkActionFollowed, checkPlayCrimes } from '../../game/turnCheck';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS150 = '2026-10-11T16-01-18-765Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-11T16-01-18-746Z_summoned-pact_cold-system_s151';
const DS157 = '2026-10-11T16-01-18-730Z_summoned-pact_cold-system_s157';
const FL157 = '2026-10-11T16-01-18-737Z_summoned-pact_cold-system_s157';
const MINI150 = '2026-10-11T16-01-18-745Z_summoned-pact_cold-system_s150';
const MINI157 = '2026-10-11T16-01-18-748Z_summoned-pact_cold-system_s157';

const HOLD = 'a harbor circle in the hold of a Valespire grain-ship';
const CITY_HUBS = ['Cathedral Close', 'Contract Hall', 'Lowmarket', 'Cathedral Undercroft', 'West Wall'];

async function factFlags(run: string, turn: number, edit = (p: string) => p): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string) => Flag[];
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number });
  const row = rows.find((r) => r.turn === turn)!;
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(row, edit(existsSync(pf) ? readFileSync(pf, 'utf8') : ''));
}

const placesLine = (R: Replay, n: number) => R.packet(n).match(/^PLACES: .*$/m)?.[0] ?? '';
const witnesses = (R: Replay, n: number) =>
  (R.packet(n).match(/^Witnesses: (.*)\.$/m)?.[1] ?? '').split(', ').filter(Boolean);
const hereBlock = (R: Replay, n: number) => R.packet(n).match(/^PRESENT:.*$/m)?.[0] ?? '';

let H: Replay;
let U: Replay;
let C: Replay;
let F: Replay;
beforeAll(async () => {
  H = new Replay(await replayWhole(DS150));
  U = new Replay(await replayWhole(DS151));
  C = new Replay(await replayWhole(DS157));
  F = new Replay(await replayWhole(FL157));
}, 900_000);

describe('replay bank multi lap 8', () => {
  it('[m8 s150ds T2-T5 | lap 8 Root A] the grain-ship hold does not open onto the city hubs', () => {
    for (const n of [2, 3, 4, 5]) {
      expect(H.before(n).currentLocation, `replay is in the hold before T${n}`).toBe(HOLD);
      for (const hub of CITY_HUBS) expect(placesLine(H, n), `T${n}`).not.toContain(hub);
    }
  });

  it('[m8 s151ds T19 | lap 8 Root A] in a dungeon room the exits are the room\'s own ways on, as the engine result names them', () => {
    expect(U.input(19)).toBe('Enter Cathedral Undercroft');
    const ways = U.packet(19).match(/Ways on: ([^.]*)\./)?.[1] ?? '';
    expect(ways, 'replay enters Stair Descent with ways on').toMatch(/Corridor/);
    const names = ways.split(', ').map((w) => w.replace(/ \(unexplored\)$/, ''));
    expect(placesLine(U, 19)).toMatch(new RegExp(`exits: ${names.join(', ')}$`));
    const exits = placesLine(U, 19).split('exits:')[1] ?? '';
    for (const hub of CITY_HUBS) expect(exits).not.toContain(hub);
  });

  it('[m8 s157ds T2 + s157fl T2 | lap 8 Root B] on the accept turn the giver is here on the sheet, speaks without a flag, and his nod answers the accept', () => {
    for (const R of [C, F]) {
      expect(R.input(2)).toBe('Accept the offer');
      expect(witnesses(R, 2)).toContain('Commander Rusk');
      expect(hereBlock(R, 2)).toContain('Commander Rusk');
      expect((R.turnCheck(2)?.p0 ?? []).map((f) => f.kind)).not.toContain('absent-speaker');
    }
    const p0 = checkActionFollowed(F.before(2), F.after(2), F.input(2), 'Commander Rusk gave a curt nod as the mask was handed over.').p0;
    expect(p0.map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('[m8 s157ds T3,T7 | lap 8 Root B] once the giver has left, no part of the packet hands him as here, and his speech still flags', () => {
    for (const n of [3, 4, 7]) {
      expect(C.before(n).npcMemories?.find((m) => m.npcName === 'Commander Rusk')?.shouldExit, `Rusk left before T${n}`).toBe(true);
      expect(witnesses(C, n), `T${n}`).not.toContain('Commander Rusk');
      expect(hereBlock(C, n), `T${n}`).not.toContain('Commander Rusk');
      expect(C.packet(n), `T${n}`).not.toMatch(/present:commander-rusk/);
    }
    const crimes = checkPlayCrimes(C.before(7), C.after(7), C.input(7), 'Commander Rusk said, "You came back. That is more than most do."');
    expect(crimes.p0.map((f) => f.kind)).toContain('absent-speaker');
  });

  it('[m8 s157ds T20 | lap 8 Root B] at Contract Hall the HERE list and the witnesses are the same people', () => {
    expect(C.after(20).currentLocation).toBe('Contract Hall');
    const w = witnesses(C, 20);
    expect(w, 'replay meets Col Thatch and Oda Dunmore').toEqual(expect.arrayContaining(['Col Thatch', 'Oda Dunmore']));
    for (const name of w) expect(hereBlock(C, 20)).toContain(name);
    expect(C.packet(20)).not.toMatch(/^NOW: .*· alone ·/m);
  });

  it('[m8 mini150 T14 + mini157 T3 | lap 8 Root C] a "pack" is the handed Bag; with no Bag handed it still flags', async () => {
    for (const [run, turn] of [[MINI150, 14], [MINI157, 3]] as const) {
      expect((await factFlags(run, turn)).filter((f) => f.kind === 'item'), `${run} T${turn}`).toEqual([]);
      const noBag = await factFlags(run, turn, (p) => p.replace(/; Bag x1/g, ''));
      expect(noBag.some((f) => f.kind === 'item' && /"pack"/.test(f.missing)), `${run} T${turn} without a Bag`).toBe(true);
    }
  });
});
