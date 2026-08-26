/**
 * Code-owned XP → level curve. Sandbox / combat awards must call this —
 * never trust GM STATUS invent for sheet progression.
 */

import type { Character } from './types';

export interface CharacterXpApplyResult {
  character: Character;
  levelsGained: number;
  notes: string[];
}

/** Apply XP and cascade level-ups (same curve as auto-fight). */
export function applyCharacterXpGain(
  character: Character,
  xpGain: number
): CharacterXpApplyResult {
  if (!xpGain || xpGain <= 0) {
    return { character, levelsGained: 0, notes: [] };
  }
  let xp = (character.xp ?? 0) + xpGain;
  let level = character.level ?? 1;
  let xpToNext = Math.max(1, character.xpToNext ?? 300);
  let maxHp = character.maxHp ?? character.hp ?? 20;
  let hp = character.hp ?? maxHp;
  let levelsGained = 0;
  const notes: string[] = [];

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    levelsGained += 1;
    xpToNext = Math.floor(xpToNext * 1.5);
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
    notes,
  };
}
