/**
 * Shared rules engine — monster stat blocks.
 * Stat blocks from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode). Only the parts the engine runs are kept.
 * A foe with no matching SRD creature gets an engine block built from its own encounter numbers (srd: false).
 */
import type { ActiveEncounter, Attributes, AttributeKey } from '../types';
import { crToXp, DND_DEFAULT_CR, highestCrWithin, normalizeCr } from '../xpRules';

export interface MonsterAttack {
  name: string;
  toHit: number;
  damage: string;
  type: string;
  ranged?: boolean;
  /** Extra damage dice on a hit (e.g. poison). */
  extra?: { dice: string; type: string };
  /** On a hit: the target saves or gains the condition (until the end of its next turn). */
  rider?: { save: AttributeKey; dc: number; condition: string; immuneSpecies?: string[] };
  /** On a hit: the target gains the condition with no save. */
  inflicts?: string;
}

export interface StatBlock {
  id: string;
  name: string;
  srd: boolean;
  cr: string;
  ac: number;
  hp: number;
  hpDice: string;
  speed: number;
  scores: Attributes;
  passivePerception: number;
  kind: 'humanoid' | 'beast' | 'undead' | 'monstrosity';
  attack: MonsterAttack;
  vulnerable?: string[];
  /** Darkvision range in feet (SRD Senses); none means it cannot see in Darkness. */
  darkvision?: number;
  /** Zombie: a Constitution save (DC 5 + the damage) leaves it at 1 HP unless the damage is Radiant or a Critical Hit. */
  undeadFortitude?: boolean;
}

const s = (STR: number, DEX: number, CON: number, INT: number, WIS: number, CHA: number): Attributes => ({ STR, DEX, CON, INT, WIS, CHA });

export const SRD_MONSTERS: Array<StatBlock & { match: RegExp }> = [
  { id: 'goblin-warrior', name: 'Goblin Warrior', srd: true, cr: '1/4', ac: 15, hp: 10, hpDice: '3d6', speed: 30,
    scores: s(8, 15, 10, 10, 8, 8), passivePerception: 9, darkvision: 60, kind: 'humanoid',
    attack: { name: 'Scimitar', toHit: 4, damage: '1d6+2', type: 'slashing' }, match: /\bgoblin/i },
  { id: 'bandit', name: 'Bandit', srd: true, cr: '1/8', ac: 12, hp: 11, hpDice: '2d8+2', speed: 30,
    scores: s(11, 12, 12, 10, 10, 10), passivePerception: 10, kind: 'humanoid',
    attack: { name: 'Scimitar', toHit: 3, damage: '1d6+1', type: 'slashing' },
    match: /\b(bandit|thugs?|brigand|cutpurse|cutthroat|blade|bravos?|brawler|robbers?|raiders?|outlaws?|footpads?|cutter|toll|highway)/i },
  { id: 'cultist', name: 'Cultist', srd: true, cr: '1/8', ac: 12, hp: 9, hpDice: '2d8', speed: 30,
    scores: s(11, 12, 10, 10, 11, 10), passivePerception: 10, kind: 'humanoid',
    attack: { name: 'Ritual Sickle', toHit: 3, damage: '1d4+1', type: 'slashing' }, match: /\b(cult|zealot)/i },
  { id: 'wolf', name: 'Wolf', srd: true, cr: '1/4', ac: 12, hp: 11, hpDice: '2d8+2', speed: 40,
    scores: s(14, 15, 12, 3, 12, 6), passivePerception: 15, darkvision: 60, kind: 'beast',
    attack: { name: 'Bite', toHit: 4, damage: '1d6+2', type: 'piercing', inflicts: 'Prone' },
    match: /\b(wol(f|ves)|hounds?|dogs?|jackals?|stalker)/i },
  { id: 'giant-rat', name: 'Giant Rat', srd: true, cr: '1/8', ac: 13, hp: 7, hpDice: '2d6', speed: 30,
    scores: s(7, 15, 11, 2, 10, 4), passivePerception: 10, darkvision: 60, kind: 'beast',
    attack: { name: 'Bite', toHit: 4, damage: '1d4+2', type: 'piercing' }, match: /\brats?\b|vermin/i },
  { id: 'skeleton', name: 'Skeleton', srd: true, cr: '1/4', ac: 13, hp: 13, hpDice: '2d8+4', speed: 30,
    scores: s(10, 16, 15, 6, 8, 5), passivePerception: 9, darkvision: 60, kind: 'undead', vulnerable: ['bludgeoning'],
    attack: { name: 'Shortsword', toHit: 5, damage: '1d6+3', type: 'piercing' }, match: /\b(skeletons?|bones?)\b/i },
  { id: 'zombie', name: 'Zombie', srd: true, cr: '1/4', ac: 8, hp: 15, hpDice: '2d8+6', speed: 20,
    scores: s(13, 6, 16, 3, 6, 5), passivePerception: 8, darkvision: 60, kind: 'undead', undeadFortitude: true,
    attack: { name: 'Slam', toHit: 3, damage: '1d8+1', type: 'bludgeoning' },
    match: /\b(zombies?|restless dead|the dead|walkers?|corpses?|drowned|grave)/i },
  { id: 'shadow', name: 'Shadow', srd: true, cr: '1/2', ac: 12, hp: 16, hpDice: '3d8+3', speed: 40,
    scores: s(6, 14, 13, 6, 10, 8), passivePerception: 10, darkvision: 60, kind: 'undead', vulnerable: ['radiant'],
    attack: { name: 'Draining Swipe', toHit: 4, damage: '1d6+2', type: 'necrotic' },
    match: /\b(shades?|shadows?|haunts?|wraiths?|specters?|ghosts?)\b/i },
  { id: 'ghoul', name: 'Ghoul', srd: true, cr: '1', ac: 12, hp: 22, hpDice: '5d8', speed: 30,
    scores: s(13, 15, 10, 7, 10, 6), passivePerception: 10, darkvision: 60, kind: 'undead',
    attack: { name: 'Claw', toHit: 4, damage: '1d4+2', type: 'slashing',
      rider: { save: 'CON', dc: 10, condition: 'Paralyzed', immuneSpecies: ['elf'] } },
    match: /\b(ghouls?|ghasts?)\b/i },
  { id: 'giant-spider', name: 'Giant Spider', srd: true, cr: '1', ac: 14, hp: 26, hpDice: '4d10+4', speed: 30,
    scores: s(14, 16, 12, 2, 11, 4), passivePerception: 14, darkvision: 60, kind: 'beast',
    attack: { name: 'Bite', toHit: 5, damage: '1d8+3', type: 'piercing', extra: { dice: '2d8', type: 'poison' } },
    match: /\bspiders?\b/i },
];

const mod = (n: number) => Math.floor((n - 10) / 2);

/** An engine block from the encounter's own numbers when no SRD creature matches (proficiency +2 up to CR 4). */
function engineBlock(enc: ActiveEncounter, cr: string): StatBlock {
  const STR = enc.strength || 12;
  const DEX = enc.dexterity || 10;
  const CON = enc.constitution || 10;
  const best = Math.max(mod(STR), mod(DEX));
  const crNum = cr.includes('/') ? 0 : Number(cr);
  const die = crNum >= 3 ? '2d6' : crNum >= 1 ? '1d8' : '1d6';
  const pb = crNum >= 5 ? 3 : 2;
  return {
    id: 'engine',
    name: enc.name,
    srd: false,
    cr,
    ac: enc.armorClass || 12,
    hp: Math.max(1, enc.maxHp || enc.hp || 10),
    hpDice: '',
    speed: 30,
    scores: { STR, DEX, CON, INT: 10, WIS: 10, CHA: 10 },
    passivePerception: 10,
    kind: 'humanoid',
    attack: { name: 'Strike', toHit: best + pb, damage: `${die}${best >= 0 ? '+' : ''}${best}`, type: 'bludgeoning' },
  };
}

/**
 * A block no richer than `maxXp` (the SRD 5.2.1 encounter budget): over budget, the same creature at the highest
 * CR that fits — its own scores and AC, HP scaled, one plain attack with no extra dice or riders (srd: false).
 */
export function blockWithinXp(block: StatBlock, maxXp: number): StatBlock {
  const own = crToXp(block.cr);
  if (own <= maxXp) return block;
  const cr = highestCrWithin(maxXp);
  const ratio = crToXp(cr) / own;
  const best = Math.max(mod(block.scores.STR), mod(block.scores.DEX));
  const crNum = cr.includes('/') ? 0 : Number(cr);
  const die = crNum >= 3 ? '2d6' : crNum >= 1 ? '1d8' : '1d6';
  const { extra: _e, rider: _r, inflicts: _i, ...attack } = block.attack;
  return {
    ...block,
    id: `${block.id}@${cr}`,
    srd: false,
    cr,
    hp: Math.max(1, Math.round(block.hp * Math.sqrt(ratio))),
    hpDice: '',
    attack: { ...attack, toHit: Math.min(attack.toHit, best + 2), damage: `${die}${best >= 0 ? '+' : ''}${best}` },
  };
}

/** The stat block a live encounter fights with. A name match wins; else the engine block at the encounter's CR. */
export function statBlockForEncounter(enc: ActiveEncounter): StatBlock {
  const hit = SRD_MONSTERS.find((b) => b.match.test(enc.name ?? ''));
  if (hit) {
    const { match: _m, ...block } = hit;
    return block;
  }
  return engineBlock(enc, normalizeCr(enc.cr) ?? DND_DEFAULT_CR);
}

export function blockById(id: string, enc: ActiveEncounter): StatBlock {
  const hit = SRD_MONSTERS.find((b) => b.id === id);
  if (hit) {
    const { match: _m, ...block } = hit;
    return block;
  }
  return statBlockForEncounter(enc);
}

export function abilityModOf(score: number): number {
  return mod(score);
}
