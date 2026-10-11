import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 2, seed 141, hosted writer (Fireworks deepseek-v4p1-flash). */
const RUN = '2026-10-11T10-48-53-661Z_summoned-pact_cold-system_s141';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-2 s141 (deepseek)', () => {
  it('[m2 s141ds T12 | multi-2 Root 2, guard] a weapon still in the bag stays out of the handed names', () => {
    const axe = (R.before(12).inventory ?? []).find((i) => i.name === 'Worn Hand Axe');
    expect(axe, 'the axe is carried before T12').toBeTruthy();
    expect(R.verdicts(12)).toContain('react:capital');
    expect(R.prose(12)).not.toMatch(/Worn Hand Axe/);
  });
});
