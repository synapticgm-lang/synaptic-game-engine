/**
 * XP-D1 OPEN5 — the one engine owner for putting gear on (LitRPG / Story RPG).
 * Every equip goes through equipItem → rules/equipLevel.equipBlockReason:
 * a too-high item changes nothing and costs no turn; unlevelled items are always wearable.
 * Tabletop (dnd) and PYOA never reach this file's rules (typed equips stay with the writer there).
 */
import type { GameState, Item } from './types';
import { EQUIP_LEVEL_MARGIN, equipBlockReason, modeUsesEquipLevel } from './rules/equipLevel';
import { normalizeEquipSlot } from './wornGear';

const WEARABLE = new Set(['weapon', 'armor', 'accessory']);

function isWearable(item: Item): boolean {
  return !!item.itemType && WEARABLE.has(item.itemType);
}

export interface EquipResult {
  state: GameState;
  ok: boolean;
  /** One STATUS line when the item is too high level (state unchanged). */
  blockedLine?: string;
  line?: string;
}

/** Wear one inventory item. Same-slot gear goes back to the bag. */
export function equipItem(state: GameState, itemId: string): EquipResult {
  const item = (state.inventory ?? []).find((i) => i.id === itemId);
  if (!item || !isWearable(item)) return { state, ok: false };
  const reason = equipBlockReason(item, state.character?.level ?? 1, state.engineMode);
  if (reason) return { state, ok: false, blockedLine: `${item.name}: ${reason}` };
  const slot = normalizeEquipSlot(item.slot) ?? (item.itemType === 'weapon' ? 'Main Hand' : item.itemType === 'armor' ? 'Chest' : undefined);
  const inventory = (state.inventory ?? []).map((i) => {
    if (i.id === item.id) return { ...i, equipped: true, ...(slot ? { slot } : {}) };
    if (slot && i.equipped && normalizeEquipSlot(i.slot) === slot) return { ...i, equipped: false };
    return i;
  });
  return { state: { ...state, inventory }, ok: true, line: `Equipped ${item.name}` };
}

const EQUIP_VERB = /^(?:i\s+)?(?:(?:now|then|quickly|carefully)\s+)?(?:put\s+on|equip|wield|wear|don|strap\s+on|swap\s+to|switch\s+to)\s+(.+?)[.!]*$/i;

/** Typed "I put on / equip / wield X" against an unworn wearable in the bag. Null when the line is not an equip. */
export function equipFromInput(
  state: GameState,
  input: string
): ({ handled: true } & EquipResult) | null {
  if (!modeUsesEquipLevel(state.engineMode)) return null;
  const m = EQUIP_VERB.exec(input.trim());
  if (!m) return null;
  const want = m[1].replace(/^(?:(?:on|the|my|a|an)\s+)+/i, '').trim().toLowerCase();
  if (!want) return null;
  const pool = (state.inventory ?? []).filter((i) => isWearable(i) && !i.equipped);
  const hit =
    pool.find((i) => i.name.toLowerCase() === want)
    ?? pool.find((i) => i.name.toLowerCase().includes(want) || want.includes(i.name.toLowerCase()));
  if (!hit) return null;
  return { handled: true, ...equipItem(state, hit.id) };
}

/**
 * On a level-up, one plain System line per bag item that just became wearable.
 * `gearNoticeLevel` is the watermark: first sight of a save only records the level.
 */
export function levelUpGearNotices(state: GameState): { state: GameState; notices: string[] } {
  if (!modeUsesEquipLevel(state.engineMode)) return { state, notices: [] };
  const level = state.character?.level ?? 1;
  const seen = state.gearNoticeLevel;
  if (seen === level) return { state, notices: [] };
  if (seen == null || level < seen) return { state: { ...state, gearNoticeLevel: level }, notices: [] };
  const notices: string[] = [];
  for (const item of state.inventory ?? []) {
    if (item.equipped || !isWearable(item) || item.itemLevel == null) continue;
    const need = Math.floor(item.itemLevel);
    if (need > seen + EQUIP_LEVEL_MARGIN && need <= level + EQUIP_LEVEL_MARGIN) {
      notices.push(`Gear: you can now wear ${item.name} (level ${need}).`);
    }
  }
  return { state: { ...state, gearNoticeLevel: level }, notices };
}
