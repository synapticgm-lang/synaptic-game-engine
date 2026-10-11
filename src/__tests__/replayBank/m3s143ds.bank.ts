import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { isJourneyUnderway } from '../../game/travelJourney';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 3, seed 143, hosted writer (Fireworks deepseek-v4p1-flash). */
const RUN = '2026-10-11T11-07-44-786Z_summoned-pact_cold-system_s143';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

/** Turns that end on a road stretch with nobody met. */
function quietLegs(): number[] {
  return R.turns().filter((n) => isJourneyUnderway(R.after(n)) && !R.after(n).journey?.encounter);
}

describe('replay bank multi-3 s143 (deepseek)', () => {
  it('[m3 s143ds T14 | multi-3 Root 1] on a quiet road stretch no "Call out to a bystander" chip is offered', () => {
    const t14 = R.after(14);
    expect(isJourneyUnderway(t14), 'replay is on the road toward the Undercroft after T14').toBe(true);
    expect(t14.journey?.encounter ?? null, 'nobody met on that stretch').toBeNull();
    expect(R.chipsAfter(14)).not.toContain('Call out to a bystander');
  });

  it('[m3 s143ds whole run | multi-3 Root 1] a quiet stretch hands the writer no crowd and seats no bystanders', () => {
    expect(quietLegs().length, 'replay has quiet road legs').toBeGreaterThan(0);
    for (const n of quietLegs()) {
      expect(R.after(n).sceneFacts?.present ?? [], `T${n} present`).not.toContain('bystanders');
      expect(R.chipsAfter(n).filter((c) => /bystander/i.test(c)), `T${n} chips`).toEqual([]);
      if (R.turns().includes(n + 1) && isJourneyUnderway(R.after(n + 1))) {
        expect(R.packet(n + 1), `T${n + 1} NOW line`).not.toMatch(/^NOW:.*crowd here/m);
      }
    }
  });

  it('[m3 s143ds T10 | multi-3 Root 3] the leg-1 sentence naming Cathedral Close is not trimmed as a repeat', () => {
    expect(R.input(10)).toBe('Travel toward Cathedral Close');
    expect(R.after(10).journey?.to, 'trip toward Cathedral Close').toBe('Cathedral Close');
    expect(R.prose(10)).toMatch(/narrow back streets that ran from [^.]* toward Cathedral Close/);
  });
});
