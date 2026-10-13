/**
 * Tabletop (engineMode 'dnd') character creation. Rules data and the derived sheet.
 *
 * Species, classes, backgrounds, ability-score methods, starting equipment, skills, saves, armour and
 * weapon numbers come from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode).
 *
 * The engine owns every number on the sheet. The writer never sees the creation menu; it only reads the
 * finished sheet through the character and inventory.
 */
import type {
  AbilityMethod,
  AttributeKey,
  Attributes,
  Character,
  Container,
  GameState,
  Item,
  KitId,
  TabletopBackgroundId,
  TabletopClassId,
  TabletopPicks,
  TabletopSheet,
  TabletopSpeciesId,
} from '../types';
import { proficiencyBonus } from '../checkRules';
import { sheetSkillBonus } from '../checkMath';
import { mulberry32, type Rng } from '../fatePick';
import { syncContainerOccupancy } from '../inventory';

export type { AbilityMethod, KitId, TabletopBackgroundId, TabletopClassId, TabletopPicks, TabletopSheet, TabletopSpeciesId };
export { sheetSkillBonus };

export const ABILITY_KEYS: AttributeKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const SRD_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation',
  'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
] as const;
export type SrdSkill = (typeof SRD_SKILLS)[number];

export const SKILL_ABILITY: Record<SrdSkill, AttributeKey> = {
  Acrobatics: 'DEX', 'Animal Handling': 'WIS', Arcana: 'INT', Athletics: 'STR', Deception: 'CHA',
  History: 'INT', Insight: 'WIS', Intimidation: 'CHA', Investigation: 'INT', Medicine: 'WIS',
  Nature: 'INT', Perception: 'WIS', Performance: 'CHA', Persuasion: 'CHA', Religion: 'INT',
  'Sleight of Hand': 'DEX', Stealth: 'DEX', Survival: 'WIS',
};

interface SpeciesDef {
  id: TabletopSpeciesId;
  name: string;
  size: 'Small' | 'Medium';
  speed: number;
  darkvision: number;
  kinLanguage?: string;
  traits: string[];
  /** Skill proficiency the species grants (Keen Senses picks the first free of these). */
  skillFrom?: SrdSkill[];
  /** Dwarven Toughness: +1 HP max per level. */
  hpPerLevel?: number;
}

export const SPECIES: SpeciesDef[] = [
  { id: 'human', name: 'Human', size: 'Medium', speed: 30, darkvision: 0,
    traits: ['Resourceful: Heroic Inspiration after each Long Rest', 'Skillful: one extra skill proficiency', 'Versatile: an Origin feat (Skilled)'],
    skillFrom: [...SRD_SKILLS] },
  { id: 'elf', name: 'Elf', size: 'Medium', speed: 30, darkvision: 60, kinLanguage: 'Elvish',
    traits: ['Darkvision 60 ft', 'Elven Lineage', 'Fey Ancestry: Advantage on saves to avoid or end Charmed', 'Keen Senses: Insight, Perception or Survival', 'Trance: a Long Rest in 4 hours'],
    skillFrom: ['Perception', 'Insight', 'Survival'] },
  { id: 'dwarf', name: 'Dwarf', size: 'Medium', speed: 30, darkvision: 120, kinLanguage: 'Dwarvish',
    traits: ['Darkvision 120 ft', 'Dwarven Resilience: Resistance to Poison damage, Advantage on saves against Poisoned', 'Dwarven Toughness: +1 HP max per level', 'Stonecunning'],
    hpPerLevel: 1 },
  { id: 'halfling', name: 'Halfling', size: 'Small', speed: 30, darkvision: 0, kinLanguage: 'Halfling',
    traits: ['Brave: Advantage on saves against Frightened', 'Halfling Nimbleness', 'Luck: reroll a 1 on a d20 Test', 'Naturally Stealthy'] },
  { id: 'gnome', name: 'Gnome', size: 'Small', speed: 30, darkvision: 60, kinLanguage: 'Gnomish',
    traits: ['Darkvision 60 ft', 'Gnomish Cunning: Advantage on INT, WIS and CHA saves', 'Gnomish Lineage'] },
  { id: 'orc', name: 'Orc', size: 'Medium', speed: 30, darkvision: 120, kinLanguage: 'Orc',
    traits: ['Darkvision 120 ft', 'Adrenaline Rush', 'Relentless Endurance: drop to 1 HP instead of 0, once per Long Rest'] },
  { id: 'dragonborn', name: 'Dragonborn', size: 'Medium', speed: 30, darkvision: 60, kinLanguage: 'Draconic',
    traits: ['Darkvision 60 ft', 'Draconic Ancestry', 'Breath Weapon', 'Damage Resistance (ancestry type)'] },
  { id: 'tiefling', name: 'Tiefling', size: 'Medium', speed: 30, darkvision: 60,
    traits: ['Darkvision 60 ft', 'Fiendish Legacy', 'Otherworldly Presence'] },
  { id: 'goliath', name: 'Goliath', size: 'Medium', speed: 35, darkvision: 0, kinLanguage: 'Giant',
    traits: ['Giant Ancestry', 'Powerful Build: Advantage to end Grappled, counts one size larger for carrying'] },
];

interface ClassDef {
  id: TabletopClassId;
  name: string;
  hitDie: number;
  primary: string;
  saves: AttributeKey[];
  armorTraining: string;
  skillChoices: SrdSkill[];
  skillCount: number;
  /** Ability order used to assign an array or roll (primary first). */
  priority: AttributeKey[];
  features: string[];
  blurb: string;
}

export const CLASSES: ClassDef[] = [
  { id: 'fighter', name: 'Fighter', hitDie: 10, primary: 'Strength or Dexterity', saves: ['STR', 'CON'],
    armorTraining: 'Light, Medium and Heavy armor; Shields',
    skillChoices: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Persuasion', 'Perception', 'Survival'],
    skillCount: 2, priority: ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
    features: ['Fighting Style', 'Second Wind', 'Weapon Mastery'],
    blurb: 'd10 Hit Die, all armor, weapon master' },
  { id: 'rogue', name: 'Rogue', hitDie: 8, primary: 'Dexterity', saves: ['DEX', 'INT'],
    armorTraining: 'Light armor',
    skillChoices: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    skillCount: 4, priority: ['DEX', 'CON', 'INT', 'WIS', 'CHA', 'STR'],
    features: ['Expertise', 'Sneak Attack 1d6', "Thieves' Cant", 'Weapon Mastery'],
    blurb: 'd8 Hit Die, light armor, skills and Sneak Attack' },
  { id: 'cleric', name: 'Cleric', hitDie: 8, primary: 'Wisdom', saves: ['WIS', 'CHA'],
    armorTraining: 'Light and Medium armor; Shields',
    skillChoices: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    skillCount: 2, priority: ['WIS', 'CON', 'STR', 'DEX', 'CHA', 'INT'],
    features: ['Spellcasting', 'Divine Order'],
    blurb: 'd8 Hit Die, medium armor and shield, divine magic' },
  { id: 'wizard', name: 'Wizard', hitDie: 6, primary: 'Intelligence', saves: ['INT', 'WIS'],
    armorTraining: 'None',
    skillChoices: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion'],
    skillCount: 2, priority: ['INT', 'CON', 'DEX', 'WIS', 'CHA', 'STR'],
    features: ['Spellcasting', 'Ritual Adept', 'Arcane Recovery'],
    blurb: 'd6 Hit Die, no armor, arcane magic' },
];

interface GearDef {
  name: string;
  qty?: number;
  kind: 'weapon' | 'armor' | 'shield' | 'gear';
}

interface BackgroundDef {
  id: TabletopBackgroundId;
  name: string;
  abilities: [AttributeKey, AttributeKey, AttributeKey];
  feat: string;
  skills: [SrdSkill, SrdSkill];
  tool: string;
  gear: GearDef[];
  gp: number;
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: 'acolyte', name: 'Acolyte', abilities: ['INT', 'WIS', 'CHA'], feat: 'Magic Initiate (Cleric)',
    skills: ['Insight', 'Religion'], tool: "Calligrapher's Supplies",
    gear: [{ name: "Calligrapher's Supplies", kind: 'gear' }, { name: 'Book (prayers)', kind: 'gear' }, { name: 'Holy Symbol', kind: 'gear' }, { name: 'Parchment', qty: 10, kind: 'gear' }, { name: 'Robe', kind: 'gear' }],
    gp: 8 },
  { id: 'criminal', name: 'Criminal', abilities: ['DEX', 'CON', 'INT'], feat: 'Alert',
    skills: ['Sleight of Hand', 'Stealth'], tool: "Thieves' Tools",
    gear: [{ name: 'Dagger', qty: 2, kind: 'weapon' }, { name: "Thieves' Tools", kind: 'gear' }, { name: 'Crowbar', kind: 'gear' }, { name: 'Pouch', qty: 2, kind: 'gear' }, { name: "Traveler's Clothes", kind: 'gear' }],
    gp: 16 },
  { id: 'sage', name: 'Sage', abilities: ['CON', 'INT', 'WIS'], feat: 'Magic Initiate (Wizard)',
    skills: ['Arcana', 'History'], tool: "Calligrapher's Supplies",
    gear: [{ name: 'Quarterstaff', kind: 'weapon' }, { name: "Calligrapher's Supplies", kind: 'gear' }, { name: 'Book (history)', kind: 'gear' }, { name: 'Parchment', qty: 8, kind: 'gear' }, { name: 'Robe', kind: 'gear' }],
    gp: 8 },
  { id: 'soldier', name: 'Soldier', abilities: ['STR', 'DEX', 'CON'], feat: 'Savage Attacker',
    skills: ['Athletics', 'Intimidation'], tool: 'Gaming Set',
    gear: [{ name: 'Spear', kind: 'weapon' }, { name: 'Shortbow', kind: 'weapon' }, { name: 'Arrows', qty: 20, kind: 'gear' }, { name: 'Gaming Set', kind: 'gear' }, { name: "Healer's Kit", kind: 'gear' }, { name: 'Quiver', kind: 'gear' }, { name: "Traveler's Clothes", kind: 'gear' }],
    gp: 14 },
];

interface KitDef {
  id: KitId;
  label: string;
  gear: GearDef[];
  gp: number;
}

export const CLASS_KITS: Record<TabletopClassId, KitDef[]> = {
  fighter: [
    { id: 'A', label: 'Chain Mail and Greatsword', gp: 4,
      gear: [{ name: 'Chain Mail', kind: 'armor' }, { name: 'Greatsword', kind: 'weapon' }, { name: 'Flail', kind: 'weapon' }, { name: 'Javelin', qty: 8, kind: 'weapon' }, { name: "Dungeoneer's Pack", kind: 'gear' }] },
    { id: 'B', label: 'Studded Leather and Longbow', gp: 11,
      gear: [{ name: 'Studded Leather Armor', kind: 'armor' }, { name: 'Scimitar', kind: 'weapon' }, { name: 'Shortsword', kind: 'weapon' }, { name: 'Longbow', kind: 'weapon' }, { name: 'Arrows', qty: 20, kind: 'gear' }, { name: 'Quiver', kind: 'gear' }, { name: "Dungeoneer's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 155, gear: [] },
  ],
  rogue: [
    { id: 'A', label: 'Leather Armor, daggers and Shortbow', gp: 8,
      gear: [{ name: 'Leather Armor', kind: 'armor' }, { name: 'Dagger', qty: 2, kind: 'weapon' }, { name: 'Shortsword', kind: 'weapon' }, { name: 'Shortbow', kind: 'weapon' }, { name: 'Arrows', qty: 20, kind: 'gear' }, { name: 'Quiver', kind: 'gear' }, { name: "Thieves' Tools", kind: 'gear' }, { name: "Burglar's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 100, gear: [] },
  ],
  cleric: [
    { id: 'A', label: 'Chain Shirt, Shield and Mace', gp: 7,
      gear: [{ name: 'Chain Shirt', kind: 'armor' }, { name: 'Shield', kind: 'shield' }, { name: 'Mace', kind: 'weapon' }, { name: 'Holy Symbol', kind: 'gear' }, { name: "Priest's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 110, gear: [] },
  ],
  wizard: [
    { id: 'A', label: 'Quarterstaff, daggers and Spellbook', gp: 5,
      gear: [{ name: 'Dagger', qty: 2, kind: 'weapon' }, { name: 'Quarterstaff', kind: 'weapon' }, { name: 'Robe', kind: 'gear' }, { name: 'Spellbook', kind: 'gear' }, { name: "Scholar's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 55, gear: [] },
  ],
};

/** SRD weapon damage dice. */
export const WEAPON_DICE: Record<string, { dice: string; type: string; ranged?: boolean; finesse?: boolean }> = {
  Dagger: { dice: '1d4', type: 'piercing', finesse: true },
  Shortsword: { dice: '1d6', type: 'piercing', finesse: true },
  Scimitar: { dice: '1d6', type: 'slashing', finesse: true },
  Greatsword: { dice: '2d6', type: 'slashing' },
  Flail: { dice: '1d8', type: 'bludgeoning' },
  Javelin: { dice: '1d6', type: 'piercing' },
  Mace: { dice: '1d6', type: 'bludgeoning' },
  Quarterstaff: { dice: '1d6', type: 'bludgeoning' },
  Spear: { dice: '1d6', type: 'piercing' },
  Shortbow: { dice: '1d6', type: 'piercing', ranged: true },
  Longbow: { dice: '1d8', type: 'piercing', ranged: true },
};

/** SRD armor: base AC and the Dexterity cap (null = full DEX, 0 = none). */
export const ARMOR_TABLE: Record<string, { base: number; dexCap: number | null; category: 'Light' | 'Medium' | 'Heavy' }> = {
  'Leather Armor': { base: 11, dexCap: null, category: 'Light' },
  'Studded Leather Armor': { base: 12, dexCap: null, category: 'Light' },
  'Chain Shirt': { base: 13, dexCap: 2, category: 'Medium' },
  'Chain Mail': { base: 16, dexCap: 0, category: 'Heavy' },
};
export const SHIELD_AC = 2;

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
/** A full 27-point spend (15/15/13/10/10/8) assigned by the class's ability order. */
const POINT_BUY_SPREAD = [15, 15, 13, 10, 10, 8];
const STANDARD_LANGUAGES = ['Dwarvish', 'Elvish', 'Halfling', 'Gnomish', 'Draconic', 'Giant', 'Orc', 'Goblin'];

export const classDef = (id: TabletopClassId) => CLASSES.find((c) => c.id === id)!;
export const speciesDef = (id: TabletopSpeciesId) => SPECIES.find((s) => s.id === id)!;
export const backgroundDef = (id: TabletopBackgroundId) => BACKGROUNDS.find((b) => b.id === id)!;
export const kitDef = (cls: TabletopClassId, id: KitId) => CLASS_KITS[cls].find((k) => k.id === id) ?? CLASS_KITS[cls][0];

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function pointBuyCost(scores: Attributes): number | null {
  let total = 0;
  for (const k of ABILITY_KEYS) {
    const c = POINT_BUY_COST[scores[k]];
    if (c == null) return null;
    total += c;
  }
  return total;
}

/** Hands `values` (highest first) to the class's ability order. */
export function assignByPriority(values: number[], cls: TabletopClassId): Attributes {
  const sorted = [...values].sort((a, b) => b - a);
  const out = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 } as Attributes;
  classDef(cls).priority.forEach((k, i) => { out[k] = sorted[i] ?? 8; });
  return out;
}

/** 4d6 drop the lowest, six times, from the save's own dice. */
export function roll4d6(rng: Rng): number[][] {
  return Array.from({ length: 6 }, () => Array.from({ length: 4 }, () => Math.floor(rng() * 6) + 1));
}

export function rollTotal(dice: number[]): number {
  const sorted = [...dice].sort((a, b) => a - b);
  return sorted[1] + sorted[2] + sorted[3];
}

export function scoresForMethod(method: AbilityMethod, cls: TabletopClassId, rng: Rng): { baseScores: Attributes; rolls?: number[][] } {
  if (method === '4d6') {
    const rolls = roll4d6(rng);
    return { baseScores: assignByPriority(rolls.map(rollTotal), cls), rolls };
  }
  return { baseScores: assignByPriority(method === 'point-buy' ? POINT_BUY_SPREAD : STANDARD_ARRAY, cls) };
}

/** Background +2 to the higher of its three abilities in the class order, +1 to the next. */
export function backgroundBonus(bg: TabletopBackgroundId, cls: TabletopClassId): Partial<Attributes> {
  const order = classDef(cls).priority;
  const [first, second] = [...backgroundDef(bg).abilities].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return { [first]: 2, [second]: 1 } as Partial<Attributes>;
}

export function finalScores(base: Attributes, bonus: Partial<Attributes>): Attributes {
  const out = { ...base };
  for (const k of ABILITY_KEYS) out[k] = Math.min(20, base[k] + (bonus[k] ?? 0));
  return out;
}

function skillValue(skill: SrdSkill, scores: Attributes): number {
  return scores[SKILL_ABILITY[skill]];
}

/** Background skills, then class picks, then species and feat skills, best ability first, no repeats. */
export function pickSkills(
  cls: TabletopClassId,
  sp: TabletopSpeciesId,
  bg: TabletopBackgroundId,
  scores: Attributes,
): { skillProfs: SrdSkill[]; expertise: SrdSkill[]; originFeats: string[] } {
  const have = new Set<SrdSkill>(backgroundDef(bg).skills);
  const best = (from: SrdSkill[]) =>
    from.filter((s) => !have.has(s)).sort((a, b) => skillValue(b, scores) - skillValue(a, scores) || from.indexOf(a) - from.indexOf(b));
  const c = classDef(cls);
  for (const s of best(c.skillChoices).slice(0, c.skillCount)) have.add(s);
  const species = speciesDef(sp);
  const originFeats = [backgroundDef(bg).feat];
  if (species.skillFrom) {
    const pick = species.id === 'elf' ? species.skillFrom.filter((s) => !have.has(s)) : best(species.skillFrom);
    if (pick[0]) have.add(pick[0]);
  }
  if (sp === 'human') {
    originFeats.push('Skilled');
    for (const s of best([...SRD_SKILLS]).slice(0, 3)) have.add(s);
  }
  const skillProfs = SRD_SKILLS.filter((s) => have.has(s));
  const expertise = cls === 'rogue'
    ? [...skillProfs].sort((a, b) => skillValue(b, scores) - skillValue(a, scores) || skillProfs.indexOf(a) - skillProfs.indexOf(b)).slice(0, 2)
    : [];
  return { skillProfs, expertise, originFeats };
}

export function languagesFor(sp: TabletopSpeciesId): string[] {
  const kin = speciesDef(sp).kinLanguage;
  const extra = STANDARD_LANGUAGES.filter((l) => l !== kin);
  return ['Common', ...(kin ? [kin, extra[0]] : extra.slice(0, 2))];
}

export function resolveSheet(picks: Required<Pick<TabletopPicks, 'classId' | 'speciesId' | 'backgroundId' | 'method' | 'baseScores' | 'kitId'>> & TabletopPicks): TabletopSheet {
  const bonus = backgroundBonus(picks.backgroundId, picks.classId);
  const scores = finalScores(picks.baseScores, bonus);
  const skills = pickSkills(picks.classId, picks.speciesId, picks.backgroundId, scores);
  return {
    classId: picks.classId,
    speciesId: picks.speciesId,
    backgroundId: picks.backgroundId,
    method: picks.method,
    baseScores: picks.baseScores,
    bonus,
    ...(picks.rolls ? { rolls: picks.rolls } : {}),
    ...skills,
    languages: languagesFor(picks.speciesId),
    kitId: picks.kitId,
    source: picks.source ?? 'build',
  };
}

function gearItem(g: GearDef, from: string, n: number): Item {
  const weapon = WEAPON_DICE[g.name];
  const armor = ARMOR_TABLE[g.name];
  const describe = weapon
    ? `${weapon.dice} ${weapon.type}${weapon.ranged ? ', ranged' : ''}${weapon.finesse ? ', finesse' : ''}.`
    : armor
      ? `${armor.category} armor. AC ${armor.base}${armor.dexCap === 0 ? '' : armor.dexCap ? ' + DEX (max 2)' : ' + DEX'}.`
      : g.kind === 'shield'
        ? `Shield. +${SHIELD_AC} AC.`
        : undefined;
  return {
    id: `tt-${from}-${n}-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: g.name,
    rarity: 'Common',
    quantity: g.qty ?? 1,
    ...(weapon ? { itemType: 'weapon' as const, diceNotation: weapon.dice } : armor || g.kind === 'shield' ? { itemType: 'armor' as const } : {}),
    ...(describe ? { description: describe } : {}),
    provenance: from === 'kit' ? 'Class starting equipment' : 'Background starting equipment',
  };
}

function sheetGear(sheet: TabletopSheet): { items: Item[]; gp: number } {
  const kit = kitDef(sheet.classId, sheet.kitId);
  const bg = backgroundDef(sheet.backgroundId);
  const items = [...kit.gear.map((g, i) => gearItem(g, 'kit', i)), ...bg.gear.map((g, i) => gearItem(g, 'bg', i))];
  const merged: Item[] = [];
  for (const it of items) {
    const same = merged.find((m) => m.name === it.name);
    if (same && it.itemType !== 'armor') same.quantity += it.quantity;
    else merged.push(it);
  }
  const armor = merged.find((i) => ARMOR_TABLE[i.name]);
  const shield = merged.find((i) => i.name === 'Shield');
  const melee = merged
    .filter((i) => WEAPON_DICE[i.name] && !WEAPON_DICE[i.name].ranged)
    .sort((a, b) => avgDice(WEAPON_DICE[b.name].dice) - avgDice(WEAPON_DICE[a.name].dice))[0];
  const wearsArmor = sheet.classId !== 'wizard';
  if (armor && wearsArmor) Object.assign(armor, { equipped: true, slot: 'Body' });
  if (shield) Object.assign(shield, { equipped: true, slot: 'Off Hand' });
  if (melee) Object.assign(melee, { equipped: true, slot: 'Main Hand' });
  return { items: merged, gp: kit.gp + bg.gp };
}

function avgDice(dice: string): number {
  const m = /^(\d+)d(\d+)$/.exec(dice);
  return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 : 0;
}

/** AC from equipped SRD armor and shield; 10 + DEX with none. */
export function tabletopArmorClass(dex: number, inventory: Item[]): { ac: number; from: string } {
  const worn = inventory.filter((i) => i.equipped);
  const armor = worn.find((i) => ARMOR_TABLE[i.name]);
  const shield = worn.some((i) => i.name === 'Shield');
  const mod = abilityMod(dex);
  let ac = 10 + mod;
  let from = 'no armor';
  if (armor) {
    const row = ARMOR_TABLE[armor.name];
    const dexPart = row.dexCap === 0 ? 0 : row.dexCap == null ? mod : Math.min(mod, row.dexCap);
    ac = row.base + dexPart;
    from = armor.name;
  }
  if (shield) {
    ac += SHIELD_AC;
    from += ' + Shield';
  }
  return { ac, from };
}

export function tabletopMaxHp(sheet: TabletopSheet, con: number, level = 1): number {
  const die = classDef(sheet.classId).hitDie;
  const extra = (speciesDef(sheet.speciesId).hpPerLevel ?? 0) * level;
  return Math.max(1, die + abilityMod(con) + extra);
}

export function tabletopHitDie(character: Pick<Character, 'srd'>): number {
  return character.srd ? classDef(character.srd.classId).hitDie : 8;
}

export interface DerivedSheet {
  title: string;
  scores: Attributes;
  pb: number;
  maxHp: number;
  hpLine: string;
  ac: number;
  acFrom: string;
  initiative: number;
  speed: number;
  size: string;
  darkvision: number;
  passivePerception: number;
  saves: Array<{ key: AttributeKey; total: number; proficient: boolean }>;
  skills: Array<{ skill: SrdSkill; total: number; proficient: boolean; expertise: boolean }>;
  traits: string[];
  features: string[];
  originFeats: string[];
  languages: string[];
  hitDie: number;
}

/** Every number on the tabletop sheet, from the character and what is equipped. */
export function deriveTabletopSheet(state: Pick<GameState, 'character' | 'inventory'>): DerivedSheet | null {
  const c = state.character;
  const s = c.srd;
  if (!s) return null;
  const cls = classDef(s.classId);
  const sp = speciesDef(s.speciesId);
  const scores = c.attributes;
  const pb = proficiencyBonus(c.level);
  const { ac, from } = tabletopArmorClass(scores.DEX, state.inventory ?? []);
  const skills = SRD_SKILLS.map((skill) => ({
    skill,
    proficient: s.skillProfs.includes(skill),
    expertise: s.expertise.includes(skill),
    total: abilityMod(scores[SKILL_ABILITY[skill]]) + sheetSkillBonus(c, skill),
  }));
  const perception = skills.find((k) => k.skill === 'Perception')!.total;
  const con = abilityMod(scores.CON);
  const dwarf = (sp.hpPerLevel ?? 0) * c.level;
  return {
    title: `${sp.name} ${cls.name} ${c.level} (${backgroundDef(s.backgroundId).name})`,
    scores,
    pb,
    maxHp: c.maxHp,
    hpLine: `d${cls.hitDie} ${cls.hitDie} ${fmtMod(con)} CON${dwarf ? ` +${dwarf} Dwarven Toughness` : ''}`,
    ac,
    acFrom: from,
    initiative: abilityMod(scores.DEX) + (s.originFeats.includes('Alert') ? pb : 0),
    speed: sp.speed,
    size: sp.size,
    darkvision: sp.darkvision,
    passivePerception: 10 + perception,
    saves: ABILITY_KEYS.map((key) => {
      const proficient = cls.saves.includes(key);
      return { key, proficient, total: abilityMod(scores[key]) + (proficient ? pb : 0) };
    }),
    skills,
    traits: sp.traits,
    features: cls.features,
    originFeats: s.originFeats,
    languages: s.languages,
    hitDie: cls.hitDie,
  };
}

const METHOD_LABEL: Record<AbilityMethod, string> = {
  'point-buy': 'point buy (27 points)',
  'standard-array': 'standard array 15/14/13/12/10/8',
  '4d6': '4d6 drop the lowest',
};

export function rollLines(rolls: number[][]): string[] {
  return rolls.map((d, i) => {
    const low = Math.min(...d);
    let dropped = false;
    const shown = d.map((v) => {
      if (!dropped && v === low) { dropped = true; return `[${v}]`; }
      return String(v);
    });
    return `Roll ${i + 1}: 4d6 ${shown.join(' ')} → ${rollTotal(d)}`;
  });
}

/** The sheet summary shown before play (and on the sheet tab). */
export function formatTabletopSheet(state: Pick<GameState, 'character' | 'inventory' | 'gold'>): string[] {
  const d = deriveTabletopSheet(state);
  const s = state.character.srd;
  if (!d || !s) return [];
  const bonus = ABILITY_KEYS.filter((k) => s.bonus[k]).map((k) => `+${s.bonus[k]} ${k}`).join(', ');
  const skills = d.skills.filter((k) => k.proficient).map((k) => `${k.skill} ${fmtMod(k.total)}${k.expertise ? ' (expertise)' : ''}`);
  const gear = (state.inventory ?? []).filter((i) => i.provenance === 'Class starting equipment' || i.provenance === 'Background starting equipment')
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name));
  return [
    `${state.character.name} — ${d.title}`,
    ABILITY_KEYS.map((k) => `${k} ${d.scores[k]} (${fmtMod(abilityMod(d.scores[k]))})`).join(' · '),
    `Scores: ${METHOD_LABEL[s.method]}${bonus ? ` · ${backgroundDef(s.backgroundId).name} ${bonus}` : ''}`,
    ...(s.rolls ? rollLines(s.rolls) : []),
    `HP ${d.maxHp} (${d.hpLine}) · AC ${d.ac} (${d.acFrom}) · Proficiency ${fmtMod(d.pb)} · Initiative ${fmtMod(d.initiative)}`,
    `Speed ${d.speed} ft · ${d.size}${d.darkvision ? ` · Darkvision ${d.darkvision} ft` : ''} · Passive Perception ${d.passivePerception} · Hit Die d${d.hitDie}`,
    `Saves: ${d.saves.map((v) => `${v.key} ${fmtMod(v.total)}${v.proficient ? '*' : ''}`).join(', ')}`,
    `Skills: ${skills.join(', ')}`,
    `Class features: ${d.features.join(', ')} · Origin feat: ${d.originFeats.join(', ')}`,
    `${speciesDef(s.speciesId).name} traits: ${d.traits.join('; ')}`,
    `Languages: ${d.languages.join(', ')}`,
    `Kit: ${gear.join(', ') || 'none'} · ${state.gold ?? 0} GP`,
  ];
}

/** Puts a finished sheet on the save: scores, HP, AC, kit and coin. Old generic weapon/armor rows go. */
export function applyTabletopSheet(state: GameState, sheet: TabletopSheet): GameState {
  const scores = finalScores(sheet.baseScores, sheet.bonus);
  const { items, gp } = sheetGear(sheet);
  const keep = (state.inventory ?? []).filter((i) =>
    !(i.itemType === 'weapon' || (i.itemType === 'armor' && i.slot !== 'Legs')) && !i.provenance?.endsWith('starting equipment'));
  const bag: Container | undefined = (state.containers ?? []).find((c) => c.equipped) ?? state.containers?.[0];
  const placed = items.map((i) => (bag ? { ...i, containerId: bag.id } : i));
  const inventory = [...keep, ...placed];
  const containers = (state.containers ?? []).map((c) =>
    c.id === bag?.id
      ? { ...c, capacity: Math.max(c.capacity, inventory.length + 4), itemIds: inventory.filter((i) => i.containerId === c.id).map((i) => i.id) }
      : c);
  const maxHp = tabletopMaxHp(sheet, scores.CON, state.character.level);
  const sp = speciesDef(sheet.speciesId);
  const cls = classDef(sheet.classId);
  const bg = backgroundDef(sheet.backgroundId);
  const character: Character = {
    ...state.character,
    attributes: scores,
    maxHp,
    hp: maxHp,
    armorClass: tabletopArmorClass(scores.DEX, inventory).ac,
    bio: `A ${sp.name.toLowerCase()} ${cls.name.toLowerCase()} with a ${bg.name.toLowerCase()}'s past.`,
    srd: sheet,
  };
  delete character.strength;
  const answers = state.openingEstablishment
    ? { ...state.openingEstablishment.answers, species: sp.name }
    : undefined;
  return syncContainerOccupancy({
    ...state,
    character,
    inventory,
    containers,
    gold: gp,
    ...(state.openingEstablishment && answers
      ? {
          openingEstablishment: {
            ...state.openingEstablishment,
            answers,
            pending: state.openingEstablishment.pending.filter((p) => p.kind !== 'species'),
          },
        }
      : {}),
  });
}

/** The four ready-made level 1 characters (standard array, first kit). */
export const PREGENS: Array<{ label: string; picks: Pick<TabletopPicks, 'classId' | 'speciesId' | 'backgroundId'> }> = [
  { label: 'Human Fighter (Soldier)', picks: { classId: 'fighter', speciesId: 'human', backgroundId: 'soldier' } },
  { label: 'Halfling Rogue (Criminal)', picks: { classId: 'rogue', speciesId: 'halfling', backgroundId: 'criminal' } },
  { label: 'Dwarf Cleric (Acolyte)', picks: { classId: 'cleric', speciesId: 'dwarf', backgroundId: 'acolyte' } },
  { label: 'Elf Wizard (Sage)', picks: { classId: 'wizard', speciesId: 'elf', backgroundId: 'sage' } },
];

export function seedNumber(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The save's own creation dice: the same save always rolls the same 4d6. */
export function creationRng(state: Pick<GameState, 'seed' | 'saveId'>): Rng {
  return mulberry32(seedNumber(`tt-create:${state.seed ?? state.saveId ?? '0'}`));
}
