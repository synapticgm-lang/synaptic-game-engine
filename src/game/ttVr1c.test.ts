/**
 * RC-VR1 part VR1-c — beginner roll hints per CheckKind, "?" help, Show roll hints setting.
 * Tabletop only. SRD 5.2.1 (Wizards of the Coast, CC BY 4.0): Ability Check / Saving Throw /
 * Attack Roll / Contests — hint text is per kind, not per label.
 */
import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import { planBeginnerRollHint, ROLL_HINT_AUTO_LIMIT, formatResultLine } from './rules/rollView';
import type { CheckKind } from './checkMath';

describe('VR1-c beginner roll hints', () => {
  it('VR1-8 first 3 of a kind auto-show; 4th needs help toggle; setting off hides all', () => {
    const kind: CheckKind = 'skill';
    let seen: Partial<Record<CheckKind, number>> | undefined;
    for (let i = 0; i < ROLL_HINT_AUTO_LIMIT; i++) {
      const plan = planBeginnerRollHint(kind, true, seen);
      expect(plan).not.toBeNull();
      expect(plan!.autoShow).toBe(true);
      expect(plan!.text).toMatch(/d20 roll/i);
      expect(plan!.text).toMatch(/hidden target/i);
      seen = plan!.nextSeen;
    }
    expect(seen?.[kind]).toBe(ROLL_HINT_AUTO_LIMIT);
    const fourth = planBeginnerRollHint(kind, true, seen);
    expect(fourth).not.toBeNull();
    expect(fourth!.autoShow).toBe(false);
    expect(fourth!.text.length).toBeGreaterThan(10);
    // Setting off: no hint at all (result line still independent).
    expect(planBeginnerRollHint(kind, false, undefined)).toBeNull();
    expect(planBeginnerRollHint(kind, false, { skill: 0 })).toBeNull();
    const resultStill = formatResultLine({
      label: 'Perception',
      d20s: [13],
      kept: 13,
      advState: 'normal',
      mods: [{ label: 'WIS', value: 1 }],
      total: 14,
      dc: 15,
      outcome: 'failure',
    });
    expect(resultStill).toBe('d20 13 + 1 (WIS) = 14 vs DC 15 — failure');
  });

  it('VR1-8 hint text is per CheckKind, not per label', () => {
    const ability = planBeginnerRollHint('ability', true, undefined)!;
    const skill = planBeginnerRollHint('skill', true, undefined)!;
    const save = planBeginnerRollHint('save', true, undefined)!;
    const contest = planBeginnerRollHint('contest', true, undefined)!;
    const attack = planBeginnerRollHint('attack', true, undefined)!;
    expect(ability.text).not.toBe(skill.text);
    expect(skill.text).toMatch(/skill training/i);
    expect(save.text).toMatch(/saving-throw|DC/i);
    expect(contest.text).toMatch(/compared against|higher total/i);
    expect(attack.text).toMatch(/Armor Class/i);
    // Counts are independent per kind.
    const afterSkill = skill.nextSeen;
    const firstSave = planBeginnerRollHint('save', true, afterSkill)!;
    expect(firstSave.autoShow).toBe(true);
    expect(firstSave.nextSeen.skill).toBe(1);
    expect(firstSave.nextSeen.save).toBe(1);
  });

  it('VR1-8 Show roll hints defaults on for new players', () => {
    expect(createDefaultSettings().showRollHints).toBe(true);
  });

  it('VR1-8 undefined setting still plans (legacy saves merge to default on)', () => {
    const plan = planBeginnerRollHint('contest', undefined, undefined);
    expect(plan).not.toBeNull();
    expect(plan!.autoShow).toBe(true);
  });
});
