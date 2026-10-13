/**
 * Multi lap 50 — a dead foe's name is matched on whole name words, so "A" and "I" are not "Giant Rat" and a
 * companion's line after the kill is no dead foe acting (g5-199 T20); the checker counts exits only in the count's own
 * clause and reads "the only road to it" as the road to the exit the sentence named (ds151 T20, ds199 T10); a token
 * followed by the display's own leading name ("@t1 Ruined hall") paints once (fl199 T19).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblems } from '../../game/beatCommitGate';
import { matchesLastKillName } from '../../game/combatAuthority';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS151 = '2026-10-13T04-29-32-153Z_summoned-pact_cold-system_s151';
const DS199 = '2026-10-13T04-29-44-506Z_summoned-pact_cold-system_s199';
const FL199 = '2026-10-13T04-29-48-418Z_summoned-pact_cold-system_s199';
const G5199 = '2026-10-13T04-29-52-389Z_summoned-pact_cold-system_s199';

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

let G: Replay;
let F: Replay;
beforeAll(async () => {
  G = new Replay(await replayWhole(G5199));
  F = new Replay(await replayWhole(FL199));
}, 1_800_000);

describe('replay bank m50 lap 50', () => {
  it('[g5-199 T20 | m50 dead-foe name words] Wenna\'s line and the closed chest are no dead Rotting Giant Rat acting', () => {
    expect(G.input(20)).toBe('Talk to Wenna Coyne');
    const s = atTurn(G, 20);
    expect(s.sceneFacts?.lastKill?.name).toBe('Rotting Giant Rat');
    for (const line of [
      'Wenna said, "I will watch the stairwell and wait here for answers."',
      'A closed wooden chest sits by the ruined floor while exits to Corridor, Stairwell Down, and Side room wait.',
    ]) expect(sentenceGateProblems(s, line, G.input(20)), line).toEqual([]);
    expect(sentenceGateProblems(s, 'The rat looks up and answers Jax.', G.input(20)).join(' ')).toMatch(/Reopens a closed fact/);
    const kill = s.sceneFacts!.lastKill!;
    for (const t of ['a', 'I', 'an', 'ant']) expect(matchesLastKillName(t, kill), t).toBe(false);
    for (const t of ['rat', 'Giant Rat', 'the Rotting Giant Rat']) expect(matchesLastKillName(t, kill), t).toBe(true);
    expect(G.prose(20)).toMatch(/Wenna said, "I will watch the stairwell/);
  });

  it('[ds151 T20, ds199 T10 | m50 checker exit clause] "the only road to it" and "stretched on both ways" are no exit count', async () => {
    expect((await factFlags(DS151, 20)).filter((f) => f.kind === 'exit-count')).toEqual([]);
    expect((await factFlags(DS199, 10)).filter((f) => f.kind === 'exit-count')).toEqual([]);
    const wrong = await factFlags(DS199, 10, 'Two roads led out of Lowmarket, and the stalls stretched on.');
    expect(wrong.map((f) => f.kind), 'a real count still flags').toContain('exit-count');
  });

  it('[fl199 T19 | m50 typed name head] "@t1 Ruined hall" paints the room once', () => {
    expect(F.input(19)).toBe('Press the attack');
    expect(F.prose(19)).toMatch(/the cleared Ruined hall in Cathedral Undercroft\./);
    expect(F.prose(19)).not.toMatch(/Cathedral Undercroft Ruined hall/);
  });
});
