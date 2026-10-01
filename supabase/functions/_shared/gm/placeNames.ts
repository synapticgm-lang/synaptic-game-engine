/** Edge stub (29z8): nearby places live on the client (src/game/placeNames.ts) and arrive in the packet's refEnum. Lets completedEventPacket boot. */
import type { GameState } from './types.ts';

export function nearbyPlaceNames(_state: GameState): string[] {
  return [];
}

export function exitPlaceNames(_state: GameState): string[] {
  return [];
}
