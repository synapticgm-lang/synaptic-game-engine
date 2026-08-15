import type { GameState, Item } from './types';

export interface InventoryArtPatch {
  itemIcons?: Record<string, string>;
  portraitUrl?: string;
  portraitKey?: string;
}

export interface CharacterLikeness {
  look: string;
  gear: string;
  key: string;
}

function equippedGearLine(state: GameState, formChange = false): string {
  if (formChange) return '';
  return (state.inventory ?? [])
    .filter((i) => i.equipped)
    .map((i) => `${i.name}${i.slot ? ` (${i.slot})` : ''}`)
    .sort()
    .join(', ');
}

/** Face/body from their description, plus what they are wearing right now. */
export function characterLikeness(
  state: GameState,
  options: { appearanceOverride?: string; formChange?: boolean } = {}
): CharacterLikeness {
  const look = (
    options.appearanceOverride?.trim()
    || state.character.appearance?.trim()
    || state.character.bio?.trim()
    || state.character.name?.trim()
    || 'ordinary clothes from this morning'
  );
  const gear = equippedGearLine(state, options.formChange);
  return {
    look,
    gear,
    key: `${look}::${gear}`.slice(0, 240),
  };
}

export function portraitCacheKey(state: GameState): string {
  return characterLikeness(state).key;
}

export function needsPortraitRefresh(state: GameState): boolean {
  const look = state.character.appearance?.trim();
  const bio = state.character.bio?.trim();
  const worn = (state.inventory ?? []).some(
    (i) => i.equipped && /shirt|jeans|boots|hoodie|jacket|tee|trainers|sneakers|doc/i.test(i.name)
  );
  if (!look && !bio && !worn) return false;
  const key = portraitCacheKey(state);
  return !state.character.portraitUrl || state.character.portraitKey !== key;
}

export function itemIconPrompt(item: Item): string {
  const slot = item.slot ? ` Worn/held as ${item.slot}.` : '';
  const desc = item.description?.trim() ? ` ${item.description.trim().slice(0, 160)}` : '';
  return `Inventory icon of ${item.name}.${slot}${desc} Common mundane object if it is street clothes or a pocket tool.`;
}

export function paperDollPrompt(state: GameState): string {
  const { look, gear } = characterLikeness(state);
  const name = state.character.name || 'the player';
  const outfit = gear || look;
  return [
    `${name} standing in an inventory paper-doll pose.`,
    `This is the same person they described: ${look}.`,
    `Currently wearing and holding: ${outfit}.`,
    'Keep their face, hair, skin, body, and age. Only the listed gear may differ from an older look.',
    'Same person, full body visible from head to feet.',
  ].join(' ');
}
