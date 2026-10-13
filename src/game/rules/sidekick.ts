/**
 * Shared rules engine — a sidekick who fights beside a lone PC (house rule).
 * Modelled on the solo-play sidekick idea (a Warrior, an Expert or a Spellcaster who covers the PC's gaps and
 * often Helps); the numbers below are SynapticGM's own, not copied from any book. The sidekick levels with the PC,
 * takes no XP share, acts right after the PC each round, and is knocked out (never killed) at 0 HP.
 */
import type { Companion, GameState, SidekickKind } from '../types';
import { proficiencyBonus } from '../checkRules';
import type { SidekickProfile } from './roundCombat';
import type { Rng } from './dice';

interface SidekickRow {
  role: string;
  ac: number;
  hpBase: number;
  hpPerLevel: number;
  /** Ability modifier added to the attack roll (proficiency is added by level). */
  mod: number;
  dice: string;
  type: string;
  heal?: string;
  names: string[];
  does: string;
}

export const SIDEKICKS: Record<SidekickKind, SidekickRow> = {
  warrior: { role: 'Warrior sidekick', ac: 16, hpBase: 13, hpPerLevel: 7, mod: 3, dice: '1d8+3', type: 'slashing', names: ['Brannoc', 'Hesta', 'Durrel'], does: 'attacks the nearest foe each round' },
  expert: { role: 'Expert sidekick', ac: 14, hpBase: 10, hpPerLevel: 6, mod: 3, dice: '1d6+3', type: 'piercing', names: ['Pell', 'Quillan', 'Sorrel'], does: 'Helps each round, giving your next attack Advantage' },
  spellcaster: { role: 'Spellcaster sidekick', ac: 12, hpBase: 9, hpPerLevel: 5, mod: 3, dice: '1d10', type: 'fire', heal: '1d8+3', names: ['Ilsabet', 'Corwin', 'Maelis'], does: 'casts Fire Bolt each round and heals you once a fight at half HP or less' },
};

export function sidekickMaxHp(kind: SidekickKind, level: number): number {
  const r = SIDEKICKS[kind];
  return r.hpBase + r.hpPerLevel * Math.max(0, level - 1);
}

/** A new sidekick at the PC's level; the name is picked from the save's own dice. */
export function makeSidekick(kind: SidekickKind, level: number, rng: Rng): Companion {
  const r = SIDEKICKS[kind];
  const hp = sidekickMaxHp(kind, level);
  return {
    id: `sidekick-${kind}`,
    name: r.names[Math.floor(rng() * r.names.length)]!,
    type: 'party',
    role: r.role,
    hp,
    maxHp: hp,
    maintenanceCost: 'none',
    assignment: 'At your side',
    notes: `Your sidekick: ${r.does}.`,
    sidekick: kind,
    ac: r.ac,
    level,
  };
}

export function sidekickOf(state: Pick<GameState, 'companions'>): Companion | null {
  return (state.companions ?? []).find((c) => !!c.sidekick) ?? null;
}

/** The sidekick's fight numbers. It fights at 1 HP after being knocked out (it gets up when the fight ends). */
export function sidekickProfile(c: Companion, level: number): SidekickProfile {
  const kind = c.sidekick!;
  const r = SIDEKICKS[kind];
  const maxHp = sidekickMaxHp(kind, level);
  return {
    name: c.name,
    kind,
    ac: c.ac ?? r.ac,
    hp: Math.max(0, Math.min(maxHp, c.hp)),
    maxHp,
    toHit: r.mod + proficiencyBonus(level),
    dice: r.dice,
    type: r.type,
    ...(r.heal ? { heal: r.heal } : {}),
  };
}

/** The sidekick keeps pace with the PC's level (its max HP grows; its current HP rises by the same amount). */
export function levelSidekick(companions: Companion[] | undefined, level: number): Companion[] | undefined {
  if (!companions?.some((c) => c.sidekick && (c.level ?? 1) < level)) return companions;
  return companions.map((c) => {
    if (!c.sidekick || (c.level ?? 1) >= level) return c;
    const maxHp = sidekickMaxHp(c.sidekick, level);
    return { ...c, level, maxHp, hp: Math.min(maxHp, c.hp + (maxHp - c.maxHp)) };
  });
}
