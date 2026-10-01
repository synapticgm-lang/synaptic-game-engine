/**
 * Text rules shared by the live chip list (`chipLegality` → `resolveOfferedChoices`) and the tester
 * (`turnCheck`): what a typed action acts on, whether a chip repeats it, whether the place text says
 * nobody is here, and whether a chip handles the LitRPG System window like an object.
 */

import type { GameState } from './types';

const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const low = (s: string | undefined | null) => norm(s).toLowerCase();

const STOP =
  /^(?:with|from|that|this|have|into|your|their|about|would|could|should|then|will|just|them|they|what|when|where|which|there|here|some|more|look|search|inspect|check|examine|study|take|try|find|carefully|around|toward|towards|again|slowly|quietly|closer|nearby|area|room|scene|place|while|still|move|make|give|open|pick|read|touch|down|over|back|away)$/;
/** Words before the verb of a typed line ("I", "carefully"): skipped so the verb itself can be dropped. */
const LEAD = /^(?:i|we|you|then|now|so|carefully|slowly|quietly|quickly|just|try|to|and)$/;
export const MOTION_VERB = /^(?:walk|walks|walking|move|moving|go|going|keep|continue|press|proceed|step|stroll|wander|head|carry)$/;

/** The words the action acts on: the verb (first word after any lead-in) is the action, not its object. */
export function objectWords(action: string): string[] {
  const words = low(action).match(/[a-z]+/g) ?? [];
  let i = 0;
  while (i < words.length && LEAD.test(words[i]!)) i++;
  const walking = MOTION_VERB.test(words[i] ?? '');
  return words
    .slice(i + 1)
    .filter((w) => w.length >= 4 && !STOP.test(w) && !(walking && MOTION_VERB.test(w)))
    .slice(0, 4);
}

export function actionVerb(action: string): string {
  const words = low(action).match(/[a-z]+/g) ?? [];
  return words.find((w) => !LEAD.test(w)) ?? '';
}

/** Word stem: a plural or verb ending does not make "exits" miss "exit". */
function stemOf(word: string): string {
  const w = word.toLowerCase();
  const cut = w.replace(/(?:ings?|ed|es|s)$/, '');
  if (cut.length >= 3) return cut.slice(0, 5);
  const plural = w.replace(/s$/, '');
  return (plural.length >= 3 ? plural : w).slice(0, 5);
}

export function stemHit(prose: string, word: string): boolean {
  return new RegExp(`\\b${stemOf(word)}`, 'i').test(prose);
}

/** Narration or the place card says nobody is here. Spoken lines do not count: a speaker is someone. */
const EMPTY_ROOM =
  /\b(?:nobody|no one|no-one|not a soul|no other (?:soul|person|people)|no sign of (?:anyone|life|people)|(?:you are|you're|you were|you stand|you stood|you're still|you are still) alone|alone (?:here|now|in (?:the|this))|deserted|(?:room|hall|chamber|place|building|house|ruin|street|square|space|corridor|bathhouse|cell|court|yard) (?:is|was|stood|lay|sat|stands|lies|sits) (?:empty|silent and empty)|empty (?:room|hall|chamber|ruin|building|house|street|square|corridor|bathhouse|cell))\b/i;

export function placeSaysEmpty(state: GameState, prose: string): boolean {
  const card = (state.places ?? []).find((p) => low(p.name) === low(state.currentLocation));
  const text = [prose, card?.description].filter(Boolean).join(' ').replace(/["“][^"”]*["”]/g, ' ');
  return EMPTY_ROOM.test(text);
}

export const WINDOW_NOUN = /\b(?:(?:blue|system|status|translucent|glowing|floating)\s+(?:panel|window|screen|box|plate)|the panel)\b/i;
export const PHYSICAL_CHIP = /^(?:touch|tap|press|push|poke|grab|take|pick up|lift|knock on|break|smash|pull|hold|weigh)\b/i;

/** A chip that handles the LitRPG System window like a thing in the room. */
export function chipHandlesSystemWindow(state: GameState, chip: string): boolean {
  if (state.engineMode !== 'litrpg') return false;
  const label = norm(chip);
  return PHYSICAL_CHIP.test(label) && WINDOW_NOUN.test(label);
}

/** Verb families for "the same move again": a chip worded differently is still the action just taken. */
const MOVE_FAMILY: RegExp[] = [
  /^(?:look|inspect|examine|investigate|check|study|scan|observe|survey|peer)$/,
  /^(?:search|rummage|sift|comb)$/,
  /^(?:wait|rest|pause|linger|watch)$/,
  /^(?:listen)$/,
  /^(?:take|grab|pick|lift|pocket)$/,
  /^(?:open|unlatch|pry|prise)$/,
  /^(?:read|decipher)$/,
];

function moveFamily(verb: string): number {
  return MOVE_FAMILY.findIndex((f) => f.test(verb));
}

/** Does this chip repeat the action the player just took? */
export function chipRepeatsAction(chip: string, action: string): boolean {
  const clean = (s: string) => low(s).replace(/[.!?]+$/, '').replace(/^(?:i|we)\s+/, '');
  const c = clean(chip);
  const a = clean(action);
  if (!c || !a || /^\(crash/.test(a)) return false;
  if (c === a) return true;
  const fam = moveFamily(actionVerb(c));
  if (fam < 0 || fam !== moveFamily(actionVerb(a))) return false;
  const chipObjects = objectWords(c);
  const actObjects = objectWords(a);
  if (!chipObjects.length) return !actObjects.length;
  return chipObjects.every((w) => stemHit(a, w));
}
