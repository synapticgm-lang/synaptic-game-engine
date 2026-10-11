/**
 * Multi lap 10 — the line gate keeps a real answer to talk (a ref typed with its row's class word binds to
 * that row; a named person here may open with their own name), the turn check hears someone the beat's own
 * narration names, and the checker reads a capitalised place name only where it is written capitalised.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { checkEmptyRoomTalk } from '../../game/turnCheck';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL151 = '2026-10-11T16-58-00-139Z_summoned-pact_cold-system_s151';
const DS159 = '2026-10-11T16-57-59-461Z_summoned-pact_cold-system_s159';

/** Fact-check one recorded turn with the page so far; `gmText` replaces the recorded prose when given. */
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
let D: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FL151));
  D = new Replay(await replayWhole(DS159));
}, 1_800_000);

describe('replay bank multi lap 10', () => {
  it('[m10 fl151 T5 | lap 10 Root A] refs typed with the class word ("person") bind to their rows, so Nell answers in quotes', () => {
    expect(F.input(5)).toBe('Talk to Nell Rudd');
    expect(F.at(5).recorded.writerRaw, 'writer typed the class column as the id').toMatch(/"id": "person"/);
    expect(F.verdicts(5).filter((v) => /^ref unknown|unknown-id/.test(v))).toEqual([]);
    expect(F.prose(5)).toMatch(/Jax approached Nell Rudd/);
    expect(F.prose(5)).toMatch(/Nell said, "Well now, a new face in the Close\./);
    expect((F.turnCheck(5)?.p0 ?? []).map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('[m10 ds159 T18 | lap 10 Root A] a named person here asked who he is may answer with his own name', () => {
    expect(D.input(18)).toBe('Talk to Garth Barrow');
    expect(D.verdicts(18)).not.toContain('speech:speaker-echo');
    expect(D.prose(18)).toMatch(/Garth Barrow said, "Garth\. I keep to the underfloors/);
    expect((D.turnCheck(18)?.p0 ?? []).map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('[m10 ds159 T2 | lap 10 Root B] "nobody else could see" with Lene Quill acting in the beat is not an empty room', () => {
    expect(D.input(2)).toBe('Accept the offer');
    expect((D.turnCheck(2)?.p0 ?? []).map((f) => f.kind)).not.toContain('ghost-chip');
    const after = D.after(2);
    expect(checkEmptyRoomTalk(after, ['Ask what is going on'], D.prose(2))).toEqual([]);
    const nobodyNamed = 'The air opened into a small grey pocket. Nobody else was in the archive.';
    expect(checkEmptyRoomTalk(after, ['Ask what is going on'], nobodyNamed).map((f) => f.kind), 'a beat naming nobody still flags').toContain('ghost-chip');
  });

  it('[m10 ds159 T20 | lap 10 Root C] "kept their clothes close" is not the place Close named as a way out', async () => {
    expect(D.input(20)).toBe('Enter Cathedral Undercroft');
    expect((await factFlags(DS159, 20)).filter((f) => f.kind === 'exit-place')).toEqual([]);
    const named = 'Jax did not run, because the only way out was back toward the Close and the Scavenger stood in it.';
    expect((await factFlags(DS159, 20, named)).map((f) => f.kind), 'the capitalised place still flags').toContain('exit-place');
  });
});
