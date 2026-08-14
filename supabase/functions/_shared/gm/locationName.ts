import type { GameState } from './types.ts';

/**
 * Location name safe to put in player-facing prose or GM prompts.
 * Encyclopedia lore titles (e.g. "Dungeon Zones & Dead Zones") are not places.
 */
export function playerFacingLocation(state: GameState): string {
  const raw =
    state.locationSheet?.name
    || state.currentLocation
    || state.activeDungeon?.dungeonName
    || '';
  const name = stripTimeClause(raw.trim());
  if (!name) return 'your surroundings';
  if (/^(every mind|every human|first blood|foundation core|the system)$/i.test(name)) {
    return 'your surroundings';
  }
  if (/&/.test(name)) return 'your surroundings';
  if (/\bzones?\b/i.test(name) && /\b(dungeon|dead|safe|quest)\b/i.test(name)) {
    return 'your surroundings';
  }
  const loreHit = (state.lorebook ?? []).find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (loreHit && loreHit.revealed !== true && (loreHit.lastSeenTurn ?? 0) <= 0) {
    return 'your surroundings';
  }
  return name;
}

const LOCAL_SCENE_PLACE =
  /\b(?:tesco(?:\s+extra)?|aisle|shelves?|counter|till|checkout|fridge|shop floor|convenience store|micro[- ]?dungeon|doorway|threshold|interior|entrance|freezer|trolley)\b/i;

/**
 * Place name safe to use as an encounter origin ("it comes from X").
 * Prefer an aisle/shop/interior cue from recent prose — never the city or UK.
 */
export function encounterOriginPlace(state: GameState, recentProse = ''): string {
  const fromProse = recentProse.match(LOCAL_SCENE_PLACE)?.[0]?.trim();
  if (fromProse) return fromProse;
  const interactable = (state.locationSheet?.interactables ?? [])
    .map((item) => item.name?.trim())
    .find((name) => name && LOCAL_SCENE_PLACE.test(name));
  if (interactable) return interactable;
  const candidates = [
    state.locationSheet?.name,
    state.activeDungeon?.dungeonName,
    state.currentLocation,
  ];
  for (const raw of candidates) {
    const name = stripTimeClause((raw ?? '').trim());
    if (!name || isCityScaleOrigin(name) || /&/.test(name)) continue;
    return name;
  }
  return 'just ahead of you';
}

function isCityScaleOrigin(name: string): boolean {
  return (
    /^(?:your surroundings|nearby cover|just ahead of you)$/i.test(name)
    || /^(every mind|every human|first blood|foundation core)$/i.test(name)
    || /\b(uk|england|britain|united kingdom|urban ruin|peterborough)\b/i.test(name)
    || /^the opening of /i.test(name)
  );
}

/** Drop clock/event clauses so "hours after Registration" never reads as travel time. */
function stripTimeClause(name: string): string {
  return name
    .replace(/,\s*(?:hours?|days?|minutes?|moments?|weeks?)\s+after\b.*$/i, '')
    .replace(/,\s*after the last coach\b.*$/i, '')
    .replace(/\s+(?:hours?|days?)\s+after\b.*$/i, '')
    .trim()
    .replace(/[,\s]+$/, '');
}
