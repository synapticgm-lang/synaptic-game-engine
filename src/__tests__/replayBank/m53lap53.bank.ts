import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { isOpeningOccupancyReset } from '../../game/sceneContextTail';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-13T06-44-47-266Z_summoned-pact_cold-system_s202';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const JOB = 'the job from Harn was still waiting for its first step';

describe('replay bank m53 (lap 53)', () => {
  it('[ds202 T3 | m53 fix 3] the opening pin named as an object ("the job from Harn") is not Harn acting here', () => {
    expect(R.after(3).journey?.to, 'replay is on the road toward Lowmarket after T3').toBe('Lowmarket');
    expect(R.after(3).openingEstablishment?.pinnedNpcNames ?? []).toContain('Harn');
    expect(isOpeningOccupancyReset(R.after(3), `Somewhere ahead Lowmarket was waking up, and ${JOB}.`)).toBe(false);
    expect(isOpeningOccupancyReset(R.after(3), 'Harn waits by the quarry circle.'), 'Harn as subject still resets').toBe(true);
    expect(R.prose(3)).toContain(JOB);
  });

  it('[ds202 T13 | m53 fix 2] a chance meeting on the back streets is at most one level above the player', () => {
    const met = R.turns().filter((n) => R.after(n).journey?.encounter && (R.after(n).journey?.areaTier ?? 1) < 3);
    expect(met.length, 'replay meets someone on ordinary ground (recorded T13 stranger)').toBeGreaterThan(0);
    for (const n of met) {
      const enc = R.after(n).journey!.encounter!;
      const level = (R.after(n).character as unknown as { level?: number }).level ?? 1;
      expect(enc.level, `T${n} ${enc.kind} level ${enc.level} vs player ${level}`).toBeLessThanOrEqual(level + 1);
    }
  });
});
