/**
 * Multi lap 13 (John's calls) — page 1 shows the housing as a scene, never its rules; a sentence the
 * commit gate rejects never reaches the page: ONE repair request carries only that sentence and the
 * engine fact, a passing rewrite takes its place, a failed one leaves the page and is logged as a bug.
 * Per-sentence gating made the gate's misreads cost real prose, so those owners were fixed too.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { repairRejectedSentences, type SentenceRepair } from '../../game/writerTurn';
import { systemHousingWriterClause } from '../../game/systemHousing';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const S78 = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';
const S79 = '2026-10-10T23-30-22-109Z_summoned-pact_cold-system_s79';
let R: Replay;
let F: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(S78));
  F = new Replay(await replayWhole(S79));
}, 1_200_000);

const repairsOf = (X: Replay, n: number) => ((X.at(n).telemetry as { sentenceRepairs?: SentenceRepair[] }).sentenceRepairs ?? []);
const repairRequests = (X: Replay, n: number) => X.at(n).writerPackets.filter((p) => /^Rewrite (?:this one sentence|these \d+ sentences)/.test(p));
/** The state the gate checked a turn's prose against (the turn's own packet is on the after state). */
const gateState = (X: Replay, n: number) => ({ ...X.before(n), completedEvent: X.after(n).completedEvent ?? X.before(n).completedEvent });

describe('replay bank multi lap 13', () => {
  it('[m13 s78 T1 | lap 13 housing] page 1 shows the worn device, not its rules; the writer facts show it through a companion', () => {
    const page1 = R.steps[0].before.log.find((e) => e.role === 'gm')?.content ?? '';
    expect(R.before(2).systemHousing?.housing).toBe('worn_device');
    expect(page1).toMatch(/fastened on you/);
    expect(page1).not.toMatch(/Others can see|only the wearer/i);
    expect(systemHousingWriterClause('worn_device')).toMatch(/sees the device but cannot read its words/);
  });

  it('[m13 s78 T4,T8,T9,T12,T18 | lap 13 gate misreads] the move, a look at a person, and "between two crates" are not gate rejections', () => {
    const lines: [number, string][] = [
      [4, 'Jax walked the back streets that ran from the empty barn in Pellane country toward Cathedral Close.'],
      [8, 'Jax kept moving toward Cathedral Undercroft with their clothes on their back and the worn system device fixed to their body.'],
      [9, "The traveler stopped and looked at the worn device on Jax's arm, then back at Jax's face."],
      [12, 'Jax left Cathedral Close and took the narrow back streets that run behind the tall houses toward Cathedral Undercroft.'],
      [18, 'Footsteps scuffed the gravel behind the row of stalls, and something small and quick darted between two crates.'],
    ];
    for (const [n, s] of lines) expect(sentenceGateProblem(gateState(R, n), s, R.input(n)), `T${n}`).toBeNull();
    // Lap 15: T15's "the only way out was back up the stairs" at Cathedral Undercroft (4 ways out) is s78 #22's real miscount.
    expect(R.turns().filter((n) => repairsOf(R, n).length), 'only T9 walking back toward the Close and T15 miscounting the ways out are rejected').toEqual([9, 15]);
    expect(repairsOf(R, 15).map((r) => r.flag)).toEqual([expect.stringMatching(/^Gives the wrong number of ways out/)]);
    expect(repairsOf(R, 9).map((r) => r.sentence)).toEqual(['Jax walked the back streets toward Cathedral Close and spoke to a traveler going the other way.']);
  });

  it('[m13 whole runs | lap 13 gate repair] every rejected sentence got ONE request with only it and the engine fact, and is off the page', () => {
    for (const X of [R, F]) {
      for (const n of X.turns().filter((t) => repairsOf(X, t).length)) {
        const asks = repairRequests(X, n);
        expect(asks.length, `T${n} one repair request`).toBe(1);
        expect(asks[0], `T${n} request carries no packet`).not.toMatch(/YOU MAY ONLY MENTION|Narrate this completed event/);
        expect(asks[0]).toMatch(/Engine fact: /);
        for (const r of repairsOf(X, n)) {
          expect(asks[0], `T${n} request names the flagged sentence`).toContain(r.sentence);
          expect(X.prose(n), `T${n} flagged sentence is off the page`).not.toContain(r.sentence);
        }
      }
    }
  });

  it('[m13 s79 T16 | lap 13 gate repair] after the T15 kill, the dead foe acting is rewritten in place; a failed rewrite leaves the page as a logged bug', async () => {
    const kill = F.after(15).sceneFacts?.lastKill;
    expect(kill?.outcome, 'replay settles the T15 fight').toBe('victory');
    const state = gateState(F, 16);
    const dead = `The ${kill!.name} lunged at Jax again, blade raised.`;
    const before = 'Jax wiped the blade clean on a rag.';
    const after = 'The undercroft went quiet around them.';
    expect(sentenceGateProblem(state, dead, F.input(16)), 'the gate rejects the dead foe acting').toBeTruthy();
    expect(sentenceGateProblem(state, before, F.input(16))).toBeNull();
    expect(sentenceGateProblem(state, after, F.input(16))).toBeNull();
    const draft = `${before} ${dead} ${after}`;
    const check = { state, playerInput: F.input(16), intent: { type: 'other' } as never, engineFact: `${kill!.name} is dead.`, previousGm: '' };
    const turn = { prose: draft, path: 'plain' as const, outcome: 'accepted' as const, problems: [], remaining: [], firstDraft: draft };
    const packet = state.completedEvent ?? ({} as never);
    let asked = '';
    const fixed = `The ${kill!.name} lay still where it had fallen.`;
    const ok = await repairRejectedSentences(turn, { packet, check, repair: async (req) => ((asked = req), fixed) });
    expect(asked).toContain(dead);
    expect(asked).toContain(`Engine fact: ${kill!.name} is dead.`);
    expect(asked).not.toContain(before);
    expect(ok.prose).toBe(`${before} ${fixed} ${after}`);
    expect(ok.repairs).toEqual([{ sentence: dead, flag: expect.any(String), fact: `${kill!.name} is dead.`, repaired: fixed }]);
    const bad = await repairRejectedSentences(turn, { packet, check, repair: async () => dead });
    expect(bad.prose).toBe(`${before} ${after}`);
    expect(bad.repairs?.[0]?.bug).toMatch(/repair failed the gate/);
  });
});
