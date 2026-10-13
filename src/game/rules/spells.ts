/**
 * Shared rules engine — spellcasting for the starter casters (Cleric, Wizard).
 * Spells, spell slots, prepared and known counts, spell save DC and spell attack, and Concentration come from
 * the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode).
 * Spell save DC = 8 + spellcasting modifier + Proficiency Bonus; spell attack = modifier + Proficiency Bonus.
 * A levelled spell spends a slot of its level or higher; a Long Rest restores every slot.
 * Concentration: taking damage calls a CON save, DC 10 or half the damage (higher), to keep it; casting another
 * Concentration spell or dropping to 0 HP ends it.
 * This module knows no mode; the presenters decide what each mode shows.
 */
import type { AttributeKey, CastingState, TabletopClassId, TabletopSheet } from '../types';

export type SpellEffect =
  | 'attack' // spell attack roll, damage on a hit
  | 'save' // the target saves; damage on a failure (half on a success when halfOnSave)
  | 'missile' // Magic Missile: darts that always hit
  | 'heal' // restores HP (dice + spellcasting modifier)
  | 'bless' // +1d4 to your attack rolls and saving throws
  | 'bane' // targets that fail a CHA save subtract 1d4 from attack rolls and saving throws
  | 'shieldOfFaith' // +2 AC
  | 'mageArmor' // AC 13 + DEX with no armor
  | 'utility'; // a sensory or utility effect with no engine numbers

export interface SpellDef {
  name: string;
  level: 0 | 1;
  classes: TabletopClassId[];
  effect: SpellEffect;
  dice?: string;
  type?: string;
  save?: AttributeKey;
  halfOnSave?: boolean;
  /** Hits every foe in reach (cone or burst). */
  area?: boolean;
  /** Extra dice per slot level above the spell's level. */
  upcast?: string;
  /** Darts per cast (Magic Missile), +1 per slot level above 1. */
  darts?: number;
  concentration?: boolean;
  /** The SRD casting time is a Bonus Action; this engine has no Bonus Actions yet, so it uses the round's action. */
  bonusAction?: boolean;
  /** A condition a hit or failed save leaves until the end of your next turn. */
  rider?: string;
  /** Usable in a fight / outside one. */
  combat: boolean;
  outside: boolean;
  /** What happens, in words, for the writer (no numbers). */
  fact: string;
}

export const SPELLS: Record<string, SpellDef> = {
  // Cantrips
  'Sacred Flame': { name: 'Sacred Flame', level: 0, classes: ['cleric'], effect: 'save', save: 'DEX', dice: '1d8', type: 'radiant', combat: true, outside: false, fact: 'radiant flame falls on the target' },
  'Fire Bolt': { name: 'Fire Bolt', level: 0, classes: ['wizard'], effect: 'attack', dice: '1d10', type: 'fire', combat: true, outside: false, fact: 'a mote of fire streaks at the target' },
  'Ray of Frost': { name: 'Ray of Frost', level: 0, classes: ['wizard'], effect: 'attack', dice: '1d8', type: 'cold', combat: true, outside: false, fact: 'a frigid beam streaks at the target' },
  Light: { name: 'Light', level: 0, classes: ['cleric', 'wizard'], effect: 'utility', combat: false, outside: true, fact: 'an object you touch sheds bright light around you for an hour' },
  Thaumaturgy: { name: 'Thaumaturgy', level: 0, classes: ['cleric'], effect: 'utility', combat: false, outside: true, fact: 'a minor wonder answers you: your voice booms, flames flicker or the ground trembles harmlessly for a moment' },
  Mending: { name: 'Mending', level: 0, classes: ['cleric'], effect: 'utility', combat: false, outside: true, fact: 'a single break or tear in an object you touch knits closed' },
  'Mage Hand': { name: 'Mage Hand', level: 0, classes: ['wizard'], effect: 'utility', combat: false, outside: true, fact: 'a spectral hand appears to lift or move a light object for you' },
  // Level 1 — Cleric
  'Cure Wounds': { name: 'Cure Wounds', level: 1, classes: ['cleric'], effect: 'heal', dice: '2d8', upcast: '2d8', combat: true, outside: true, fact: 'healing warmth closes your wounds' },
  'Healing Word': { name: 'Healing Word', level: 1, classes: ['cleric'], effect: 'heal', dice: '2d4', upcast: '2d4', bonusAction: true, combat: true, outside: true, fact: 'a spoken word of healing eases your hurts' },
  'Guiding Bolt': { name: 'Guiding Bolt', level: 1, classes: ['cleric'], effect: 'attack', dice: '4d6', upcast: '1d6', type: 'radiant', rider: 'Guiding Bolt', combat: true, outside: false, fact: 'a flash of light streaks at the target and leaves it glowing' },
  Bless: { name: 'Bless', level: 1, classes: ['cleric'], effect: 'bless', concentration: true, combat: true, outside: false, fact: 'a blessing settles on you and steadies your aim' },
  'Shield of Faith': { name: 'Shield of Faith', level: 1, classes: ['cleric'], effect: 'shieldOfFaith', concentration: true, bonusAction: true, combat: true, outside: false, fact: 'a shimmering field surrounds and protects you' },
  Bane: { name: 'Bane', level: 1, classes: ['cleric'], effect: 'bane', save: 'CHA', concentration: true, area: true, combat: true, outside: false, fact: 'a curse reaches for your foes' },
  'Inflict Wounds': { name: 'Inflict Wounds', level: 1, classes: ['cleric'], effect: 'save', save: 'CON', halfOnSave: true, dice: '2d10', upcast: '1d10', type: 'necrotic', combat: true, outside: false, fact: 'necrotic energy floods the target' },
  // Level 1 — Wizard
  'Magic Missile': { name: 'Magic Missile', level: 1, classes: ['wizard'], effect: 'missile', dice: '1d4+1', darts: 3, type: 'force', combat: true, outside: false, fact: 'glowing darts of force strike unerringly' },
  'Burning Hands': { name: 'Burning Hands', level: 1, classes: ['wizard'], effect: 'save', save: 'DEX', halfOnSave: true, area: true, dice: '3d6', upcast: '1d6', type: 'fire', combat: true, outside: false, fact: 'a thin sheet of flame shoots from your hands' },
  Thunderwave: { name: 'Thunderwave', level: 1, classes: ['wizard'], effect: 'save', save: 'CON', halfOnSave: true, area: true, dice: '2d8', upcast: '1d8', type: 'thunder', combat: true, outside: false, fact: 'a wave of thunderous force sweeps out from you' },
  'Mage Armor': { name: 'Mage Armor', level: 1, classes: ['wizard'], effect: 'mageArmor', combat: true, outside: true, fact: 'a protective magical force settles over you' },
  'Chromatic Orb': { name: 'Chromatic Orb', level: 1, classes: ['wizard'], effect: 'attack', dice: '3d8', upcast: '1d8', type: 'acid', combat: true, outside: false, fact: 'an orb of acid hurtles at the target' },
  'Ray of Sickness': { name: 'Ray of Sickness', level: 1, classes: ['wizard'], effect: 'attack', dice: '2d8', upcast: '1d8', type: 'poison', rider: 'Poisoned', combat: true, outside: false, fact: 'a ray of sickening green energy lashes at the target' },
  Grease: { name: 'Grease', level: 1, classes: ['wizard'], effect: 'save', save: 'DEX', area: true, rider: 'Prone', combat: true, outside: false, fact: 'slick grease covers the ground under your foes' },
  'Color Spray': { name: 'Color Spray', level: 1, classes: ['wizard'], effect: 'save', save: 'CON', area: true, rider: 'Blinded', combat: true, outside: false, fact: 'a dazzling array of flashing colored light springs from your hand' },
};

/** Cantrips a class knows, in the order it learns them (3 at levels 1–3, 4 from level 4). */
const CANTRIP_ORDER: Partial<Record<TabletopClassId, string[]>> = {
  cleric: ['Sacred Flame', 'Light', 'Thaumaturgy', 'Mending'],
  wizard: ['Fire Bolt', 'Ray of Frost', 'Light', 'Mage Hand'],
};

/** Level 1 spells a class prepares (Cleric) or writes in the spellbook (Wizard), in pick order. */
const SPELL_ORDER: Partial<Record<TabletopClassId, string[]>> = {
  cleric: ['Cure Wounds', 'Guiding Bolt', 'Bless', 'Healing Word', 'Shield of Faith', 'Bane', 'Inflict Wounds'],
  wizard: ['Magic Missile', 'Burning Hands', 'Mage Armor', 'Thunderwave', 'Chromatic Orb', 'Ray of Sickness', 'Grease', 'Color Spray'],
};

/** Full-caster slots by character level (index 0 = level 1 slots). SRD 5.2.1 Cleric / Wizard tables. */
const FULL_CASTER_SLOTS: number[][] = [[2], [3], [4, 2], [4, 3], [4, 3, 2]];
/** Prepared spells by level, SRD 5.2.1 Cleric / Wizard tables. */
const PREPARED = [4, 5, 6, 7, 9];

export function isCaster(classId: TabletopClassId | undefined): boolean {
  return classId === 'cleric' || classId === 'wizard';
}

export function spellcastingAbility(classId: TabletopClassId): AttributeKey {
  return classId === 'wizard' ? 'INT' : 'WIS';
}

export interface CasterProgression {
  cantrips: number;
  prepared: number;
  /** Wizard spellbook size (6 at level 1, +2 a level). */
  spellbook: number;
  /** Slots per spell level (index 0 = level 1). */
  slots: number[];
}

export function casterProgression(classId: TabletopClassId, level: number): CasterProgression | null {
  if (!isCaster(classId)) return null;
  const l = Math.max(1, Math.min(5, Math.floor(level || 1)));
  return {
    cantrips: l >= 4 ? 4 : 3,
    prepared: PREPARED[l - 1]!,
    spellbook: classId === 'wizard' ? 6 + 2 * (l - 1) : 0,
    slots: FULL_CASTER_SLOTS[l - 1]!,
  };
}

export interface KnownSpells {
  cantrips: string[];
  prepared: string[];
  spellbook: string[];
}

/**
 * The spells a caster has at `level`. Only level 1 spells exist in this engine, so a list runs out before the
 * SRD count at higher levels (Cleric 7, Wizard 8 in the book); higher slots cast them upcast.
 */
export function knownSpells(sheet: Pick<TabletopSheet, 'classId' | 'spells'>, level: number): KnownSpells | null {
  const prog = casterProgression(sheet.classId, level);
  if (!prog) return null;
  const cantripPool = CANTRIP_ORDER[sheet.classId] ?? [];
  const pool = SPELL_ORDER[sheet.classId] ?? [];
  const chosen = sheet.spells;
  const cantrips = (chosen?.cantrips?.length ? chosen.cantrips : cantripPool).slice(0, prog.cantrips);
  const spellbook = sheet.classId === 'wizard' ? (chosen?.spellbook?.length ? chosen.spellbook : pool).slice(0, prog.spellbook) : [];
  const from = sheet.classId === 'wizard' ? spellbook : pool;
  const prepared = (chosen?.prepared?.length ? chosen.prepared.filter((s) => from.includes(s)) : from).slice(0, prog.prepared);
  return { cantrips, prepared, spellbook };
}

export function slotsLeft(classId: TabletopClassId, level: number, casting: CastingState | undefined): number[] {
  const prog = casterProgression(classId, level);
  if (!prog) return [];
  return prog.slots.map((n, i) => Math.max(0, n - (casting?.slotsUsed?.[i] ?? 0)));
}

/** The lowest slot at `minLevel` or higher with one left; `want` asks for a specific slot level. Null when none. */
export function pickSlot(left: number[], minLevel: number, want?: number): number | null {
  if (want && want >= minLevel && (left[want - 1] ?? 0) > 0) return want;
  if (want) return null;
  for (let i = minLevel - 1; i < left.length; i++) if ((left[i] ?? 0) > 0) return i + 1;
  return null;
}

export function spendSlot(casting: CastingState | undefined, slotLevel: number): CastingState {
  const used = [...(casting?.slotsUsed ?? [])];
  while (used.length < slotLevel) used.push(0);
  used[slotLevel - 1] = (used[slotLevel - 1] ?? 0) + 1;
  return { ...(casting ?? { slotsUsed: [] }), slotsUsed: used };
}

/** Spell save DC = 8 + modifier + PB; spell attack = modifier + PB. */
export function spellNumbers(abilityMod: number, pb: number): { dc: number; attack: number } {
  return { dc: 8 + abilityMod + pb, attack: abilityMod + pb };
}

export function concentrationDc(damage: number): number {
  return Math.max(10, Math.floor(damage / 2));
}

/** Dice for a spell cast with `slotLevel` (upcast adds the per-level dice). */
export function spellDice(def: SpellDef, slotLevel: number): string {
  const base = def.dice ?? '1d4';
  const extra = Math.max(0, slotLevel - Math.max(1, def.level));
  if (!extra || !def.upcast) return base;
  const b = /^(\d+)d(\d+)$/.exec(base);
  const u = /^(\d+)d(\d+)$/.exec(def.upcast);
  if (b && u && b[2] === u[2]) return `${Number(b[1]) + Number(u[1]) * extra}d${b[2]}`;
  return base;
}

const SPELL_NAMES = Object.keys(SPELLS).sort((a, b) => b.length - a.length);

const SPELL_RES = SPELL_NAMES.map((n) => [n, new RegExp(`\\b${n.toLowerCase().replace(/ /g, '\\s+')}\\b`)] as const);

/**
 * The spell a line names ("Cast Cure Wounds", "cast bless on myself"), or null. Whole words only; a utility
 * spell whose name is an everyday word (Light, Mending) counts only when the line says "cast".
 */
export function spellInInput(input: string): string | null {
  const s = (input ?? '').toLowerCase();
  const cast = /\bcast\b/.test(s);
  return SPELL_RES.find(([n, re]) => re.test(s) && (cast || SPELLS[n]!.effect !== 'utility'))?.[0] ?? null;
}

/** "at level 2", "with a 2nd-level slot", "level 2 slot". */
export function slotLevelInInput(input: string): number | undefined {
  const m = /\b(?:at|with an?|using an?)?\s*(?:level|lvl)\s*([1-9])\b|\b([1-9])(?:st|nd|rd|th)[- ]level\b/i.exec(input ?? '');
  const n = m ? Number(m[1] ?? m[2]) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/** A Wizard's Arcane Recovery on a Short Rest: slots worth up to half the Wizard level (rounded up), once a day. */
export function arcaneRecovery(level: number, casting: CastingState | undefined): { casting: CastingState; recovered: number[] } | null {
  if (casting?.arcaneRecoveryUsed) return null;
  let budget = Math.ceil(Math.max(1, level) / 2);
  const used = [...(casting?.slotsUsed ?? [])];
  const recovered: number[] = [];
  for (let i = Math.min(used.length, 5) - 1; i >= 0; i--) {
    while ((used[i] ?? 0) > 0 && i + 1 <= budget) {
      used[i]! -= 1;
      budget -= i + 1;
      recovered.push(i + 1);
    }
  }
  if (!recovered.length) return null;
  return { casting: { ...(casting ?? { slotsUsed: [] }), slotsUsed: used, arcaneRecoveryUsed: true }, recovered };
}
