/**
 * LitRPG / story RPG Progress tab: only the save's own numbers, from the same owners the engine reads.
 * A part with no data is empty, and a part the System housing hides is empty (the engine still grows it, hidden).
 */
import { skillLabel } from './skillGates';
import { CHECK_SKILLS, skillRanksOf } from './skillRanks';
import { hidesPart } from './systemHousing';
import { classDisplayName } from './rules/characterClass';
import { unspentStatPoints } from './rules/abilityPoints';
import { namedSkillViews, type NamedSkillView } from './rules/librarySkills';
import type { AttributeKey, GameState, Rarity } from './types';

const ATTRIBUTE_KEYS: AttributeKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const RARITY_ORDER: Rarity[] = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export interface ProgressPanel {
  attributes: { key: AttributeKey; value: number }[];
  skills: { key: string; label: string; rank: number }[];
  /** LitRPG named skills from the skill library (the same views the System window reads). */
  namedSkills: NamedSkillView[];
  level: number | null;
  xp: { xp: number; toNext: number } | null;
  /** The class as the mode names it; null with no class or when the housing hides the level. */
  className: string | null;
  /** Free stat points waiting (rules/abilityPoints); 0 when the housing hides the level. */
  statPointsToSpend: number;
  items: { id: string; name: string; rarity: Rarity; quantity: number; equipped: boolean }[];
}

export function progressPanel(state: GameState): ProgressPanel {
  const c = state.character;
  const housing = state.systemHousing;
  const attributes = ATTRIBUTE_KEYS
    .map((key) => ({ key, value: c?.attributes?.[key] }))
    .filter((a): a is { key: AttributeKey; value: number } => typeof a.value === 'number');
  const ranks = skillRanksOf(c);
  const skills = hidesPart(housing, 'skills')
    ? []
    : CHECK_SKILLS.filter((s) => ranks[s] > 0).map((s) => ({ key: s, label: skillLabel(s), rank: ranks[s] }));
  const level = c && !hidesPart(housing, 'level') ? c.level : null;
  const xp = c && !hidesPart(housing, 'experience') ? { xp: c.xp, toNext: c.xpToNext } : null;
  const className = c && !hidesPart(housing, 'level') ? classDisplayName(state) : null;
  const items = (state.inventory ?? [])
    .map((it) => ({ id: it.id, name: it.name, rarity: it.rarity, quantity: it.quantity, equipped: !!it.equipped }))
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  const statPointsToSpend = hidesPart(housing, 'level') ? 0 : unspentStatPoints(state);
  return { attributes, skills, namedSkills: namedSkillViews(state), level, xp, className, statPointsToSpend, items };
}
