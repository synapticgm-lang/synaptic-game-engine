/**
 * Bundled inventory + paper-doll art. Original SynapticGM glyphs (we own the drawings).
 * Used instead of hosted Klein for item icons and character portraits — no API spend.
 * Memorable story plates are separate and stay opt-in.
 */

import type { GameState, Item } from './types';
import { normalizeEquipSlot } from './wornGear';

export type StockItemGlyphId =
  | 'sword'
  | 'dagger'
  | 'axe'
  | 'bow'
  | 'staff'
  | 'shield'
  | 'helm'
  | 'hat'
  | 'chest'
  | 'cloak'
  | 'boots'
  | 'pants'
  | 'ring'
  | 'potion'
  | 'bag'
  | 'phone'
  | 'headphones'
  | 'key'
  | 'book'
  | 'tool'
  | 'quest'
  | 'unknown';

function tile(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
<rect width="64" height="64" rx="10" fill="#0f172a"/>
<rect x="1.5" y="1.5" width="61" height="61" rx="8.5" stroke="#334155" stroke-width="1.5"/>
${inner}
</svg>`;
}

const INK = '#e2e8f0';
const GOLD = '#c4a574';

const ITEM_SVG: Record<StockItemGlyphId, string> = {
  sword: tile(`<path d="M32 8l2 28h-4L32 8z" fill="${INK}"/><rect x="28" y="36" width="8" height="3" fill="${GOLD}"/><rect x="30.5" y="39" width="3" height="14" fill="${INK}"/>`),
  dagger: tile(`<path d="M32 10l1.6 24h-3.2L32 10z" fill="${INK}"/><rect x="29" y="34" width="6" height="2.5" fill="${GOLD}"/><rect x="30.5" y="36.5" width="3" height="12" fill="${INK}"/>`),
  axe: tile(`<rect x="30" y="12" width="4" height="34" fill="${INK}"/><path d="M34 16h14l-2 10H34V16z" fill="${GOLD}"/>`),
  bow: tile(`<path d="M20 12c14 8 14 32 0 40" stroke="${INK}" stroke-width="3" fill="none"/><path d="M20 12v40" stroke="${GOLD}" stroke-width="1.5"/><path d="M20 32h18" stroke="${INK}" stroke-width="2"/>`),
  staff: tile(`<rect x="30.5" y="10" width="3" height="42" fill="${INK}"/><circle cx="32" cy="12" r="6" fill="${GOLD}"/>`),
  shield: tile(`<path d="M32 10l16 6v14c0 12-8 20-16 24-8-4-16-12-16-24V16l16-6z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M32 18v26" stroke="${GOLD}" stroke-width="2"/>`),
  helm: tile(`<path d="M16 36c0-12 7-20 16-20s16 8 16 20v4H16v-4z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><rect x="22" y="30" width="20" height="5" fill="${GOLD}"/>`),
  hat: tile(`<ellipse cx="32" cy="42" rx="18" ry="5" fill="${GOLD}"/><path d="M20 40c2-14 22-14 24 0H20z" fill="${INK}"/>`),
  chest: tile(`<path d="M18 22h28v26H18z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M18 22l14-8 14 8" stroke="${GOLD}" stroke-width="2"/><path d="M32 22v26" stroke="${INK}" stroke-width="1.5"/>`),
  cloak: tile(`<path d="M24 14h16l4 8v26H20V22l4-8z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M24 14c4 6 12 6 16 0" stroke="${GOLD}" stroke-width="2"/>`),
  boots: tile(`<path d="M22 18h8v22l-10 8H16V36l6-18z" fill="${INK}"/><path d="M34 18h8v22l10 8h-4V36l-6-18z" fill="${INK}"/><rect x="16" y="46" width="14" height="4" fill="${GOLD}"/><rect x="38" y="46" width="14" height="4" fill="${GOLD}"/>`),
  pants: tile(`<path d="M22 14h20v12l-4 26h-5L32 26l-1 26h-5L22 26V14z" fill="${INK}"/><path d="M22 26h20" stroke="${GOLD}" stroke-width="2"/>`),
  ring: tile(`<circle cx="32" cy="34" r="12" stroke="${INK}" stroke-width="4" fill="none"/><rect x="28" y="16" width="8" height="8" rx="1" fill="${GOLD}"/>`),
  potion: tile(`<path d="M26 18h12v8l6 22a10 10 0 01-24 0l6-22V18z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M24 38c3 6 13 6 16 0" fill="${GOLD}"/>`),
  bag: tile(`<path d="M18 26h28v24H18z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M26 26c0-8 12-8 12 0" stroke="${GOLD}" stroke-width="2"/>`),
  phone: tile(`<rect x="22" y="10" width="20" height="44" rx="3" fill="#1e293b" stroke="${INK}" stroke-width="2"/><rect x="26" y="16" width="12" height="28" fill="${GOLD}" opacity=".35"/><circle cx="32" cy="48" r="2" fill="${INK}"/>`),
  headphones: tile(`<path d="M16 32a16 16 0 0132 0" stroke="${INK}" stroke-width="3" fill="none"/><rect x="12" y="30" width="8" height="16" rx="2" fill="${GOLD}"/><rect x="44" y="30" width="8" height="16" rx="2" fill="${GOLD}"/>`),
  key: tile(`<circle cx="24" cy="24" r="8" stroke="${INK}" stroke-width="3" fill="none"/><path d="M30 28l18 18M40 38v8M46 44v8" stroke="${GOLD}" stroke-width="3"/>`),
  book: tile(`<path d="M16 14h14v36H16z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M34 14h14v36H34z" fill="#1e293b" stroke="${INK}" stroke-width="2"/><path d="M32 14v36" stroke="${GOLD}" stroke-width="2"/>`),
  tool: tile(`<rect x="28" y="12" width="8" height="28" rx="1" fill="${INK}"/><path d="M18 40h28l-4 10H22l-4-10z" fill="${GOLD}"/>`),
  quest: tile(`<path d="M32 10l6 12h14l-12 9 5 14-13-8-13 8 5-14-12-9h14L32 10z" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/>`),
  unknown: tile(`<circle cx="32" cy="32" r="14" stroke="${INK}" stroke-width="2" fill="none"/><path d="M26 26c0-4 12-4 12 4 0 4-6 5-6 10" stroke="${GOLD}" stroke-width="3" fill="none"/><circle cx="32" cy="44" r="2" fill="${GOLD}"/>`),
};

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function pickStockItemGlyph(item: Pick<Item, 'name' | 'slot' | 'itemType' | 'description'>): StockItemGlyphId {
  const hay = `${item.name} ${item.slot ?? ''} ${item.itemType ?? ''} ${item.description ?? ''}`.toLowerCase();
  const slot = normalizeEquipSlot(item.slot);

  if (/\b(headphone|earbud|airpod)/.test(hay)) return 'headphones';
  if (/\b(phone|mobile|smartphone)/.test(hay)) return 'phone';
  if (/\b(potion|flask|vial|elixir|bottle|heal)/.test(hay) || item.itemType === 'consumable') return 'potion';
  if (/\b(backpack|satchel|bag|pack|pouch)/.test(hay) || item.itemType === 'container' || /container/i.test(item.slot ?? '')) return 'bag';
  if (/\b(key|keys|leatherman|multi[-\s]?tool)/.test(hay)) return /\bkey/.test(hay) ? 'key' : 'tool';
  if (/\bbook|journal|tome|grimoire/.test(hay)) return 'book';
  if (/\bring|band\b|amulet|necklace|pendant/.test(hay) || item.itemType === 'accessory') {
    if (/\bamulet|necklace|pendant|cloak/.test(hay)) return 'cloak';
    return 'ring';
  }
  if (item.itemType === 'quest' || /\bquest|blessing|token|seal|mark\b/.test(hay)) return 'quest';

  if (/\bbow|crossbow|arrow/.test(hay)) return 'bow';
  if (/\baxe|hatchet/.test(hay)) return 'axe';
  if (/\bstaff|stave|wand|rod\b/.test(hay)) return 'staff';
  if (/\bshield|buckler/.test(hay)) return 'shield';
  if (/\bdagger|knife|dirk|shiv/.test(hay)) return 'dagger';
  if (/\bsword|blade|rapier|sabre|saber|gladius|claymore/.test(hay) || item.itemType === 'weapon' || slot === 'Main Hand') {
    if (slot === 'Off Hand' && !/\bsword|blade|dagger|knife/.test(hay)) return 'shield';
    if (item.itemType === 'weapon' || slot === 'Main Hand' || /\bsword|blade/.test(hay)) return 'sword';
  }

  if (slot === 'Head' || /\bhelm|helmet|hood|cap\b|hat\b|crown/.test(hay)) {
    return /\bhat|cap|beanie|hood/.test(hay) ? 'hat' : 'helm';
  }
  if (slot === 'Feet' || /\bboot|shoe|sandal/.test(hay)) return 'boots';
  if (slot === 'Legs' || /\bpant|trouser|jeans|leggings/.test(hay)) return 'pants';
  if (slot === 'Off Hand') return /\bphone/.test(hay) ? 'phone' : 'shield';
  if (slot === 'Shoulders' || /\bcloak|cape|mantle|shawl/.test(hay)) return 'cloak';
  if (slot === 'Chest' || item.itemType === 'armor' || /\barmor|mail|plate|tunic|shirt|hoodie|jacket|coat|clothes/.test(hay)) {
    return /\bcloak|robe/.test(hay) ? 'cloak' : 'chest';
  }
  if (item.itemType === 'material') return 'unknown';
  return 'unknown';
}

export function stockItemIconSrc(item: Pick<Item, 'name' | 'slot' | 'itemType' | 'description'>): string {
  return svgDataUri(ITEM_SVG[pickStockItemGlyph(item)]);
}

function portraitSvg(opts: { helm: boolean; hat: boolean; armor: boolean; street: boolean; cloak: boolean; sword: boolean; shield: boolean; staff: boolean }): string {
  const headwear = opts.helm
    ? `<path d="M28 22c0-8 24-8 24 0v6H28v-6z" fill="#334155" stroke="${INK}" stroke-width="1.5"/><rect x="32" y="26" width="16" height="3" fill="${GOLD}"/>`
    : opts.hat
      ? `<ellipse cx="40" cy="30" rx="16" ry="4" fill="${GOLD}"/><path d="M30 28c2-10 16-10 20 0H30z" fill="${INK}"/>`
      : `<circle cx="40" cy="26" r="8" fill="#cbd5e1" stroke="${INK}" stroke-width="1.5"/>`;
  const bodyFill = opts.armor ? '#475569' : opts.street ? '#334155' : '#1e293b';
  const body = opts.cloak
    ? `<path d="M24 36c4-4 28-4 32 0v40H24V36z" fill="#1e293b" stroke="${INK}" stroke-width="1.5"/>`
    : `<path d="M28 34h24l4 12v30H24V46l4-12z" fill="${bodyFill}" stroke="${INK}" stroke-width="1.5"/>`;
  const weapon = opts.staff
    ? `<rect x="18" y="40" width="3" height="48" fill="${INK}"/><circle cx="19.5" cy="38" r="5" fill="${GOLD}"/>`
    : opts.sword
      ? `<path d="M16 88V48l3-2 3 2v40" fill="${INK}"/><rect x="14" y="46" width="10" height="3" fill="${GOLD}"/>`
      : '';
  const shield = opts.shield
    ? `<path d="M58 48l10 4v12c0 8-4 14-10 16-6-2-10-8-10-16V52l10-4z" fill="#1e293b" stroke="${GOLD}" stroke-width="1.5"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120">
<rect width="80" height="120" fill="#0f172a"/>
<rect x="4" y="4" width="72" height="112" rx="8" fill="none" stroke="#334155" stroke-width="2"/>
${body}
${headwear}
${weapon}
${shield}
</svg>`;
}

export function stockPortraitSrc(state: GameState): string {
  const worn = (state.inventory ?? []).filter((i) => i.equipped);
  const hay = worn.map((i) => `${i.name} ${i.slot ?? ''} ${i.itemType ?? ''}`).join(' ').toLowerCase();
  const look = `${state.character.appearance ?? ''} ${state.character.bio ?? ''}`.toLowerCase();
  const helm = worn.some((i) => normalizeEquipSlot(i.slot) === 'Head') && /\bhelm|helmet|crown/.test(hay);
  const hat = worn.some((i) => normalizeEquipSlot(i.slot) === 'Head') && !helm;
  const armor = /\barmor|mail|plate|tunic/.test(hay) || worn.some((i) => i.itemType === 'armor');
  const street =
    /\bhoodie|jeans|tee|shirt|clothes|jacket|earth|travel|everyday|street|what you had on|light took you\b/.test(
      hay + ' ' + look
    );
  const cloak = /\bcloak|cape|robe|hood/.test(hay);
  const staff = /\bstaff|wand|stave/.test(hay);
  const sword = worn.some((i) => normalizeEquipSlot(i.slot) === 'Main Hand') && !staff;
  const shield = worn.some((i) => normalizeEquipSlot(i.slot) === 'Off Hand') || /\bshield/.test(hay);
  return svgDataUri(portraitSvg({ helm, hat, armor, street, cloak, sword, shield, staff }));
}
