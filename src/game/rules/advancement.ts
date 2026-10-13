/**
 * Shared rules engine — character advancement (level-up).
 * Rules from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode): on a new level gain a Hit Die, HP = the Hit Die roll
 * or the fixed value (half the die + 1) + CON modifier (at least 1), the class features of that level
 * (subclass at level 3, Ability Score Improvement at 4), the new Proficiency Bonus, and more spell slots and
 * spells for a caster. Raising CON raises max HP for every level.
 *
 * A character with a SRD sheet (tabletop) levels this way. Every other character keeps its mode's current rule
 * (max HP × 1.1 and a full heal) — a mode maths difference listed for unification.
 */
import type { Attributes, AttributeKey, Character, EngineMode } from '../types';
import { proficiencyBonus } from '../checkRules';
import { rollDie, signed, type Rng } from './dice';
import { casterProgression, knownSpells } from './spells';
import {
  abilityMod,
  ABILITY_KEYS,
  CLASS_LEVEL_FEATURES,
  classDef,
  fixedHitDieValue,
  fmtMod,
  speciesDef,
  tabletopMaxHp,
} from '../tabletop/characterBuild';

export interface SrdLevelUpInfo {
  level: number;
  hitDie: number;
  /** The die rolled (roll method), or null when the fixed value was taken. */
  roll: number | null;
  taken: number;
  conMod: number;
  dwarf: number;
  maxBefore: number;
  maxAfter: number;
  hpBefore: number;
  hpAfter: number;
  features: string[];
  asi?: { bonus: Partial<Attributes>; before: Partial<Attributes>; after: Partial<Attributes> };
  pbBefore: number;
  pbAfter: number;
  slots?: number[];
  slotsBefore?: number[];
  newSpells: string[];
}

/** Level 4 Ability Score Improvement: +2 to the class's first ability under 19, else +1 and +1 (cap 20). */
export function autoAsi(scores: Attributes, priority: AttributeKey[]): Partial<Attributes> {
  const open = priority.filter((k) => scores[k] < 20);
  const first = open.find((k) => scores[k] <= 18);
  if (first) return { [first]: 2 } as Partial<Attributes>;
  const [a, b] = open;
  if (!a) return {};
  return (b ? { [a]: 1, [b]: 1 } : { [a]: 1 }) as Partial<Attributes>;
}

/** One SRD level-up of a sheet character to `toLevel` (one level above its current). */
export function srdLevelUp(character: Character, toLevel: number, rng: Rng = Math.random): { character: Character; info: SrdLevelUpInfo } {
  const sheet = character.srd!;
  const cls = classDef(sheet.classId);
  const die = cls.hitDie;
  const fromLevel = toLevel - 1;
  const roll = sheet.hpMethod === 'roll' ? rollDie(die, rng) : null;
  const taken = roll ?? fixedHitDieValue(die);
  const gains = [...(sheet.hpGains ?? [])];
  while (gains.length < fromLevel - 1) gains.push(fixedHitDieValue(die));
  gains[toLevel - 2] = taken;
  let attributes = character.attributes;
  let asi: SrdLevelUpInfo['asi'];
  const asiList = [...(sheet.asi ?? [])];
  if ((CLASS_LEVEL_FEATURES[sheet.classId][toLevel] ?? []).includes('Ability Score Improvement')) {
    const bonus = autoAsi(attributes, cls.priority);
    const after = { ...attributes };
    for (const k of ABILITY_KEYS) if (bonus[k]) after[k] = Math.min(20, after[k] + bonus[k]!);
    const keys = ABILITY_KEYS.filter((k) => bonus[k]);
    asi = {
      bonus,
      before: Object.fromEntries(keys.map((k) => [k, attributes[k]])) as Partial<Attributes>,
      after: Object.fromEntries(keys.map((k) => [k, after[k]])) as Partial<Attributes>,
    };
    asiList.push({ level: toLevel, bonus });
    attributes = after;
  }
  const nextSheet = { ...sheet, hpGains: gains, ...(asiList.length ? { asi: asiList } : {}) };
  const maxBefore = character.maxHp ?? tabletopMaxHp(sheet, character.attributes.CON, fromLevel);
  const maxAfter = tabletopMaxHp(nextSheet, attributes.CON, toLevel);
  const hpBefore = character.hp ?? maxBefore;
  const hpAfter = Math.max(0, Math.min(maxAfter, hpBefore + (maxAfter - maxBefore)));
  const progBefore = casterProgression(sheet.classId, fromLevel);
  const progAfter = casterProgression(sheet.classId, toLevel);
  const knownBefore = knownSpells(sheet, fromLevel);
  const knownAfter = knownSpells(nextSheet, toLevel);
  const had = new Set([...(knownBefore?.cantrips ?? []), ...(knownBefore?.prepared ?? []), ...(knownBefore?.spellbook ?? [])]);
  const newSpells = [...new Set([...(knownAfter?.cantrips ?? []), ...(knownAfter?.spellbook ?? []), ...(knownAfter?.prepared ?? [])])].filter((s) => !had.has(s));
  return {
    character: { ...character, attributes, srd: nextSheet, level: toLevel, maxHp: maxAfter, hp: hpAfter },
    info: {
      level: toLevel,
      hitDie: die,
      roll,
      taken,
      conMod: abilityMod(attributes.CON),
      dwarf: speciesDef(sheet.speciesId).hpPerLevel ?? 0,
      maxBefore,
      maxAfter,
      hpBefore,
      hpAfter,
      features: CLASS_LEVEL_FEATURES[sheet.classId][toLevel] ?? [],
      ...(asi ? { asi } : {}),
      pbBefore: proficiencyBonus(fromLevel),
      pbAfter: proficiencyBonus(toLevel),
      ...(progAfter ? { slots: progAfter.slots, slotsBefore: progBefore?.slots ?? [] } : {}),
      newSpells,
    },
  };
}

/** Level-up STATUS lines per mode. Tabletop shows every number; other modes keep the one line they have today. */
export function presentLevelUp(mode: EngineMode | undefined, info: SrdLevelUpInfo): string[] {
  const head = `Level Up! Now level ${info.level}`;
  if (mode !== 'dnd') return [head];
  const how = info.roll != null ? `rolled ${info.roll}` : `fixed ${info.taken}`;
  const dwarf = info.dwarf ? ` + ${info.dwarf} Dwarven Toughness` : '';
  const retro = info.asi?.bonus.CON ? ' (CON raised: every level counts)' : '';
  const lines = [
    head,
    `Level ${info.level} — Hit Die d${info.hitDie}: ${how} ${signed(info.conMod)} CON${dwarf}; HP max ${info.maxBefore} → ${info.maxAfter}${retro}, HP ${info.hpBefore} → ${info.hpAfter}; Hit Dice ${info.level}`,
  ];
  if (info.features.length) lines.push(`New feature${info.features.length > 1 ? 's' : ''}: ${info.features.join(', ')}`);
  if (info.asi) {
    const parts = Object.keys(info.asi.bonus).map((k) => {
      const key = k as AttributeKey;
      return `+${info.asi!.bonus[key]} ${key} (${info.asi!.before[key]} → ${info.asi!.after[key]})`;
    });
    if (parts.length) lines.push(`Ability Score Improvement: ${parts.join(', ')}`);
  }
  if (info.pbAfter !== info.pbBefore) lines.push(`Level ${info.level} — Proficiency Bonus ${fmtMod(info.pbBefore)} → ${fmtMod(info.pbAfter)}`);
  if (info.slots && info.slots.join() !== (info.slotsBefore ?? []).join()) {
    lines.push(`Spell slots: ${info.slots.flatMap((n, i) => (n ? [`level ${i + 1} ×${n}`] : [])).join(', ')}`);
  }
  if (info.newSpells.length) lines.push(`New spell${info.newSpells.length > 1 ? 's' : ''}: ${info.newSpells.join(', ')}`);
  return lines;
}
