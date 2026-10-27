/**
 * M1 / C7 — nine known SRD/engine rule-gap cases.
 * M3 flipped seven to pass; M6 flips gap-parley / gap-steal to pass.
 * Do not delete these ids.
 */

export type RuleGapId =
  | 'gap-nat20'
  | 'gap-nat1'
  | 'gap-oa-on-flee'
  | 'gap-short-rest-hit-dice'
  | 'gap-sell-half'
  | 'gap-str-x15'
  | 'gap-parley'
  | 'gap-cap-4'
  | 'gap-steal';

export interface RuleGapCase {
  id: RuleGapId;
  /** Short label for reports. */
  label: string;
  /**
   * SRD 5.2.1 note (CC BY 4.0). Quoted rule the engine must eventually match.
   * @see https://www.dndbeyond.com/srd
   */
  srd: string;
  /** Still an expected failure until the owning merge order lands the rule. */
  expectedFail: boolean;
}

/**
 * The nine rule gaps named in merge order M1.
 * Keep player inputs / failure cases elsewhere; this list is the id registry.
 */
export const RULE_GAPS: readonly RuleGapCase[] = [
  {
    id: 'gap-nat20',
    label: 'Natural 20 on attack / death save',
    // SRD 5.2.1 — Rolling a 1 or 20: "If the d20 roll for an attack is a 20, the attack hits
    // regardless of any modifiers or the target's AC. This is called a Critical Hit..."
    // Death Saving Throws: "If you roll a 20 on the d20, you regain 1 hit point."
    srd: 'SRD 5.2.1: d20 roll of 20 on an attack is a Critical Hit (hits regardless of modifiers/AC); death save 20 regains 1 HP.',
    expectedFail: false,
  },
  {
    id: 'gap-nat1',
    label: 'Natural 1 on attack / death save',
    // SRD 5.2.1 — Rolling a 1 or 20: "If the d20 roll for an attack is a 1, the attack misses
    // regardless of any modifiers or the target's AC."
    // Death Saving Throws: "If you roll a 1 on the d20, it counts as two failures."
    srd: 'SRD 5.2.1: d20 roll of 1 on an attack misses regardless of modifiers/AC; death save 1 counts as two failures.',
    expectedFail: false,
  },
  {
    id: 'gap-oa-on-flee',
    label: 'Opportunity attack on flee (not Disengage)',
    // SRD 5.2.1 — Opportunity Attacks: leaving an enemy's reach without Disengage provokes.
    srd: 'SRD 5.2.1 Opportunity Attacks: leaving a foe reach without Disengage provokes one reaction attack.',
    expectedFail: false,
  },
  {
    id: 'gap-short-rest-hit-dice',
    label: 'Short rest spends Hit Dice',
    // SRD 5.2.1 — Short Rest: "A character can spend one or more Hit Dice at the end of a Short Rest..."
    srd: 'SRD 5.2.1 Short Rest: spend one or more Hit Dice (class die + CON) at end of rest; Long Rest recovers spent Hit Dice.',
    expectedFail: false,
  },
  {
    id: 'gap-sell-half',
    label: 'Sell gear for half price',
    // SRD 5.2.1 — Selling Treasure / Armor, Weapons… often half cost when sold.
    srd: 'SRD 5.2.1 Equipment: arms and armor typically sell for half price when sold.',
    expectedFail: false,
  },
  {
    id: 'gap-str-x15',
    label: 'Carrying capacity STR × 15 lb',
    // SRD 5.2.1 — Carrying Capacity: "Your carrying capacity is your Strength score multiplied by 15."
    srd: 'SRD 5.2.1 Carrying Capacity: Strength score × 15 pounds.',
    expectedFail: false,
  },
  {
    id: 'gap-parley',
    label: 'Parley / social check resolution',
    // SRD 5.2.1 — Charisma (Persuasion / Intimidation / Deception) Ability Checks vs a DC.
    srd: 'SRD 5.2.1 Ability Checks (CHA): social influence resolved by the engine check, not free success.',
    expectedFail: false,
  },
  {
    id: 'gap-cap-4',
    label: 'Combat action economy cap (non-idle picks)',
    srd: 'SRD 5.2.1 Combat: one action / bonus / reaction economy — engine cap on non-idle fight picks (≤4 chips).',
    expectedFail: false,
  },
  {
    id: 'gap-steal',
    label: 'Steal / Sleight of Hand contested',
    // SRD 5.2.1 — Dexterity (Sleight of Hand) vs Passive Wisdom (Perception).
    srd: 'SRD 5.2.1 Sleight of Hand: Dexterity (Sleight of Hand) vs Passive Wisdom (Perception) — theft is not free success.',
    expectedFail: false,
  },
] as const;

export function ruleGapById(id: RuleGapId): RuleGapCase {
  const hit = RULE_GAPS.find((g) => g.id === id);
  if (!hit) throw new Error(`unknown rule gap id: ${id}`);
  return hit;
}

/** Vitest helper: document that this assertion is an expected-fail gap (do not delete). */
export function expectRuleGap(id: RuleGapId): RuleGapCase {
  const g = ruleGapById(id);
  if (!g.expectedFail) throw new Error(`${id} is no longer expected-fail — flip the bank case to assert pass`);
  return g;
}

/** Ids still expected to fail (none after M6). */
export function expectedFailGapIds(): RuleGapId[] {
  return RULE_GAPS.filter((g) => g.expectedFail).map((g) => g.id);
}

/** Ids flipped to pass (M3 + M6). */
export function passedGapIds(): RuleGapId[] {
  return RULE_GAPS.filter((g) => !g.expectedFail).map((g) => g.id);
}
