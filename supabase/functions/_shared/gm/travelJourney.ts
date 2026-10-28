/** Edge stub (29z8): road meetings are built on the client (src/game/travelJourney.ts) and arrive in the packet. Lets completedEventPacket and places boot. */
import type { GameState } from './types.ts';
import { underwayHereLabel } from './locationName.ts';
import { convertWriterCueFact, hasWriterCueChrome, plainFromWriterCueSentence } from './writerCueLines.ts';
import { isBookForbiddenLedgerLine, ledgerLineToBookProse } from './ledgerToProse.ts';
export { isBookForbiddenLedgerLine } from './ledgerToProse.ts';

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

/**
 * Plain Travel: → writer form, then every other receipt label the same way. Not inside "Extended Travel:" (q31-L4).
 * `subject` is the PC display name for Must-narrate → third-person past (T10R).
 * T10AJ — ledger labels convert (or drop) BEFORE cue convert (parity with src/game/travelJourney.ts).
 */
export function writerEngineResult(fact: string, subject?: string): string {
  let travel = (fact ?? '').replace(/(?<![A-Za-z])Travel: .*?\.(?=\s+[A-Z]|\s*$)/g, (m) => writerTravelFact(m) ?? m);
  // T10U — death beat is the death sentence only (no Check failure / Extended Travel chrome /
  // stray push-on travel sentence mixed into the book). SRD 5.2.1 Exhaustion 6 = death.
  if (/\bYou are dead\./i.test(travel)) {
    const death =
      travel.match(
        /(?:The forced march wore you down past what a body can bear\.\s*)?Your breath stops on the road\.\s*You are dead\./i,
      )?.[0]
      ?? travel.match(/[^.]*You are dead\./i)?.[0]?.trim();
    if (death) {
      const line = death.endsWith('.') ? death : `${death}.`;
      return /The forced march|Your breath stops/i.test(line)
        ? line
        : `The forced march wore you down past what a body can bear. Your breath stops on the road. You are dead.`;
    }
  }
  // T10AH/T10AJ — peel + convert STATUS/dungeon/check ledger before cue convert.
  travel = travel
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .map((s) => ledgerLineToBookProse(s, subject))
    .filter((s) => s && !isRoadLabel(s))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  // T10P — cue-heavy facts convert as whole blocks (periods inside Must narrate must not leak).
  if (hasWriterCueChrome(travel)) {
    const converted = convertWriterCueFact(travel, subject);
    if (converted) return converted;
  }
  const parts = travel.split('. ');
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    let s = (i < parts.length - 1 ? `${parts[i]}.` : parts[i]!).trim();
    while (s.includes('  ')) s = s.split('  ').join(' ');
    if (!s || isRoadLabel(s) || isBookForbiddenLedgerLine(s)) continue;
    // T10E — writer cue lines (shared writerCueLines) → plain narration; never player chrome.
    const cue = plainFromWriterCueSentence(s, subject);
    if (cue.cue) {
      if (cue.plain) out.push(cue.plain.endsWith('.') ? cue.plain : `${cue.plain}.`);
      continue;
    }
    const plain = ledgerLineToBookProse(s, subject);
    if (plain) out.push(plain.endsWith('.') || plain.endsWith('?') || plain.endsWith('!') ? plain : `${plain}.`);
  }
  return out.join(' ');
}

export function isJourneyUnderway(state: Pick<GameState, 'journey'>): boolean {
  return !!state.journey && state.journey.legsDone < state.journey.legsTotal;
}

/**
 * Stub semantics (T10AJ-fix): road meetings arrive in the packet from the client.
 * Same predicates as src/game/travelJourney.ts so scenePresence can boot on edge.
 * No road meeting on the edge unless journey.encounter already says so.
 */
export function roadMeetingOver(enc: {
  engaged?: boolean;
  escaped?: boolean;
  lost?: boolean;
} | null | undefined): boolean {
  return !!enc && (!!enc.engaged || !!enc.escaped || !!enc.lost);
}

const ROAD_MEETING_LABEL: Record<string, string> = {
  wildlife: 'wildlife',
  traveler: 'a traveler',
  meeting: 'a stranger',
  thugs: 'thugs',
  camp: 'a camp',
  undead: 'the restless dead',
  monster: 'a monster',
  villain: 'a villain',
  signs: 'signs on the way',
  plea: 'someone in need',
  lair: 'a lair',
};

export function roadMeetingLabel(kind: string): string {
  return ROAD_MEETING_LABEL[kind] ?? kind;
}
