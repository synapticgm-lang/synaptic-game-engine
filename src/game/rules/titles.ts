/**
 * Shared rules engine — titles. A title is earned once by a deed the engine already records (an achievement
 * key) and gives one small perk: +1 on one check skill while it is the active title. Titles never add to an
 * attack (skill library Batch 0: a title is influence, never direct harm). The perk shares the +3 bonus cap
 * with the named-skill rank (Amendment 3), so it adds nothing on top of a rank-3 or evolved skill.
 * LitRPG only. Leaf module: types only, so checkMath can read it.
 */
import type { GameState } from '../types';
import type { CheckSkillName } from '../skillRanks';

export interface TitleDef {
  id: string;
  name: string;
  /** The check skill the perk adds to. */
  skill: CheckSkillName;
  /** The achievement key that earns it. */
  deed: string;
}

export const TITLE_PERK = 1;
export const CHECK_BONUS_CAP = 3;
export const TITLE_KEY = 'title:';

export const TITLES: readonly TitleDef[] = [
  { id: 'blooded', name: 'Blooded', skill: 'athletics', deed: 'achv:first-kill' },
  { id: 'pathfinder', name: 'Pathfinder', skill: 'survival', deed: 'achv:first-quest' },
  { id: 'adept', name: 'Adept', skill: 'arcana', deed: 'achv:first-technique' },
  { id: 'veteran', name: 'Veteran', skill: 'perception', deed: 'achv:fights-won-10' },
  { id: 'delver', name: 'Delver', skill: 'investigation', deed: 'achv:first-dungeon' },
  { id: 'bossbreaker', name: 'Bossbreaker', skill: 'persuasion', deed: 'achv:boss-felled' },
];

export function titleSkillLabel(skill: CheckSkillName): string {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

export function titlePerkText(def: TitleDef): string {
  return `+${TITLE_PERK} ${titleSkillLabel(def.skill)}`;
}

/** Titles this save has earned, in the order they were earned. */
export function earnedTitles(state: Pick<GameState, 'engineMode' | 'sandboxAwardKeys'>): TitleDef[] {
  if (state.engineMode !== 'litrpg') return [];
  const keys = (state.sandboxAwardKeys ?? []).filter((k) => k.startsWith(TITLE_KEY));
  return keys.map((k) => TITLES.find((t) => `${TITLE_KEY}${t.id}` === k)).filter((t): t is TitleDef => !!t);
}

export function titleByName(name: string | null | undefined): TitleDef | undefined {
  const n = (name ?? '').trim().toLowerCase();
  return n ? TITLES.find((t) => t.name.toLowerCase() === n) : undefined;
}

/**
 * The worn title: the one the player set (when earned), else the first title earned. A free-text title an
 * older save set by hand still shows, with no perk.
 */
export function activeTitleOf(state: Pick<GameState, 'engineMode' | 'sandboxAwardKeys' | 'character'>): { name: string; def?: TitleDef } | null {
  const earned = earnedTitles(state);
  const set = state.character?.activeTitle?.trim();
  if (set) {
    const def = earned.find((t) => t.name.toLowerCase() === set.toLowerCase());
    return def ? { name: def.name, def } : { name: set };
  }
  return earned[0] ? { name: earned[0].name, def: earned[0] } : null;
}

/** The active title's perk on a check of `skill`, inside the +3 cap shared with the named-skill rank. */
export function titleCheckMod(
  state: Pick<GameState, 'engineMode' | 'sandboxAwardKeys' | 'character'>,
  skill: CheckSkillName | undefined,
  otherBonus: number,
  intentKind?: string
): { label: string; value: number } | null {
  if (state.engineMode !== 'litrpg' || !skill || intentKind === 'attack') return null;
  const def = activeTitleOf(state)?.def;
  if (!def || def.skill !== skill) return null;
  const value = Math.min(TITLE_PERK, CHECK_BONUS_CAP - Math.max(0, otherBonus));
  return value > 0 ? { label: `Title: ${def.name}`, value } : null;
}
