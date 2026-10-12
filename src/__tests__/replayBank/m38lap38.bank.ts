/**
 * Multi lap 38 — the answer repair passes the same fact / name gate as a draft line before it lands (the
 * "Sunstone" amulet nobody was handed); it asks for quoted words plus a speaker and keeps a properly attributed
 * reply, including a held short name ("Nell" for Nell Rudd); the checker does not count gates passed along a
 * stair as the place's ways out.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { parsePlayerIntent } from '../../game/intentParser';
import { MISSING_ANSWER_PROBLEM, repairMissingAnswer, type WriterTurnResult } from '../../game/writerTurn';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL150 = '2026-10-12T15-58-30-591Z_summoned-pact_cold-system_s150';
const G5151 = '2026-10-12T15-58-30-562Z_summoned-pact_cold-system_s151';
const DS151 = '2026-10-12T15-58-30-578Z_summoned-pact_cold-system_s151';

async function factFlags(run: string, turn: number): Promise<Flag[]> {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
    pageOne: (dir: string) => string;
  };
  const dir = join(RUNS, run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row);
  const row = rows.find((r) => r.turn === turn)!;
  const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
  const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
  return mod.checkTurn(row, existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
}

let A: Replay;
let B: Replay;
beforeAll(async () => {
  // One at a time: every replay shares the one writer queue.
  A = new Replay(await replayWhole(FL150));
  B = new Replay(await replayWhole(G5151));
}, 1_800_000);

/** The writer turn as committed on replay, with its quotes taken out, run back through the answer repair with a scripted reply. */
async function answerRepair(X: Replay, n: number, reply: string) {
  const state: GameState = { ...X.before(n), completedEvent: X.after(n).completedEvent };
  expect(state.completedEvent, `T${n} has a packet`).toBeTruthy();
  const playerInput = X.input(n);
  const prose = X.prose(n).replace(/\s*[^.!?]*["“][^"“”]{3,}["”][^.!?]*[.!?]*/g, '').trim();
  const turn = { prose, path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: prose } as WriterTurnResult;
  const asked: string[] = [];
  const out = await repairMissingAnswer(turn, {
    packet: state.completedEvent!,
    check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
    repair: async (request) => {
      asked.push(request);
      return reply;
    },
  });
  return { out, asked, prose };
}

const answerRepairOf = (X: Replay, n: number) =>
  (X.at(n).telemetry as { answerRepair?: { repaired?: string; flag: string; bug?: string } }).answerRepair;

describe('replay bank multi lap 38', () => {
  it('[m38 fl150 T17 | lap 38 root A] an answer repair that names an item nobody was handed is not committed; a clean reply is', async () => {
    expect(A.input(17)).toBe('Ask Col Thatch what they want');
    expect(A.prose(17)).not.toMatch(/Sunstone/);
    expect(answerRepairOf(A, 17)?.flag).toBe(MISSING_ANSWER_PROBLEM);
    expect(answerRepairOf(A, 17)?.bug, 'the miss is logged, nothing invented lands').toBeTruthy();

    // The recorded lap 38 reply, word for word.
    const sun = await answerRepair(A, 17, '"It was my Sunstone amulet," Col Thatch replied, his voice tight with anger.');
    expect(sun.out.prose, 'the invented answer is dropped, no fallback line').toBe(sun.prose);
    expect(sun.out.answerRepair?.bug).toBe('repair failed the gate: a name the scene never handed');

    const clean = await answerRepair(A, 17, '"Something of mine was taken, and I want it back," Col Thatch replied, his voice tight with anger.');
    expect(clean.out.answerRepair?.bug).toBeUndefined();
    expect(clean.out.prose).toMatch(/"Something of mine was taken, and I want it back," Col Thatch replied/);
  });

  it('[m38 g5-151 T5, T7 | lap 38 root A format] the repair asks for quotes plus a speaker; a bare reply is not kept, an attributed one is', async () => {
    expect(B.input(5)).toBe('Talk to Nell Rudd');
    expect(B.input(7)).toBe('Talk to Nell Rudd');

    const bare = await answerRepair(B, 5, "Those papers in Cathedral Close? I haven't seen them.");
    expect(bare.asked).toHaveLength(1);
    expect(bare.asked[0]).toMatch(/inside quote marks, plus who said it/);
    expect(bare.out.prose, 'no quotes, no answer').toBe(bare.prose);
    expect(bare.out.answerRepair?.bug).toMatch(/no quoted answer/);

    const wrapped = await answerRepair(B, 5, `"I haven't seen any papers, and I don't want to."`);
    expect(wrapped.out.prose, 'quoted words with no speaker are not kept').toBe(wrapped.prose);
    expect(wrapped.out.answerRepair?.bug).toBeTruthy();

    const full = await answerRepair(B, 5, `"I haven't seen any papers, and I don't want to," Nell Rudd said.`);
    expect(full.out.answerRepair?.bug).toBeUndefined();
    expect(full.out.prose).toMatch(/"I haven't seen any papers, and I don't want to," Nell Rudd said\./);

    // g5-151 T7 was rejected for its speaker: "Nell" is the held short form of Nell Rudd, not nobody.
    const short = await answerRepair(B, 7, `"Keep your voice down and come back after dark," Nell hissed.`);
    expect(short.out.answerRepair?.bug).toBeUndefined();
    expect(short.out.prose).toMatch(/"Keep your voice down and come back after dark," Nell hissed\./);
  });

  it('[m38 ds151 T16, T4 | lap 38 root C checker] gates passed along a stair are not the place\'s exits; a wrong door count on arrival still flags', async () => {
    const t16 = await factFlags(DS151, 16);
    expect(t16.filter((f) => f.kind === 'exit-count')).toEqual([]);
    const t4 = await factFlags(DS151, 4);
    expect(t4.filter((f) => f.kind === 'exit-count').map((f) => f.quote).join(' ')).toMatch(/Three doors stood at the far side/);
  });
});
