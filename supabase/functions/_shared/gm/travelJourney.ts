/** Edge stub (29z8): road meetings are built on the client (src/game/travelJourney.ts) and arrive in the packet. Lets completedEventPacket and places boot. */
import type { GameState } from './types.ts';
import { underwayHereLabel } from './locationName.ts';

export function roadMeetingFact(_j: unknown): string { return ''; }

export const UNDERWAY_HERE = 'On the road between places';

const tidy = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

const ROAD_LABELS = new Set(
  ['Forest path', 'Marsh track', 'Mountain pass', 'Coast road', 'Back streets', 'Open road', 'On the road between places'].map((l) =>
    l.toLowerCase(),
  ),
);

/** Same labels as the client GROUND_LABEL + UNDERWAY_HERE. */
export function isRoadLabel(name: string | undefined | null): boolean {
  return ROAD_LABELS.has((name ?? '').replace(/\s+/g, ' ').trim().toLowerCase());
}

export function isTripHere(state: Pick<GameState, 'journey'>, name: string | undefined | null): boolean {
  if (isRoadLabel(name)) return true;
  const trip = underwayHereLabel(state);
  return !!trip && tidy(name).toLowerCase() === trip.toLowerCase();
}

export function isJourneyUnderway(state: Pick<GameState, 'journey'>): boolean {
  return !!state.journey && state.journey.legsDone < state.journey.legsTotal;
}
