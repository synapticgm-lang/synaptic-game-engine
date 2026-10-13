/**
 * LitRPG presenter for the shared SRD class list: the System's name, role and starting skill for each class.
 * A leaf module (type imports only) so the edge writer facts can name the class too.
 */
import type { Character, TabletopClassId } from './types.ts';
import type { CheckSkillName } from './skillRanks.ts';

export interface LitrpgClassEntry {
  name: string;
  role: string;
  /** One check skill from the class's SRD skill list; the class grants one rank in it. */
  startingSkill: CheckSkillName;
}

export const LITRPG_CLASS: Record<TabletopClassId, LitrpgClassEntry> = {
  fighter: { name: 'Warrior', role: 'front-line fighter', startingSkill: 'athletics' },
  rogue: { name: 'Rogue', role: 'scout and lock-breaker', startingSkill: 'thievery' },
  cleric: { name: 'Cleric', role: 'healer', startingSkill: 'persuasion' },
  wizard: { name: 'Mage', role: 'arcane caster', startingSkill: 'arcana' },
  barbarian: { name: 'Berserker', role: 'bruiser', startingSkill: 'athletics' },
  bard: { name: 'Bard', role: 'support and talker', startingSkill: 'persuasion' },
  druid: { name: 'Druid', role: 'nature caster', startingSkill: 'survival' },
  monk: { name: 'Monk', role: 'unarmed striker', startingSkill: 'stealth' },
  paladin: { name: 'Paladin', role: 'holy guardian', startingSkill: 'persuasion' },
  ranger: { name: 'Hunter', role: 'tracker and archer', startingSkill: 'survival' },
  sorcerer: { name: 'Sorcerer', role: 'innate caster', startingSkill: 'arcana' },
  warlock: { name: 'Warlock', role: 'pact caster', startingSkill: 'investigation' },
};

/** The class as the System names it: the sheet's class first, then `classId`. */
export function litrpgClassName(c: Pick<Character, 'srd' | 'classId'> | null | undefined): string | null {
  const id = c?.srd?.classId ?? c?.classId;
  return id ? LITRPG_CLASS[id]?.name ?? null : null;
}
