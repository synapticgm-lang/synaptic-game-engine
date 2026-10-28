/** Edge stub (29z8): road meetings are built on the client (src/game/travelJourney.ts) and arrive in the packet. Lets completedEventPacket and places boot. */
import type { GameState } from './types.ts';
import { underwayHereLabel } from './locationName.ts';
import { convertWriterCueFact, hasWriterCueChrome, plainFromWriterCueSentence } from './writerCueLines.ts';

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
 */
export function writerEngineResult(fact: string, subject?: string): string {
  const travel = (fact ?? '').replace(/(?<![A-Za-z])Travel: .*?\.(?=\s+[A-Z]|\s*$)/g, (m) => writerTravelFact(m) ?? m);
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
    if (!s || isRoadLabel(s)) continue;
    const roomHead = 'Dungeon room: ';
    if (s.startsWith(roomHead) && !s.startsWith('Dungeon room: none')) {
      const body = s.endsWith('.') ? s.slice(0, -1) : s;
      const mark = ', inside ';
      const cut = body.indexOf(mark);
      if (cut > roomHead.length) {
        const room = body.slice(roomHead.length, cut);
        const inside = body.slice(cut + mark.length);
        if (room && inside) {
          out.push(`You stood in ${room} inside ${inside}.`);
          continue;
        }
      }
    }
    const waysHead = 'Ways on: ';
    if (s.startsWith(waysHead)) {
      const body = (s.endsWith('.') ? s.slice(0, -1) : s).slice(waysHead.length);
      const names: string[] = [];
      const raw = body.split(',');
      for (let w = 0; w < raw.length; w++) {
        let n = raw[w]!.trim();
        const paren = n.indexOf(' (');
        if (paren >= 0) n = n.slice(0, paren).trim();
        if (n && !isRoadLabel(n)) names.push(n);
      }
      if (names.length === 1) out.push(`A way led on to ${names[0]}.`);
      else if (names.length > 1) out.push(`Ways led on to ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}.`);
      continue;
    }
    if (s.startsWith('Rest:')) {
      const low = s.toLowerCase();
      const kind = low.includes('long rest') ? 'long rest' : low.includes('short rest') ? 'short rest' : 'rest';
      const hpAt = s.indexOf('HP ');
      if (hpAt >= 0) {
        const bits = s.slice(hpAt + 3).trim().split(' ');
        const to = (bits[2] ?? '').split('(')[0] ?? '';
        if (bits[0] && to && (bits[1] === '→' || bits[1] === '->' || bits[1] === 'to')) {
          out.push(`You took a ${kind} and your hurts eased (${bits[0]} to ${to}).`);
          continue;
        }
      }
      out.push(`You took a ${kind}.`);
      continue;
    }
    // T10E — writer cue lines (shared writerCueLines) → plain narration; never player chrome.
    const cue = plainFromWriterCueSentence(s, subject);
    if (cue.cue) {
      if (cue.plain) out.push(cue.plain.endsWith('.') ? cue.plain : `${cue.plain}.`);
      continue;
    }
    out.push(s.endsWith('.') ? s : `${s}.`);
  }
  return out.join(' ');
}

export function isJourneyUnderway(state: Pick<GameState, 'journey'>): boolean {
  return !!state.journey && state.journey.legsDone < state.journey.legsTotal;
}
