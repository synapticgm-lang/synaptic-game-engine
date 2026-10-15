import { describe, expect, it } from 'vitest';
import { applyCharacterXpGain } from './characterXp';
import { realEncounterCr, statBlockForEncounter } from './rules/srdMonsters';
import { LITRPG_MILESTONE_XP, crForFoeLevel, encounterXpBudget, milestoneXp } from './xpRules';
import type { ActiveEncounter, Character } from './types';

/** Order E — levelling per mode on one XP engine; E.3 — CR for engine-made foes and the solo budget (SRD 5.2.1). */
describe('Order E: one XP engine, per-mode rows', () => {
  const hard = { strictness: 'hardcore' as const };
  const over = { playerLevel: 10, areaLevel: 2 };

  it('tabletop: Hard and over-level pay the plain CR XP, with only the SRD maths line', () => {
    const plain = milestoneXp('dnd', 'encounter', { cr: '1/4' });
    expect(milestoneXp('dnd', 'encounter', { cr: '1/4', ...hard })).toEqual(plain);
    expect(milestoneXp('dnd', 'encounter', { cr: '1/4', ...over })).toEqual(plain);
    expect(plain).toEqual({ amount: 50, detail: 'CR 1/4 = 50 XP ÷ 1 = 50' });
    expect(milestoneXp('dnd', 'encounter', { cr: 2, count: 2, partySize: 3, ...hard, ...over }).detail).toBe(
      'CR 2 = 450 XP × 2 = 900 XP ÷ 3 = 300'
    );
  });

  it('LitRPG and story RPG keep ×1.25 on Hard, the 5% over-level cut and the 25% low-foe share', () => {
    for (const mode of ['litrpg', 'rpg'] as const) {
      expect(milestoneXp(mode, 'encounter', hard).amount).toBe(Math.round(LITRPG_MILESTONE_XP.encounter * 1.25));
      expect(milestoneXp(mode, 'encounter', over).amount).toBe(Math.round(LITRPG_MILESTONE_XP.encounter * 0.05));
      expect(milestoneXp(mode, 'encounter', { level: 5, foeLevel: 1 }).amount).toBe(LITRPG_MILESTONE_XP.encounter * 0.25);
    }
    expect(milestoneXp('rpg', 'significantPlace').amount).toBe(0);
  });

  it('PYOA pays no XP and never levels', () => {
    for (const kind of ['encounter', 'boss', 'questComplete', 'significantPlace'] as const) {
      expect(milestoneXp('pyoa', kind, hard).amount).toBe(0);
    }
    const pc = { level: 1, xp: 0, xpToNext: 150, hp: 10, maxHp: 10 } as Character;
    const r = applyCharacterXpGain(pc, 10_000, 'pyoa');
    expect(r.levelsGained).toBe(0);
    expect(r.notes).toEqual([]);
    expect(r.character).toBe(pc);
  });
});

describe('Order E.3: CR for engine-made foes and the solo level-1 budget (SRD 5.2.1)', () => {
  it('solo level 1 budget is the SRD XP Budget per Character: Low 50, Moderate 75, High 100', () => {
    expect([0, 1, 2].map((b) => encounterXpBudget(1, 1, b as 0 | 1 | 2))).toEqual([50, 75, 100]);
    expect(encounterXpBudget(1, 2, 1)).toBe(150);
  });

  it('a foe with no card CR and no SRD match fights and pays at one CR from its level and tier', () => {
    expect(crForFoeLevel(1, 'encounter')).toBe('1/4');
    expect(crForFoeLevel(1, 'miniBoss')).toBe('1/2');
    expect(crForFoeLevel(5, 'encounter')).toBe('2');
    const crawler = { name: 'Blind Crawler', level: 1, hp: 13, maxHp: 13, armorClass: 11, strength: 11, dexterity: 10, constitution: 11, xpReward: 0, goldReward: 0, source: 'dungeon room' } as ActiveEncounter;
    const guard = { ...crawler, name: 'Watchtower Stair Guard', level: 2, source: 'dungeon mini-boss' };
    expect(realEncounterCr(crawler)).toBe('1/4');
    expect(statBlockForEncounter(crawler).cr).toBe(realEncounterCr(crawler));
    expect(realEncounterCr(guard)).toBe('1');
    expect(statBlockForEncounter(guard).cr).toBe(realEncounterCr(guard));
    expect(milestoneXp('dnd', 'encounter', { cr: realEncounterCr(crawler) }).amount).toBe(50);
  });

  it('a card CR and an SRD block still win over the level CR', () => {
    expect(realEncounterCr({ name: 'Blind Crawler', level: 5, cr: '1/8' })).toBe('1/8');
    expect(realEncounterCr({ name: 'Road Bandit', level: 5 })).toBe('1/8');
  });
});
