import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isRoadLabel } from '../../game/travelJourney';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-06T14-54-13-439Z_summoned-pact_cold-system_s71';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const outcome = (n: number) => R.packet(n).match(/Outcome: ([^.\n]+)/)?.[1] ?? '';

describe('replay bank s71', () => {
  it('[s71 T6 | s71 Root A (s70 Bug A returned)] the road label is never painted into prose or handed as Here', () => {
    for (const t of R.turns()) {
      expect(R.prose(t), `T${t} prose`).not.toMatch(/On the road between places/);
      expect(R.packet(t).match(/^Here: .*$/m)?.[0] ?? '', `T${t} Here line`).not.toMatch(/On the road between places/);
    }
  });

  it('[s71 T5 | s71 Root A] no place card is built for a road label', () => {
    for (const t of R.turns()) {
      for (const p of R.after(t).places ?? []) expect(isRoadLabel(p.name), `T${t} card "${p.name}"`).toBe(false);
    }
  });

  it('[s71 T5 | s71 Root C] an outbound leg that did not arrive is not "Outcome: arrived"', () => {
    expect(R.after(5).journey, 'replay is underway after T5').toBeTruthy();
    expect(outcome(5)).not.toMatch(/^arrived/);
  });

  it('[s71 T10 | s71 Root C] a turn back that really arrived is "Outcome: arrived"', () => {
    const t = R.turns().find((n) => /^Turn back/.test(R.input(n)) && R.before(n).journey && !R.after(n).journey);
    expect(t, 'replay has a turn back that arrived').toBeTruthy();
    expect(outcome(t!)).toMatch(/^arrived/);
  });

  it('[s71 T5 | s71 Root C] a leg receipt never reads finished while the trip goes on (leg N of M, N < M)', () => {
    for (const t of R.turns()) {
      if (!R.after(t).journey) continue;
      for (const m of R.receiptText(t).matchAll(/leg (\d+) of (\d+)/g)) {
        expect(Number(m[1]), `T${t} "${m[0]}"`).toBeLessThan(Number(m[2]));
      }
    }
  });

  it('[s71 T9 | s71 Root A] a mid-trip reroute is not told "No move this turn"', () => {
    const t = R.turns().find((n) => R.before(n).journey && R.after(n).journey && R.before(n).journey!.to !== R.after(n).journey!.to);
    expect(t, 'replay has a mid-trip reroute').toBeTruthy();
    expect(R.packet(t!)).not.toMatch(/No move this turn/);
  });

  it('[s71 T2 | s71 Root D] the frozen-ford opening is not replaced by the Cinderflow Road hub', () => {
    expect(R.before(2).currentLocation).not.toBe('Cinderflow Road');
    expect(R.before(2).currentLocation ?? '').toMatch(/ford/i);
  });

  it('[s71 T2 | s71 Root D] no hub discovery XP for the start place with no move', () => {
    expect(R.before(2).currentLocation).toBe(R.after(2).currentLocation);
    expect(R.receiptText(2)).not.toMatch(/XP Gained: \d+ \(reached /);
  });
});
