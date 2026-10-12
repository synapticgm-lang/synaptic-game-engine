import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 1, seed 138, hosted writer (Fireworks deepseek-v4p1-flash). */
const RUN = '2026-10-11T10-31-58-804Z_summoned-pact_cold-system_s138';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-1 s138 (deepseek)', () => {
  it('[m1 s138ds T2 | multi-1 Root 3] the housing rules sit on the SYSTEM line, not in HERE (whole run)', () => {
    expect(R.packet(2), 'T2 has a SYSTEM line').toMatch(/^SYSTEM: Levels exist in the world/m);
    for (const n of R.turns()) {
      const here = R.packet(n).match(/\nHERE:\n((?:- [^\n]*\n)*)/)?.[1] ?? '';
      expect(here, `T${n}`).not.toMatch(/^- System:/m);
    }
  });

  it('[m1 s138ds T2 | multi-1 Root 3] the panel is never a person on the REF ENUM (whole run)', () => {
    expect(R.packet(2), 'a world_status save has no panel to mention on T2').not.toMatch(/the panel/);
    for (const n of R.turns()) {
      expect(R.packet(n), `T${n}`).not.toMatch(/^t\d+\s+\S+\s+person\s+"the panel"/m);
    }
  });
});
