import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 2, seed 142, OpenRouter google/gemini-2.5-flash-lite. */
const RUN = '2026-10-11T10-48-53-554Z_summoned-pact_cold-system_s142';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank multi-2 s142 (flash-lite)', () => {
  it('[m2 s142fl T2 | multi-2 Root 2] "Earth" from the mention list keeps the refusal line', () => {
    expect(R.input(2)).toBe('Refuse the offer');
    expect(R.packet(2), 'Earth is mentionable on T2').toMatch(/YOU MAY ONLY MENTION:[^\n]*\bEarth\b/);
    expect(R.verdicts(2)).toContain('action:ok');
    expect(R.prose(2)).toMatch(/refused the offer/);
  });

  it('[m2 s142fl T10 | multi-2 Root 2] the open quest title from the nudge ("The Summons\' Price") keeps its line', () => {
    expect(R.packet(10), 'the nudge hands the quest title').toMatch(/word reaches you about The Summons[’'] Price/);
    expect(R.verdicts(10)).toContain('action:ok');
    expect(R.prose(10)).toMatch(/Summons[’'] Price/);
  });
});
