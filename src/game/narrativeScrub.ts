/**
 * Post-GM claim scrub — soft-replace invented Proper Names without killing atmosphere.
 * Client/Warden only (not synced to edge).
 */

import type { GameState } from './types';
import { findUngroundedNamedClaims } from './suggestionValidation';
import { isAloneArrivalOpening } from './openingEstablishment';

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
    text = replaceUngroundedName(text, name, guessGenericReplacement(name, state));
  }

  const alone = isAloneArrivalOpening(state);
  for (const claim of interactionClaims) {
    if (claim.length < 3) continue;
    // Never scrub the grounded PC name into a role slot.
    const pc = (state.character?.name ?? '').trim().toLowerCase();
    if (pc && claim.toLowerCase() === pc) continue;
    const generic = /\b(chest|door|crate|cache|altar|console|panel|window)\b/i.test(claim)
      ? { afterThe: 'something nearby', afterA: 'something nearby', bare: 'something nearby' }
      : /\b(creature|beast|enemy|foe|hatchling|mob)\b/i.test(claim)
        ? { afterThe: 'a nearby threat', afterA: 'a nearby threat', bare: 'a nearby threat' }
        : alone
          ? { afterThe: 'the panel', afterA: 'a panel glow', bare: 'the panel' }
          : personSlotFromScene(state);
    text = replaceUngroundedName(text, claim, generic);
  }

  // Never leave soft placeholders as dialogue subjects / room furniture.
  text = scrubSomeoneNearbyActor(text, alone);
  text = scrubSpeakerLeak(text, state);
  text = scrubOfficialPlaceholder(text, state);

  return { text, stripped: Array.from(new Set(stripped)) };
}

type GenericSlot = { afterThe: string; afterA: string; bare: string };

/** Prefer role slots — never "someone nearby" as a spoken name. */
function atNamedInterior(state: GameState): boolean {
  const here = `${state.currentLocation ?? ''} ${state.locationSheet?.name ?? ''}`;
  return /\b(cathedral|circle|court|vault|chapel|nave|undercroft|palace|temple|keep|castle|inn|hall|chamber)\b/i.test(
    here
  );
}

/** Prefer a grounded present role over the old default "the official" (matrix-40 leak). */
function personSlotFromScene(state: GameState): GenericSlot {
  const present = (state.sceneFacts?.present ?? [])
    .map((p) => (typeof p === 'string' ? p : (p as { name?: string })?.name ?? ''))
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && !/^(you|pc|player|unknown)$/i.test(s));
  if (present[0]) {
    const n = present[0];
    const bare = /^the\s+/i.test(n) ? n : `the ${n}`;
    return { afterThe: bare, afterA: bare.replace(/^the\s+/i, 'a '), bare };
  }
  return { afterThe: 'the stranger', afterA: 'a stranger', bare: 'the stranger' };
}

function guessGenericReplacement(name: string, state: GameState): GenericSlot {
  if (/\b(keep|tower|fort|castle|hall|manor|estate|temple|cathedral)\b/i.test(name)) {
    // "Nearby" is for things that are not here — do not relocate the current interior.
    if (atNamedInterior(state)) {
      return { afterThe: 'this place', afterA: 'this place', bare: 'this place' };
    }
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
    if (isAloneArrivalOpening(state)) {
      return { afterThe: 'the panel', afterA: 'a panel', bare: 'the panel' };
    }
    return personSlotFromScene(state);
  }
  if (isAloneArrivalOpening(state)) {
    return { afterThe: 'the panel', afterA: 'a panel', bare: 'the panel' };
  }
  return personSlotFromScene(state);
}

/** Rewrite leftover placeholder actors into role language. */
export function scrubSomeoneNearbyActor(text: string, alone = false): string {
  if (!text || !/someone nearby/i.test(text)) return text;
  const role = alone ? 'the panel' : 'the stranger';
  const rolePoss = alone ? "the panel's" : "the stranger's";
  return text
    .replace(/\bsomeone nearby(?:'s|’s)\b/gi, rolePoss)
    .replace(/\bsomeone nearby\s+(does|doesn't|does not|did|said|states?|turns?|inclines?|remains?|stands?|listens?|regards?|gestures?|speaks?|asks?|replies?|nods?)\b/gi, `${role} $1`)
    .replace(/\b(?:the\s+)?someone nearby\b/gi, role);
}

/**
 * "the official" was the default invented-name slot and leaked into prose + choice pads (~329 matrix hits).
 * Keep it only when the scene already has an official/registrar; else → stranger / panel / grounded present.
 */
export function scrubOfficialPlaceholder(text: string, state: GameState): string {
  if (!text || !/\bthe official\b|\ban official\b/i.test(text)) return text;
  const grounded =
    /\b(official|registrar|clerk|envoy|taxman|alderman)\b/i.test(
      [
        ...(state.sceneFacts?.present ?? []).map((p) =>
          typeof p === 'string' ? p : (p as { name?: string })?.name ?? ''
        ),
        state.sceneFacts?.lastBeat ?? '',
        ...(state.sceneFacts?.props ?? []),
      ].join(' ')
    );
  if (grounded) return text;
  const alone = isAloneArrivalOpening(state);
  const slot = alone
    ? { the: 'the panel', a: 'a panel', poss: "the panel's" }
    : (() => {
        const s = personSlotFromScene(state);
        return {
          the: s.afterThe,
          a: s.afterA,
          poss: s.afterThe.replace(/\bthe\b/i, "the") + "'s",
        };
      })();
  return text
    .replace(/\bthe official(?:'s|’s)\b/gi, slot.poss)
    .replace(/\ban official\b/gi, slot.a)
    .replace(/\bthe official\b/gi, slot.the);
}

/**
 * Kill leaked "the speaker" in room furniture / System Name lines.
 * Alone scenes must never invent a speaker as PC/System chrome.
 */
export function scrubSpeakerLeak(text: string, state: GameState): string {
  if (!text || !/\bthe speaker\b/i.test(text)) return text;
  const alone = isAloneArrivalOpening(state);
  const pc = (state.character?.name ?? '').trim();
  const nameForSystem =
    pc && !/^(unknown|adventurer|hero)$/i.test(pc) ? pc : 'you';
  let next = text;
  // "gapes open the speaker" / "onto the speaker" furniture mangling
  next = next.replace(/\bgapes?\s+open(?:\s+onto)?\s+the speaker\b/gi, 'gapes open');
  next = next.replace(/\bopen(?:s|ed|ing)?\s+(?:onto\s+)?the speaker\b/gi, 'open');
  if (alone || /<system[\s>]/i.test(text)) {
    next = next.replace(
      /((?:^|\n)\s*[—\-–]?\s*)the speaker(\s*[—\-–]?\s*(?:\n|$))/gi,
      `$1${nameForSystem}$2`
    );
    next = next.replace(/\bName:\s*the speaker\b/gi, `Name: ${nameForSystem}`);
    next = next.replace(/\[the speaker\]/gi, `[${nameForSystem}]`);
    next = next.replace(/\bthe speaker:\s*/gi, `${nameForSystem}: `);
  }
  if (alone) {
    next = next.replace(/\bthe speaker\b/gi, 'the panel');
    next = next.replace(/\ba speaker\b/gi, 'a panel');
  }
  return next;
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
  // P1-6: Hub authority whitelist — never scrub known hub names
  // (Import at top of file needed for hubsForBibleId)
  if (state.campaignBibleId) {
    try {
      const { hubsForBibleId } = require('./outdoorHubs');
      const hubs = hubsForBibleId(state.campaignBibleId);
      for (const hub of hubs) {
        add(hub.name);
        for (const alias of hub.aliases ?? []) add(alias);
      }
    } catch {
      // hubsForBibleId may not be available in all contexts
    }
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
