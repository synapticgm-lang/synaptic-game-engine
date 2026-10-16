/**
 * Multi lap 31 — pageOpeners still tracks same-action openers for the ledger; Order M step 3 puts SCENE in the
 * info sheet instead of ALREADY ON THE PAGE. A writer outage on a non-talk turn paints the book beat, never
 * "Nobody here answered."; the fact checker reads the handed start of this turn's move as where the walk came from.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { outageSpokenLine, pageOpeners } from '../../game/completedEventPacket';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');

async function checker() {
  return (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string) => Flag[];
  };
}

function recorded(run: string, turn: number): { row: { turn: number; gmText: string }; packet: string } {
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number; gmText: string });
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return { row: rows.find((r) => r.turn === turn)!, packet: existsSync(pf) ? readFileSync(pf, 'utf8') : '' };
}

const FL150 = '2026-10-12T12-26-50-805Z_summoned-pact_cold-system_s150';
const FL151 = '2026-10-12T12-26-51-054Z_summoned-pact_cold-system_s151';

let F: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FL150));
}, 1_800_000);

describe('replay bank multi lap 31', () => {
  it('[m31 fl150 T6 | Order M / lap 31] SCENE is on the sheet; pageOpeners still tracks same-action openers', () => {
    expect(F.input(6)).toBe('Travel toward Cathedral Close');
    expect(F.after(6).journey, 'replay sets out on T6').toBeTruthy();
    expect(F.packet(6), 'T6 sheet has SCENE').toMatch(/^SCENE:/m);
    expect(F.packet(6)).not.toContain('ALREADY ON THE PAGE');

    const log = [
      { role: 'player', content: 'Travel toward Lowmarket' }, { role: 'gm', content: 'Jax left the hall behind. More.' },
      { role: 'player', content: 'Turn back' }, { role: 'gm', content: 'Jax came back to the hall. More.' },
      { role: 'player', content: 'Look around' }, { role: 'gm', content: 'Jax looked at the hall. More.' },
      { role: 'player', content: 'Travel toward Lowmarket' },
    ];
    const s = { ...F.after(5), log } as unknown as GameState;
    const same = pageOpeners(s, 'Travel toward Lowmarket');
    expect(same, 'earlier beat for the same line comes too').toContain('Jax left the hall behind.');
    expect(same[same.length - 1], 'the last beat is always on the page').toBe('Jax looked at the hall.');
    const other = pageOpeners(s, 'Wait');
    expect(other, 'another line does not reach back').not.toContain('Jax left the hall behind.');
    expect(other[other.length - 1]).toBe('Jax looked at the hall.');
  });

  it('[m31 fl150 T6,T7 | lap 31 outage on a travel turn] the empty writer reply paints the travel beat, not "Nobody here answered."', () => {
    expect(F.input(6)).toBe('Travel toward Cathedral Close');
    expect(F.prose(6)).not.toMatch(/Nobody here answered/);
    expect(F.prose(6), 'the beat names where Jax was headed').toMatch(/Cathedral Close/);
    expect((F.turnCheck(6)?.p0 ?? []).map((f) => f.kind)).not.toContain('ignored-action');

    const at = F.after(5);
    expect(outageSpokenLine(at, 'unchanged', 'Travel toward Cathedral Close'), 'travel is not a spoken turn').toBe('');
    const nobody = { ...at, sceneFacts: { ...at.sceneFacts, present: [] } } as GameState;
    expect(outageSpokenLine(nobody, 'spoke', 'Talk to someone'), 'no one here to answer').toBe('');
  });

  it('[m31 fl151 T14 | lap 31 the trip start is not a way out] "led them from the Weighing Cup" is the handed start of the move', async () => {
    const mod = await checker();
    const { row, packet } = recorded(FL151, 14);
    expect(row.gmText).toMatch(/led them from the noisy Weighing Cup/);
    expect(packet).toMatch(/^Moved this turn: from The Weighing Cup to Cathedral Close/m);
    expect(mod.checkTurn(row, packet).filter((f) => f.kind === 'exit-place')).toEqual([]);
    const elsewhere = packet.replace('Moved this turn: from The Weighing Cup', 'Moved this turn: from Lowmarket');
    expect(mod.checkTurn(row, elsewhere).map((f) => f.kind), 'a place the move did not start from still flags').toContain('exit-place');
  });
});
