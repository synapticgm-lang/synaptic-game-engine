import type { GameState } from './types';

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
  const name = raw.trim();
  if (!name) return 'your surroundings';
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
