import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 1, seed 137, hosted writer (Fireworks deepseek-v4p1-flash). */
const RUN = '2026-10-11T10-31-58-835Z_summoned-pact_cold-system_s137';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-1 s137 (deepseek)', () => {
  it('[m1 s137ds T11 | multi-1 Root 2, tester] leaving Nell and Col for the road is not a ghost chip for them', () => {
    expect(R.input(11)).toBe('Travel toward Cathedral Undercroft');
    expect(R.chips(11), 'they were offered at Cathedral Close').toContain('Talk to Nell Rudd');
    expect(R.after(11).currentLocation).not.toBe('Cathedral Close');
    const ghosts = (R.turnCheck(11)?.p0 ?? []).filter((f) => f.kind === 'ghost-chip');
    expect(ghosts).toEqual([]);
  });

  it('[m1 s137ds T11 | multi-1 Root 2, tester] the empty-room check reads the list offered after the turn', () => {
    for (const chip of R.chipsAfter(11)) expect(chip).not.toMatch(/Talk to (Nell Rudd|Col Thatch)/);
  });
});
