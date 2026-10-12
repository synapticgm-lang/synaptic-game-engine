/**
 * Multi lap 15 — a sentence that counts the ways out ("Three ways out of the close", "the only way left")
 * must match the ways out the writer was handed: the engine's own Exits receipt this turn, else the
 * PLACES line of the info sheet. A wrong count goes back for the one-sentence repair with the right list.
 */
import type { GameState } from './types';
import { sheetExitNames } from './infoSheet';
import { playerFacingLocation } from './locationName';
import { hubsForBibleId } from './outdoorHubs';

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
/** "the only way on ran past the traveler", "the way back": the ways in one direction, not every way out. */
const ONE_DIRECTION = /^\s+(?:on(?!\s+(?:the|a|an|its|their|his|her)\b)|onwards?|ahead|forwards?|back)\b/i;

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

/**
 * The ways out a clause counts. `more` marks a count added to one already given ("two more ways out",
 * "a further two roads"): it is part of the sentence's total, not the total.
 */
function statedExitCounts(clause: string, exits: string[], sentence: string): Array<{ n: number; more: boolean }> {
  const out: Array<{ n: number; more: boolean }> = [];
  for (const m of clause.matchAll(COUNTED_EXIT)) {
    const at = m.index ?? 0;
    const end = at + m[0].length;
    const word = m[1]!.toLowerCase();
    const noun = m[2]!.toLowerCase();
    const after = clause.slice(end);
    if (!/^exits?$/.test(noun) && !LEADS_OUT.test(after)) continue;
    if (PART_OF.test(clause.slice(0, at)) || ONE_DIRECTION.test(after) || /^\s+of\s+the\b/i.test(after)) continue;
    // "the only other way out" leaves out the way in; "one of the ways out" picks one of several.
    if (/\b(?:other|remaining|of)\b/i.test(m[0].slice(m[1]!.length, m[0].length - m[2]!.length))) continue;
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
    if (Number.isFinite(n)) out.push({ n: n!, more: /\b(?:more|further|additional)\b/i.test(m[0]) });
  }
  return out;
}

/** The repair line for a sentence that miscounts the ways out, or null when the count is right or absent. */
export function wrongExitCountProblem(state: GameState, sentence: string): string | null {
  const exits = handedExits(state);
  if (!exits) return null;
  const here = playerFacingLocation(state) || norm(state.currentLocation ?? '') || 'here';
  const wrong = `Gives the wrong number of ways out: ${here} has ${exits.length} (${exits.join(', ')}).`;
  for (const one of (sentence ?? '').split(/(?<=[.!?])\s+/)) {
    const counts = one
      .split(/[;:]\s*|,\s*(?=(?:and|but|while|as|though|yet)\b)/i)
      .flatMap((clause) => statedExitCounts(clause, exits, one));
    if (!counts.length) continue;
    // "Two doors stood open…, while two more ways out…": the counts add up to the sentence's total.
    if (counts.some((c) => c.more)) {
      if (counts.reduce((sum, c) => sum + c.n, 0) !== exits.length) return wrong;
      continue;
    }
    if (counts.some((c) => c.n !== exits.length)) return wrong;
  }
  return null;
}

/** "Somewhere past the wall the Cinderflow Road ran west": a way out leading somewhere, named. */
const WAY_LEADS = new RegExp(
  `\\b(?:ways? out|exits?|${EXIT_NOUN}\\s+(?:left|led|leads|lead|ran|runs|run|went|go|goes)\\b|led (?:back )?to|leads (?:back )?to)`,
  'i'
);

/**
 * The repair line for a sentence that names a known place of this world as a way out of here when it is
 * none of the handed ways out (nor here, nor this turn's road ends), or null. Same reading as the fact
 * checker's exit-place check.
 */
export function wrongExitPlaceProblem(state: GameState, sentence: string): string | null {
  const exits = handedExits(state);
  if (!exits) return null;
  const key = (s: string) => norm(s).toLowerCase().replace(/^the\s+/, '');
  const here = playerFacingLocation(state) || norm(state.currentLocation ?? '') || 'here';
  const known = [state.currentLocation, here, ...exits, state.journey?.from, state.journey?.to].filter(Boolean).map((s) => key(s!));
  const isKnown = (name: string) => known.some((k) => k && (k.includes(key(name)) || key(name).includes(k)));
  const names = [
    ...hubsForBibleId(state.campaignBibleId).flatMap((h) => [h.name, ...(h.aliases ?? [])]),
    ...(state.places ?? []).map((p) => p.name),
  ]
    .map(norm)
    // A lowercase one-word alias ("the wall", "the market") is a common noun, not a name.
    .filter((n) => {
      const bare = n.replace(/^the\s+/i, '');
      return bare.length >= 4 && (/[A-Z]/.test(bare) || bare.includes(' '));
    })
    .sort((a, b) => b.length - a.length);
  for (const one of (sentence ?? '').split(/(?<=[.!?])\s+/)) {
    for (const clause of one.split(/[;:]\s*|,\s*(?=(?:and|but|while|as|though|yet)\b)/i)) {
      if (!WAY_LEADS.test(clause) || /\b(?:counting|watching|eyeing|checking) the exits\b/i.test(clause)) continue;
      let rest = clause;
      for (const name of names) {
        const bare = name.replace(/^the\s+/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // A capitalised name is the place only when written capitalised ("Close", not "kept their clothes close").
        const re = /[A-Z]/.test(bare) ? new RegExp(`\\b${bare}\\b`) : new RegExp(`\\b${bare}\\b`, 'i');
        const hit = rest.match(re);
        if (!hit) continue;
        const before = rest.slice(0, hit.index ?? 0);
        rest = rest.replace(re, ' ');
        if (isKnown(name)) continue;
        // "the road ran along the city wall": a place the way passes, not where it leads.
        if (/\b(?:along|past|beside|under|by|over|through|across|below|above|beneath|around)\s+(?:the\s+)?$/i.test(before)) continue;
        return `Names a way out ${here} does not have (${hit[0]}): the ways out of ${here} are ${exits.join(', ')}.`;
      }
    }
  }
  return null;
}
