import type { Character } from './types';

export const CHECK_SKILLS = [
  'athletics',
  'perception',
  'investigation',
  'stealth',
  'thievery',
  'persuasion',
  'arcana',
  'survival',
] as const;

export type CheckSkillName = (typeof CHECK_SKILLS)[number];

type RankSource = Pick<Character, 'level' | 'skills'> | null | undefined;

/** The check bonus for a skill: a granted rank, else the soft practice bonus from level. */
export function skillRankOf(character: RankSource, skill: CheckSkillName): number {
  const granted = character?.skills?.[skill];
  if (granted != null) return Math.floor(Number(granted) || 0);
  const lvl = character?.level ?? 1;
  if (skill === 'perception' || skill === 'investigation' || skill === 'athletics') {
    return Math.floor(lvl / 4);
  }
  return Math.floor(lvl / 5);
}

export function skillRanksOf(character: RankSource): Record<CheckSkillName, number> {
  const out = {} as Record<CheckSkillName, number>;
  for (const s of CHECK_SKILLS) out[s] = skillRankOf(character, s);
  return out;
}
