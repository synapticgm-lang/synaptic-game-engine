/**
 * 28r — fight approaches unlocked by gear and skills.
 * The engine owns the numbers: an approach swaps the attack attribute and adds to-hit / damage / AC,
 * free opening attacks (a shot before the foe closes, a strike from hiding) and an MP cost.
 * Used by both the Auto Fight button (best approach) and typed/chip fights (engineFight).
 */
import type { AttributeKey, GameState, Item } from './types';
import { weaponCategory } from './checkRules';

export type FightApproachId = 'melee' | 'ranged' | 'spell' | 'ambush' | 'guarded';

export interface FightApproach {
  id: FightApproachId;
  /** Chip label; always carries an attack verb so the fight pad locks keep it. */
  label: string;
  attr: AttributeKey;
  toHit: number;
  damage: number;
  ac: number;
  /** Free player attacks before the first exchange. */
  openingAttacks: number;
  /** Opening attacks roll twice and keep the higher die. */
  openingAdvantage: boolean;
  mpCost: number;
  /** What unlocked it (gear name or skill), for receipts and the writer. */
  source: string;
}

type SkillMap = Partial<Record<string, number>>;

const RANGED_RE = /\b(bow|longbow|shortbow|crossbow|sling|javelins?|throwing|darts?|pistol|gun|rifle|revolver|musket)\b/i;
const FOCUS_RE = /\b(staff|wand|rod|orb|tome|grimoire|spellbook|focus|talisman|holy symbol|scepter)\b/i;
const SHIELD_RE = /\b(shield|buckler|targe|pavise)\b/i;
const HEAVY_ARMOR_RE = /\b(plate|full plate|chain ?mail|chainmail|mail hauberk|splint|banded|brigandine)\b/i;

export const SPELL_MP_COST = 3;

function attrScore(state: GameState, key: AttributeKey): number {
  if (key === 'STR' && state.character.strength != null) return state.character.strength;
  return state.character.attributes?.[key] ?? (key === 'STR' ? 14 : key === 'CHA' ? 10 : 12);
}

export function attrMod(state: GameState, key: AttributeKey): number {
  return Math.floor((attrScore(state, key) - 10) / 2);
}

function skills(state: GameState): SkillMap {
  return ((state.character as { skills?: SkillMap }).skills ?? {}) as SkillMap;
}

function skillValue(state: GameState, ...names: string[]): number {
  const s = skills(state);
  let best = 0;
  for (const n of names) best = Math.max(best, Math.floor(Number(s[n] ?? 0) || 0));
  return best;
}

function isWeapon(item: Item): boolean {
  return item.itemType === 'weapon' || /\b(hand|weapon|main)\b/i.test(item.slot ?? '');
}

function rangedWeapon(state: GameState): Item | undefined {
  const inv = state.inventory ?? [];
  const pick = (list: Item[]) =>
    list.find((i) => {
      const cat = weaponCategory(i.name);
      return cat === 'bow' || cat === 'firearm' || RANGED_RE.test(i.name);
    });
  return pick(inv.filter((i) => i.equipped)) ?? pick(inv.filter(isWeapon));
}

function spellFocus(state: GameState): Item | undefined {
  return (state.inventory ?? []).find((i) => FOCUS_RE.test(i.name));
}

function shieldOrHeavyArmor(state: GameState): Item | undefined {
  const worn = (state.inventory ?? []).filter((i) => i.equipped);
  return worn.find((i) => SHIELD_RE.test(i.name)) ?? worn.find((i) => HEAVY_ARMOR_RE.test(i.name));
}

function foeIsUnaware(state: GameState): boolean {
  if (state.sceneFacts?.pendingEncounter && !state.activeEncounter) return true;
  const enc = state.activeEncounter;
  return !!enc && !enc.phase && !(enc.engagedTurnCount ?? 0) && !enc.caught;
}

export function meleeApproach(): FightApproach {
  return {
    id: 'melee',
    label: 'Press the attack',
    attr: 'STR',
    toHit: 0,
    damage: 0,
    ac: 0,
    openingAttacks: 0,
    openingAdvantage: false,
    mpCost: 0,
    source: 'melee',
  };
}

/** Every approach the character's gear and skills unlock right now. Melee is always first. */
export function availableFightApproaches(state: GameState): FightApproach[] {
  const out: FightApproach[] = [meleeApproach()];
  const ch = state.character;

  const bow = rangedWeapon(state);
  if (bow) {
    out.push({
      id: 'ranged',
      label: `Attack from range with the ${bow.name}`,
      attr: 'DEX',
      toHit: 0,
      damage: 0,
      ac: 0,
      openingAttacks: 1,
      openingAdvantage: false,
      mpCost: 0,
      source: bow.name,
    });
  }

  const focus = spellFocus(state);
  const arcana = skillValue(state, 'arcana', 'spellcasting', 'magic');
  const mind = Math.max(attrScore(state, 'INT'), attrScore(state, 'WIS'));
  if ((ch.maxMp ?? 0) > 0 && (ch.mp ?? 0) >= SPELL_MP_COST && (focus || arcana > 0 || mind >= 14)) {
    const attr: AttributeKey = attrScore(state, 'INT') >= attrScore(state, 'WIS') ? 'INT' : 'WIS';
    out.push({
      id: 'spell',
      label: 'Attack with a spell',
      attr,
      toHit: focus ? 1 : 0,
      damage: 2 + Math.min(3, arcana),
      ac: 0,
      openingAttacks: 0,
      openingAdvantage: false,
      mpCost: SPELL_MP_COST,
      source: focus ? focus.name : arcana > 0 ? 'arcana' : attr,
    });
  }

  const stealth = skillValue(state, 'stealth', 'thievery');
  if (foeIsUnaware(state) && (stealth > 0 || attrScore(state, 'DEX') >= 14)) {
    out.push({
      id: 'ambush',
      label: 'Attack from hiding',
      attr: 'DEX',
      toHit: 2,
      damage: 2,
      ac: 0,
      openingAttacks: 1,
      openingAdvantage: true,
      mpCost: 0,
      source: stealth > 0 ? 'stealth' : 'DEX',
    });
  }

  const guard = shieldOrHeavyArmor(state);
  if (guard) {
    out.push({
      id: 'guarded',
      label: `Fight behind the ${guard.name}`,
      attr: 'STR',
      toHit: -1,
      damage: 0,
      ac: SHIELD_RE.test(guard.name) ? 3 : 2,
      openingAttacks: 0,
      openingAdvantage: false,
      mpCost: 0,
      source: guard.name,
    });
  }
  return out;
}

const APPROACH_INPUT: Array<[FightApproachId, RegExp]> = [
  ['ambush', /\b(from hiding|sneak attack|ambush|from the shadows|catch (?:it|them|him|her) unaware)\b/i],
  ['spell', /\b(spell|cast|hex|conjure|magic missile|firebolt|fire bolt)\b/i],
  ['ranged', /\b(from range|shoot|loose|fire (?:an? )?(?:arrow|bolt|shot)|throw (?:a |the )?(?:javelin|dart|knife))\b/i],
  ['guarded', /\b(fight(?:ing)? behind (?:the|my)|shield up|defensively|guard(?:ed)? stance|hold the line)\b/i],
];

/** The approach a typed line or chip asks for, when the character has it unlocked; else melee. */
export function approachFromInput(state: GameState, input: string): FightApproach {
  const text = input ?? '';
  const open = availableFightApproaches(state);
  for (const [id, re] of APPROACH_INPUT) {
    if (!re.test(text)) continue;
    const hit = open.find((a) => a.id === id);
    if (hit) return hit;
  }
  return open[0]!;
}

/** Expected damage per exchange minus expected damage taken — used by Auto Fight to pick. */
export function approachScore(
  state: GameState,
  a: FightApproach,
  enemy: { armorClass: number; attack: number; level: number }
): number {
  const lvl = Math.max(1, Math.floor(state.character.level / 2));
  const hitChance = (mod: number, ac: number) => Math.max(0.05, Math.min(0.95, (21 - (ac - mod)) / 20));
  const baseAc = state.character.armorClass ?? 12 + attrMod(state, 'DEX');
  const mod = attrMod(state, a.attr) + lvl + a.toHit;
  const dmg = 6 + Math.floor(state.character.level / 2) + 1.5 + attrMod(state, a.attr) + a.damage;
  const dealt = hitChance(mod, enemy.armorClass) * dmg;
  const enemyMod = enemy.attack + Math.max(0, Math.floor(enemy.level / 2));
  const taken = hitChance(enemyMod, baseAc + a.ac) * (enemy.attack + 1.5);
  const opening = a.openingAttacks * dealt * (a.openingAdvantage ? 1.4 : 1);
  return dealt - taken + opening * 0.5 - a.mpCost * 0.3;
}

export function bestFightApproach(
  state: GameState,
  enemy: { armorClass: number; attack: number; level: number }
): FightApproach {
  const open = availableFightApproaches(state);
  let best = open[0]!;
  let bestScore = approachScore(state, best, enemy);
  for (const a of open.slice(1)) {
    const s = approachScore(state, a, enemy);
    if (s > bestScore + 0.01) {
      best = a;
      bestScore = s;
    }
  }
  return best;
}

/** Extra fight chips (non-melee) for the pad; melee stays the existing "Press the attack". */
export function fightApproachChips(state: GameState): string[] {
  return availableFightApproaches(state)
    .filter((a) => a.id !== 'melee')
    .map((a) => a.label);
}

/** One receipt line for STATUS. */
export function approachReceipt(a: FightApproach): string | null {
  if (a.id === 'melee') return null;
  const bits: string[] = [`${a.attr}`];
  if (a.toHit) bits.push(`${a.toHit > 0 ? '+' : ''}${a.toHit} to hit`);
  if (a.damage) bits.push(`+${a.damage} damage`);
  if (a.ac) bits.push(`+${a.ac} AC`);
  if (a.openingAttacks) bits.push(`${a.openingAttacks} opening ${a.openingAdvantage ? 'strike with advantage' : 'shot'}`);
  if (a.mpCost) bits.push(`${a.mpCost} MP`);
  return `Approach: ${approachName(a)} (${a.source}) — ${bits.join(', ')}`;
}

export function approachName(a: FightApproach): string {
  switch (a.id) {
    case 'ranged':
      return 'ranged';
    case 'spell':
      return 'spell';
    case 'ambush':
      return 'strike from hiding';
    case 'guarded':
      return 'guarded';
    default:
      return 'melee';
  }
}

/** Fact-line opener for the writer and the Auto Fight template. */
export function approachOpener(a: FightApproach, enemyName: string): string {
  const name = (enemyName || 'the foe').trim();
  switch (a.id) {
    case 'ranged':
      return `You open on ${name} from range with the ${a.source} before it can close.`;
    case 'spell':
      return `You work a spell against ${name}${/arcana|INT|WIS/.test(a.source) ? '' : ` through the ${a.source}`}.`;
    case 'ambush':
      return `You strike ${name} from hiding before it knows you are there.`;
    case 'guarded':
      return `You meet ${name} behind the ${a.source}, giving ground only when you choose.`;
    default:
      return `You close with ${name}.`;
  }
}
