/**
 * Multi lap 39 — "the only other way out" and "one of the ways out" are not a total of one (commit gate and
 * checker read them the same way), and "the only way forward" is one direction, not every way out; the answer
 * repair takes one member of a group held here ("a thug" for the thugs) as the speaker and does not ask a foe
 * the engine just put down to answer.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { wrongExitCountProblem } from '../../game/exitCount';
import { parsePlayerIntent } from '../../game/intentParser';
import { motiveLinesOf } from '../../game/npcSheet';
import { repairMissingAnswer, type WriterTurnResult } from '../../game/writerTurn';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const FL188 = '2026-10-12T16-50-46-026Z_summoned-pact_cold-system_s188';
const DS188 = '2026-10-12T16-50-46-022Z_summoned-pact_cold-system_s188';

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

let F: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FL188));
}, 1_800_000);

/** A talk turn with no quote on the page, run through the answer repair with a scripted reply. */
async function answerRepair(state: GameState, playerInput: string, reply: string) {
  expect(state.completedEvent, 'replay reaches a writer packet').toBeTruthy();
  const prose = 'Jax spoke with the thugs on the back streets.';
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
  return { out, asked };
}

describe('replay bank multi lap 39', () => {
  it('[m39 fl188 T16 | lap 39 root E gate] "the only other way out" and "one of the ways out" are not a total of one', () => {
    expect(F.input(16)).toBe('Next unexplored room');
    const state: GameState = F.after(16);
    expect(state.completedEvent, 'replay reaches the T16 writer call').toBeTruthy();
    expect(state.currentLocation ?? '').toMatch(/Corridor/);
    // The corridor has two ways out (Stair Descent, Ruined hall); Jax came in by the stair.
    expect(wrongExitCountProblem(state, 'The only other way out appeared to be the Ruined hall.')).toBeNull();
    expect(wrongExitCountProblem(state, 'The Ruined hall appeared to be one of the ways out.')).toBeNull();
    expect(wrongExitCountProblem(state, 'The only way out was the Ruined hall.')).toMatch(/has 2 \(Stair Descent, Ruined hall\)/);
    expect(wrongExitCountProblem(state, 'Five passages led out of the corridor.')).toMatch(/wrong number of ways out/);
    expect(F.prose(16), 'the writer line lands, not dropped').toMatch(/only other way out appeared to be the Ruined hall/);
  });

  it('[m39 ds188 T12 | lap 39 root E checker] "the only way forward" between two people is one direction, not the exit count', async () => {
    const t12 = await factFlags(DS188, 12);
    expect(t12.filter((f) => f.kind === 'exit-count')).toEqual([]);
  });

  it('[m39 fl188 T20 | lap 39 root A2] "a thug grunted" names one of the thugs held here as the speaker', async () => {
    expect(F.input(20)).toBe('Talk your way past the thugs');
    // The thugs met on the road at T19 are in this turn's REF ENUM; nobody is down yet.
    const state: GameState = { ...F.before(20), completedEvent: F.after(19).completedEvent };
    expect(state.sceneFacts?.lastKill?.name ?? '').not.toMatch(/thugs/);
    // q31-G: the thugs are asked from their meeting class (no want on this tape). The recorded lap 39 reply is not a
    // backed line (tt-fix-4 backed answers + Wire-in H group lines), so it is not kept; one of their group lines is.
    const recorded = await answerRepair(state, F.input(20), `"You managed to talk your way through, I'll give you that," a thug grunted.`);
    expect(recorded.asked).toHaveLength(1);
    expect(recorded.out.answerRepair?.bug).toMatch(/not held to a backed/);
    const line = motiveLinesOf(state, 'thugs')[0]!;
    expect(line).toBeTruthy();
    const thug = await answerRepair(state, F.input(20), `"${line}," a thug grunted.`);
    expect(thug.out.answerRepair?.bug).toBeUndefined();
    expect(thug.out.prose).toContain(`"${line}," a thug grunted.`);
    // Still nobody: a voice with no one here behind it.
    const voice = await answerRepair(state, F.input(20), `"Move along then," a rough voice growled.`);
    expect(voice.out.answerRepair?.bug).toBe('repair reply names nobody here as the speaker');
  });

  it('[m39 fl150 T7 | lap 39 root A2] a foe the engine just put down is not asked to answer', async () => {
    // On replay fl188 T20 is the shape fl150 T7 had live: parley failed, the engine fought and put the thugs down.
    expect(F.input(20)).toBe('Talk your way past the thugs');
    const state = F.after(20);
    expect(state.sceneFacts?.lastKill?.name, 'replay reaches the downed thugs').toMatch(/thugs/i);
    const down = await answerRepair(state, F.input(20), `"You think you can just waltz through here, little bird?" a rough voice growled.`);
    expect(down.asked, 'no repair request to the downed thugs').toHaveLength(0);
    expect(down.out.answerRepair).toBeUndefined();
  });
});
