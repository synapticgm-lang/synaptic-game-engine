/**
 * Shared rules engine — monster stat blocks.
 * Stat blocks from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode). The numbers are the bundled SRD data
 * (src/data/srd/srd521.json, built by scripts/srdExtract.mjs from 5e-bits/5e-database at a pinned commit).
 * A foe with no matching SRD creature gets an engine block built from its own encounter numbers (srd: false).
 */
import SRD from '../../data/srd/srd521.json';
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
  /** SRD 5.2.1 stat block Gear: what the creature carries (and drops). */
  gear?: string[];
  kind: 'humanoid' | 'beast' | 'undead' | 'monstrosity';
  attack: MonsterAttack;
  vulnerable?: string[];
  /** Darkvision range in feet (SRD Senses); none means it cannot see in Darkness. */
  darkvision?: number;
  /** Zombie: a Constitution save (DC 5 + the damage) leaves it at 1 HP unless the damage is Radiant or a Critical Hit. */
  undeadFortitude?: boolean;
}

type SrdCreature = Omit<StatBlock, 'id' | 'srd' | 'kind' | 'attack' | 'undeadFortitude'> & { attacks: MonsterAttack[] };
const SRD_CREATURES = SRD.monsters as Record<string, SrdCreature>;

/**
 * What the engine adds to an SRD creature: the foe names it answers to, how the engine treats it (`kind`), the one
 * attack it fights with, and the rider effects the SRD writes in words. Every number comes from the SRD data.
 */
const ENGINE: Array<{ id: string; kind: StatBlock['kind']; attack: string; match: RegExp } & Pick<MonsterAttack, 'rider' | 'inflicts'> & Pick<StatBlock, 'undeadFortitude'>> = [
  { id: 'goblin-warrior', kind: 'humanoid', attack: 'Scimitar', match: /\bgoblin/i },
  { id: 'bandit', kind: 'humanoid', attack: 'Scimitar',
    match: /\b(bandit|thugs?|brigand|cutpurse|cutthroat|blade|bravos?|brawler|robbers?|raiders?|outlaws?|footpads?|cutter|toll|highway)/i },
  { id: 'cultist', kind: 'humanoid', attack: 'Ritual Sickle', match: /\b(cult|zealot)/i },
  { id: 'wolf', kind: 'beast', attack: 'Bite', inflicts: 'Prone', match: /\b(wol(f|ves)|hounds?|dogs?|jackals?|stalker)/i },
  { id: 'giant-rat', kind: 'beast', attack: 'Bite', match: /\brats?\b|vermin/i },
  { id: 'skeleton', kind: 'undead', attack: 'Shortsword', match: /\b(skeletons?|bones?)\b/i },
  { id: 'zombie', kind: 'undead', attack: 'Slam', undeadFortitude: true,
    match: /\b(zombies?|restless dead|the dead|walkers?|corpses?|drowned|grave)/i },
  { id: 'shadow', kind: 'undead', attack: 'Draining Swipe', match: /\b(shades?|shadows?|haunts?|wraiths?|specters?|ghosts?)\b/i },
  { id: 'ghoul', kind: 'undead', attack: 'Claw', rider: { save: 'CON', dc: 10, condition: 'Paralyzed', immuneSpecies: ['elf'] },
    match: /\b(ghouls?|ghasts?)\b/i },
  { id: 'giant-spider', kind: 'beast', attack: 'Bite', match: /\bspiders?\b/i },
];

export const SRD_MONSTERS: Array<StatBlock & { match: RegExp }> = ENGINE.map(({ id, kind, attack, match, rider, inflicts, undeadFortitude }) => {
  const { attacks, ...creature } = SRD_CREATURES[id]!;
  const hit = attacks.find((a) => a.name === attack)!;
  return {
    id,
    srd: true,
    ...creature,
    kind,
    ...(undeadFortitude ? { undeadFortitude } : {}),
    attack: { ...hit, ...(rider ? { rider } : {}), ...(inflicts ? { inflicts } : {}) },
    match,
  };
});

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

/** The real CR a fight pays XP from: the card's, else the name-matched SRD block's; null when neither exists. */
export function realEncounterCr(enc: Pick<ActiveEncounter, 'name' | 'cr'> | null | undefined): string | null {
  if (!enc) return null;
  const given = normalizeCr(enc.cr);
  if (given) return given;
  const hit = SRD_MONSTERS.find((b) => b.match.test(enc.name ?? ''));
  return hit ? normalizeCr(hit.cr) : null;
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
