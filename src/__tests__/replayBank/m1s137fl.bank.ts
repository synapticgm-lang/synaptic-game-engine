import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 1, seed 137, writer google/gemini-2.5-flash-lite. */
const RUN = '2026-10-11T10-31-58-855Z_summoned-pact_cold-system_s137';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-1 s137 (flash-lite)', () => {
  it('[m1 s137fl T2 | multi-1 Root 1] a ref whose id is the row display binds to that row, so the action line is kept', () => {
    expect(R.input(2)).toBe('Ask what they want');
    expect(R.at(2).recorded.writerRaw, 'writer typed the display as the id').toMatch(/"id": "the roof-thieves"/);
    expect(R.verdicts(2).filter((v) => /^ref unknown|unknown-id/.test(v))).toEqual([]);
    expect(R.prose(2)).toMatch(/the roof-thieves/i);
  });

  it('[m1 s137fl T17 | multi-1 Root 1] talking to Col Thatch keeps the lines that name Col Thatch', () => {
    expect(R.input(17)).toBe('Talk to Col Thatch');
    expect(R.verdicts(17).filter((v) => /^ref unknown|unknown-id/.test(v))).toEqual([]);
    expect(R.prose(17)).toMatch(/Col Thatch/);
  });

  it('[m1 s137fl whole run | multi-1 Root 1] no turn binds a ref to nothing when its id is a REF ENUM display', () => {
    for (const n of R.turns()) {
      const raw = R.at(n).recorded.writerRaw ?? '';
      const ids = [...raw.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1].toLowerCase());
      const shown = [...R.packet(n).matchAll(/^t\d+\s+\S+\s+\S+\s+"([^"]+)"/gm)].map((m) => m[1].toLowerCase());
      const unknown = R.verdicts(n).filter((v) => /^ref unknown:/.test(v)).map((v) => v.slice('ref unknown:'.length).toLowerCase());
      for (const u of unknown) expect(ids.includes(u) && shown.includes(u), `T${n} ${u}`).toBe(false);
    }
  });
});
