/**
 * Shared rules engine — limited-use class features and their recharge.
 * Rage, Weapon Mastery, Lay On Hands, Innate Sorcery, Favored Enemy and Paladin's Smite numbers come from the
 * System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at
 * https://www.dndbeyond.com/srd, licensed under CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/legalcode).
 * The engine counts every use; the writer only narrates the ones the engine spent.
 */
import type { Character, TabletopClassId } from '../types';

export type FeatureUse = 'rage' | 'layOnHands' | 'innateSorcery' | 'favoredEnemy' | 'paladinSmite';

const atLevel = (level: number, table: number[]) => table[Math.min(table.length, Math.max(1, level)) - 1];

/** Uses (or the pool, for Lay On Hands) of each feature at a level; 0 = the class does not have it yet. */
export function featureMax(classId: TabletopClassId, level: number, use: FeatureUse): number {
  switch (use) {
    case 'rage': return classId === 'barbarian' ? atLevel(level, [2, 2, 3, 3, 3]) : 0;
    case 'layOnHands': return classId === 'paladin' ? 5 * Math.max(1, level) : 0;
    case 'innateSorcery': return classId === 'sorcerer' ? 2 : 0;
    case 'favoredEnemy': return classId === 'ranger' ? 2 : 0;
    case 'paladinSmite': return classId === 'paladin' && level >= 2 ? 1 : 0;
  }
}

/** Uses left (spent counts live on `character.featureUses`). */
export function featureLeft(c: Pick<Character, 'srd' | 'level' | 'featureUses'>, use: FeatureUse): number {
  if (!c.srd) return 0;
  return Math.max(0, featureMax(c.srd.classId, c.level ?? 1, use) - (c.featureUses?.[use] ?? 0));
}

/** Spends `n` uses (clamped to what is left). */
export function spendFeature<C extends Pick<Character, 'srd' | 'level' | 'featureUses'>>(c: C, use: FeatureUse, n = 1): C {
  const spent = Math.min(n, featureLeft(c, use));
  if (spent <= 0) return c;
  return { ...c, featureUses: { ...(c.featureUses ?? {}), [use]: (c.featureUses?.[use] ?? 0) + spent } };
}

/** Rage Damage: +2 at levels 1–8. */
export const RAGE_DAMAGE = 2;

/** Weapon Mastery: how many weapons' mastery properties the class uses. */
export function masteryCount(classId: TabletopClassId, level: number): number {
  switch (classId) {
    case 'barbarian': return level >= 4 ? 3 : 2;
    case 'fighter': return level >= 4 ? 4 : 3;
    case 'paladin':
    case 'ranger':
    case 'rogue': return 2;
    default: return 0;
  }
}

/**
 * Recharge on a rest. Short Rest: one Rage back. Long Rest: every use back.
 * (Warlock Pact Magic slots come back on a Short Rest too — recoveryRules resets the slots.)
 */
export function restoreFeatures<C extends Pick<Character, 'srd' | 'level' | 'featureUses'>>(c: C, rest: 'short' | 'long'): { character: C; regained: string[] } {
  if (!c.srd || !c.featureUses) return { character: c, regained: [] };
  if (rest === 'long') {
    const regained = Object.entries(c.featureUses).filter(([, n]) => n > 0).map(([k]) => FEATURE_LABEL[k as FeatureUse] ?? k);
    const next = { ...c };
    delete next.featureUses;
    return { character: next, regained };
  }
  const rage = c.featureUses.rage ?? 0;
  if (!rage) return { character: c, regained: [] };
  return { character: { ...c, featureUses: { ...c.featureUses, rage: rage - 1 } }, regained: ['1 Rage'] };
}

export const FEATURE_LABEL: Record<FeatureUse, string> = {
  rage: 'Rage',
  layOnHands: 'Lay On Hands',
  innateSorcery: 'Innate Sorcery',
  favoredEnemy: "Favored Enemy (Hunter's Mark)",
  paladinSmite: "Paladin's Smite (Divine Smite)",
};
