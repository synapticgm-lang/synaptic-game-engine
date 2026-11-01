/**
 * Code-owned XP → level curve. Sandbox / combat awards must call this —
 * never trust GM STATUS invent for sheet progression.
 */

import type { Character, EngineMode } from './types';
import { MODE_XP, dndXpToNext } from './xpRules';
import { isUnitXpMode, levelBar, XP_TURN_SURPLUS_CAP } from './rules/xpPace';
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
 * Apply XP and cascade level-ups. LitRPG / Story RPG use levelBar (×1.25 after L1→L2 = 150).
 * A save that already has xpToNext keeps it until its next level-up, then the new curve applies.
 * XP-D1 A2: LitRPG / Story RPG — at most one level per apply; surplus capped at 50% of the next bar.
 * Tabletop (SRD) and PYOA paths unchanged.
 */
export function applyCharacterXpGain(
  character: Character,
  xpGain: number,
  mode?: EngineMode,
  housing?: SystemHousingConfig | null,
  rng?: Rng
): CharacterXpApplyResult {
  if (!xpGain || xpGain <= 0 || MODE_XP[mode ?? 'litrpg']?.xp === false) {
    return { character, levelsGained: 0, notes: [] };
  }
  const srdBar = onSrdThresholds(character, mode);
  const oneLevelCap = isUnitXpMode(mode) && !srdBar;
  let next: Character = { ...character, xp: (character.xp ?? 0) + xpGain };
  let xpToNext = srdBar ? dndXpToNext(next.level ?? 1) : Math.max(1, character.xpToNext ?? levelBar(mode, character.level ?? 1));
  let levelsGained = 0;
  const notes: string[] = [];
  while ((next.xp ?? 0) >= xpToNext) {
    const base = { ...next, xp: (next.xp ?? 0) - xpToNext };
    const toLevel = (next.level ?? 1) + 1;
    const up = next.srd ? srdLevelUp(base, toLevel, rng) : sharedLevelUp(base, toLevel);
    next = up.character;
    levelsGained += 1;
    notes.push(...presentLevelUp(next.srd ? 'dnd' : mode, up.info));
    // After a level-up, always take the current curve (no save migration of the old bar).
    xpToNext = srdBar ? dndXpToNext(next.level) : levelBar(mode, next.level);
    if (oneLevelCap) {
      const surplusCap = Math.max(0, Math.floor(xpToNext * XP_TURN_SURPLUS_CAP));
      next = { ...next, xp: Math.min(next.xp ?? 0, surplusCap) };
      break;
    }
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
  let xpToNext = srdBar ? dndXpToNext(fromLevel) : Math.max(1, before.xpToNext ?? levelBar(mode, fromLevel));
  let gain = xpToNext - (before.xp ?? 0);
  for (let level = fromLevel + 1; level < toLevel; level++) {
    xpToNext = srdBar ? dndXpToNext(level) : levelBar(mode, level);
    gain += xpToNext;
  }
  return Math.max(0, gain + (after.xp ?? 0));
}
