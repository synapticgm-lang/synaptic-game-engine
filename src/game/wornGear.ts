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

function chunkUtterance(text: string): string[] {
  return text
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((c) => c.replace(/\s+/g, ' ').trim())
    .filter((c) => c.length >= 3);
}

function phraseInChunks(text: string, noun: RegExp): string | null {
  const chunks = chunkUtterance(text);
  const hit = chunks.find((c) => noun.test(c) && !/backpack|phone|headphone|leatherman|multi[-\s]?tool|\bkeys?\b/i.test(c));
  if (hit) return titleGarment(hit.replace(/\b(no|not|refused?|without)\s+underwear\b/i, '').trim());
  const re = new RegExp(`((?:[A-Za-z0-9'-]+\\s+){0,2})${noun.source}`, 'i');
  const m = text.match(re);
  if (!m) return null;
  return titleGarment(m[0]);
}

const BAG_EXTRAS: Array<{ re: RegExp; name: string; description: string }> = [
  { re: /\bbackpacks?\b/i, name: 'Backpack', description: 'The bag you had on you this morning.' },
  { re: /\b(?:mobile\s+)?phones?\b/i, name: 'Phone', description: 'The phone you already had. Reception is dying with the rest of the grid.' },
  { re: /\b(?:wireless\s+)?headphones?\b/i, name: 'Headphones', description: 'The pair you had on you this morning.' },
  { re: /\b(?:leatherman|multi[-\s]?tool)\b/i, name: 'Leatherman', description: 'A pocket multi-tool. Ordinary steel. Not System-issue.' },
  { re: /\b(?:house\s+)?keys?\b/i, name: 'Keys', description: 'House or car keys from this morning.' },
];

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

  take('Feet', phraseInChunks(text, /doc\s*martens?|docmartins?|docs?\b|boots|trainers|sneakers|shoes/));
  take('Legs', phraseInChunks(text, /jeans|trousers|pants|shorts|leggings|joggers/));

  const jacket = phraseInChunks(text, /hoodie|jumper|sweater|jacket|coat|blazer|cloak/);
  const shirt = phraseInChunks(text, /t-?shirt|tee\b|shirt|top|blouse|vest/);
  if (shirt && jacket) {
    take('Chest', shirt);
    take('Shoulders', jacket);
  } else {
    take('Chest', shirt ?? jacket);
  }
  take('Head', phraseInChunks(text, /beanie|cap|hat|hood\b/));

  if (!pieces.length) {
    if (/\b(gym clothes|work clothes|uniform|street clothes|slept in)\b/i.test(text)) {
      take('Chest', titleGarment(text.split(/[,.]/)[0] ?? text) || 'Everyday clothes');
    }
  }

  return pieces;
}

function makeWornItem(piece: WornPiece, containerId?: string, id?: string): Item {
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
    description: piece.name,
  };
}

/**
 * Put described garments on the sheet as equipped items.
 * Zero stat modifiers — mundane clothes still occupy Chest / Legs / Feet.
 */
export function materializeWornClothes(inventory: Item[], appearance: string, containerId?: string): Item[] {
  const look = appearance.replace(/\s+/g, ' ').trim();
  if (
    !look
    || /\bwhy should\b/i.test(look)
    || /\bgive you (?:my )?(?:name|location)\b/i.test(look)
    || /\b(?:you\s+)?(perve?|creep|weirdo|freak)\b/i.test(look)
  ) {
    return dropInsultGear(inventory);
  }

  const pieces = parseWornPieces(look);
  if (!pieces.length && !BAG_EXTRAS.some((e) => e.re.test(look))) return inventory;

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
    const worn = makeWornItem(piece, bag ?? placeholders[0]?.containerId, id);
    next.push(worn);
  }

  const have = new Set(next.map((i) => i.name.toLowerCase()));
  for (const extra of BAG_EXTRAS) {
    if (!extra.re.test(look) || have.has(extra.name.toLowerCase())) continue;
    next.push({
      id: `start-${extra.name.toLowerCase()}`,
      name: extra.name,
      rarity: 'Common',
      quantity: 1,
      itemType: 'accessory',
      itemLevel: 1,
      equipped: false,
      containerId: bag ?? placeholders[0]?.containerId,
      provenance: 'On you this morning',
      description: extra.description,
    });
    have.add(extra.name.toLowerCase());
  }

  return dropInsultGear(next);
}

/** Insults must not sit on the sheet as equipped "clothes". */
export function dropInsultGear(inventory: Item[]): Item[] {
  return inventory.filter((item) => {
    const n = item.name.trim();
    if (/^(?:you\s+)?(perve?|creep|weirdo|freak|sicko|pervert)$/i.test(n)) return false;
    if (/\bwhy should\b/i.test(n)) return false;
    if (/\bgive you\b/i.test(n) && /\bname\b/i.test(n)) return false;
    return true;
  });
}
