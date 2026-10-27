/**
 * Replay bank, new rules (Order 8): companions are their own people, like any other NPC. Drop at:
 * src/__tests__/replayBank/companionsOwnNpcs.bank.ts. Needs one recorded run (>= 20 turns, after Order 8 lands)
 * with two companions, where the scripted player lines include (README): an order the companion's agenda opposes,
 * a choice that serves one companion's want and costs the other's, and a callback 8+ turns later to something said.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, npc } from './bank';
import { replayWhole, RUNS_ROOT } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '';                       // ORDER-NAMED: recorded run dir
const T = { order: 0, split: 0, said: 0, recall: 0 };   // ORDER-NAMED: harness turns of the four scripted beats
const A = '', B = '';                 // ORDER-NAMED: the two companion names

let X: Replay;
beforeAll(async () => {
  if (!RUN || !existsSync(join(RUNS_ROOT, RUN))) throw new Error('record the companion run first (see README)');
  X = new Replay(await replayWhole(RUN));
}, 1_800_000);

describe('replay bank new rules: companions act as their own NPCs', () => {
  it('each companion has its own agenda, wants and memory record, like any NPC', () => {
    for (const name of [A, B]) {
      const r: any = npc(X.before(T.order), name);
      expect(r, name).toBeTruthy();
      expect(r.agenda ?? r.wants, `${name} has wants`).toBeTruthy();
    }
    expect(JSON.stringify(npc(X.before(T.order), A)?.agenda)).not.toBe(JSON.stringify(npc(X.before(T.order), B)?.agenda));
  });

  it('a companion can disagree: an order against its agenda is not silently obeyed', () => {
    const p = X.packet(T.order);
    expect(p, 'writer is told the companion objects or refuses').toMatch(new RegExp(`${A}[^\\n]*(objects|refuses|disagrees|unwilling)`, 'i'));
    expect(X.receiptText(T.order)).not.toMatch(new RegExp(`${A}[^\\n]*(obeys|complies) without`, 'i'));
  });

  it('own wants: a choice that serves one costs the other (attitude moves apart)', () => {
    const d = (n: string) => ((npc(X.after(T.split), n) as any)?.attitude ?? 0) - ((npc(X.before(T.split), n) as any)?.attitude ?? 0);
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
