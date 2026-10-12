/**
 * Code-owned XP → level curve. Sandbox / combat awards must call this —
 * never trust GM STATUS invent for sheet progression.
 */

import type { Character, EngineMode } from './types';
import { dndXpToNext } from './xpRules';
import { hidesPart, type SystemHousingConfig } from './systemHousing';

export interface CharacterXpApplyResult {
  character: Character;
  levelsGained: number;
  notes: string[];
}

/** Apply XP and cascade level-ups (same curve as auto-fight). */
export function applyCharacterXpGain(
  character: Character,
  xpGain: number,
  /** 28a — 'dnd' uses the 5e thresholds (SRD 5.1); other modes keep the ×1.5 curve. */
  mode?: EngineMode,
  /** A housing with level off still levels the character, hidden: no level note. */
  housing?: SystemHousingConfig | null
): CharacterXpApplyResult {
  if (!xpGain || xpGain <= 0) {
    return { character, levelsGained: 0, notes: [] };
  }
  let xp = (character.xp ?? 0) + xpGain;
  let level = character.level ?? 1;
  let xpToNext = mode === 'dnd' ? dndXpToNext(level) : Math.max(1, character.xpToNext ?? 150);
  let maxHp = character.maxHp ?? character.hp ?? 20;
  let hp = character.hp ?? maxHp;
  let levelsGained = 0;
  const notes: string[] = [];

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    levelsGained += 1;
    xpToNext = mode === 'dnd' ? dndXpToNext(level) : Math.floor(xpToNext * 1.5);
    maxHp = Math.floor(maxHp * 1.1);
    hp = maxHp;
    notes.push(`Level Up! Now level ${level}`);
  }

  return {
    character: {
      ...character,
      xp,
      level,
      xpToNext,
      maxHp,
      hp,
    },
    levelsGained,
    notes: hidesPart(housing, 'level') ? [] : notes,
  };
}

/** All XP the sheet gained between two states, counting the bars filled by any level-ups (same curve). */
export function characterXpGainBetween(
  before: Character | undefined,
  after: Character | undefined,
  mode?: EngineMode
): number {
  if (!before || !after) return 0;
  const fromLevel = before.level ?? 1;
  const toLevel = after.level ?? fromLevel;
  if (toLevel <= fromLevel) return Math.max(0, (after.xp ?? 0) - (before.xp ?? 0));
  let xpToNext = mode === 'dnd' ? dndXpToNext(fromLevel) : Math.max(1, before.xpToNext ?? 150);
  let gain = xpToNext - (before.xp ?? 0);
  for (let level = fromLevel + 1; level < toLevel; level++) {
    xpToNext = mode === 'dnd' ? dndXpToNext(level) : Math.floor(xpToNext * 1.5);
    gain += xpToNext;
  }
  return Math.max(0, gain + (after.xp ?? 0));
}
