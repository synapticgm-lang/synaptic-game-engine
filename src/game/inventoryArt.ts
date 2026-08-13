import type { GameState, Item } from './types';

export interface InventoryArtPatch {
  itemIcons?: Record<string, string>;
  portraitUrl?: string;
  portraitKey?: string;
}

export function portraitCacheKey(state: GameState): string {
  const look = (state.character.appearance || state.character.bio || state.character.name || '').trim();
  const gear = (state.inventory ?? [])
    .filter((i) => i.equipped)
    .map((i) => `${i.slot ?? ''}:${i.name}`)
    .sort()
    .join('|');
  return `${look}::${gear}`.slice(0, 240);
}

export function itemIconPrompt(item: Item): string {
  const slot = item.slot ? ` Worn/held as ${item.slot}.` : '';
  const desc = item.description?.trim() ? ` ${item.description.trim().slice(0, 160)}` : '';
  return `Inventory icon of ${item.name}.${slot}${desc} Common mundane object if it is street clothes or a pocket tool.`;
}

export function paperDollPrompt(state: GameState): string {
  const name = state.character.name || 'the player';
  const look = state.character.appearance?.trim() || 'ordinary clothes from this morning';
  const gear = (state.inventory ?? [])
    .filter((i) => i.equipped)
    .map((i) => `${i.name}${i.slot ? ` (${i.slot})` : ''}`)
    .join(', ') || 'everyday clothes';
  return `${name} standing in an inventory paper-doll pose. Appearance: ${look}. Equipped: ${gear}. Same person, full body visible.`;
}
