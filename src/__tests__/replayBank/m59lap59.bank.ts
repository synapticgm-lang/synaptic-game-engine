/**
 * Multi lap 59 — a person's short given name ("Oda" for Oda Dunmore) is a handed name, so the line that turns
 * from her and shows Rosel's papers commits and "the papers" later in the beat points at something shown
 * (ds208 T21); the fact checker no longer reads the holder's "and waited" as the papers waiting (ds208 T21);
 * a way-out repair is handed this place's ways out as its fact, with how to fix the count (ds151 T15).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblems } from '../../game/beatCommitGate';
import type { CompletedEventPacket } from '../../game/completedEventPacket';
import { parsePlayerIntent } from '../../game/intentParser';
import { plainLineFactProblem, tokenLineVerdicts } from '../../game/tokenProse';
import { repairRejectedSentences, type DraftCheck, type WriterTurnResult } from '../../game/writerTurn';
import { Replay } from './bank';
import { replayRun } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string; writerRaw?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS208 = '2026-10-13T11-06-05-631Z_summoned-pact_cold-system_s208';
const DS151 = '2026-10-13T11-06-05-635Z_summoned-pact_cold-system_s151';
const HOOK = 'Two doors stood open on the far side of Cathedral Close, and both of them led somewhere Jax had not been yet.';
const EXITS = 'Exits: the ways out of Cathedral Close lead to Contract Hall, Lowmarket, West Wall, Cathedral Undercroft.';

function rows(run: string): Row[] {
  return readFileSync(join(RUNS, run, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
}

async function factFlags(run: string, turn: number, gmText?: string): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const all = rows(run);
  const row = all.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...all.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(gmText ? { ...row, gmText } : row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
}

let D: Replay;
let A: Replay;
beforeAll(async () => {
  D = new Replay(await replayRun(DS208, 21));
  A = new Replay(await replayRun(DS151, 15));
}, 600_000);

describe('replay bank m59 (lap 59)', () => {
  it('[ds208 T21 | m59 fix 1] "Jax turned from Oda" is a handed name; the papers line commits', () => {
    expect(D.input(21)).toBe('Talk to Rosel Brack');
    const raw = rows(DS208).find((r) => r.turn === 21)!.writerRaw ?? '';
    const s = D.before(21);
    expect(tokenLineVerdicts(raw, s, s.completedEvent as CompletedEventPacket)[0]).toBe('action:ok');
    expect(D.prose(21)).toMatch(/Jax turned from Oda and stepped to the other side of the job board/);
    expect(D.prose(21)).toMatch(/short stack of papers.*Rosel set the papers down/s);
  });

  it('[m59 fix 1] a short capital that is nobody here still fails as a name never handed', () => {
    const s = D.before(21);
    expect(plainLineFactProblem('Jax turned from Ulf and stepped to the job board.', s)).toBe('a name the scene never handed');
    expect(plainLineFactProblem('Jax turned from Oda and stepped to the job board.', s)).toBeNull();
  });

  it('[ds208 T21 | m59 fix 3] the fact checker does not read Rosel\'s "and waited" as the papers waiting', async () => {
    const flags = await factFlags(DS208, 21);
    expect(flags.filter((f) => /papers/.test(f.missing))).toEqual([]);
  });

  it('[m59 fix 3] a thing that lies waiting on its own is still a find', async () => {
    const flags = await factFlags(DS208, 21, 'A silver key lay waiting on the floor of the hall, and Jax picked it up.');
    expect(flags.some((f) => /"key"/.test(f.missing))).toBe(true);
  });

  it('[ds151 T15 | m59 fix 2] the hook still fails the gate, and its repair is handed the close\'s ways out', async () => {
    expect(A.input(15)).toBe('Walk on');
    const s = A.after(15);
    expect(sentenceGateProblems(s, HOOK, 'Walk on').some((p) => /wrong number of ways out/.test(p))).toBe(true);
    const travel = 'Travel: back streets to Cathedral Close — +30 min, now afternoon.';
    const check: DraftCheck = { state: s, playerInput: 'Walk on', intent: parsePlayerIntent('Walk on', s), engineFact: travel, previousGm: '' };
    const turn = { prose: `${A.prose(15)} ${HOOK}` } as unknown as WriterTurnResult;
    let asked = '';
    const out = await repairRejectedSentences(turn, {
      packet: s.completedEvent as CompletedEventPacket,
      check,
      repair: async (request) => { asked = request; return HOOK; },
    });
    // tt-fix-4 (430fb4c8): the writer is handed the travel receipt's plain form; the record keeps the receipt.
    expect(asked).toContain(`Engine fact: ${EXITS} Arrived at Cathedral Close. It is now afternoon.`);
    expect(asked).toMatch(/Name every one of those ways out, or give no number/);
    expect(out.repairs?.[0]?.fact).toBe(`${EXITS} ${travel}`);
    expect(out.prose).not.toContain(HOOK);
  });

  it('[m59 fix 2] a rewrite that names all four ways out is kept', async () => {
    const s = A.after(15);
    const check: DraftCheck = { state: s, playerInput: 'Walk on', intent: parsePlayerIntent('Walk on', s), engineFact: '', previousGm: '' };
    const good = 'Four ways led out of Cathedral Close, to the Contract Hall, Lowmarket, the West Wall and down to the Cathedral Undercroft.';
    const out = await repairRejectedSentences({ prose: `${A.prose(15)} ${HOOK}` } as unknown as WriterTurnResult, {
      packet: s.completedEvent as CompletedEventPacket,
      check,
      repair: async () => good,
    });
    expect(out.repairs?.[0]?.bug).toBeUndefined();
    expect(out.repairs?.[0]?.fact).toBe(EXITS);
    expect(out.prose).toContain(good);
  });

  it('[m59 fix 2] a turn fact that already lists the ways out is not given them twice', async () => {
    const s = A.after(15);
    const check: DraftCheck = { state: s, playerInput: 'Walk on', intent: parsePlayerIntent('Walk on', s), engineFact: EXITS, previousGm: '' };
    let asked = '';
    const out = await repairRejectedSentences({ prose: `${A.prose(15)} ${HOOK}` } as unknown as WriterTurnResult, {
      packet: s.completedEvent as CompletedEventPacket,
      check,
      repair: async (request) => { asked = request; return HOOK; },
    });
    expect(out.repairs?.[0]?.fact).toBe(EXITS);
    expect(asked.split('Exits:').length - 1).toBe(1);
  });
});
