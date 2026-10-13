import { describe, expect, it } from 'vitest';
import { formatCheckRecord, resolveCheckRecord } from '../checkRules';
import { deathSaveLine } from './combatPresenter';
import { rollAnimationMs, rollAnimationScale, shownD20, splitRollLine } from './rollView';

const rec = (d20s: number[], adv: 'normal' | 'advantage' | 'disadvantage' = 'normal') =>
  resolveCheckRecord({ label: 'Perception', mods: [{ label: 'WIS', value: 2 }], dc: 12, adv, d20s });

describe('rollView (tt-build-9): the die shown is the die the engine printed', () => {
  it('reads the kept d20 from the engine check line, with and without Advantage', () => {
    const plain = formatCheckRecord(rec([14]), 'dnd');
    expect(shownD20(plain)).toMatchObject({ kept: 14, dice: [14], adv: null });
    const adv = formatCheckRecord(rec([3, 17], 'advantage'), 'dnd');
    expect(adv).toContain('d20 (adv: 3, 17)');
    expect(shownD20(adv)).toMatchObject({ kept: 17, dice: [3, 17], adv: 'advantage' });
    const dis = formatCheckRecord(rec([3, 17], 'disadvantage'), 'dnd');
    expect(shownD20(dis)).toMatchObject({ kept: 3, adv: 'disadvantage' });
  });

  it('LitRPG and story RPG check lines show no d20, so no die is drawn', () => {
    for (const mode of ['litrpg', 'rpg'] as const) {
      const line = formatCheckRecord(rec([14]), mode);
      expect(shownD20(line)).toBeNull();
      expect(splitRollLine(line)).toEqual([{ text: line }]);
    }
  });

  it('death saves: natural 20 and natural 1 are crit and fumble; a secret save has no die', () => {
    const nat20 = deathSaveLine({ state: { successes: 0, failures: 0 }, d20: 20, result: 'revived' });
    expect(shownD20(nat20)).toMatchObject({ kept: 20, crit: true });
    const nat1 = deathSaveLine({ state: { successes: 0, failures: 2 }, d20: 1, result: 'two failures' });
    expect(shownD20(nat1)).toMatchObject({ kept: 1, fumble: true });
    expect(shownD20(deathSaveLine({ state: { successes: 1, failures: 0 }, d20: 12, result: 'success' }, true))).toBeNull();
  });

  it('every d20 in a round or initiative line gets its own die; the text joins back unchanged', () => {
    const round = 'Round 1 — you Longsword d20 14 + 5 = 19 vs AC 13: hit, 1d8 (6) + 3 slashing = 9; Goblin HP 7 → 0; Goblin Scimitar d20 (dis: 2, 9) 2 + 4 = 6 vs AC 16: miss (natural 1)';
    const parts = splitRollLine(round);
    expect(parts.filter((p) => p.roll).map((p) => p.roll!.kept)).toEqual([14, 2]);
    expect(parts.map((p) => p.text).join('')).toBe(round);
    const init = 'Initiative — you d20 11 + 2 = 13; Goblin rolled behind the screen';
    expect(splitRollLine(init).filter((p) => p.roll).map((p) => p.roll!.kept)).toEqual([11]);
  });

  it('reads the other engine forms (auto-fight, quick checks, loot) and ignores dice that are not a d20', () => {
    expect(shownD20('Round 2 — Jax hits (d20:18) for 6 damage. Enemy HP: 3')!.kept).toBe(18);
    expect(shownD20('Action Check: d20(9) + Mod(2) = 11 vs DC 12 — failure')!.kept).toBe(9);
    expect(shownD20('d20=4 mod=1 dc=10 Athletics FAILURE')!.kept).toBe(4);
    expect(shownD20('d20 = 19 → Rare: Moonsilver Ring')!.kept).toBe(19);
    expect(shownD20('Fireball 8d6 (28) fire; 2d20 is not a d20 line')).toBeNull();
    expect(shownD20('d20 25')).toBeNull();
  });

  it('Static never animates; Normal is fixed; Excited grows with the roll', () => {
    expect(rollAnimationMs('static', 20)).toBe(0);
    expect(rollAnimationMs('normal', 1)).toBe(rollAnimationMs('normal', 20));
    expect(rollAnimationMs('excited', 20)).toBeGreaterThan(rollAnimationMs('excited', 1));
    expect(rollAnimationScale('excited', 20)).toBe(1.35);
    expect(rollAnimationScale('normal', 20)).toBe(1);
  });
});
