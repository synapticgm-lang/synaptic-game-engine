import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 3, seed 144, OpenRouter google/gemini-2.5-flash-lite. */
const RUN = '2026-10-11T11-07-44-818Z_summoned-pact_cold-system_s144';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-3 s144 (flash-lite)', () => {
  it('[m3 s144fl T14 | multi-3 Root 3, guard] a retold sentence that only names the place left is still trimmed', () => {
    expect(R.input(14)).toBe('Walk on');
    expect(R.after(14).journey?.to ?? R.after(14).currentLocation, 'heading for the Undercroft').toMatch(/Undercroft/);
    expect(R.prose(14)).not.toMatch(/Jax had left The Weighing Cup behind them/);
  });
});
