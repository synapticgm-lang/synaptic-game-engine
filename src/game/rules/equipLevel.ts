/**
 * XP-D1 OPEN5 — WoW-style equip level rule (LitRPG / Story RPG).
 * One owner: canEquipAtLevel / equipBlockReason. Items without itemLevel have no requirement.
 * Tabletop (dnd) and PYOA never apply this rule.
 */
import type { EngineMode, Item } from '../types';

/** Kit may be worn up to this many levels above the player. */
export const EQUIP_LEVEL_MARGIN = 2;

export function modeUsesEquipLevel(mode: EngineMode | undefined): boolean {
  return mode === 'litrpg' || mode === 'rpg';
}

/** True when the item may be worn at this player level (or the mode/item has no requirement). */
export function canEquipAtLevel(
  item: Pick<Item, 'itemLevel'> | null | undefined,
  playerLevel: number,
  mode?: EngineMode
): boolean {
  if (!modeUsesEquipLevel(mode)) return true;
  if (item == null || item.itemLevel == null || !Number.isFinite(item.itemLevel)) return true;
  const P = Math.max(1, Math.floor(playerLevel || 1));
  const need = Math.max(1, Math.floor(item.itemLevel));
  return need <= P + EQUIP_LEVEL_MARGIN;
}

/** Null when wearable; otherwise the one STATUS line (no turn cost). */
export function equipBlockReason(
  item: Pick<Item, 'itemLevel' | 'name'> | null | undefined,
  playerLevel: number,
  mode?: EngineMode
): string | null {
  if (canEquipAtLevel(item, playerLevel, mode)) return null;
  const need = Math.max(1, Math.floor(item!.itemLevel!));
  const P = Math.max(1, Math.floor(playerLevel || 1));
  return `Requires level ${need} (you are level ${P})`;
}

/** Minimum player level required to wear a leveled drop; null when unlevelled. */
export function requiredPlayerLevel(item: Pick<Item, 'itemLevel'> | null | undefined): number | null {
  if (item?.itemLevel == null || !Number.isFinite(item.itemLevel)) return null;
  return Math.max(1, Math.floor(item.itemLevel) - EQUIP_LEVEL_MARGIN);
}
