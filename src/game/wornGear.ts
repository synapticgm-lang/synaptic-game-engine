import type { Item } from './types';

/** Paper-doll / profile labels. Worn clothes may use Body or Boots. */
export type DisplayEquipSlot = 'Head' | 'Shoulders' | 'Chest' | 'Main Hand' | 'Off Hand' | 'Legs' | 'Feet';

const SLOT_ALIASES: Record<string, DisplayEquipSlot> = {
  Head: 'Head',
  Shoulders: 'Shoulders',
  Chest: 'Chest',
  Body: 'Chest',
  Torso: 'Chest',
  'Main Hand': 'Main Hand',
  'Off Hand': 'Off Hand',
  Legs: 'Legs',
  Feet: 'Feet',
  Boots: 'Feet',
  Shoes: 'Feet',
};

export function normalizeEquipSlot(slot?: string): DisplayEquipSlot | undefined {
  if (!slot) return undefined;
  return SLOT_ALIASES[slot];
}

export function findEquippedInSlot(inventory: Item[], slot: DisplayEquipSlot): Item | undefined {
  return inventory.find((item) => item.equipped && normalizeEquipSlot(item.slot) === slot);
}

function hasCombatStats(item: Item): boolean {
  return Object.values(item.modifiers ?? {}).some((n) => typeof n === 'number' && n !== 0);
}

function isReplaceableOutfit(item: Item): boolean {
  if (item.id === 'si-clothes' || item.id === 'starter-armor') return true;
  if (/clothes you had on|patched leather tunic/i.test(item.name)) return true;
  const slot = normalizeEquipSlot(item.slot);
  if ((slot === 'Chest' || slot === 'Legs' || slot === 'Feet' || slot === 'Shoulders' || slot === 'Head') && !hasCombatStats(item)) {
    return /clothes|shirt|tee|hoodie|jacket|coat|jeans|boots|tunic|uniform|gym/i.test(`${item.name} ${item.slot ?? ''}`);
  }
  return false;
}

type WearSlot = 'Head' | 'Shoulders' | 'Chest' | 'Legs' | 'Feet';

interface WornPiece {
  slot: WearSlot;
  name: string;
}

function titleGarment(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => (/^(and|a|an|the)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
    .replace(/^(and|a|an|the)\s+/i, '')
    .slice(0, 60);
}

function phraseAround(text: string, noun: RegExp): string | null {
  const re = new RegExp(`((?:[A-Za-z0-9'-]+\\s+){0,3})${noun.source}`, 'i');
  const m = text.match(re);
  if (!m) return null;
  return titleGarment(m[0]);
}

/** Split a clothes sentence into worn pieces. No stat bonuses — street clothes still equip. */
export function parseWornPieces(appearance: string): WornPiece[] {
  const text = appearance.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  const pieces: WornPiece[] = [];
  const take = (slot: WearSlot, name: string | null) => {
    if (!name) return;
    if (pieces.some((p) => p.slot === slot && p.name.toLowerCase() === name.toLowerCase())) return;
    pieces.push({ slot, name });
  };

  take('Feet', phraseAround(text, /doc\s*martens?|docmartins?|docs?\b|boots|trainers|sneakers|shoes/));
  take('Legs', phraseAround(text, /jeans|trousers|pants|shorts|leggings|joggers/));

  const jacket = phraseAround(text, /hoodie|jumper|sweater|jacket|coat|blazer|cloak/);
  const shirt = phraseAround(text, /t-?shirt|tee\b|shirt|top|blouse|vest/);
  if (shirt && jacket) {
    take('Chest', shirt);
    take('Shoulders', jacket);
  } else {
    take('Chest', shirt ?? jacket);
  }
  take('Head', phraseAround(text, /beanie|cap|hat|hood\b/));

  if (!pieces.length) {
    if (/\b(gym clothes|work clothes|uniform|street clothes|slept in|travel-worn|practical)\b/i.test(text)) {
      take('Chest', titleGarment(text.split(/[,.]/)[0] ?? text) || 'Everyday clothes');
    } else if (text.split(/\s+/).length >= 2) {
      take('Chest', titleGarment(text) || 'Clothes worn at the start');
    }
  }

  return pieces;
}

function makeWornItem(piece: WornPiece, appearance: string, containerId?: string, id?: string): Item {
  return {
    id: id ?? `worn-${piece.slot.toLowerCase().replace(/\s+/g, '-')}`,
    name: piece.name,
    rarity: 'Common',
    quantity: 1,
    itemType: 'armor',
    itemLevel: 1,
    equipped: true,
    slot: piece.slot,
    containerId,
    provenance: 'What you were wearing when this started',
    description: appearance.slice(0, 240),
  };
}

/**
 * Put described garments on the sheet as equipped items.
 * Zero stat modifiers — mundane clothes still occupy Chest / Legs / Feet.
 */
export function materializeWornClothes(inventory: Item[], appearance: string, containerId?: string): Item[] {
  const look = appearance.replace(/\s+/g, ' ').trim();
  if (!look || /\bwhy should(?: i)? tell you\b/i.test(look)) return inventory;

  const pieces = parseWornPieces(look);
  if (!pieces.length) return inventory;

  const bag = containerId ?? inventory.find((i) => i.containerId)?.containerId;
  const placeholders = inventory.filter(isReplaceableOutfit);
  const kept = inventory.filter((i) => !isReplaceableOutfit(i));

  const next = [...kept];
  let reusedId = placeholders[0]?.id;

  for (const piece of pieces) {
    const existingReal = next.find(
      (i) => i.equipped && normalizeEquipSlot(i.slot) === piece.slot && hasCombatStats(i)
    );
    if (existingReal) continue;
    const id = reusedId;
    reusedId = undefined;
    const worn = makeWornItem(piece, look, bag ?? placeholders[0]?.containerId, id);
    next.push(worn);
  }

  return next;
}
