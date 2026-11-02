/**
 * XP-D1 OPEN8 FIX 3 — L2→L3 into 15–25 without hunt cap; quest share 60–70%.
 * Bars still rise 25%/level; unitsPerLevel L2 raised; QUEST_STEP nudged.
 */
import { describe, expect, it } from 'vitest';
import {
  levelBar,
  unitsPerLevel,
  QUEST_STEP_UNITS_L2_PLUS,
  QUEST_COMPLETE_UNITS_L2_PLUS,
  ENCOUNTER_UNITS_L2_PLUS,
  unitMilestoneAmount,
  grayLevel,
} from './rules/xpPace';
import { WILDS_KILL_XP_MULT } from './rules/wildlifeConfig';

describe('OPEN8 — L2→L3 pace retune (no hunt cap)', () => {
  it('bars still rise each level (25% growth; L1=150)', () => {
    expect(levelBar('litrpg', 1)).toBe(150);
    const bars: number[] = [];
    for (let L = 1; L <= 10; L++) bars.push(levelBar('litrpg', L));
    for (let i = 1; i < bars.length; i++) {
      expect(bars[i]!).toBeGreaterThanOrEqual(bars[i - 1]!);
      expect(bars[i]!).toBe(Math.floor(bars[i - 1]! * 1.25));
    }
  });

  it('L2 units grew vs OPEN7 (8→12) so xpUnit shrinks; quest step lever ≥1.35', () => {
    expect(unitsPerLevel('litrpg', 2)).toBeGreaterThanOrEqual(12);
    expect(unitsPerLevel('litrpg', 3)).toBeGreaterThanOrEqual(unitsPerLevel('litrpg', 2)!);
    expect(unitsPerLevel('litrpg', 4)).toBeGreaterThanOrEqual(unitsPerLevel('litrpg', 3)!);
    expect(QUEST_STEP_UNITS_L2_PLUS).toBeGreaterThanOrEqual(1.35);
    expect(QUEST_COMPLETE_UNITS_L2_PLUS).toBeGreaterThanOrEqual(2.4);
    expect(ENCOUNTER_UNITS_L2_PLUS).toBe(1.15);
    expect(WILDS_KILL_XP_MULT).toBe(0.48);
  });

  it('non-gray table kill still pays >0; gray pays 0 (no hunt cap)', () => {
    for (let n = 0; n < 50; n++) {
      const xp = unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: 2,
        foeLevel: 2,
        levelSource: 'table',
      });
      expect(xp).toBeGreaterThan(0);
    }
    expect(
      unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: 8,
        foeLevel: 1,
        levelSource: 'table',
      }),
    ).toBe(0);
    expect(grayLevel(8)).toBeGreaterThanOrEqual(1);
  });

  it('quest step at L2 pays more units than trash kill share path suggests for quest share', () => {
    const step = unitMilestoneAmount('litrpg', 'questStep', { playerLevel: 2 });
    const kill = unitMilestoneAmount('litrpg', 'encounter', {
      playerLevel: 2,
      foeLevel: 2,
      levelSource: 'table',
    });
    // Quest step should not be tiny vs a same-level trash kill (quest-follower share).
    expect(step).toBeGreaterThan(0);
    expect(kill).toBeGreaterThan(0);
    expect(step / kill).toBeGreaterThan(0.7);
  });
});
