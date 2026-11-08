/**
 * Replay bank, Order 8. One real recording, still unfilled (RUN stays empty until that tape exists).
 * Legal party: A is the one recruited companion. B is another named NPC present at the beats, not a
 * second recruit. The memory beat is the player's own earlier line, not an NPC quote.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, npc } from './bank';
import { replayWhole, RUNS_ROOT } from './replayRun';
import { storedRelationshipFor } from '../../game/npcRelationships';
import { PARTY_CAP, recruitedCompanions } from '../../game/rules/companions';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '';                       // ORDER-NAMED: recorded run dir
const T = { order: 0, split: 0, said: 0, recall: 0 };   // ORDER-NAMED: harness turns of the four scripted beats
const A = '', B = '';                 // ORDER-NAMED: A recruited companion, B the other NPC

let X: Replay;
beforeAll(async () => {
  if (!RUN || !existsSync(join(RUNS_ROOT, RUN))) throw new Error('record the companion run first (see README)');
  X = new Replay(await replayWhole(RUN));
}, 1_800_000);

describe('replay bank new rules: a companion and another NPC act as their own people', () => {
  it('the party holds one recruit, and the other NPC has a different agenda', () => {
    expect(recruitedCompanions(X.before(T.order)).length).toBeLessThanOrEqual(PARTY_CAP);
    expect(recruitedCompanions(X.before(T.order)).map((c) => c.name)).toContain(A);
    expect(recruitedCompanions(X.before(T.order)).map((c) => c.name)).not.toContain(B);
    for (const name of [A, B]) {
      const r = npc(X.before(T.order), name);
      expect(r, name).toBeTruthy();
      // Real NpcMemory fields (goal/need/offer/traits) — not a parallel agenda bag.
      expect(r?.goal ?? r?.need ?? r?.offer, `${name} has wants`).toBeTruthy();
    }
    const aGoal = npc(X.before(T.order), A)?.goal;
    const bGoal = npc(X.before(T.order), B)?.goal;
    expect(JSON.stringify(aGoal)).not.toBe(JSON.stringify(bGoal));
  });

  it('a companion can disagree: an order against its agenda is not silently obeyed', () => {
    const p = X.packet(T.order);
    expect(p, 'writer is told the companion objects or refuses').toMatch(new RegExp(`${A}[^\\n]*(objects|refuses|disagrees|unwilling)`, 'i'));
    expect(X.receiptText(T.order)).not.toMatch(new RegExp(`${A}[^\\n]*(obeys|complies) without`, 'i'));
  });

  it('own wants: a choice that serves one costs the other (relationship trust moves apart)', () => {
    // Stored relationship trust is the approval number. persona.rel.trust is a separate nudge.
    const trustOf = (state: GameState, n: string) => storedRelationshipFor(state, n)?.trust ?? 0;
    const d = (n: string) => trustOf(X.after(T.split), n) - trustOf(X.before(T.split), n);
    expect(Math.sign(d(A)) * Math.sign(d(B)), 'opposite or one unmoved').toBeLessThanOrEqual(0);
    expect(d(A) !== 0 || d(B) !== 0).toBe(true);
  });

  it('memory: what was said reaches the writer packet when it matters, 8+ turns later', () => {
    expect(T.recall - T.said).toBeGreaterThanOrEqual(8);
    const said = X.input(T.said).slice(0, 40);
    expect(X.packet(T.recall), 'retrieved memory carries the earlier line').toContain(said.split(' ').slice(0, 4).join(' '));
  });

  it('companions are never steered by player-only chips (no option speaks for them)', () => {
    for (const n of X.turns()) for (const c of X.chips(n)) expect(c, `T${n}`).not.toMatch(new RegExp(`^${A} (agrees|says yes)`, 'i'));
  });
});
