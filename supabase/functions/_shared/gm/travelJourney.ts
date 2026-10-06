/** Edge stub (29z8): road meetings are built on the client (src/game/travelJourney.ts) and arrive in the packet. Lets completedEventPacket and places boot. */
export function roadMeetingFact(_j: unknown): string { return ''; }

const ROAD_LABELS = new Set(
  ['Forest path', 'Marsh track', 'Mountain pass', 'Coast road', 'Back streets', 'Open road', 'On the road between places'].map((l) =>
    l.toLowerCase(),
  ),
);

/** Same labels as the client GROUND_LABEL + UNDERWAY_HERE. */
export function isRoadLabel(name: string | undefined | null): boolean {
  return ROAD_LABELS.has((name ?? '').replace(/\s+/g, ' ').trim().toLowerCase());
}
