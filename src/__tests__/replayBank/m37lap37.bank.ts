/**
 * Multi lap 37 — a weapon someone else holds is not the player's missing item (the priest's staff); a talk turn
 * whose beat has no quoted answer gets one repair request for it, kept only when a person here says something
 * new; the checker does not read a passive ("faced being left alone at the quay") as Jax moving.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { findUnsupportedNarrativeItemClaims } from '../../game/suggestionValidation';
import { parsePlayerIntent } from '../../game/intentParser';
import { MISSING_ANSWER_PROBLEM, repairMissingAnswer, type WriterTurnResult } from '../../game/writerTurn';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL150 = '2026-10-12T15-25-39-664Z_summoned-pact_cold-system_s150';
const FL151 = '2026-10-12T15-25-44-288Z_summoned-pact_cold-system_s151';
const FL186 = '2026-10-12T15-25-41-717Z_summoned-pact_cold-system_s186';
const G5150 = '2026-10-12T15-25-39-719Z_summoned-pact_cold-system_s150';

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
let C: Replay;
beforeAll(async () => {
  // One at a time: every replay shares the one writer queue.
  A = new Replay(await replayWhole(FL150));
  B = new Replay(await replayWhole(FL151));
  C = new Replay(await replayWhole(FL186));
}, 1_800_000);

/** The writer turn as committed on replay, run back through the answer repair with a scripted reply. */
async function answerRepair(X: Replay, n: number, reply: string) {
  const state: GameState = { ...X.before(n), completedEvent: X.after(n).completedEvent };
  expect(state.completedEvent, `T${n} has a packet`).toBeTruthy();
  const playerInput = X.input(n);
  const turn = { prose: X.prose(n), path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: X.prose(n) } as WriterTurnResult;
  const asked: string[] = [];
  const out = await repairMissingAnswer(turn, {
    packet: state.completedEvent!,
    check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
    repair: async (request) => {
      asked.push(request);
      return reply;
    },
  });
  return { out, asked };
}

const answerRepairOf = (X: Replay, n: number) =>
  (X.at(n).telemetry as { answerRepair?: { sentence: string; flag: string; bug?: string } }).answerRepair;

describe('replay bank multi lap 37', () => {
  it('[m37 long-open s84 missing-item | lap 37 narrative items] a weapon held by someone else is not the player\'s missing item', () => {
    const st = A.after(9);
    expect(st.character?.name, 'replay has the locked name').toBe('Jax');
    expect(findUnsupportedNarrativeItemClaims('The priest gripped the pilgrim staff with both hands.', st)).toEqual([]);
    expect(findUnsupportedNarrativeItemClaims('Col Thatch watched Jax with a dagger at his belt.', st)).toEqual([]);
    expect(findUnsupportedNarrativeItemClaims('Jax drew your dagger.', st)).toContain('dagger');
    expect(findUnsupportedNarrativeItemClaims("You swing a dagger at the thug.", st)).toContain('dagger');
    for (const n of A.turns()) expect(A.noteText(n), `T${n}`).not.toMatch(/missing item: (?:pilgrim )?staff/i);
  });

  it('[m37 fl150 T9, fl151 T7, fl186 T14 | lap 37 talk answer] a talk turn with no quoted answer asks once for it; a new line from someone here lands', async () => {
    expect(A.input(9)).toBe('Talk to Col Thatch');
    expect(B.input(7)).toBe('Talk to Nell Rudd');
    expect(C.input(14)).toBe('Talk to someone in the street');
    for (const [X, n] of [[A, 9], [B, 7], [C, 14]] as const) {
      expect(X.prose(n), `T${n} replay has no quote`).not.toMatch(/["“]/);
      // On replay the repair channel hands back the recorded reply: no answer in it, so nothing is added and the miss is logged.
      expect(answerRepairOf(X, n)?.flag, `T${n}`).toBe(MISSING_ANSWER_PROBLEM);
      expect(answerRepairOf(X, n)?.bug, `T${n}`).toBeTruthy();
    }

    const col = await answerRepair(A, 9, 'Col Thatch said, "Something went missing from the shrine last night, and nobody will say who took it."');
    expect(col.asked).toHaveLength(1);
    expect(col.asked[0]).toMatch(/Col Thatch/);
    expect(col.out.prose).toMatch(/Col Thatch said, "Something went missing/);
    expect(col.out.answerRepair?.bug).toBeUndefined();

    const road = await answerRepair(C, 14, 'The traveler shrugged and said, "Nothing out here but the road and the cold."');
    expect(road.out.prose).toMatch(/"Nothing out here but the road and the cold\."/);

    const pc = await answerRepair(A, 9, 'Jax said to Col Thatch, "Tell me what you lost."');
    expect(pc.out.prose, 'the player is never given the answer line').toBe(A.prose(9));
    expect(pc.out.answerRepair?.bug).toMatch(/nobody here/);

    const said = (B.before(7).npcMemories ?? []).find((m) => m.npcName === 'Nell Rudd')?.said?.[0]?.line;
    expect(said, 'Nell Rudd has an earlier line on the record').toBeTruthy();
    const again = await answerRepair(B, 7, `Nell Rudd said, "${said}"`);
    expect(again.out.prose, 'a line said before is not the answer').toBe(B.prose(7));
    expect(again.out.answerRepair?.bug).toMatch(/earlier line/);
  });

  it('[m37 g5-150 T3 | lap 37 checker passive] "faced being left alone at the quay" is not a move', async () => {
    const flags = await factFlags(G5150, 3);
    expect(flags.filter((f) => f.kind === 'move')).toEqual([]);
  });
});
