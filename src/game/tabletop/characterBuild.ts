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
import { casterProgression, isCaster, knownSpells, slotsLeft, spellcastingAbility, spellNumbers } from '../rules/spells';
import { variantLoad } from '../rules/encumbrance';
import { carriedCoinLb, wealthLine } from '../rules/coins';
import { SHIELD_AC, SRD_ARMOR, SRD_WEAPONS, type SrdArmor, type SrdWeapon, type WeaponMastery } from '../rules/srdGear';
import { magicAcBonus, magicSaveBonus } from '../rules/magicItems';
import { masteryCount } from '../rules/classFeatures';

import { hashSeed } from '../seededRng';
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
  /** Tool proficiencies the class grants (crafting reads them). */
  tools?: string[];
}

/** The four 6a classes keep their place at the head of every menu; the other eight follow alphabetically. */
const CLASS_ORDER: TabletopClassId[] = ['fighter', 'rogue', 'cleric', 'wizard', 'barbarian', 'bard', 'druid', 'monk', 'paladin', 'ranger', 'sorcerer', 'warlock'];

const CLASS_DEFS: ClassDef[] = [
  { id: 'barbarian', name: 'Barbarian', hitDie: 12, primary: 'Strength', saves: ['STR', 'CON'],
    armorTraining: 'Light and Medium armor; Shields',
    skillChoices: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    skillCount: 2, priority: ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
    features: ['Rage', 'Unarmored Defense', 'Weapon Mastery'],
    blurb: 'd12 Hit Die, Rage, Unarmored Defense' },
  { id: 'bard', name: 'Bard', hitDie: 8, primary: 'Charisma', saves: ['DEX', 'CHA'],
    armorTraining: 'Light armor',
    skillChoices: [...SRD_SKILLS],
    skillCount: 3, priority: ['CHA', 'DEX', 'CON', 'WIS', 'INT', 'STR'],
    features: ['Bardic Inspiration', 'Spellcasting'],
    blurb: 'd8 Hit Die, light armor, songs and arcane magic', tools: ['Lute'] },
  { id: 'cleric', name: 'Cleric', hitDie: 8, primary: 'Wisdom', saves: ['WIS', 'CHA'],
    armorTraining: 'Light and Medium armor; Shields',
    skillChoices: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    skillCount: 2, priority: ['WIS', 'CON', 'STR', 'DEX', 'CHA', 'INT'],
    features: ['Spellcasting', 'Divine Order'],
    blurb: 'd8 Hit Die, medium armor and shield, divine magic' },
  { id: 'druid', name: 'Druid', hitDie: 8, primary: 'Wisdom', saves: ['INT', 'WIS'],
    armorTraining: 'Light armor; Shields',
    skillChoices: ['Animal Handling', 'Arcana', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
    skillCount: 2, priority: ['WIS', 'CON', 'DEX', 'INT', 'CHA', 'STR'],
    features: ['Spellcasting', 'Druidic', 'Primal Order (Magician)'],
    blurb: 'd8 Hit Die, light armor and shield, primal magic', tools: ['Herbalism Kit'] },
  { id: 'fighter', name: 'Fighter', hitDie: 10, primary: 'Strength or Dexterity', saves: ['STR', 'CON'],
    armorTraining: 'Light, Medium and Heavy armor; Shields',
    skillChoices: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Persuasion', 'Perception', 'Survival'],
    skillCount: 2, priority: ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
    features: ['Fighting Style', 'Second Wind', 'Weapon Mastery'],
    blurb: 'd10 Hit Die, all armor, weapon master' },
  { id: 'monk', name: 'Monk', hitDie: 8, primary: 'Dexterity and Wisdom', saves: ['STR', 'DEX'],
    armorTraining: 'None',
    skillChoices: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    skillCount: 2, priority: ['DEX', 'WIS', 'CON', 'STR', 'INT', 'CHA'],
    features: ['Martial Arts', 'Unarmored Defense'],
    blurb: 'd8 Hit Die, no armor, Martial Arts', tools: ["Woodcarver's Tools"] },
  { id: 'paladin', name: 'Paladin', hitDie: 10, primary: 'Strength and Charisma', saves: ['WIS', 'CHA'],
    armorTraining: 'Light, Medium and Heavy armor; Shields',
    skillChoices: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    skillCount: 2, priority: ['STR', 'CHA', 'CON', 'WIS', 'DEX', 'INT'],
    features: ['Lay On Hands', 'Spellcasting', 'Weapon Mastery'],
    blurb: 'd10 Hit Die, all armor, Lay On Hands and divine magic' },
  { id: 'ranger', name: 'Ranger', hitDie: 10, primary: 'Dexterity and Wisdom', saves: ['STR', 'DEX'],
    armorTraining: 'Light and Medium armor; Shields',
    skillChoices: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    skillCount: 3, priority: ['DEX', 'WIS', 'CON', 'STR', 'INT', 'CHA'],
    features: ['Spellcasting', 'Favored Enemy', 'Weapon Mastery'],
    blurb: "d10 Hit Die, medium armor, Hunter's Mark" },
  { id: 'rogue', name: 'Rogue', hitDie: 8, primary: 'Dexterity', saves: ['DEX', 'INT'],
    armorTraining: 'Light armor',
    skillChoices: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    skillCount: 4, priority: ['DEX', 'CON', 'INT', 'WIS', 'CHA', 'STR'],
    features: ['Expertise', 'Sneak Attack 1d6', "Thieves' Cant", 'Weapon Mastery'],
    blurb: 'd8 Hit Die, light armor, skills and Sneak Attack', tools: ["Thieves' Tools"] },
  { id: 'sorcerer', name: 'Sorcerer', hitDie: 6, primary: 'Charisma', saves: ['CON', 'CHA'],
    armorTraining: 'None',
    skillChoices: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    skillCount: 2, priority: ['CHA', 'CON', 'DEX', 'WIS', 'INT', 'STR'],
    features: ['Spellcasting', 'Innate Sorcery'],
    blurb: 'd6 Hit Die, no armor, innate arcane magic' },
  { id: 'warlock', name: 'Warlock', hitDie: 8, primary: 'Charisma', saves: ['WIS', 'CHA'],
    armorTraining: 'Light armor',
    skillChoices: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    skillCount: 2, priority: ['CHA', 'CON', 'DEX', 'WIS', 'INT', 'STR'],
    features: ['Eldritch Invocations (Armor of Shadows)', 'Pact Magic'],
    blurb: 'd8 Hit Die, light armor, Pact Magic' },
  { id: 'wizard', name: 'Wizard', hitDie: 6, primary: 'Intelligence', saves: ['INT', 'WIS'],
    armorTraining: 'None',
    skillChoices: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion'],
    skillCount: 2, priority: ['INT', 'CON', 'DEX', 'WIS', 'CHA', 'STR'],
    features: ['Spellcasting', 'Ritual Adept', 'Arcane Recovery'],
    blurb: 'd6 Hit Die, no armor, arcane magic' },
];

export const CLASSES: ClassDef[] = CLASS_ORDER.map((id) => CLASS_DEFS.find((c) => c.id === id)!);

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
  barbarian: [
    { id: 'A', label: 'Greataxe and handaxes', gp: 15,
      gear: [{ name: 'Greataxe', kind: 'weapon' }, { name: 'Handaxe', qty: 4, kind: 'weapon' }, { name: "Explorer's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 75, gear: [] },
  ],
  bard: [
    { id: 'A', label: 'Leather Armor, daggers and a lute', gp: 19,
      gear: [{ name: 'Leather Armor', kind: 'armor' }, { name: 'Dagger', qty: 2, kind: 'weapon' }, { name: 'Lute', kind: 'gear' }, { name: "Entertainer's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 90, gear: [] },
  ],
  druid: [
    { id: 'A', label: 'Leather Armor, Shield and Quarterstaff', gp: 9,
      gear: [{ name: 'Leather Armor', kind: 'armor' }, { name: 'Shield', kind: 'shield' }, { name: 'Sickle', kind: 'weapon' }, { name: 'Quarterstaff', kind: 'weapon' }, { name: 'Druidic Focus', kind: 'gear' }, { name: "Explorer's Pack", kind: 'gear' }, { name: 'Herbalism Kit', kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 50, gear: [] },
  ],
  monk: [
    { id: 'A', label: 'Spear, daggers and woodcarver\'s tools', gp: 11,
      gear: [{ name: 'Spear', kind: 'weapon' }, { name: 'Dagger', qty: 5, kind: 'weapon' }, { name: "Woodcarver's Tools", kind: 'gear' }, { name: "Explorer's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 50, gear: [] },
  ],
  paladin: [
    { id: 'A', label: 'Chain Mail, Shield and Longsword', gp: 9,
      gear: [{ name: 'Chain Mail', kind: 'armor' }, { name: 'Shield', kind: 'shield' }, { name: 'Longsword', kind: 'weapon' }, { name: 'Javelin', qty: 6, kind: 'weapon' }, { name: 'Holy Symbol', kind: 'gear' }, { name: "Priest's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 150, gear: [] },
  ],
  ranger: [
    { id: 'A', label: 'Studded Leather, swords and Longbow', gp: 7,
      gear: [{ name: 'Studded Leather Armor', kind: 'armor' }, { name: 'Scimitar', kind: 'weapon' }, { name: 'Shortsword', kind: 'weapon' }, { name: 'Longbow', kind: 'weapon' }, { name: 'Arrows', qty: 20, kind: 'gear' }, { name: 'Quiver', kind: 'gear' }, { name: 'Druidic Focus', kind: 'gear' }, { name: "Explorer's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 150, gear: [] },
  ],
  sorcerer: [
    { id: 'A', label: 'Spear, daggers and an arcane focus', gp: 28,
      gear: [{ name: 'Spear', kind: 'weapon' }, { name: 'Dagger', qty: 2, kind: 'weapon' }, { name: 'Arcane Focus', kind: 'gear' }, { name: "Dungeoneer's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 50, gear: [] },
  ],
  warlock: [
    { id: 'A', label: 'Leather Armor, Sickle and an arcane focus', gp: 15,
      gear: [{ name: 'Leather Armor', kind: 'armor' }, { name: 'Sickle', kind: 'weapon' }, { name: 'Dagger', qty: 2, kind: 'weapon' }, { name: 'Arcane Focus', kind: 'gear' }, { name: 'Book (occult lore)', kind: 'gear' }, { name: "Scholar's Pack", kind: 'gear' }] },
    { id: 'coin', label: 'Coin instead', gp: 100, gear: [] },
  ],
};

/** SRD weapon numbers (the shared rules table). */
export const WEAPON_DICE: Readonly<Record<string, SrdWeapon>> = SRD_WEAPONS;

/**
 * SRD 5.2.1 weapon training: every class has Simple. Barbarian, Fighter, Paladin and Ranger all Martial;
 * Rogue Martial with Finesse or Light; Monk Martial with Light.
 */
export function weaponProficient(classId: TabletopClassId, weapon: string): boolean {
  const w = WEAPON_DICE[weapon];
  if (!w) return false;
  if (!w.martial || ['barbarian', 'fighter', 'paladin', 'ranger'].includes(classId)) return true;
  if (classId === 'rogue') return !!(w.finesse || w.light);
  return classId === 'monk' && !!w.light;
}

/** SRD armor: base AC and the Dexterity cap (null = full DEX, 0 = none). The shared rules table. */
export const ARMOR_TABLE: Readonly<Record<string, SrdArmor>> = SRD_ARMOR;
export { SHIELD_AC };

/** SRD 5.2.1 armor training by class. */
const ARMOR_TRAINED: Record<TabletopClassId, Array<'Light' | 'Medium' | 'Heavy' | 'Shield'>> = {
  barbarian: ['Light', 'Medium', 'Shield'],
  bard: ['Light'],
  cleric: ['Light', 'Medium', 'Shield'],
  druid: ['Light', 'Shield'],
  fighter: ['Light', 'Medium', 'Heavy', 'Shield'],
  monk: [],
  paladin: ['Light', 'Medium', 'Heavy', 'Shield'],
  ranger: ['Light', 'Medium', 'Shield'],
  rogue: ['Light'],
  sorcerer: [],
  warlock: ['Light'],
  wizard: [],
};

export function armorTrained(classId: TabletopClassId): ReadonlyArray<'Light' | 'Medium' | 'Heavy' | 'Shield'> {
  return ARMOR_TRAINED[classId];
}

/**
 * Worn armor or a shield beyond the class's training (null when all is trained). SRD 5.2.1: untrained armor gives
 * Disadvantage on any D20 Test that uses Strength or Dexterity, and you can't cast spells.
 */
export function untrainedArmor(c: Pick<Character, 'srd'>, inventory: Item[] | null | undefined): string | null {
  if (!c.srd) return null;
  const trained = ARMOR_TRAINED[c.srd.classId];
  const bad = (inventory ?? []).filter((i) => i.equipped && (
    (ARMOR_TABLE[i.name] && !trained.includes(ARMOR_TABLE[i.name].category)) || (i.name === 'Shield' && !trained.includes('Shield'))
  ));
  return bad.length ? bad.map((i) => i.name).join(' and ') : null;
}

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

/** Tool proficiencies: the background's tool plus the class's (crafting reads them). */
export function toolProficiencies(c: Pick<Character, 'srd'>): string[] {
  const s = c.srd;
  if (!s) return [];
  return [...new Set([backgroundDef(s.backgroundId).tool, ...(classDef(s.classId).tools ?? [])])];
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

/** An SRD gear row (weapon dice, armor AC text) under any provenance — crafting and loot share it. */
export function srdGearRow(name: string, qty: number, id: string, provenance: string): Item {
  const kind: GearDef['kind'] = WEAPON_DICE[name] ? 'weapon' : ARMOR_TABLE[name] ? 'armor' : name === 'Shield' ? 'shield' : 'gear';
  return { ...gearItem({ name, qty, kind }, 'kit', 0), id, provenance };
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
  const trained = ARMOR_TRAINED[sheet.classId];
  if (armor && trained.includes(ARMOR_TABLE[armor.name].category)) Object.assign(armor, { equipped: true, slot: 'Body' });
  if (shield && trained.includes('Shield')) Object.assign(shield, { equipped: true, slot: 'Off Hand' });
  if (melee) Object.assign(melee, { equipped: true, slot: 'Main Hand' });
  return { items: merged, gp: kit.gp + bg.gp };
}

function avgDice(dice: string): number {
  const m = /^(\d+)d(\d+)$/.exec(dice);
  return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 : 0;
}

/**
 * AC from equipped SRD armor and shield; 10 + DEX with none, or 13 + DEX under Mage Armor. With the wearer,
 * the class's armorless base (Barbarian and Monk Unarmored Defense, Draconic Resilience) and attuned magic
 * items count too. The best armorless base wins.
 */
export function tabletopArmorClass(
  dex: number,
  inventory: Item[],
  mageArmor = false,
  who?: Pick<Character, 'srd' | 'attributes' | 'level'>,
): { ac: number; from: string } {
  const worn = inventory.filter((i) => i.equipped);
  const armor = worn.find((i) => ARMOR_TABLE[i.name]);
  const shield = worn.some((i) => i.name === 'Shield');
  const mod = abilityMod(dex);
  let ac = 10 + mod;
  let from = 'no armor';
  if (!armor) {
    const bases: Array<[number, string]> = [];
    if (mageArmor) bases.push([13 + mod, 'Mage Armor']);
    if (who?.srd) {
      const m = (k: AttributeKey) => abilityMod(who.attributes[k]);
      const cls = who.srd.classId;
      if (cls === 'barbarian') bases.push([10 + mod + m('CON'), 'Unarmored Defense']);
      if (cls === 'monk' && !shield) bases.push([10 + mod + m('WIS'), 'Unarmored Defense']);
      if (hasClassFeature(who, /Draconic Resilience/)) bases.push([10 + mod + m('CHA'), 'Draconic Resilience']);
    }
    for (const [v, label] of bases) if (v > ac) { ac = v; from = label; }
  }
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
  if (who?.srd) {
    const magic = magicAcBonus(inventory, !!armor || shield);
    if (magic.bonus) {
      ac += magic.bonus;
      from += ` + ${magic.from.join(' + ')}`;
    }
  }
  return { ac, from };
}

/**
 * Weapon Mastery picks: equipped weapons first, then the class kit's, then any other carried weapon the class is
 * trained with, up to the class's count. Derived each time (the SRD lets you change them on a Long Rest).
 */
export function weaponMasteries(c: Pick<Character, 'srd' | 'level'>, inventory: Item[] | null | undefined): Array<{ weapon: string; mastery: WeaponMastery }> {
  const s = c.srd;
  if (!s) return [];
  const count = masteryCount(s.classId, c.level ?? 1);
  if (!count) return [];
  const inv = inventory ?? [];
  const kit = CLASS_KITS[s.classId].find((k) => k.id === 'A')?.gear.map((g) => g.name) ?? [];
  const names = [
    ...inv.filter((i) => i.equipped).map((i) => i.name),
    ...kit,
    ...inv.map((i) => i.name),
  ];
  const out: Array<{ weapon: string; mastery: WeaponMastery }> = [];
  for (const n of names) {
    if (out.length >= count) break;
    if (!WEAPON_DICE[n] || !weaponProficient(s.classId, n) || out.some((o) => o.weapon === n)) continue;
    out.push({ weapon: n, mastery: WEAPON_DICE[n].mastery });
  }
  return out;
}

/** The mastery property `weapon` uses for this character, if it is one of their picks. */
export function masteryFor(c: Pick<Character, 'srd' | 'level'>, inventory: Item[] | null | undefined, weapon: string): WeaponMastery | undefined {
  return weaponMasteries(c, inventory).find((m) => m.weapon === weapon)?.mastery;
}

/**
 * Speed changes from the sheet: Unarmored Movement (Monk 2+, no armor or Shield) +10 ft; heavy armor whose
 * Strength need the wearer does not meet −10 ft.
 */
export function speedAdjust(c: Pick<Character, 'srd' | 'level' | 'attributes'>, inventory: Item[]): number {
  if (!c.srd) return 0;
  const worn = inventory.filter((i) => i.equipped);
  const armor = worn.find((i) => ARMOR_TABLE[i.name]);
  const shield = worn.some((i) => i.name === 'Shield');
  let adj = 0;
  if (!armor && !shield && hasClassFeature(c, /^Unarmored Movement/)) adj += 10;
  const need = armor ? ARMOR_TABLE[armor.name].strength : undefined;
  if (need && c.attributes.STR < need) adj -= 10;
  return adj;
}

/** The SRD fixed level-up value for a Hit Die (d6 4, d8 5, d10 6, d12 7). */
export function fixedHitDieValue(die: number): number {
  return die / 2 + 1;
}

/** The Hit Die result counted for each level after the first: what was taken, else the fixed value. */
export function levelHpGains(sheet: Pick<TabletopSheet, 'classId' | 'hpGains'>, level: number): number[] {
  const die = classDef(sheet.classId).hitDie;
  return Array.from({ length: Math.max(0, level - 1) }, (_, i) => sheet.hpGains?.[i] ?? fixedHitDieValue(die));
}

/**
 * Max HP: Hit Die max + CON at level 1, then each later level's Hit Die result + CON (at least 1 a level),
 * + 1 a level for Dwarven Toughness. CON is applied to every level, so raising CON raises HP retroactively.
 */
export function tabletopMaxHp(sheet: TabletopSheet, con: number, level = 1): number {
  const die = classDef(sheet.classId).hitDie;
  const m = abilityMod(con);
  const extra = (speciesDef(sheet.speciesId).hpPerLevel ?? 0) * level + draconicHp(sheet.classId, level);
  const later = levelHpGains(sheet, level).reduce((s, g) => s + Math.max(1, g + m), 0);
  return Math.max(1, die + m) + later + extra;
}

/** Draconic Resilience (Draconic Sorcery, level 3): +3 HP, then +1 for each later Sorcerer level. */
export function draconicHp(classId: TabletopClassId, level: number): number {
  return classId === 'sorcerer' && level >= 3 ? level : 0;
}

/** Class features gained at each level, SRD 5.2.1 (SRD subclass at level 3; Ability Score Improvement at 4). */
export const CLASS_LEVEL_FEATURES: Record<TabletopClassId, Record<number, string[]>> = {
  barbarian: {
    2: ['Danger Sense', 'Reckless Attack'],
    3: ['Path of the Berserker subclass: Frenzy', 'Primal Knowledge'],
    4: ['Ability Score Improvement'],
  },
  bard: {
    2: ['Expertise', 'Jack of All Trades'],
    3: ['College of Lore subclass: Bonus Proficiencies, Cutting Words'],
    4: ['Ability Score Improvement'],
  },
  druid: {
    2: ['Wild Shape', 'Wild Companion'],
    3: ["Circle of the Land subclass: Circle of the Land Spells, Land's Aid"],
    4: ['Ability Score Improvement'],
  },
  monk: {
    2: ["Monk's Focus", 'Unarmored Movement', 'Uncanny Metabolism'],
    3: ['Deflect Attacks', 'Warrior of the Open Hand subclass: Open Hand Technique'],
    4: ['Ability Score Improvement', 'Slow Fall'],
  },
  paladin: {
    2: ['Fighting Style', "Paladin's Smite"],
    3: ['Channel Divinity', 'Oath of Devotion subclass: Oath of Devotion Spells, Sacred Weapon'],
    4: ['Ability Score Improvement'],
  },
  ranger: {
    2: ['Deft Explorer', 'Fighting Style'],
    3: ["Hunter subclass: Hunter's Lore, Hunter's Prey (Colossus Slayer)"],
    4: ['Ability Score Improvement'],
  },
  sorcerer: {
    2: ['Font of Magic', 'Metamagic'],
    3: ['Draconic Sorcery subclass: Draconic Resilience, Draconic Spells'],
    4: ['Ability Score Improvement'],
  },
  warlock: {
    2: ['Magical Cunning', 'Eldritch Invocations (Agonizing Blast, Eldritch Mind)'],
    3: ["Fiend Patron subclass: Dark One's Blessing, Fiend Spells"],
    4: ['Ability Score Improvement'],
  },
  fighter: {
    2: ['Action Surge', 'Tactical Mind'],
    3: ['Champion subclass: Improved Critical (19–20)', 'Remarkable Athlete'],
    4: ['Ability Score Improvement'],
  },
  rogue: {
    2: ['Cunning Action'],
    3: ['Thief subclass: Fast Hands, Second-Story Work', 'Steady Aim', 'Sneak Attack 2d6'],
    4: ['Ability Score Improvement'],
  },
  cleric: {
    2: ['Channel Divinity (Divine Spark, Turn Undead)'],
    3: ['Life Domain subclass: Disciple of Life', 'Preserve Life'],
    4: ['Ability Score Improvement'],
  },
  wizard: {
    2: ['Scholar'],
    3: ['Evoker subclass: Evocation Savant', 'Potent Cantrip'],
    4: ['Ability Score Improvement'],
  },
};

/** Rogue Sneak Attack: 1d6 at level 1, +1d6 every odd level. */
export function sneakAttackDice(level: number): string {
  return `${Math.ceil(Math.max(1, level) / 2)}d6`;
}

/** Every class feature up to `level`; a feature that grows (Sneak Attack) shows its current dice once. */
export function classFeaturesAt(classId: TabletopClassId, level: number): string[] {
  const out = [...classDef(classId).features];
  for (let l = 2; l <= level; l++) out.push(...(CLASS_LEVEL_FEATURES[classId][l] ?? []));
  const sneak = `Sneak Attack ${sneakAttackDice(level)}`;
  return [...new Set(out.map((f) => (/^Sneak Attack /.test(f) ? sneak : f)))];
}

/** Has the character reached the level-3 subclass feature that names `feature`? */
export function hasClassFeature(c: Pick<Character, 'srd' | 'level'>, feature: RegExp): boolean {
  return !!c.srd && classFeaturesAt(c.srd.classId, c.level ?? 1).some((f) => feature.test(f));
}

export function tabletopHitDie(character: Pick<Character, 'srd' | 'classId'>): number {
  const id = character.srd?.classId ?? character.classId;
  return id ? classDef(id).hitDie : 8;
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
  /** Variant Encumbrance: over STR × 10 lb. */
  heavilyEncumbered?: boolean;
  /** Worn armor the class is not trained in (Disadvantage on STR and DEX D20 Tests, no spellcasting). */
  untrainedArmor?: string;
  size: string;
  darkvision: number;
  passivePerception: number;
  saves: Array<{ key: AttributeKey; total: number; proficient: boolean }>;
  skills: Array<{ skill: SrdSkill; total: number; proficient: boolean; expertise: boolean }>;
  traits: string[];
  features: string[];
  /** Weapon Mastery: the weapons whose mastery property the character uses. */
  masteries?: Array<{ weapon: string; mastery: WeaponMastery }>;
  originFeats: string[];
  languages: string[];
  hitDie: number;
  /** Cleric / Wizard: spell DC and attack, spells, and slots left (rules/spells). */
  spellcasting?: {
    ability: AttributeKey;
    dc: number;
    attack: number;
    cantrips: string[];
    prepared: string[];
    spellbook: string[];
    slots: Array<{ level: number; total: number; left: number }>;
  };
}

/** The caster block of the sheet, from the class, level and spent slots. */
export function sheetSpellcasting(c: Pick<Character, 'srd' | 'level' | 'attributes' | 'casting'>): DerivedSheet['spellcasting'] {
  const s = c.srd;
  if (!s || !isCaster(s.classId)) return undefined;
  const known = knownSpells(s, c.level ?? 1);
  const prog = casterProgression(s.classId, c.level ?? 1);
  if (!known || !prog) return undefined;
  const ability = spellcastingAbility(s.classId);
  const { dc, attack } = spellNumbers(abilityMod(c.attributes[ability]), proficiencyBonus(c.level));
  const left = slotsLeft(s.classId, c.level ?? 1, c.casting);
  return {
    ability,
    dc,
    attack,
    ...known,
    slots: prog.slots.map((total, i) => ({ level: i + 1, total, left: left[i] ?? 0 })).filter((s) => s.total > 0),
  };
}

/** Every number on the tabletop sheet, from the character and what is equipped. */
export function deriveTabletopSheet(state: Pick<GameState, 'character' | 'inventory'> & Partial<Pick<GameState, 'houseRules' | 'gold' | 'purse'>>): DerivedSheet | null {
  const c = state.character;
  const s = c.srd;
  if (!s) return null;
  const cls = classDef(s.classId);
  const sp = speciesDef(s.speciesId);
  const scores = c.attributes;
  const pb = proficiencyBonus(c.level);
  const { ac, from } = tabletopArmorClass(scores.DEX, state.inventory ?? [], !!c.casting?.mageArmor, c);
  const magicSaves = magicSaveBonus(state.inventory);
  const draconic = draconicHp(s.classId, c.level);
  const masteries = weaponMasteries(c, state.inventory);
  const skills = SRD_SKILLS.map((skill) => ({
    skill,
    proficient: s.skillProfs.includes(skill),
    expertise: s.expertise.includes(skill),
    total: abilityMod(scores[SKILL_ABILITY[skill]]) + sheetSkillBonus(c, skill),
  }));
  const perception = skills.find((k) => k.skill === 'Perception')!.total;
  const con = abilityMod(scores.CON);
  const dwarf = (sp.hpPerLevel ?? 0) * c.level;
  const gains = levelHpGains(s, c.level);
  const conPart = gains.length ? `${fmtMod(con)} CON ×${c.level}` : `${fmtMod(con)} CON`;
  const load = state.houseRules?.encumbrance === 'variant'
    ? variantLoad(state.inventory, scores.STR, carriedCoinLb({ engineMode: 'dnd', character: c, gold: state.gold, purse: state.purse }))
    : null;
  const untrained = untrainedArmor(c, state.inventory);
  return {
    title: `${sp.name} ${cls.name} ${c.level} (${backgroundDef(s.backgroundId).name})`,
    scores,
    pb,
    maxHp: c.maxHp,
    hpLine: `d${cls.hitDie} ${[cls.hitDie, ...gains].join(' + ')} ${conPart}${dwarf ? ` +${dwarf} Dwarven Toughness` : ''}${draconic ? ` +${draconic} Draconic Resilience` : ''}`,
    ac,
    acFrom: from,
    initiative: abilityMod(scores.DEX) + (s.originFeats.includes('Alert') ? pb : 0),
    speed: Math.max(0, sp.speed - (load?.speedPenalty ?? 0) + speedAdjust(c, state.inventory ?? [])),
    ...(load?.heavy ? { heavilyEncumbered: true } : {}),
    ...(untrained ? { untrainedArmor: untrained } : {}),
    size: sp.size,
    darkvision: sp.darkvision,
    passivePerception: 10 + perception,
    saves: ABILITY_KEYS.map((key) => {
      const proficient = cls.saves.includes(key);
      return { key, proficient, total: abilityMod(scores[key]) + (proficient ? pb : 0) + magicSaves };
    }),
    skills,
    traits: sp.traits,
    features: classFeaturesAt(s.classId, c.level),
    ...(masteries.length ? { masteries } : {}),
    originFeats: s.originFeats,
    languages: s.languages,
    hitDie: cls.hitDie,
    spellcasting: sheetSpellcasting(c),
  };
}

/**
 * What the sheet does to a D20 Test of this ability: untrained armor (STR, DEX) or heavy variant encumbrance
 * (STR, DEX, CON) gives Disadvantage. The words for the roll line, or null.
 */
export function sheetBurden(state: Pick<GameState, 'character' | 'inventory'> & Partial<Pick<GameState, 'houseRules' | 'gold' | 'purse'>>, ability: AttributeKey | string | undefined): string | null {
  const d = deriveTabletopSheet(state);
  if (!d || !ability) return null;
  if (d.untrainedArmor && (ability === 'STR' || ability === 'DEX')) return `untrained in ${d.untrainedArmor}`;
  if (d.heavilyEncumbered && (ability === 'STR' || ability === 'DEX' || ability === 'CON')) return 'heavily encumbered';
  return null;
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

/** The caster lines of the sheet summary. */
export function spellSummaryLines(sc: DerivedSheet['spellcasting']): string[] {
  if (!sc) return [];
  const slots = sc.slots.map((s) => `level ${s.level} ${s.left}/${s.total}`).join(', ');
  return [
    `Spellcasting (${sc.ability}): spell save DC ${sc.dc} · spell attack ${fmtMod(sc.attack)} · slots ${slots}`,
    `Cantrips: ${sc.cantrips.join(', ')} · Prepared: ${sc.prepared.join(', ')}`,
    ...(sc.spellbook.length ? [`Spellbook: ${sc.spellbook.join(', ')}`] : []),
  ];
}

/** The sheet summary shown before play (and on the sheet tab). */
export function formatTabletopSheet(state: Pick<GameState, 'character' | 'inventory' | 'gold'> & Partial<Pick<GameState, 'purse' | 'houseRules'>>): string[] {
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
    ...(d.masteries ? [`Weapon Mastery: ${d.masteries.map((m) => `${m.weapon} (${m.mastery})`).join(', ')}`] : []),
    ...spellSummaryLines(d.spellcasting),
    `${speciesDef(s.speciesId).name} traits: ${d.traits.join('; ')}`,
    `Languages: ${d.languages.join(', ')}`,
    ...(d.untrainedArmor ? [`Armor training: not trained in ${d.untrainedArmor} — Disadvantage on Strength and Dexterity rolls, and no spellcasting`] : []),
    `Kit: ${gear.join(', ') || 'none'} · ${wealthLine({ engineMode: 'dnd', character: state.character, gold: state.gold ?? 0, purse: state.purse })}`,
  ];
}

/** Puts a finished sheet on the save: scores, HP, AC, kit and coin. Old generic weapon/armor rows go. */
export function applyTabletopSheet(state: GameState, sheet: TabletopSheet): GameState {
  const scores = finalScores(sheet.baseScores, sheet.bonus);
  const { items, gp } = sheetGear(sheet);
  const keep = (state.inventory ?? []).filter((i) =>
    !(i.itemType === 'weapon' || (i.itemType === 'armor' && i.slot !== 'Legs')) && !i.provenance?.endsWith('starting equipment'));
  const bag: Container | undefined = (state.containers ?? []).find((c) => c.equipped) ?? state.containers?.[0];
  // The campaign already dressed the PC: the kit's clothes are those same clothes, not a second set.
  const dressed = keep.some((i) => /\bclothes\b/i.test(i.name));
  const placed = items
    .filter((i) => !(dressed && /\bclothes\b/i.test(i.name)))
    .map((i) => (bag ? { ...i, containerId: bag.id } : i));
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
    armorClass: tabletopArmorClass(scores.DEX, inventory, false, { srd: sheet, attributes: scores, level: state.character.level }).ac,
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
    purse: null,
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
  return hashSeed(seed);
}

/** The save's own creation dice: the same save always rolls the same 4d6. */
export function creationRng(state: Pick<GameState, 'seed' | 'saveId'>): Rng {
  return mulberry32(seedNumber(`tt-create:${state.seed ?? state.saveId ?? '0'}`));
}
