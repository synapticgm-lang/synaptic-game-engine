import { describe, expect, it } from 'vitest';
import { buildNewGameState } from '../fateAutoplay';
import { beginTabletopCreation, stepTabletopCreation } from '../tabletop/creationFlow';
import { abilityMod, deriveTabletopSheet, tabletopMaxHp } from '../tabletop/characterBuild';
import { applyCharacterXpGain } from '../characterXp';
import { dndXpToNext } from '../xpRules';
import type { Character, GameState, RoundCombatState } from '../types';
import { SRD_MONSTERS, type StatBlock } from './srdMonsters';
import { playRound, type PcProfile, type PcSpell } from './roundCombat';
import { combatFacts, tabletopCombatLines } from './combatPresenter';
import { srdLevelUp, presentLevelUp } from './advancement';
import {
  arcaneRecovery,
  casterProgression,
  concentrationDc,
  pickSlot,
  slotLevelInInput,
  slotsLeft,
  spellDice,
  spellInInput,
  spellNumbers,
  SPELLS,
  spendSlot,
} from './spells';

const built = (pick: string): GameState => {
  const s = buildNewGameState({ bibleId: 'cursed-keep', characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
  return [`Ready-made: ${pick}`, 'Begin play'].reduce(stepTabletopCreation, beginTabletopCreation(s));
};
const at = (c: Character, level: number): Character => {
  let ch = c;
  for (let l = (c.level ?? 1) + 1; l <= level; l++) ch = srdLevelUp(ch, l).character;
  return ch;
};

describe('shared rules engine — spells (SRD 5.2.1)', () => {
  it('full-caster slots, prepared and cantrip counts by level', () => {
    expect([1, 2, 3, 4, 5].map((l) => casterProgression('cleric', l)!.slots)).toEqual([[2], [3], [4, 2], [4, 3], [4, 3, 2]]);
    expect([1, 2, 3, 4, 5].map((l) => casterProgression('wizard', l)!.prepared)).toEqual([4, 5, 6, 7, 9]);
    expect(casterProgression('wizard', 1)).toMatchObject({ cantrips: 3, spellbook: 6 });
    expect(casterProgression('wizard', 4)).toMatchObject({ cantrips: 4, spellbook: 12 });
    expect(casterProgression('fighter', 3)).toBeNull();
  });

  it('spell save DC = 8 + modifier + PB, attack = modifier + PB; concentration DC is 10 or half the damage', () => {
    expect(spellNumbers(3, 2)).toEqual({ dc: 13, attack: 5 });
    expect(concentrationDc(7)).toBe(10);
    expect(concentrationDc(23)).toBe(11);
  });

  it('slots: spend the lowest that fits, say so when none is left; a long rest is the only full refill', () => {
    const one = spendSlot(undefined, 1);
    expect(slotsLeft('cleric', 1, one)).toEqual([1]);
    expect(pickSlot(slotsLeft('cleric', 1, spendSlot(one, 1)), 1)).toBeNull();
    expect(pickSlot([0, 2], 1)).toBe(2);
    expect(pickSlot([3, 2], 1, 2)).toBe(2);
    expect(spellDice(SPELLS['Cure Wounds']!, 2)).toBe('4d8');
    expect(spellDice(SPELLS['Burning Hands']!, 2)).toBe('4d6');
    expect(slotLevelInInput('cast Cure Wounds at level 2')).toBe(2);
    // Arcane Recovery: up to half the wizard level (rounded up) in slot levels, once a day.
    const r = arcaneRecovery(1, { slotsUsed: [2] })!;
    expect(r.recovered).toEqual([1]);
    expect(arcaneRecovery(1, r.casting)).toBeNull();
  });

  it('a spell is read from whole words; Light and Mending count only when the line says cast', () => {
    expect(spellInInput('cast bless on myself')).toBe('Bless');
    expect(spellInInput('Magic Missile the zombie')).toBe('Magic Missile');
    expect(spellInInput('Attack the zombie in the dim light')).toBeNull();
    expect(spellInInput('Walk lightly past the guard')).toBeNull();
    expect(spellInInput('Cast Light on my staff')).toBe('Light');
    expect(spellInInput('wave the blessing scroll')).toBeNull();
  });
});

describe('shared rules engine — level-up (SRD 5.2.1)', () => {
  it('fixed Hit Die + CON per level (at least 1), class features at 2 and 3, Ability Score Improvement at 4', () => {
    const f = built('Human Fighter (Soldier)').character;
    const con = abilityMod(f.attributes.CON);
    const l4 = at(f, 4);
    expect(l4.srd!.hpGains).toEqual([6, 6, 6]);
    expect(l4.srd!.asi).toEqual([{ level: 4, bonus: { STR: 2 } }]);
    expect(l4.attributes.STR).toBe(f.attributes.STR + 2);
    expect(l4.maxHp).toBe(10 + con + 3 * (6 + con));
    const up4 = srdLevelUp(at(f, 3), 4);
    const lines = presentLevelUp('dnd', up4.info);
    expect(lines).toContain('New feature: Ability Score Improvement');
    expect(lines).toContain(`Ability Score Improvement: +2 STR (${f.attributes.STR} → ${f.attributes.STR + 2})`);
    expect(presentLevelUp('litrpg', up4.info)).toEqual(['Level Up! Now level 4']);
    const l3 = srdLevelUp(at(f, 2), 3);
    expect(l3.info.features).toEqual(['Champion subclass: Improved Critical (19–20)', 'Remarkable Athlete']);
  });

  it('raising CON raises max HP for every level; a dwarf adds 1 HP a level', () => {
    const c = built('Dwarf Cleric (Acolyte)').character;
    const l3 = at(c, 3);
    const raised = { ...l3.attributes, CON: l3.attributes.CON + (l3.attributes.CON % 2 ? 1 : 2) };
    expect(tabletopMaxHp(l3.srd!, raised.CON, 3) - tabletopMaxHp(l3.srd!, l3.attributes.CON, 3)).toBe(3);
    const con = abilityMod(c.attributes.CON);
    expect(l3.maxHp).toBe(8 + con + 2 * (5 + con) + 3);
  });

  it('casters gain slots and spells at level-up; a rogue’s Sneak Attack grows to 2d6 at 3', () => {
    const w = built('Elf Wizard (Sage)').character;
    const up = srdLevelUp(at(w, 2), 3);
    expect(up.info.slots).toEqual([4, 2]);
    expect(presentLevelUp('dnd', up.info)).toContain('Spell slots: level 1 ×4, level 2 ×2');
    // Level 2: two more spells in the spellbook (6 → 8), one more prepared.
    const two = srdLevelUp(w, 2);
    expect(two.info.newSpells).toEqual(['Grease', 'Color Spray']);
    expect(presentLevelUp('dnd', two.info)).toContain('New spells: Grease, Color Spray');
    const r = built('Halfling Rogue (Criminal)');
    const r3 = { ...r, character: at(r.character, 3) };
    const feats = deriveTabletopSheet(r3)!.features.join(', ');
    expect(feats).toMatch(/Sneak Attack 2d6/);
    expect(feats).toMatch(/Thief subclass/);
    expect(feats).not.toMatch(/Sneak Attack 1d6/);
  });

  it('a tabletop level-up adds the gain to current HP (no free heal); other characters keep ×1.1 and a full heal', () => {
    const f = built('Human Fighter (Soldier)').character;
    const hurt = { ...f, hp: 3 };
    const up = applyCharacterXpGain(hurt, dndXpToNext(1), 'dnd');
    expect(up.character.hp).toBe(3 + 6 + abilityMod(f.attributes.CON));
    const plain = { ...hurt, srd: undefined, maxHp: 20, hp: 3, xpToNext: 150 } as Character;
    const lit = applyCharacterXpGain(plain, 150, 'litrpg');
    expect(lit).toMatchObject({ notes: ['Level Up! Now level 2'], character: { maxHp: 22, hp: 22 } });
  });
});

const block = (id: string): StatBlock => {
  const { match: _m, ...b } = SRD_MONSTERS.find((m) => m.id === id)!;
  return b;
};
const seq = (...vals: number[]) => {
  let i = 0;
  return () => vals[Math.min(i++, vals.length - 1)]!;
};
const spell = (name: string): PcSpell => ({ name, def: SPELLS[name]!, toHit: 5, dc: 13, mod: 3 });
const caster = (over: Partial<PcProfile> = {}): PcProfile => ({
  name: 'Jax',
  ac: 16,
  hp: 30,
  maxHp: 30,
  speed: 25,
  initiativeMod: 0,
  saves: { STR: 0, DEX: 0, CON: 4, INT: 0, WIS: 5, CHA: 3 },
  stealth: 0,
  species: 'dwarf',
  weapon: { name: 'Mace', toHit: 4, dice: '1d6', mod: 2, type: 'bludgeoning', ranged: false },
  spells: [spell('Bless'), spell('Shield of Faith'), spell('Burning Hands')],
  slots: [2],
  conditions: [],
  ...over,
});
const fight = (b: StatBlock, n = 1, over: Partial<RoundCombatState> = {}) => ({
  combat: {
    encounterName: b.name,
    round: 1,
    pcInitiative: 20,
    foes: Array.from({ length: n }, (_, i) => ({ id: `f${i + 1}`, name: `${b.name} ${i + 1}`, blockId: b.id, hp: b.hp, maxHp: b.hp, initiative: 5, conditions: [] })),
    pcConditions: [],
    ...over,
  } as RoundCombatState,
  blocks: Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i + 1}`, b])),
});

describe('shared rules engine — casting in a round', () => {
  it('a hit while concentrating calls the CON save; a failure ends Bless and the writer hears it in words', () => {
    const f = fight(block('zombie'), 1, { concentration: 'Bless' });
    // Zombie slam d20 20 (crit) 2d6 6+6 +1; CON save d20 1, Bless d4 1: 1 + 4 + 1 = 6 vs DC 10.
    const r = playRound({ pc: caster(), ...f, action: 'other', rng: seq(0.99, 0.99, 0.99, 0, 0) });
    const lines = tabletopCombatLines(r.events, 'Jax').join(' ');
    expect(lines).toContain('you CON save to hold Bless d20 1 + 4 + Bless 1d4 (1) = 6 vs DC 10: failure');
    expect(lines).toContain('you lose concentration on Bless (failed the CON save)');
    expect(r.combat.concentration ?? null).toBeNull();
    const facts = combatFacts(r.events, 'Jax');
    expect(facts).toContain('Your concentration breaks, and Bless fades.');
    // "Zombie 1" is the STATUS name; the fight glue relabels it ("the zombie") before the writer sees it.
    expect(facts.join(' ').replace(/Zombie 1/g, '')).not.toMatch(/\d|to hold/);
  });

  it('dropping to 0 HP ends concentration without a save', () => {
    const f = fight(block('zombie'), 1, { concentration: 'Bless' });
    const r = playRound({ pc: caster({ hp: 4 }), ...f, action: 'other', rng: seq(0.99, 0.99, 0.99) });
    expect(r.outcome).toBe('down');
    expect(tabletopCombatLines(r.events, 'Jax').join(' ')).toContain('you lose concentration on Bless (you dropped to 0 HP)');
  });

  it('a second concentration spell ends the first; the slot is reported back to spend', () => {
    const f = fight(block('zombie'), 1, { concentration: 'Bless' });
    const r = playRound({ pc: caster(), ...f, action: 'cast', spell: 'Shield of Faith', slotLevel: 1, rng: seq(0.01) });
    expect(r.slotSpent).toBe(1);
    expect(r.combat.concentration).toBe('Shield of Faith');
    const lines = tabletopCombatLines(r.events, 'Jax').join(' ');
    expect(lines).toContain('you lose concentration on Bless (you cast Shield of Faith)');
    expect(lines).toContain('you cast Shield of Faith (level 1 slot, concentration)');
  });

  it('Burning Hands: one damage roll, every foe saves, half on a success', () => {
    const f = fight(block('bandit'), 2);
    // Bandit 1 saves (d20 20), then the damage is rolled once (3d6 4, 4, 4 = 12); Bandit 2 saves on the same roll.
    const r = playRound({ pc: caster(), ...f, action: 'cast', spell: 'Burning Hands', slotLevel: 1, rng: seq(0.99, 0.5, 0.5, 0.5, 0.99, 0.01) });
    const hits = r.events.filter((e) => e.k === 'attack' && e.pc);
    expect(hits).toHaveLength(2);
    for (const h of hits) expect(h).toMatchObject({ half: true, dealt: 6 });
    expect(tabletopCombatLines(r.events, 'Jax')[0]).toContain('you Burning Hands: 3d6 (4, 4, 4) = 12, halved = 6 fire; Bandit 1 HP 11 → 5');
    expect(r.slotSpent).toBe(1);
  });
});
