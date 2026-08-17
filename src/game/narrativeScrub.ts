/**
 * Post-GM claim scrub — soft-replace invented Proper Names without killing atmosphere.
 * Client/Warden only (not synced to edge).
 */

import type { GameState } from './types';
import { findUngroundedNamedClaims } from './suggestionValidation';

const ALWAYS_ALLOW = new Set(
  [
    'the system',
    'system',
    'earth',
    'integration',
    'foundation core',
    'first blood',
    'what do you do',
    'united kingdom',
    'england',
    'scotland',
    'wales',
    'london',
    'tesco',
    'tesco extra',
  ].map((s) => s.toLowerCase())
);

/**
 * Soft-scrub Proper Names that look invented (Title Case multi-word) when ungrounded.
 * Single-token names are left alone to avoid wrecking common words mid-sentence.
 */
export function scrubInventedProperNouns(
  narrative: string,
  state: GameState,
  establishedProse = ''
): { text: string; stripped: string[] } {
  if (!narrative?.trim()) return { text: narrative, stripped: [] };

  const interactionClaims = findUngroundedNamedClaims(narrative, state, establishedProse);
  const stripped: string[] = [...interactionClaims];
  let text = narrative;

  const grounded = buildLooseGroundSet(state, establishedProse);
  const found: string[] = [];
  const re = /\b([A-Z][\p{L}'-]{2,}(?:\s+[A-Z][\p{L}'-]{2,}){1,3})\b/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(narrative)) !== null) {
    const name = m[1]!.trim();
    const key = name.toLowerCase();
    if (ALWAYS_ALLOW.has(key)) continue;
    if (grounded.has(key)) continue;
    if (key.split(/\s+/).every((p) => ALWAYS_ALLOW.has(p))) continue;
    found.push(name);
  }

  for (const name of Array.from(new Set(found))) {
    stripped.push(name);
    text = replaceUngroundedName(text, name, guessGenericReplacement(name));
  }

  for (const claim of interactionClaims) {
    if (claim.length < 3) continue;
    const generic = /\b(chest|door|crate|cache|altar|console)\b/i.test(claim)
      ? { afterThe: 'something nearby', afterA: 'something nearby', bare: 'something nearby' }
      : /\b(creature|beast|enemy|foe|hatchling|mob)\b/i.test(claim)
        ? { afterThe: 'a nearby threat', afterA: 'a nearby threat', bare: 'a nearby threat' }
        : { afterThe: 'the speaker', afterA: 'a speaker', bare: 'the speaker' };
    text = replaceUngroundedName(text, claim, generic);
  }

  // Never leave the soft placeholder as a dialogue subject / possessive actor.
  text = scrubSomeoneNearbyActor(text);

  return { text, stripped: Array.from(new Set(stripped)) };
}

type GenericSlot = { afterThe: string; afterA: string; bare: string };

/** Prefer role slots — never "someone nearby" as a spoken name. */
function guessGenericReplacement(name: string): GenericSlot {
  if (/\b(keep|tower|fort|castle|hall|manor|estate|temple|cathedral)\b/i.test(name)) {
    return { afterThe: 'the nearby building', afterA: 'a nearby building', bare: 'a nearby building' };
  }
  if (/\b(street|road|avenue|lane|alley|plaza)\b/i.test(name)) {
    return { afterThe: 'the nearby street', afterA: 'a nearby street', bare: 'a nearby street' };
  }
  if (/\b(blade|sword|gun|rifle|staff|wand|armor|relic|artifact)\b/i.test(name)) {
    return { afterThe: 'the piece of gear', afterA: 'a piece of gear', bare: 'a piece of gear' };
  }
  if (/\b(blessing|mark|brand|sigil|seal|pact)\b/i.test(name)) {
    return { afterThe: 'the mark', afterA: 'a mark', bare: 'the mark' };
  }
  if (/\b(court|order|covenant|compact|faction|guild|circle|keepers?|warden)\b/i.test(name)) {
    return { afterThe: 'the court', afterA: 'a court', bare: 'the court' };
  }
  if (/\b(official|registrar|speaker|figure|robed)\b/i.test(name)) {
    return { afterThe: 'the official', afterA: 'an official', bare: 'the official' };
  }
  return { afterThe: 'the speaker', afterA: 'a speaker', bare: 'the speaker' };
}

/** Rewrite leftover placeholder actors into role language. */
export function scrubSomeoneNearbyActor(text: string): string {
  if (!text || !/someone nearby/i.test(text)) return text;
  return text
    .replace(/\bsomeone nearby(?:'s|’s)\b/gi, "the speaker's")
    .replace(/\bsomeone nearby\s+(does|doesn't|does not|did|said|states?|turns?|inclines?|remains?|stands?|listens?|regards?|gestures?|speaks?|asks?|replies?|nods?)\b/gi, 'the speaker $1')
    .replace(/\b(?:the\s+)?someone nearby\b/gi, 'the speaker');
}

function replaceUngroundedName(text: string, name: string, slot: GenericSlot): string {
  const e = escapeReg(name);
  return text
    .replace(new RegExp(`\\bthe\\s+${e}\\b`, 'gi'), slot.afterThe)
    .replace(new RegExp(`\\b(?:a|an)\\s+${e}\\b`, 'gi'), slot.afterA)
    .replace(new RegExp(`\\b${e}\\b`, 'g'), slot.bare);
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLooseGroundSet(state: GameState, prose: string): Set<string> {
  const set = new Set<string>(ALWAYS_ALLOW);
  const add = (raw?: string | null) => {
    if (!raw?.trim()) return;
    const n = raw.trim().toLowerCase();
    set.add(n);
    for (const part of n.split(/\s+/)) if (part.length >= 3) set.add(part);
  };
  add(state.character?.name);
  add(state.currentLocation);
  add(state.locationSheet?.name);
  add(state.previousLocationSheet?.name);
  add(state.activeDungeon?.dungeonName);
  add(state.activeEncounter?.name);
  for (const i of state.inventory ?? []) add(i.name);
  for (const c of state.companions ?? []) add(c.name);
  for (const q of state.quests ?? []) {
    if (q.revealed) add(q.name);
  }
  for (const n of state.npcMemories ?? []) add(n.npcName);
  for (const l of state.lorebook ?? []) {
    if (l.revealed !== false) add(l.name);
  }
  for (const it of state.locationSheet?.interactables ?? []) add(it.name);
  for (const node of state.activeDungeon?.nodes ?? []) {
    if (state.activeDungeon?.visitedNodeIds?.includes(node.id)) add(node.name);
  }
  const blob = `${prose}\n${(state.timeline ?? [])
    .slice(-20)
    .map((t) => t.text)
    .join('\n')}`;
  for (const hit of blob.matchAll(/\b([A-Z][\p{L}'-]{2,}(?:\s+[A-Z][\p{L}'-]{2,}){0,3})\b/gu)) {
    add(hit[1]);
  }
  return set;
}
