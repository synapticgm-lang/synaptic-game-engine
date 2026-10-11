import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { isJourneyUnderway } from '../../game/travelJourney';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 3, seed 144, hosted writer (Fireworks deepseek-v4p1-flash). */
const RUN = '2026-10-11T11-07-44-793Z_summoned-pact_cold-system_s144';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-3 s144 (deepseek)', () => {
  it('[m3 s144ds T10 | multi-3 Root 1] leg 1 toward the Weighing Cup offers no bystander chip and no ghost-chip P0', () => {
    expect(R.input(10)).toBe('Travel toward The Weighing Cup');
    expect(isJourneyUnderway(R.after(10)), 'replay is on the road after T10').toBe(true);
    expect(R.after(10).journey?.encounter ?? null, 'a quiet stretch').toBeNull();
    expect(R.chipsAfter(10)).not.toContain('Call out to a bystander');
    expect((R.turnCheck(10)?.p0 ?? []).filter((f) => f.kind === 'ghost-chip')).toEqual([]);
  });

  it('[m3 s144ds T10 | multi-3 Root 1] the leg-1 packet does not carry the Lowmarket crowd onto the road', () => {
    expect(R.packet(10)).not.toMatch(/^NOW:.*crowd here/m);
    expect(R.packet(10)).not.toMatch(/a crowd, nobody named/);
  });

  it('[m3 s144ds T13 | multi-3 Root 1, guard] a stretch with someone on it still offers the meeting\'s own chip', () => {
    expect(R.after(12).journey?.encounter?.kind, 'replay meets someone on the T12 stretch').toBe('meeting');
    expect(R.chipsAfter(12)).toContain('Greet whoever is coming');
  });
});
