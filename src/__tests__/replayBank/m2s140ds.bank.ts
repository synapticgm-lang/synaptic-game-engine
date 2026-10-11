import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

/** Multi lap 2, seed 140, hosted writer (Fireworks deepseek-v4p1-flash). */
const RUN = '2026-10-11T10-48-53-405Z_summoned-pact_cold-system_s140';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const COUNT = /(two|three|four) of them/;

describe('replay bank multi-2 s140 (deepseek)', () => {
  it('[m2 s140ds T15 | multi-2 Root 1] a thugs meeting carries the engine\'s headcount in the receipt and the writer fact', () => {
    expect(R.after(15).journey?.encounter?.kind, 'replay meets thugs on T15').toBe('thugs');
    const n = R.after(15).journey?.encounter?.count ?? 0;
    expect(n).toBeGreaterThanOrEqual(2);
    const word = ['', 'one', 'two', 'three', 'four'][n]!;
    expect(R.receiptText(15)).toMatch(new RegExp(`chance meeting: thugs \\(level \\d+\\), ${word} of them`));
    expect(R.packet(15)).toMatch(new RegExp(`On this stretch: thugs, ${word} of them`));
  });

  it('[m2 s140ds whole run | multi-2 Root 1] every thugs meeting the engine rolls has a count (whole run)', () => {
    let seen = 0;
    for (const n of R.turns()) {
      for (const r of R.receipts(n).filter((x) => /chance meeting: thugs/.test(x))) {
        seen++;
        expect(r, `T${n}`).toMatch(COUNT);
      }
    }
    expect(seen, 'the run meets thugs').toBeGreaterThan(0);
  });

  it('[m2 s140ds T14 | multi-2 Root 2] a capital on the mention list ("Crown") does not drop the line', () => {
    expect(R.packet(14), 'Crown is mentionable on T14').toMatch(/YOU MAY ONLY MENTION:[^\n]*\bCrown\b/);
    expect(R.verdicts(14)).not.toContain('action:capital');
    expect(R.prose(14)).toMatch(/Crown postings/);
  });
});
