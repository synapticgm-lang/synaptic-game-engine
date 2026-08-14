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

/** Drop clock/event clauses so "hours after Registration" never reads as travel time. */
function stripTimeClause(name: string): string {
  return name
    .replace(/,\s*(?:hours?|days?|minutes?|moments?|weeks?)\s+after\b.*$/i, '')
    .replace(/,\s*after the last coach\b.*$/i, '')
    .replace(/\s+(?:hours?|days?)\s+after\b.*$/i, '')
    .trim()
    .replace(/[,\s]+$/, '');
}
