import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-11T07-49-04-384Z_summoned-pact_cold-system_s84';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

describe('replay bank s84', () => {
  it('[s84 T14 | s84 Root A (s83 Root B returned)] Check the exits names the ways out the travel chips offer', () => {
    expect(R.input(14)).toBe('Check the exits');
    const exits = R.receipts(14).find((l) => /^Exits:/.test(l)) ?? '';
    expect(exits).toMatch(/Cathedral Close/);
    expect(exits).not.toMatch(/no way out/i);
    for (const chip of R.chips(14)) {
      const m = chip.match(/^Travel toward (.+)$/);
      if (m) expect(exits).toContain(m[1]);
    }
  });

  it('[s84 T10,T12 | s84 Root C] turn-back chip rests after a recent turn-back to the same origin', () => {
    const origin = 'a wayside shrine on the Valespire road';
    expect(R.input(8)).toBe(`Turn back toward ${origin}`);
    expect(R.chips(10)).not.toContain(`Turn back toward ${origin}`);
    expect(R.chips(12)).not.toContain(`Turn back toward ${origin}`);
  });

  it('[s84 T3 | s84 Root D] no ghost-chip P0 for "Ask the world" while the priest is here', () => {
    expect(R.input(3)).toBe('Ask the world');
    const p0 = R.turnCheck(3)?.p0 ?? [];
    expect(p0.filter((f) => f.kind === 'ghost-chip')).toEqual([]);
  });

  it('[s84 T8 | carried, paintDisplay] no article pasted onto a counted display ("A one frightened priest")', () => {
    expect(R.prose(8)).not.toMatch(/\ba one\b/i);
  });

  it('[s84 T2,T13,T14,T15 | carried, missing-item check] the priest\'s pilgrim staff is not flagged as the player\'s missing item', () => {
    for (const t of [2, 13, 14, 15]) expect(R.noteText(t)).not.toMatch(/missing item: (pilgrim )?staff/i);
  });

  it('[s84 T21 | carried, writer] the Undercroft is not given a spire', () => {
    expect(R.prose(21)).not.toMatch(/spire/i);
  });
});
