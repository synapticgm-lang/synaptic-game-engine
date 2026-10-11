import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { fatePicks, replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-06T11-47-41-329Z_summoned-pact_cold-system_s70';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const placeNames = (n: number) => (R.after(n).places ?? []).map((p) => p.name);

describe('replay bank s70', () => {
  it('[s70 T5 | s70 Bug A] the road label "Back streets" never becomes the location or a place card', () => {
    expect(R.after(5).journey, 'replay is underway after T5').toBeTruthy();
    expect(R.after(5).currentLocation).not.toBe('Back streets');
    expect(placeNames(5)).not.toContain('Back streets');
  });

  it('[s70 T6 | s70 Bug A] a new destination named mid-trip does not start from the road label', () => {
    expect(R.before(6).journey, 'replay is underway before T6').toBeTruthy();
    expect(R.receiptText(6)).not.toMatch(/between Back streets and/i);
    expect(R.after(6).journey?.from).not.toBe('Back streets');
  });

  it('[s70 T6 | s70 Bug A] no turn-back chip names the road the player stands on', () => {
    for (const c of R.chips(6)) expect(c).not.toMatch(/^Turn back toward (Back streets|On the road between places)$/i);
  });

  it('[s70 T7 | s70 Bug A] turning back never "arrives" at the road label', () => {
    expect(R.after(7).currentLocation).not.toBe('Back streets');
    expect(R.receiptText(7)).not.toMatch(/back streets to Back streets/i);
  });

  it('[s70 T16 | s70 Bug A] the writer is not handed one road under two names', () => {
    expect(R.packet(16)).not.toMatch(/Location: Back streets/);
    expect(R.prose(16)).not.toMatch(/back streets of back streets/i);
  });

  it('[s70 T17 | s70 Bug A] Walk on stays offered while a trip is underway with no meeting on the road', () => {
    const quiet = R.turns().filter((n) => R.before(n).journey && !R.before(n).journey!.encounter);
    expect(quiet.length, 'replay has quiet journey turns').toBeGreaterThan(0);
    for (const t of quiet) expect(R.chips(t), `T${t}`).toContain('Walk on');
  });

  it('[s70 T5 | s70 Bug A] no "Return to X" chip for a place never visited (whole run)', () => {
    for (const t of R.turns()) {
      const visited = R.visitedBefore(t);
      for (const c of R.chips(t)) {
        const m = c.match(/^Return to (.+)$/);
        if (m) expect(visited.has(m[1]), `T${t} chip "${c}"`).toBe(true);
      }
    }
  });

  it('[s70 T21 | s70 Bug B] ordinary first-person speech from a met NPC is not a self-intro', () => {
    const forgot = (R.turnCheck(21)?.down ?? []).filter((f) => f.kind === 'sheet-forgotten');
    expect(forgot.map((f) => f.detail).join('\n')).not.toMatch(/Edda Tew/);
    expect(R.noteText(21)).not.toMatch(/runWarden would change "Edda Tew stopped too/);
  });

  it('[s70 T21 | s70 Bug B] a no-name street talk chip is not bound to an NPC already met', () => {
    expect(R.input(21)).toBe('Talk to someone in the street');
    expect(R.packet(21)).not.toMatch(/Jax spoke to Edda Tew\./);
  });

  it('[s70 whole run | s70 Bug A, tester] the Fate picker takes Walk on some of the time', async () => {
    const t = R.turns().find((n) => R.before(n).journey && R.chips(n).includes('Walk on'));
    expect(t, 'replay has a journey turn offering Walk on').toBeTruthy();
    const picks = await fatePicks(RUN, R.before(t!), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(picks).toContain('Walk on');
  }, 120_000);
});
