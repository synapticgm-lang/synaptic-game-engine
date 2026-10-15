/**
 * Multi lap 57 — the talk chip "Ask what they want" no longer opens the place's dungeon because it matches the
 * story chip (fl206 T5); a quoted line naming a place ("We'll take it back at Contract Hall") is not the camera
 * claiming HERE, so the answer repair is kept (g5-151 T8); the checker reads "Two Worn Hand Axes" as the handed
 * Worn Hand Axe (fl206 T9) and "the paper on the boards" at a notice-board hall as the place's own fittings (ds151 T18).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblems } from '../../game/beatCommitGate';
import { claimedHerePlace } from '../../game/completedEventPacket';
import { objectiveOpensInterior } from '../../game/enterInterior';
import { Replay } from './bank';
import { replayRun } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL206 = '2026-10-13T10-15-45-378Z_summoned-pact_cold-system_s206';
const G5151 = '2026-10-13T10-15-43-300Z_summoned-pact_cold-system_s151';
const DS151 = '2026-10-13T10-15-40-578Z_summoned-pact_cold-system_s151';

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
let G: Replay;
beforeAll(async () => {
  F = new Replay(await replayRun(FL206, 5));
  G = new Replay(await replayRun(G5151, 8));
}, 600_000);

describe('replay bank m57 (lap 57)', () => {
  it('[fl206 T5 | m57 fix 1] "Ask what they want" talks to the novices; it does not open the cistern dungeon', () => {
    expect(F.input(5)).toBe('Ask what they want');
    expect(F.before(5).currentLocation).toBe('the rain-cistern under Valespire Close');
    expect(F.after(5).currentLocation).toBe('the rain-cistern under Valespire Close');
    expect(F.after(5).activeDungeon?.currentNodeId ?? null, 'no dungeon room entered').toBeNull();
    expect(F.receiptText(5)).not.toMatch(/entered the rain-cistern|Dungeon room:/);
  });

  it('[m57 fix 1] a talk chip never opens the interior; bare search of the outside neither (G-m57 door record)', () => {
    const s = F.before(5);
    expect(objectiveOpensInterior(s, 'Ask what they want')).toBe(false);
    // G-m57: observe/search of the outside never enters; only a door-step or an enter move does.
    expect(objectiveOpensInterior(s, 'Search the cistern')).toBe(false);
  });

  it('[g5-151 T8 | m57 fix 2] a quoted plan naming Contract Hall is not a HERE claim; the answer repair passes the gate', () => {
    expect(G.input(8)).toBe('Talk to Col Thatch');
    expect(G.after(8).currentLocation).toBe('Cathedral Close');
    const repaired = `"We'll take it back at Contract Hall; tell me when and I'll see it done," Col Thatch said.`;
    expect(claimedHerePlace(repaired)).toBe('');
    expect(sentenceGateProblems(G.after(8), repaired, 'Talk to Col Thatch')).toEqual([]);
  });

  it('[m57 fix 2] narration that puts the camera back at another place still fails the gate', () => {
    const moved = 'Jax was back at Lowmarket before the bell, "as promised," Col Thatch said.';
    expect(claimedHerePlace(moved)).toBe('Lowmarket');
    expect(sentenceGateProblems(G.after(8), moved, 'Talk to Col Thatch').join(' ')).toMatch(/Invents a person or place/);
  });

  it('[fl206 T9 | m57 fix 3 checker] "Two Worn Hand Axes" is the handed Worn Hand Axe', async () => {
    expect((await factFlags(FL206, 9)).filter((f) => f.kind === 'name')).toEqual([]);
    const off = await factFlags(FL206, 9, 'Two Rusted Hand Axes lay inside the open chest for Jax to take.');
    expect(off.map((f) => f.kind), 'an unhanded plural name still flags').toContain('name');
  });

  it('[ds151 T18 | m57 fix 3 checker] paper on the boards of a notice-board hall is the place\'s own fittings', async () => {
    expect((await factFlags(DS151, 18)).filter((f) => f.kind === 'item')).toEqual([]);
    const found = await factFlags(DS151, 18, 'Jax took the paper on the boards and folded it away.');
    expect(found.map((f) => f.kind), 'paper Jax takes still flags').toContain('item');
    const elsewhere = await factFlags(DS151, 18, 'A key on the floor waited for someone to pick it up.');
    expect(elsewhere.map((f) => f.kind), 'an item on a fitting the place never names still flags').toContain('item');
  });
});
