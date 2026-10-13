import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from '../fateAutoplay';
import { sheetSkillBonus } from '../checkMath';
import { mulberry32 } from '../fatePick';
import {
  PREGENS,
  deriveTabletopSheet,
  pointBuyCost,
  roll4d6,
  rollTotal,
  seedNumber,
  tabletopArmorClass,
} from './characterBuild';
import {
  autoTabletopCreation,
  beginTabletopCreation,
  creationChips,
  parseTypedScores,
  stepTabletopCreation,
  tabletopCreationPending,
} from './creationFlow';

function freshKeep(seed = 150) {
  return buildNewGameState({ bibleId: 'cursed-keep', characterName: 'Jax', seed, personality: 'chilled-gm' }).state;
}

describe('tabletop character creation (SRD 5.2.1)', () => {
  it('ready-made fighter has engine-owned numbers', () => {
    let s = beginTabletopCreation(freshKeep());
    expect(tabletopCreationPending(s)).toBe(true);
    expect(creationChips(s)[0]).toBe('Quick start');
    s = stepTabletopCreation(s, `Ready-made: ${PREGENS[0].label}`);
    s = stepTabletopCreation(s, 'Begin play');
    expect(tabletopCreationPending(s)).toBe(false);
    const d = deriveTabletopSheet(s)!;
    expect(d).toBeTruthy();
    expect(s.character.srd!.classId).toBe('fighter');
    // Hit die max (10) + CON mod, AC from worn armour, proficiency +2.
    const con = Math.floor((s.character.attributes.CON - 10) / 2);
    expect(s.character.maxHp).toBe(10 + con);
    expect(d.pb).toBe(2);
    expect(d.skills).toHaveLength(18);
    expect(d.saves.filter((x) => x.proficient).map((x) => x.key).sort()).toEqual(['CON', 'STR']);
    expect(s.character.armorClass).toBe(tabletopArmorClass(s.character.attributes.DEX, s.inventory).ac);
    // The old starter sword / leather / chain shirt do not survive next to the class kit.
    expect(s.inventory.some((i) => /Worn Iron Shortsword|Patched Leather|^Chain Shirt$/.test(i.name) && !i.provenance?.includes('starting equipment'))).toBe(false);
  });

  it('every pregen builds a full sheet', () => {
    for (const p of PREGENS) {
      let s = beginTabletopCreation(freshKeep());
      s = stepTabletopCreation(s, `Ready-made: ${p.label}`);
      s = stepTabletopCreation(s, 'Begin play');
      const d = deriveTabletopSheet(s)!;
      expect(d.skills.filter((k) => k.proficient).length).toBeGreaterThanOrEqual(4);
      expect(s.character.hp).toBe(s.character.maxHp);
    }
  });

  it('point buy rejects over-budget typed scores and accepts legal ones', () => {
    expect(pointBuyCost({ STR: 15, DEX: 15, CON: 15, INT: 8, WIS: 8, CHA: 8 })).toBe(27);
    let s = beginTabletopCreation(freshKeep());
    for (const pick of ['Build my own', 'Rogue', 'Halfling', 'Criminal', 'Point buy (27 points)']) s = stepTabletopCreation(s, pick);
    expect(s.tabletopCreation!.stage).toBe('scores');
    const over = stepTabletopCreation(s, 'STR 15 DEX 15 CON 15 INT 15 WIS 8 CHA 8');
    expect(over.tabletopCreation!.stage).toBe('scores');
    const ok = stepTabletopCreation(s, 'STR 8 DEX 15 CON 14 INT 13 WIS 12 CHA 10');
    expect(ok.tabletopCreation!.picks.baseScores!.DEX).toBe(15);
    expect(stepTabletopCreation(ok, 'Keep these scores').tabletopCreation!.stage).toBe('kit');
    expect(parseTypedScores('STR 8 DEX 15 CON 14 INT 13 WIS 12 CHA 10')!.DEX).toBe(15);
  });

  it('4d6 drop lowest keeps the shown dice', () => {
    const rolls = roll4d6(mulberry32(7));
    expect(rolls).toHaveLength(6);
    for (const dice of rolls) {
      expect(dice).toHaveLength(4);
      const kept = [...dice].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
      expect(rollTotal(dice)).toBe(kept);
    }
  });

  it('seeded auto build is stable and checks read the sheet', () => {
    const a = autoTabletopCreation(freshKeep(150), mulberry32(seedNumber('tt-fate:150')));
    const b = autoTabletopCreation(freshKeep(150), mulberry32(seedNumber('tt-fate:150')));
    expect(a.character.srd).toEqual(b.character.srd);
    const d = deriveTabletopSheet(a)!;
    const stealth = d.skills.find((k) => k.skill === 'Stealth')!;
    expect(Math.floor((a.character.attributes.DEX - 10) / 2) + sheetSkillBonus(a.character, 'Stealth')).toBe(stealth.total);
  });

  it('fate opening shows the sheet only when creation ran', () => {
    const plain = stampOpening(freshKeep(150));
    expect(plain.log[0].systemLog).toEqual([]);
    const built = stampOpening(
      buildNewGameState({ bibleId: 'cursed-keep', characterName: 'Jax', seed: 150, personality: 'chilled-gm', tabletopCreation: true }).state
    );
    expect((built.log[0].systemLog ?? []).join('\n')).toMatch(/Hit Points|HP/);
  });

  it('LitRPG and story RPG never open the book', () => {
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const s = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm', tabletopCreation: true }).state;
      expect(s.character.srd).toBeUndefined();
      expect(beginTabletopCreation(s)).toBe(s);
    }
  });
});
