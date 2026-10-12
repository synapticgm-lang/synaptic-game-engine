/**
 * Multi lap 35 — travel receipts carry a real dash, not "â€”" bytes; the last-resort travel line takes arrived /
 * set out from the travel engine's commit and never a chip word as the destination ("set out with Walk"); the fight
 * receipt agrees with a group foe's rolled headcount ("the thugs are down").
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { lastResortStoryBody } from '../../game/completedEventPacket';
import { roadFoe } from '../../game/travelJourney';
import { MOJIBAKE, Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const F150 = '2026-10-12T14-37-37-415Z_summoned-pact_cold-system_s150';
const F151 = '2026-10-12T14-37-36-895Z_summoned-pact_cold-system_s151';

let A: Replay;
let B: Replay;
beforeAll(async () => {
  // One at a time: every replay shares the one writer queue.
  A = new Replay(await replayWhole(F150));
  B = new Replay(await replayWhole(F151));
}, 900_000);

describe('replay bank multi lap 35', () => {
  it('[m35 long-open s79 Root C | lap 35 dash bytes] travel receipts and packets carry a real dash (whole run)', () => {
    expect(A.receiptText(8), 'replay reaches Cathedral Close on T8').toMatch(/Travel: back streets to Cathedral Close — \+30 min/);
    for (const R of [A, B]) {
      for (const n of R.turns()) {
        expect(R.receiptText(n), `T${n} receipts`).not.toMatch(MOJIBAKE);
        expect(R.packet(n), `T${n} packet`).not.toMatch(MOJIBAKE);
      }
    }
  });

  it('[m35 fl150 T8 + fl151 T8 | lap 35 last-resort travel] "Walk on" that arrives is told as an arrival, not "set out with Walk"', () => {
    for (const [R, place] of [
      [A, 'Cathedral Close'],
      [B, 'West Wall'],
    ] as const) {
      expect(R.input(8)).toBe('Walk on');
      expect(R.verdicts(8), 'the recorded reply is still cut off').toContain('json-unparsed');
      expect(R.after(8).completedEvent?.outcome, 'the travel engine committed the arrival').toBe('arrived');
      expect(R.after(8).currentLocation).toBe(place);
      expect(R.prose(8)).not.toMatch(/\bWalk\b|set out/);
      expect(R.prose(8)).toMatch(new RegExp(place));
    }
    const setOut = [A, B]
      .flatMap((R) => R.turns().map((n) => ({ R, n })))
      .find(({ R, n }) => R.after(n).completedEvent?.outcome === 'set out' && R.after(n).journey?.to);
    expect(setOut, 'a replayed turn sets out').toBeTruthy();
    const st = setOut!.R.after(setOut!.n);
    const resort = lastResortStoryBody(st, st.completedEvent!, 'Walk on');
    expect(resort.prose).toContain(st.journey!.to);
    expect(resort.prose).not.toMatch(/\bWalk\b|You reached|You came into/);
  });

  it('[m35 long-open s79 #19 + fl150 T11 | lap 35 plural foe] the fight receipt says a group of thugs "are down"', () => {
    expect(A.input(11)).toBe('Face the thugs');
    expect(A.receiptText(11), 'replay wins the fight').toMatch(/Fight: VICTORY vs the thugs/);
    expect(A.receiptText(11)).toMatch(/the thugs are down and cannot fight on/);
    expect(A.receiptText(11)).not.toMatch(/the thugs is down/);
    expect(roadFoe({ kind: 'thugs', level: 1, stretch: 0, dangerous: false, count: 3 }).count).toBe(3);
    expect(roadFoe({ kind: 'villain', level: 1, stretch: 0, dangerous: false }).count).toBeUndefined();
  });
});
