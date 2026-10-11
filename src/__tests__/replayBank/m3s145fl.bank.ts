import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 3, seed 145, OpenRouter google/gemini-2.5-flash-lite. */
const RUN = '2026-10-11T11-07-44-796Z_summoned-pact_cold-system_s145';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-3 s145 (flash-lite)', () => {
  it('[m3 s145fl T3 | multi-3 Root 2] "Ask the world" reads status: no social track, no talk P0', () => {
    expect(R.input(3)).toBe('Ask the world');
    expect(R.before(3).systemHousing?.housing, 'world_status housing').toBe('world_status');
    expect(R.receiptText(3)).not.toMatch(/Social track/);
    expect((R.turnCheck(3)?.p0 ?? []).filter((f) => f.kind === 'ignored-action' || f.kind === 'ghost-chip')).toEqual([]);
  });

  it('[m3 s145fl T8 | multi-3 Root 3] the travel sentence naming Cathedral Close is not trimmed as a repeat', () => {
    expect(R.input(8)).toBe('Travel toward Cathedral Close');
    expect(R.after(8).journey?.to, 'trip toward Cathedral Close').toBe('Cathedral Close');
    expect(R.prose(8)).toMatch(/heading toward Cathedral Close/);
    expect((R.turnCheck(8)?.p0 ?? []).filter((f) => f.kind === 'ignored-action')).toEqual([]);
  });
});
