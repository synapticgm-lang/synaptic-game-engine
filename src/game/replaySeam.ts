/**
 * Replay bank only (`replayRun`): the build stamp of the saved tape being replayed. Live play and new fate-autoplay
 * runs never set it. A replayed road keeps the meetings it recorded (a chance on every stretch, sure after 2 quiet
 * stretches, the old kind pool, no camps), and a world step shipped after the tape's build stays off.
 */
let tapeStamp: string | null = null;

/** The stamp each replay-sensitive world step shipped in. tt-fix-2: an opening place takes the matched spine's pin. */
const FEATURE_STAMP = { openingPlaceNames: '2026-10-14g' } as const;

export function setReplayTape(stamp: string | null): void {
  tapeStamp = stamp;
}

/** A tape is replayed; with `feature`, one built before that step shipped (stamps sort by date, then suffix). */
export function replayPreFeature(feature?: keyof typeof FEATURE_STAMP): boolean {
  return tapeStamp !== null && (!feature || (!!tapeStamp && tapeStamp < FEATURE_STAMP[feature]));
}
