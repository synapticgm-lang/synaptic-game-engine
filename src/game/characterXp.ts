/**
 * Code-owned XP → level curve. Sandbox / combat awards must call this —
 * never trust GM STATUS invent for sheet progression.
 */

import type { Character, EngineMode } from './types';
import { MODE_XP, dndXpToNext } from './xpRules';
import { hidesPart, type SystemHousingConfig } from './systemHousing';
import { presentLevelUp, sharedLevelUp, srdLevelUp } from './rules/advancement';
import type { Rng } from './rules/dice';

export interface CharacterXpApplyResult {
  character: Character;
  levelsGained: number;
  notes: string[];
}

/** A tabletop character (or one with a SRD sheet) levels on the SRD 5.2.1 thresholds. */
function onSrdThresholds(character: Character, mode?: EngineMode): boolean {
  return mode === 'dnd' || !!character.srd;
}

/**
 * Apply XP and cascade level-ups. Every character gains HP per level by the SRD rule (rules/advancement): a SRD
 * sheet also gains its class's features, ASI and spells; a character with no sheet takes the d8 Hit Die at its
 * fixed value + CON. The mode profile decides what the level-up lines show.
 * The XP bar is still per mode: tabletop on the SRD thresholds, LitRPG and story RPG on the ×1.5 curve from 150
 * (a mode maths difference held for John — tt-build-7).
 */
export function applyCharacterXpGain(
  character: Character,
  xpGain: number,
  /** 'dnd' uses the SRD thresholds; other modes keep the ×1.5 curve. */
  mode?: EngineMode,
  /** A housing with level off still levels the character, hidden: no level note. */
  housing?: SystemHousingConfig | null,
  rng?: Rng
): CharacterXpApplyResult {
  if (!xpGain || xpGain <= 0 || MODE_XP[mode ?? 'litrpg']?.xp === false) {
    return { character, levelsGained: 0, notes: [] };
  }
  const srdBar = onSrdThresholds(character, mode);
  let next: Character = { ...character, xp: (character.xp ?? 0) + xpGain };
  let xpToNext = srdBar ? dndXpToNext(next.level ?? 1) : Math.max(1, character.xpToNext ?? 150);
  let levelsGained = 0;
  const notes: string[] = [];
  while ((next.xp ?? 0) >= xpToNext) {
    const base = { ...next, xp: (next.xp ?? 0) - xpToNext };
    const toLevel = (next.level ?? 1) + 1;
    const up = next.srd ? srdLevelUp(base, toLevel, rng) : sharedLevelUp(base, toLevel);
    next = up.character;
    levelsGained += 1;
    notes.push(...presentLevelUp(next.srd ? 'dnd' : mode, up.info));
    xpToNext = srdBar ? dndXpToNext(next.level) : Math.floor(xpToNext * 1.5);
  }
  return {
    character: { ...next, xpToNext },
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
  const srdBar = onSrdThresholds(before, mode);
  const fromLevel = before.level ?? 1;
  const toLevel = after.level ?? fromLevel;
  if (toLevel <= fromLevel) return Math.max(0, (after.xp ?? 0) - (before.xp ?? 0));
  let xpToNext = srdBar ? dndXpToNext(fromLevel) : Math.max(1, before.xpToNext ?? 150);
  let gain = xpToNext - (before.xp ?? 0);
  for (let level = fromLevel + 1; level < toLevel; level++) {
    xpToNext = srdBar ? dndXpToNext(level) : Math.floor(xpToNext * 1.5);
    gain += xpToNext;
  }
  return Math.max(0, gain + (after.xp ?? 0));
}
