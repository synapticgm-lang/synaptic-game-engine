/**
 * Multi lap 19 — the blows of the fight the engine settled this turn are this beat, not a fight already left;
 * a body such as the Crown or the Scale may know or watch (only a place title cannot act as a person); the checker
 * reads a short name of HERE ("the close") as HERE, not a move.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isStaleFightBleed } from '../../game/sceneContextTail';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const D150 = '2026-10-12T05-02-50-699Z_summoned-pact_cold-system_s150';
const G150 = '2026-10-12T05-03-22-274Z_summoned-pact_cold-system_s150';
const D168 = '2026-10-12T05-03-58-286Z_summoned-pact_cold-system_s168';

type Repair = { sentence: string; flag: string; bug?: string };
type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');

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
const repairs = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? []);

let S: Replay;
let G: Replay;
beforeAll(async () => {
  S = new Replay(await replayWhole(D150));
  G = new Replay(await replayWhole(G150));
}, 1_800_000);

describe('replay bank multi lap 19', () => {
  it('[m19 ds150 T13 | lap 19 kill turn] the blows of the fight won this turn stay on the page', () => {
    expect(S.input(13)).toBe('Face the thugs');
    expect(S.after(13).sceneFacts?.lastKill?.turn).toBe(S.before(13).turn);
    expect(repairs(S, 13).filter((r) => /already left as if it were here/.test(r.flag))).toEqual([]);
    expect(S.prose(13)).toMatch(/hit the first thugs? hard in the chest/);
    const kill = S.after(13).sceneFacts!.lastKill!;
    const next = { ...S.after(13), turn: (kill.turn ?? 0) + 1 };
    expect(
      isStaleFightBleed(next, 'The second thug swung a blade that missed Jax by a hand\'s width.'),
      'the same blows a turn later are still a fight already left',
    ).toBe(true);
  });

  it('[m19 ds168 T18 | lap 19 checker] walking across "the close" while at Cathedral Close is not a move; leaving for Lowmarket still is', async () => {
    expect((await factFlags(D168, 18)).filter((f) => f.kind === 'move')).toEqual([]);
    const wrong = await factFlags(D168, 18, 'Jax left Col Thatch by the kitchen door and walked into Lowmarket.');
    expect(wrong.filter((f) => f.kind === 'move').length).toBeGreaterThan(0);
  });

  it('[m19 g5-150 T2 | lap 19 body acts] "The Crown does not yet know, and the Scale watches" is not a place acting as a person', () => {
    expect(G.input(2)).toBe('Ask what they want');
    expect(repairs(G, 2)).toEqual([]);
    expect(G.prose(2)).toMatch(/the Scale watches/);
    const s = G.before(2);
    expect(sentenceGateProblem(s, 'The Crown does not yet know, and the Scale watches.')).toBeNull();
    expect(sentenceGateProblem(s, 'Lowmarket watches Jax from the far side of the hold.'), 'a place as a person still fails').toMatch(
      /name or place title/,
    );
  });
});
