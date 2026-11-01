import { describe, expect, it } from 'vitest';
import {
  applyLuckPush,
  bumpOutcome,
  classify2d6Outcome,
  createDiceSheet,
  formatPyoaDiceRoll,
  mulberry32,
  performPyoaCheck,
  pyoaRollSeed,
  roll2d6,
} from './pyoaDice2d6';
import type { PyoaDiceRules } from './pyoaBookTypes';

const RULES: PyoaDiceRules = {
  system: '2d6',
  version: 1,
  stats: ['MIGHT', 'WIT', 'NERVE', 'CRAFT'],
  statSpread: [2, 1, 1, 0],
  stamina: 10,
  luck: 3,
  luckMax: 5,
  targets: [7, 10],
};

describe('pyoaDice2d6', () => {
  it('roll2d6 returns faces 1–6', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 40; i++) {
      const { die1, die2 } = roll2d6(rng);
      expect(die1).toBeGreaterThanOrEqual(1);
      expect(die1).toBeLessThanOrEqual(6);
      expect(die2).toBeGreaterThanOrEqual(1);
      expect(die2).toBeLessThanOrEqual(6);
    }
  });

  it('classifies full / mixed / miss and doubles', () => {
    expect(classify2d6Outcome(6, 6, 0, 10).outcome).toBe('full'); // double six
    expect(classify2d6Outcome(1, 1, 5, 7).outcome).toBe('miss'); // double one
    expect(classify2d6Outcome(4, 4, 2, 8).outcome).toBe('full'); // 10 >= 10
    expect(classify2d6Outcome(3, 4, 1, 8).outcome).toBe('mixed'); // 8
    expect(classify2d6Outcome(3, 5, 1, 8).outcome).toBe('mixed'); // 9
    expect(classify2d6Outcome(2, 2, 1, 8).outcome).toBe('miss'); // 5
  });

  it('luck push bumps one step and spends luck', () => {
    expect(bumpOutcome('miss')).toBe('mixed');
    expect(bumpOutcome('mixed')).toBe('full');
    const sheet = createDiceSheet(RULES);
    const roll = performPyoaCheck({
      seed: 1,
      sectionId: 'td-test',
      visit: 1,
      stat: 'WIT',
      target: 8,
      label: 'Test',
      sheet,
    });
    // Force a non-full outcome for the push test when needed
    const forced = { ...roll, outcome: 'miss' as const, baseOutcome: 'miss' as const, usedLuck: false };
    const pushed = applyLuckPush(forced, sheet);
    expect(pushed).not.toBeNull();
    expect(pushed!.roll.outcome).toBe('mixed');
    expect(pushed!.roll.usedLuck).toBe(true);
    expect(pushed!.sheet.luck).toBe(sheet.luck - 1);
  });

  it('same seed+section+visit always yields the same dice (reload lock)', () => {
    const sheet = createDiceSheet(RULES);
    const a = performPyoaCheck({
      seed: 99,
      sectionId: 'td-0-004',
      visit: 1,
      stat: 'WIT',
      target: 7,
      label: 'Trace',
      sheet,
    });
    const b = performPyoaCheck({
      seed: 99,
      sectionId: 'td-0-004',
      visit: 1,
      stat: 'WIT',
      target: 7,
      label: 'Trace',
      sheet,
    });
    expect(a.die1).toBe(b.die1);
    expect(a.die2).toBe(b.die2);
    expect(a.total).toBe(b.total);
    expect(a.outcome).toBe(b.outcome);

    const c = performPyoaCheck({
      seed: 99,
      sectionId: 'td-0-004',
      visit: 2,
      stat: 'WIT',
      target: 7,
      label: 'Trace',
      sheet,
    });
    // New visit → new roll (may rarely collide; seed mix makes collision unlikely)
    expect(pyoaRollSeed(99, 'td-0-004', 1)).not.toBe(pyoaRollSeed(99, 'td-0-004', 2));
    expect(formatPyoaDiceRoll(a)).toMatch(/2d6 \(/);
  });

  it('0 stamina applies −2 to the check bonus', () => {
    const sheet = { ...createDiceSheet(RULES), stamina: 0 };
    const roll = performPyoaCheck({
      seed: 7,
      sectionId: 'x',
      visit: 1,
      stat: 'MIGHT',
      target: 8,
      label: 'Push',
      sheet,
    });
    expect(roll.statBonus).toBe((sheet.stats.MIGHT ?? 0) - 2);
  });
});
