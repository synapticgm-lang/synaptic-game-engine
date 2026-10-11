/**
 * Multi lap 15 — a sentence that counts the ways out ("Three ways out of the close", "the only way left")
 * must match the ways out the writer was handed: the engine's own Exits receipt this turn, else the
 * PLACES line of the info sheet. A wrong count goes back for the one-sentence repair with the right list.
 */
import type { GameState } from './types';
import { sheetExitNames } from './infoSheet';
import { playerFacingLocation } from './locationName';

const NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, both: 2, single: 1, only: 1,
};
const EXIT_NOUN = '(?:roads?|exits?|ways?|paths?|doors?|doorways?|lanes?|streets?|routes?|gates?|tracks?|trails?|passages?|stairs?)';
const COUNTED_EXIT = new RegExp(
  `\\b(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|both|single|only)\\s+(?:[a-z-]+\\s+){0,2}?(${EXIT_NOUN})\\b`,
  'gi'
);
/** Right after the noun: "ways out", or a leading verb ("doors led off", "the only way left to go"). */
const LEADS_OUT = /^\s+(?:out\b|(?:[a-z-]+\s+)?(?:left|led|lead|leads|ran|run|runs|went|go|goes|opened|open)\b)/i;
/** "the other two doors", "the first two roads" count part of the ways, not all of them. */
const PART_OF = /\b(?:other|remaining|first|last|next|those|these)\s+$/i;

const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim();

/**
 * The mapped ways out handed this turn, or null when there is nothing to count against. "No way out"
 * means no way out reaches a mapped place, not that the room has no door, so it has no count.
 */
export function handedExits(state: GameState): string[] | null {
  const receipt = (state.completedEvent?.engineResult ?? '').match(/\bExits:\s*([^\n]*?)\.(?=\s|$)/)?.[1];
  if (receipt != null) {
    if (/\bno way out\b/i.test(receipt)) return null;
    const listed = receipt.match(/\blead(?:s)? to\s+(.+)$/i)?.[1];
    if (listed) return [...new Set(listed.split(/,\s*(?:and\s+)?|\s+and\s+/).map(norm).filter(Boolean))];
  }
  const sheet = sheetExitNames(state);
  return sheet.length ? sheet : null;
}

/** The number of ways out a clause states, or null when it states none. */
function statedExitCount(clause: string, exits: string[], sentence: string): number | null {
  for (const m of clause.matchAll(COUNTED_EXIT)) {
    const at = m.index ?? 0;
    const end = at + m[0].length;
    const word = m[1]!.toLowerCase();
    const noun = m[2]!.toLowerCase();
    const after = clause.slice(end);
    if (!/^exits?$/.test(noun) && !LEADS_OUT.test(after)) continue;
    if (PART_OF.test(clause.slice(0, at)) || /^\s+of\s+the\b/i.test(after)) continue;
    if (word === 'only' && /s$/.test(noun)) continue;
    // "One passage led…, another…" lists the ways one by one.
    if (word === 'one' && /\b(?:another|the other|a second|a third)\b/i.test(sentence)) continue;
    const n = /^\d+$/.test(word) ? Number(word) : NUM[word];
    if (n === 1) {
      // "the only road to Lowmarket" is the one way to a named exit, not the total.
      const rest = after.replace(/^\s+out\b/i, '').toLowerCase();
      const names = (t: string) => exits.some((e) => e.length >= 4 && t.includes(e.toLowerCase().replace(/^the\s+/, '')));
      if (/^\s*(?:to|toward|towards|into)\s/.test(rest) && names(rest.split(/[,;]/)[0]!)) continue;
      // "Cathedral Close waited, but the only way there ran…": the one way to the exit the sentence names.
      if (/^\s*(?:\w+\s+){0,4}?(?:to\s+(?:get|go|reach)\s+)?there\b/.test(rest) && names(sentence.toLowerCase())) continue;
    }
    if (Number.isFinite(n)) return n!;
  }
  return null;
}

/** The repair line for a sentence that miscounts the ways out, or null when the count is right or absent. */
export function wrongExitCountProblem(state: GameState, sentence: string): string | null {
  const exits = handedExits(state);
  if (!exits) return null;
  for (const one of (sentence ?? '').split(/(?<=[.!?])\s+/)) {
    for (const clause of one.split(/[;:]\s*|,\s*(?=(?:and|but|while|as|though|yet)\b)/i)) {
      const n = statedExitCount(clause, exits, one);
      if (n == null || n === exits.length) continue;
      const here = playerFacingLocation(state) || norm(state.currentLocation ?? '') || 'here';
      return `Gives the wrong number of ways out: ${here} has ${exits.length} (${exits.join(', ')}).`;
    }
  }
  return null;
}
