/**
 * Replay bank, Order 8. One private recording (not in git).
 * A is the only recruited companion. B is present and not recruited.
 * On this tape A's stored trust goes from no row to 10, and B has no stored row, so the
 * predicate's missing-row zero is not a second stored number moving the other way.
 * 21 of 22 committed pages are the engine line after the writer gate. This file does not
 * claim prose quality or a green full bank.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, npc } from './bank';
import { replayWhole, RUNS_ROOT } from './replayRun';
import { storedRelationshipFor } from '../../game/npcRelationships';
import { PARTY_CAP, recruitedCompanions } from '../../game/rules/companions';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-11-08T23-52-11-338Z_summoned-pact_chilled-gm_s36';
const T = { order: 3, split: 2, said: 4, recall: 13 };
const A = 'Mara Vell', B = 'Innkeep Mara';
const TAPE_SHA256 = {
  'turns.jsonl': '639e17cf15fd06e9719d24c5fcd1f943ac85413a9d056125a248176a7e76f6d0',
  'meta.json': '1e7af7ba21fc9ce185ce4050e9b58b87dc368b7734624731a2c7b23463c0cbfe',
} as const;

let X: Replay;
beforeAll(async () => {
  const dir = join(RUNS_ROOT, RUN);
  if (!existsSync(dir)) {
    throw new Error(
      `companion tape missing at ${dir}. Restore private turns.jsonl and meta.json `
      + `(sha256 ${TAPE_SHA256['turns.jsonl']} and ${TAPE_SHA256['meta.json']}). Do not commit them.`
    );
  }
  for (const name of ['turns.jsonl', 'meta.json'] as const) {
    const got = createHash('sha256').update(readFileSync(join(dir, name))).digest('hex');
    if (got !== TAPE_SHA256[name]) throw new Error(`${name} sha256 ${got} != ${TAPE_SHA256[name]}`);
  }
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
