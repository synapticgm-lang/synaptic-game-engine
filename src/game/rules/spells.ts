/**
 * Shared rules engine — spellcasting for every SRD caster (Bard, Cleric, Druid, Paladin, Ranger, Sorcerer,
 * Warlock, Wizard): full casters, half casters (Paladin, Ranger) and Pact Magic (Warlock).
 * Spells, spell slots, prepared and known counts, spell save DC and spell attack, and Concentration come from
 * the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode).
 * Spell save DC = 8 + spellcasting modifier + Proficiency Bonus; spell attack = modifier + Proficiency Bonus.
 * A levelled spell spends a slot of its level or higher; a Long Rest restores every slot.
 * Concentration: taking damage calls a CON save, DC 10 or half the damage (higher), to keep it; casting another
 * Concentration spell or dropping to 0 HP ends it.
 * Spell levels, class lists and Concentration are the bundled SRD data (src/data/srd/srd521.json).
 * This module knows no mode; the presenters decide what each mode shows.
 */
import SRD from '../../data/srd/srd521.json';
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
  | 'mark' // Hunter's Mark / Hex: your attack hits on the marked foe deal extra dice while you concentrate
  | 'smite' // Divine / Searing Smite: a weapon attack; on a hit the extra dice land and the slot is spent
  | 'divineFavor' // your weapon hits deal extra radiant dice for the rest of the fight
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
  /** A condition a hit or failed save leaves until the end of your next turn (while you concentrate, for a Concentration spell). */
  rider?: string;
  /** A melee spell attack (Chill Touch, Shocking Grasp). */
  melee?: boolean;
  /** Mark / smite / Divine Favor: the extra damage on a hit. */
  onHit?: { dice: string; type: string };
  /** Divine Smite: one more die against a Fiend or an Undead. */
  vsUndead?: string;
  /** Searing Smite: the burning foe takes this at the start of each of its turns until it saves (CON). */
  burn?: string;
  /** The name is an everyday word (Command, Entangle): the line must say "cast". */
  needsCast?: boolean;
  /** Usable in a fight / outside one. */
  combat: boolean;
  outside: boolean;
  /** What happens, in words, for the writer (no numbers). */
  fact: string;
}

/** A spell as the engine writes it; level, classes and Concentration come from the SRD data. */
type EngineSpell = Omit<SpellDef, 'level' | 'classes' | 'concentration'>;

const ENGINE_SPELLS: Record<string, EngineSpell> = {
  // Cantrips
  'Sacred Flame': { name: 'Sacred Flame', effect: 'save', save: 'DEX', dice: '1d8', type: 'radiant', combat: true, outside: false, fact: 'radiant flame falls on the target' },
  'Fire Bolt': { name: 'Fire Bolt', effect: 'attack', dice: '1d10', type: 'fire', combat: true, outside: false, fact: 'a mote of fire streaks at the target' },
  'Ray of Frost': { name: 'Ray of Frost', effect: 'attack', dice: '1d8', type: 'cold', combat: true, outside: false, fact: 'a frigid beam streaks at the target' },
  'Vicious Mockery': { name: 'Vicious Mockery', effect: 'save', save: 'WIS', dice: '1d6', type: 'psychic', rider: 'Vicious Mockery', combat: true, outside: false, fact: 'a string of insults laced with subtle enchantment stings the target' },
  'Starry Wisp': { name: 'Starry Wisp', effect: 'attack', dice: '1d8', type: 'radiant', combat: true, outside: false, fact: 'a mote of starlight flies at the target' },
  'Produce Flame': { name: 'Produce Flame', effect: 'attack', dice: '1d8', type: 'fire', combat: true, outside: false, fact: 'a flickering flame leaps from your hand and you hurl it at the target' },
  'Poison Spray': { name: 'Poison Spray', effect: 'attack', dice: '1d12', type: 'poison', combat: true, outside: false, fact: 'a spray of toxic mist lashes at the target' },
  'Chill Touch': { name: 'Chill Touch', effect: 'attack', melee: true, dice: '1d10', type: 'necrotic', combat: true, outside: false, fact: 'your hand, wreathed in the chill of the grave, reaches for the target' },
  'Shocking Grasp': { name: 'Shocking Grasp', effect: 'attack', melee: true, dice: '1d8', type: 'lightning', combat: true, outside: false, fact: 'lightning springs from your hand at a touch' },
  'Eldritch Blast': { name: 'Eldritch Blast', effect: 'attack', dice: '1d10', type: 'force', combat: true, outside: false, fact: 'a beam of crackling energy streaks at the target' },
  Light: { name: 'Light', effect: 'utility', combat: false, outside: true, fact: 'an object you touch sheds bright light around you for an hour' },
  'Dancing Lights': { name: 'Dancing Lights', effect: 'utility', combat: false, outside: true, fact: 'small floating lights bob around you, lighting the way' },
  Thaumaturgy: { name: 'Thaumaturgy', effect: 'utility', combat: false, outside: true, fact: 'a minor wonder answers you: your voice booms, flames flicker or the ground trembles harmlessly for a moment' },
  Druidcraft: { name: 'Druidcraft', effect: 'utility', combat: false, outside: true, fact: 'a small nature effect answers you: a bud blooms, a breeze stirs leaves, or a sensory sign of tomorrow\'s weather appears' },
  Prestidigitation: { name: 'Prestidigitation', effect: 'utility', combat: false, outside: true, fact: 'a harmless magical trick answers you: a spark, a clean cloth, a warm cup or a small mark' },
  'Minor Illusion': { name: 'Minor Illusion', effect: 'utility', combat: false, outside: true, fact: 'a small sound or image of your making appears nearby' },
  Mending: { name: 'Mending', effect: 'utility', combat: false, outside: true, fact: 'a single break or tear in an object you touch knits closed' },
  'Mage Hand': { name: 'Mage Hand', effect: 'utility', combat: false, outside: true, fact: 'a spectral hand appears to lift or move a light object for you' },
  // Level 1
  'Cure Wounds': { name: 'Cure Wounds', effect: 'heal', dice: '2d8', upcast: '2d8', combat: true, outside: true, fact: 'healing warmth closes your wounds' },
  'Healing Word': { name: 'Healing Word', effect: 'heal', dice: '2d4', upcast: '2d4', bonusAction: true, combat: true, outside: true, fact: 'a spoken word of healing eases your hurts' },
  'Guiding Bolt': { name: 'Guiding Bolt', effect: 'attack', dice: '4d6', upcast: '1d6', type: 'radiant', rider: 'Guiding Bolt', combat: true, outside: false, fact: 'a flash of light streaks at the target and leaves it glowing' },
  Bless: { name: 'Bless', effect: 'bless', combat: true, outside: false, fact: 'a blessing settles on you and steadies your aim' },
  'Shield of Faith': { name: 'Shield of Faith', effect: 'shieldOfFaith', bonusAction: true, combat: true, outside: false, fact: 'a shimmering field surrounds and protects you' },
  Bane: { name: 'Bane', effect: 'bane', save: 'CHA', area: true, combat: true, outside: false, fact: 'a curse reaches for your foes' },
  'Inflict Wounds': { name: 'Inflict Wounds', effect: 'save', save: 'CON', halfOnSave: true, dice: '2d10', upcast: '1d10', type: 'necrotic', combat: true, outside: false, fact: 'necrotic energy floods the target' },
  'Magic Missile': { name: 'Magic Missile', effect: 'missile', dice: '1d4+1', darts: 3, type: 'force', combat: true, outside: false, fact: 'glowing darts of force strike unerringly' },
  'Burning Hands': { name: 'Burning Hands', effect: 'save', save: 'DEX', halfOnSave: true, area: true, dice: '3d6', upcast: '1d6', type: 'fire', combat: true, outside: false, fact: 'a thin sheet of flame shoots from your hands' },
  Thunderwave: { name: 'Thunderwave', effect: 'save', save: 'CON', halfOnSave: true, area: true, dice: '2d8', upcast: '1d8', type: 'thunder', combat: true, outside: false, fact: 'a wave of thunderous force sweeps out from you' },
  'Mage Armor': { name: 'Mage Armor', effect: 'mageArmor', combat: true, outside: true, fact: 'a protective magical force settles over you' },
  'Chromatic Orb': { name: 'Chromatic Orb', effect: 'attack', dice: '3d8', upcast: '1d8', type: 'acid', combat: true, outside: false, fact: 'an orb of acid hurtles at the target' },
  'Ray of Sickness': { name: 'Ray of Sickness', effect: 'attack', dice: '2d8', upcast: '1d8', type: 'poison', rider: 'Poisoned', combat: true, outside: false, fact: 'a ray of sickening green energy lashes at the target' },
  Grease: { name: 'Grease', effect: 'save', save: 'DEX', area: true, rider: 'Prone', combat: true, outside: false, fact: 'slick grease covers the ground under your foes' },
  'Color Spray': { name: 'Color Spray', effect: 'save', save: 'CON', area: true, rider: 'Blinded', combat: true, outside: false, fact: 'a dazzling array of flashing colored light springs from your hand' },
  'Dissonant Whispers': { name: 'Dissonant Whispers', effect: 'save', save: 'WIS', halfOnSave: true, dice: '3d6', upcast: '1d6', type: 'psychic', combat: true, outside: false, fact: 'a discordant melody only the target can hear wracks it with pain' },
  'Faerie Fire': { name: 'Faerie Fire', effect: 'save', save: 'DEX', area: true, rider: 'Faerie Fire', combat: true, outside: false, fact: 'your foes are outlined in pale light that shows every move' },
  Entangle: { name: 'Entangle', effect: 'save', save: 'STR', area: true, rider: 'Restrained', needsCast: true, combat: true, outside: false, fact: 'grasping weeds and vines sprout from the ground around your foes' },
  Command: { name: 'Command', effect: 'save', save: 'WIS', rider: 'Prone', needsCast: true, combat: true, outside: false, fact: 'you speak one word of command — "Grovel" — and the target obeys if its will breaks' },
  "Hunter's Mark": { name: "Hunter's Mark", effect: 'mark', onHit: { dice: '1d6', type: 'force' }, bonusAction: true, combat: true, outside: false, fact: 'you mark the target as your quarry' },
  Hex: { name: 'Hex', effect: 'mark', onHit: { dice: '1d6', type: 'necrotic' }, bonusAction: true, combat: true, outside: false, fact: 'you lay a curse on the target' },
  'Divine Smite': { name: 'Divine Smite', effect: 'smite', onHit: { dice: '2d8', type: 'radiant' }, upcast: '1d8', vsUndead: '1d8', bonusAction: true, combat: true, outside: false, fact: 'radiant power floods through your weapon into the target' },
  'Searing Smite': { name: 'Searing Smite', effect: 'smite', onHit: { dice: '1d6', type: 'fire' }, upcast: '1d6', burn: '1d6', bonusAction: true, combat: true, outside: false, fact: 'your weapon flares with white-hot fire and sets the target burning' },
  'Divine Favor': { name: 'Divine Favor', effect: 'divineFavor', onHit: { dice: '1d4', type: 'radiant' }, bonusAction: true, combat: true, outside: false, fact: 'divine radiance runs along your weapon' },
  'Charm Person': { name: 'Charm Person', effect: 'utility', combat: false, outside: true, fact: 'you weave a charm that makes a humanoid regard you as a friendly acquaintance for a while' },
  'Detect Magic': { name: 'Detect Magic', effect: 'utility', combat: false, outside: true, fact: 'you sense the presence of magic nearby' },
  'Speak with Animals': { name: 'Speak with Animals', effect: 'utility', combat: false, outside: true, fact: 'you can understand and speak with beasts for a while' },
  'Comprehend Languages': { name: 'Comprehend Languages', effect: 'utility', combat: false, outside: true, fact: 'you understand the literal meaning of any language you hear or see written for a while' },
  'Animal Friendship': { name: 'Animal Friendship', effect: 'utility', combat: false, outside: true, fact: 'you convince a beast that you mean it no harm' },
};

const SRD_SPELLS = SRD.spells as Record<string, { level: 0 | 1; classes: string[]; concentration: boolean }>;

/** Every spell the engine runs: its level, class lists and Concentration from the SRD data, the rest from the engine. */
export const SPELLS: Record<string, SpellDef> = Object.fromEntries(
  Object.entries(ENGINE_SPELLS).map(([name, spell]) => {
    const srd = SRD_SPELLS[name]!;
    const def: SpellDef = { ...spell, level: srd.level, classes: srd.classes as TabletopClassId[] };
    return [name, srd.concentration ? { ...def, concentration: true } : def];
  })
);

/** Cantrips a class knows, in the order it learns them. */
const CANTRIP_ORDER: Partial<Record<TabletopClassId, string[]>> = {
  bard: ['Vicious Mockery', 'Starry Wisp', 'Light', 'Mage Hand', 'Minor Illusion', 'Prestidigitation'],
  cleric: ['Sacred Flame', 'Light', 'Thaumaturgy', 'Mending'],
  druid: ['Produce Flame', 'Starry Wisp', 'Druidcraft', 'Poison Spray', 'Mending'],
  sorcerer: ['Fire Bolt', 'Shocking Grasp', 'Light', 'Prestidigitation', 'Ray of Frost', 'Mage Hand'],
  warlock: ['Eldritch Blast', 'Chill Touch', 'Minor Illusion', 'Prestidigitation'],
  wizard: ['Fire Bolt', 'Ray of Frost', 'Light', 'Mage Hand'],
};

/** Level 1 spells a class prepares (or writes in the spellbook, Wizard), in pick order. */
const SPELL_ORDER: Partial<Record<TabletopClassId, string[]>> = {
  bard: ['Healing Word', 'Dissonant Whispers', 'Faerie Fire', 'Cure Wounds', 'Thunderwave', 'Command', 'Bane', 'Charm Person', 'Color Spray', 'Detect Magic', 'Comprehend Languages', 'Speak with Animals', 'Animal Friendship'],
  cleric: ['Cure Wounds', 'Guiding Bolt', 'Bless', 'Healing Word', 'Shield of Faith', 'Bane', 'Inflict Wounds'],
  druid: ['Cure Wounds', 'Entangle', 'Faerie Fire', 'Thunderwave', 'Healing Word', 'Charm Person', 'Detect Magic', 'Speak with Animals', 'Animal Friendship'],
  paladin: ['Bless', 'Cure Wounds', 'Divine Favor', 'Searing Smite', 'Shield of Faith', 'Command', 'Detect Magic'],
  ranger: ['Cure Wounds', 'Entangle', 'Animal Friendship', 'Speak with Animals', 'Detect Magic'],
  sorcerer: ['Magic Missile', 'Burning Hands', 'Mage Armor', 'Thunderwave', 'Chromatic Orb', 'Ray of Sickness', 'Color Spray', 'Grease', 'Charm Person', 'Detect Magic', 'Comprehend Languages'],
  warlock: ['Hex', 'Charm Person', 'Bane', 'Comprehend Languages', 'Detect Magic', 'Speak with Animals'],
  wizard: ['Magic Missile', 'Burning Hands', 'Mage Armor', 'Thunderwave', 'Chromatic Orb', 'Ray of Sickness', 'Grease', 'Color Spray'],
};

type CasterType = 'full' | 'half' | 'pact';

/** SRD 5.2.1 class tables: the caster type, cantrips and prepared spells by level (index 0 = level 1). */
const CASTER_TABLE: Partial<Record<TabletopClassId, { type: CasterType; ability: AttributeKey; cantrips: number[]; prepared: number[] }>> = {
  bard: { type: 'full', ability: 'CHA', cantrips: [2, 2, 2, 3, 3], prepared: [4, 5, 6, 7, 9] },
  cleric: { type: 'full', ability: 'WIS', cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9] },
  // Druid cantrips include the extra one from Primal Order (Magician).
  druid: { type: 'full', ability: 'WIS', cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9] },
  paladin: { type: 'half', ability: 'CHA', cantrips: [0, 0, 0, 0, 0], prepared: [2, 3, 4, 5, 6] },
  ranger: { type: 'half', ability: 'WIS', cantrips: [0, 0, 0, 0, 0], prepared: [2, 3, 4, 5, 6] },
  sorcerer: { type: 'full', ability: 'CHA', cantrips: [4, 4, 4, 5, 5], prepared: [2, 4, 6, 7, 9] },
  warlock: { type: 'pact', ability: 'CHA', cantrips: [2, 2, 2, 3, 3], prepared: [2, 3, 4, 5, 6] },
  wizard: { type: 'full', ability: 'INT', cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9] },
};

/** Spell slots by character level (index 0 = level 1 slots). */
const SLOTS: Record<CasterType, number[][]> = {
  full: [[2], [3], [4, 2], [4, 3], [4, 3, 2]],
  half: [[2], [2], [3], [3], [4, 2]],
  // Pact Magic: every slot is the Warlock's slot level (1st at levels 1–2, 2nd at 3–4, 3rd at 5).
  pact: [[1], [2], [0, 2], [0, 2], [0, 0, 2]],
};

/**
 * Spells a class always has prepared (not counted against the prepared number), SRD 5.2.1: Ranger Favored
 * Enemy (Hunter's Mark); Paladin's Smite (Divine Smite, level 2); the level-3 subclass lists (Life Domain,
 * Oath of Devotion, Draconic Sorcery, Fiend Patron) — only their level-1 spells exist in this engine.
 */
export function alwaysPrepared(classId: TabletopClassId, level: number): string[] {
  const l = Math.max(1, level || 1);
  switch (classId) {
    case 'ranger': return ["Hunter's Mark"];
    case 'paladin': return [...(l >= 2 ? ['Divine Smite'] : []), ...(l >= 3 ? ['Shield of Faith'] : [])];
    case 'cleric': return l >= 3 ? ['Bless', 'Cure Wounds'] : [];
    case 'sorcerer': return l >= 3 ? ['Chromatic Orb', 'Command'] : [];
    case 'warlock': return l >= 3 ? ['Burning Hands', 'Command'] : [];
    default: return [];
  }
}

/** Spells cast at will with no slot (Warlock Armor of Shadows: Mage Armor on yourself). */
export function atWillSpells(classId: TabletopClassId): string[] {
  return classId === 'warlock' ? ['Mage Armor'] : [];
}

export function isCaster(classId: TabletopClassId | undefined): boolean {
  return !!classId && !!CASTER_TABLE[classId];
}

export function spellcastingAbility(classId: TabletopClassId): AttributeKey {
  return CASTER_TABLE[classId]?.ability ?? 'WIS';
}

export function isPactCaster(classId: TabletopClassId | undefined): boolean {
  return !!classId && CASTER_TABLE[classId]?.type === 'pact';
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
  const row = CASTER_TABLE[classId];
  if (!row) return null;
  const l = Math.max(1, Math.min(5, Math.floor(level || 1)));
  return {
    cantrips: row.cantrips[l - 1]!,
    prepared: row.prepared[l - 1]!,
    spellbook: classId === 'wizard' ? 6 + 2 * (l - 1) : 0,
    slots: SLOTS[row.type][l - 1]!,
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
  const picked = (chosen?.prepared?.length ? chosen.prepared.filter((s) => from.includes(s)) : from).slice(0, prog.prepared);
  const prepared = [...picked, ...alwaysPrepared(sheet.classId, level).filter((s) => !picked.includes(s))];
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
  return SPELL_RES.find(([n, re]) => re.test(s) && (cast || (SPELLS[n]!.effect !== 'utility' && !SPELLS[n]!.needsCast)))?.[0] ?? null;
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
