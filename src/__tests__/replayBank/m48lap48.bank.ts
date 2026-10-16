/**
 * Multi lap 48 — the road meeting has one label ("a stranger") that the writer's ref, the answer repair's
 * speaker check and the turn check all read (fl150 T10); loot this turn's engine result hands over is a ref
 * the writer can name (ds150 T10, Fine Longsword); a thing found that no fact handed fails the line (ds151 T18,
 * "a small iron ring"); the checker's move test reads place names as whole words ("courtyard" is not Court, ds151 T8).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { roadMeetingPeople } from '../../game/chipLegality';
import { parsePlayerIntent } from '../../game/intentParser';
import { plainLineFactProblem } from '../../game/tokenProse';
import { roadMeetingRef } from '../../game/travelJourney';
import { repairMissingAnswer, type WriterTurnResult } from '../../game/writerTurn';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Row = { turn: number; gmText?: string };
type Flag = { kind: string; quote: string; missing: string };
const RUNS = resolve('scripts/fate-autoplay/runs');
const DS150 = '2026-10-13T03-38-35-696Z_summoned-pact_cold-system_s150';
const FL150 = '2026-10-13T03-38-38-764Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-13T03-39-09-751Z_summoned-pact_cold-system_s151';

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

let A: Replay;
let B: Replay;
let F: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(DS150));
  B = new Replay(await replayWhole(DS151));
  F = new Replay(await replayWhole(FL150));
}, 1_800_000);

/** A talk turn with no quote on the page, run through the answer repair with a scripted reply. */
async function answerRepair(state: GameState, playerInput: string, reply: string) {
  expect(state.completedEvent, 'replay reaches a writer packet').toBeTruthy();
  const prose = 'Jax called out a greeting to the person approaching on the street.';
  const turn = { prose, path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: prose } as WriterTurnResult;
  return repairMissingAnswer(turn, {
    packet: state.completedEvent!,
    check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
    repair: async () => reply,
  });
}

describe('replay bank m48 lap 48', () => {
  it('[fl150 T10 | m48 one road-meeting label] the stranger on the back streets is the speaker the repair may name', async () => {
    expect(F.input(10)).toBe('Greet whoever is coming');
    const before = F.before(10);
    expect(roadMeetingPeople(before)).toBe('a stranger');
    expect(roadMeetingRef(before)?.display).toBe('a stranger');
    const s = F.after(10);
    // tt-build-roadmeet: the road meeting is its own REF ENUM class (an event that can speak), never a person present.
    expect((s.completedEvent?.refEnum ?? []).filter((r) => r.klass === 'meeting').map((r) => r.display)).toContain('a stranger');
    expect((s.completedEvent?.refEnum ?? []).filter((r) => r.klass === 'person').map((r) => r.display)).not.toContain('a stranger');
    const ok = await answerRepair(s, F.input(10), '"Just passing through," the stranger replied, not slowing down.');
    expect(ok.answerRepair?.bug).toBeUndefined();
    expect(ok.prose).toMatch(/"Just passing through," the stranger replied/);
    const nobody = await answerRepair(s, F.input(10), '"Just passing through," a rough voice said.');
    expect(nobody.answerRepair?.bug).toBe('repair reply names nobody here as the speaker');
  });

  it('[ds150 T10 | m48 found loot is a ref] the Fine Longsword the chest gave up is in the REF ENUM and the mention list', () => {
    expect(A.input(10)).toBe('Check the chest');
    const packet = A.after(10).completedEvent!;
    expect(packet.engineResult ?? '').toMatch(/found Fine Longsword/);
    expect((packet.refEnum ?? []).find((r) => r.display === 'Fine Longsword')?.klass).toBe('carried');
    expect(packet.allowlist).toContain('Fine Longsword');
    // A turn whose engine result hands nothing over does not list pack items.
    expect((A.after(9).completedEvent?.refEnum ?? []).some((r) => r.display === 'Fine Longsword')).toBe(false);
  });

  it('[ds151 T18 | m48 unhanded find] "found a small iron ring set into the stone" fails; a handed door passes', () => {
    expect(B.input(18)).toBe('Map the first undercroft door');
    // The page before T18, with T18's own packet (the after-state log already holds T18's prose).
    const s = { ...B.before(18), completedEvent: B.after(18).completedEvent } as GameState;
    const find = (line: string) => plainLineFactProblem(line, s, s.completedEvent ?? undefined);
    expect(find('Jax traced the edges of the metal and found a small iron ring set into the stone beside the frame.'))
      .toBeNull(); // P-5a/c (John, 2026-10-16): the writer may invent a fitting person or thing; it is registered, not refused.
    expect(B.prose(18)).toMatch(/found a small iron ring/); // P-5a/c: the invented line now stays
    expect(find('Jax traced the edges of the metal and found the door set flush into the stone.')).toBeNull();
    expect(find('Jax found nothing on the frame.')).toBeNull();
  });

  it('[ds151 T8 | m48 checker whole-word place] "the courtyard stones" is no move to Court; walking to Contract Hall still is', async () => {
    expect((await factFlags(DS151, 8)).filter((f) => f.kind === 'move')).toEqual([]);
    const moved = await factFlags(DS151, 8, 'Jax left Nell by the courtyard stones and walked into the Contract Hall.');
    expect(moved.filter((f) => f.kind === 'move')).toHaveLength(1);
  });
});
