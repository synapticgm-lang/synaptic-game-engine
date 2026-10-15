/**
 * Opening scene and travel, per mode (replay-case-staging R17-R24). Tapes are distill-1, build 2026-10-15i,
 * pinned by the replay seam (Order B). R18 here is its clock part (Order F): the one world clock moves by each
 * travel receipt's own span, and the road pays nothing. The L4 night line and the Order M packet parts wait on those orders.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, xpTotal } from './bank';
import { replayWhole } from './replayRun';
import { worldClock } from '../../game/travelJourney';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_S5002 = 'distill-1/2026-10-15T09-29-02-010Z_cursed-keep_chilled-gm_s5002';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_S5002));
}, 600_000);

describe('replay bank mode opening + travel', () => {
  it('[R18 tabletop s5002 T3-T7 | Order F] each travel turn moves the clock by its receipt\'s span to the slot it names; the road pays 0 XP', () => {
    for (const n of [3, 4, 5, 7]) {
      const travel = T.receipts(n).find((l) => l.startsWith('Travel:')) ?? '';
      const [, span, unit, slot] = travel.match(/\+(\d+(?:\.\d+)?)\s*(min|h)\b, now (\w+)/) ?? [];
      expect(span, `T${n} has a travel receipt with a span`).toBeTruthy();
      expect(worldClock(T.after(n)) - worldClock(T.before(n))).toBeCloseTo(Number(span) / (unit === 'min' ? 60 : 1));
      expect(T.after(n).sceneFacts?.timeOfDay).toBe(slot);
      expect(xpTotal(T.after(n))).toBe(xpTotal(T.before(n)));
    }
  });

  it('[R17 tabletop s5002 | Order E.2/E.3] level 1 at the opening; every XP line is the plain SRD CR maths, never a difficulty or over-level multiplier or "XP: none"', () => {
    expect(T.before(T.turns()[0]!).character.level).toBe(1);
    for (const n of T.turns()) {
      const xp = T.receipts(n).filter((l) => /^XP\b/.test(l));
      for (const line of xp) {
        expect(line, `T${n}`).not.toMatch(/× 1\.25|× 5%|XP: none/);
        expect(line, `T${n}`).toMatch(/— CR \S+ = /);
      }
    }
  });
});
