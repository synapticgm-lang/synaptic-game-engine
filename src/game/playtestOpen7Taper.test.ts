/**
 * XP-D1 OPEN7 addendum — kill XP taper only (no artificial caps).
 */
import { describe, expect, it } from 'vitest';
import { grayLevel, killScale, unitMilestoneAmount } from './rules/xpPace';
import { WILDS_KILL_XP_MULT } from './rules/wildlifeConfig';

describe('OPEN7 addendum — kill XP taper only', () => {
  it('against one creature, pay is non-increasing as player level rises; >0 until gray; 0 only when gray', () => {
    const M = 3;
    let prev = Number.POSITIVE_INFINITY;
    for (let P = 1; P <= 12; P++) {
      const xp = unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: P,
        foeLevel: M,
        levelSource: 'table',
      });
      const gray = M <= grayLevel(P);
      if (gray) {
        expect(xp).toBe(0);
        expect(killScale(P, M)).toBe(0);
      } else {
        expect(xp).toBeGreaterThan(0);
        expect(xp).toBeLessThanOrEqual(prev);
      }
      prev = xp === 0 ? prev : xp;
    }
  });

  it('200 kills of a non-gray creature never hit 0 (no budget / ledger / event-cap zero)', () => {
    const P = 2;
    const M = 2;
    for (let i = 0; i < 200; i++) {
      const xp = unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: P,
        foeLevel: M,
        levelSource: 'table',
      });
      expect(xp).toBeGreaterThan(0);
    }
    expect(WILDS_KILL_XP_MULT).toBeGreaterThan(0);
  });

  it('elite pays full taper ×2 (skips trash mult) — not a flat constant', () => {
    const normal = unitMilestoneAmount('litrpg', 'encounter', {
      playerLevel: 4,
      foeLevel: 3,
      levelSource: 'table',
    });
    const elite = unitMilestoneAmount('litrpg', 'encounter', {
      playerLevel: 4,
      foeLevel: 3,
      levelSource: 'table',
      elite: true,
    });
    expect(normal).toBeGreaterThan(0);
    expect(elite).toBeGreaterThan(normal * 2);
    const ratio = elite / normal;
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(2 / WILDS_KILL_XP_MULT + 0.5);
  });
});
