import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-11T14-04-20-511Z_summoned-pact_cold-system_s151';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi lap 4 s151', () => {
  it('[m4 s151 T2 | lap 4 Root 2] the treaty-tent envoys are one group on HERE and the REF ENUM when the offer is taken', () => {
    expect(R.input(2)).toBe('Accept the offer');
    expect(R.before(2).currentLocation).toMatch(/treaty tent/);
    expect(R.packet(2)).toMatch(/^PRESENT:.*Pellane and Ash Court envoys/m);
    expect(R.packet(2)).toMatch(/^t\d+\s+cast:\S+\s+person\s+"the Pellane and Ash Court envoys"$/m);
    expect(R.packet(2)).not.toMatch(/^t\d+\s+cast:\S+\s+person\s+"(?:Pellane|Ash Court)"$/m);
  });
});
