/** Edge stub (29z8): skill gates live on the client (src/game/skillGates.ts) and arrive in the packet. Lets completedEventPacket boot. */
import type { GameState } from './types.ts';
export function gateFactLines(_state: GameState): string[] { return []; }
