/** Edge stub (29z8): road meetings are built on the client (src/game/travelJourney.ts) and arrive in the packet. Lets completedEventPacket and places boot. */
import type { GameState } from './types.ts';
import { underwayHereLabel } from './locationName.ts';

export function roadMeetingFact(_j: unknown): string { return ''; }
export function roadMeetingRef(_state: unknown): { display: string; note: string } | null { return null; }
export function roadMeetingOnBeat(_state: unknown): { label: string; count: number } | null { return null; }
/** The client puts the road meeting event in the engine result; the edge passes the engine result through. */
export function withRoadMeetingEvent(_state: unknown, engineResult?: string): string { return (engineResult ?? '').trim(); }

/** This turn's travel beat facts for the writer (empty on any other turn). */
export function travelBeatFact(state: Pick<GameState, 'travelBeat' | 'turn'>): string {
  const b = state.travelBeat;
  return b && b.turn === (state.turn ?? 0) && b.facts.length ? b.facts.join(' ') : '';
}

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

/** Same as the client: a meeting chip without its failure-cost tail. */
export function meetingMoveBase(chip: string): string {
  return (chip ?? '').replace(/\s+/g, ' ').trim().replace(/,\s*but fail and (?:they|it) attacks?$/i, '');
}

const TIME_SLOT = '(dawn|morning|midday|afternoon|dusk|evening|night)';

/** Same as the client (tt-fix-4): travel receipt → destination + plain time. */
export function writerTravelFact(receipt: string): string | null {
  const r = (receipt ?? '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (!/^Travel:/i.test(r)) return null;
  const slot = r.match(new RegExp(`\\bnow ${TIME_SLOT}\\b`, 'i'))?.[1] ?? r.match(new RegExp(`\\(${TIME_SLOT}\\)`, 'i'))?.[1];
  const time = slot ? ` It is now ${slot}.` : '';
  const to =
    r.match(/;\s*([^;]+?) still ahead\b/)?.[1]
    ?? r.match(/\bbetween .+? and (.+?)(?: at a \w+ pace)?(?: \(| —|;|$)/)?.[1];
  const ground = r.match(/^Travel: (?:still on )?(?:the )?(.+?) between /i)?.[1];
  const on = ground ? `On the ${ground} toward ${to}` : `Toward ${to}`;
  if (to && /the way on is blocked/i.test(r)) return `${on}; the way on is blocked.${time}`;
  if (to) return `${on}.${time}`;
  const dest = r.match(/^Travel: .* to (.+?)(?: at a \w+ pace)?(?: — |$)/)?.[1];
  return dest ? `Arrived at ${dest}.${time}` : null;
}

/** Plain Travel: → writer form. Not inside "Extended Travel:" (q31-L4). */
export function writerEngineResult(fact: string): string {
  return (fact ?? '').replace(/(?<![A-Za-z])Travel: .*?\.(?=\s+[A-Z]|\s*$)/g, (m) => writerTravelFact(m) ?? m);
}

export function isJourneyUnderway(state: Pick<GameState, 'journey'>): boolean {
  return !!state.journey && state.journey.legsDone < state.journey.legsTotal;
}
