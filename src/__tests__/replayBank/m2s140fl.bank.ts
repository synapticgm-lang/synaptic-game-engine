import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 2, seed 140, OpenRouter google/gemini-2.5-flash-lite. */
const RUN = '2026-10-11T10-48-53-513Z_summoned-pact_cold-system_s140';
const DIR = resolve('scripts/fate-autoplay/runs', RUN);
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

type Flag = { kind: string; quote: string; missing: string };
/** The fact checker on one saved turn: its recorded prose against the packet the writer was handed. */
async function factFlags(turn: number): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string) => Flag[];
  };
  const rows = readFileSync(join(DIR, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number });
  const row = rows.find((r) => r.turn === turn)!;
  const pf = join(DIR, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '');
}

describe('replay bank multi-2 s140 (flash-lite)', () => {
  it('[m2 s140fl T18 | multi-2 Root 2] the open quest title keeps the travel line that names the destination', () => {
    expect(R.input(18)).toBe('Travel toward Cathedral Close');
    expect(R.packet(18), 'the quest title is handed on T18').toMatch(/Circle.s Price/);
    expect(R.verdicts(18)).toContain('action:ok');
    expect(R.prose(18)).toMatch(/Cathedral Close/);
  });

  it('[m2 s140fl T5,T21 | multi-2 Root 3, tester] "twenty-five" and "two hundred twenty-five" are one number each, read against the handed sheet', async () => {
    for (const t of [5, 21]) {
      expect((await factFlags(t)).filter((f) => f.kind === 'number'), `T${t}`).toEqual([]);
    }
  });

  it('[m2 s140fl T12 | multi-2 Root 3, tester guard] a count the packet never held ("Three rough thugs") is still flagged', async () => {
    expect((await factFlags(12)).filter((f) => f.kind === 'number').map((f) => f.missing)).toEqual(['Three appears in no handed fact']);
  });
});
