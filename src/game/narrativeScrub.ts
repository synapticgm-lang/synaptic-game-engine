/**
 * Post-GM claim scrub — soft-replace invented Proper Names without killing atmosphere.
 * Client/Warden only (not synced to edge).
 */

import type { GameState } from './types';
import { findUngroundedNamedClaims } from './suggestionValidation';
import { isAloneArrivalOpening } from './openingEstablishment';
import { realPresentPeople, isPolityFactionOrPlaceToken } from './chromeAuthority';
import { hubsForBibleId } from './outdoorHubs';

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

/** Prefer a grounded present *person* over the old default "the official" (matrix-40 leak).
 * Never use polity/faction/place tokens (Pellane → "the Pellane" contagion).
 */
function personSlotFromScene(state: GameState): GenericSlot {
  const present = realPresentPeople(
    (state.sceneFacts?.present ?? [])
      .map((p) => (typeof p === 'string' ? p : (p as { name?: string })?.name ?? ''))
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !/^(you|pc|player|unknown)$/i.test(s))
  ).filter((n) => !isPolityFactionOrPlaceToken(n));
  if (present[0]) {
    const n = present[0];
    // Already a "the X" role phrase — keep; never invent "the Pellane"
    if (/^the\s+/i.test(n) && !isPolityFactionOrPlaceToken(n.replace(/^the\s+/i, ''))) {
      return { afterThe: n, afterA: n.replace(/^the\s+/i, 'a '), bare: n };
    }
    if (isPolityFactionOrPlaceToken(n)) {
      return { afterThe: 'the stranger', afterA: 'a stranger', bare: 'the stranger' };
    }
    const bare = /^the\s+/i.test(n) ? n : `the ${n}`;
    return { afterThe: bare, afterA: bare.replace(/^the\s+/i, 'a '), bare };
  }
  return { afterThe: 'the stranger', afterA: 'a stranger', bare: 'the stranger' };
}


/** 29a — names that must never be replaced with mark/panel/building generics. */
export function buildProtectedEntityNames(state: GameState): Set<string> {
  const names: string[] = [];
  if (state.activeEncounter?.name) names.push(state.activeEncounter.name);
  for (const n of state.sceneFacts?.present ?? []) {
    if (typeof n === 'string') names.push(n);
  }
  for (const c of state.companions ?? []) {
    if (c?.name) names.push(c.name);
  }
  for (const i of state.inventory ?? []) {
    if (i?.name) names.push(i.name);
  }
  if (state.currentLocation) names.push(state.currentLocation);
  if (state.locationSheet?.name) names.push(state.locationSheet.name);
  for (const q of state.quests ?? []) {
    if (q?.name) names.push(q.name);
    for (const o of q?.objectives ?? []) {
      if (o?.description) names.push(o.description);
    }
  }
  names.push('Millstone Charter', 'Mask Scarf', 'Pact-Hunter', 'Keep Wraith', 'Circle Blessing');
  const set = new Set<string>();
  for (const n of names) {
    const t = (n || '').trim();
    if (t.length >= 2) set.add(t.toLowerCase());
  }
  return set;
}

function isProtectedName(name: string, protectedNames: Set<string>): boolean {
  const lower = name.toLowerCase().trim();
  if (protectedNames.has(lower)) return true;
  for (const p of protectedNames) {
    if (p.length >= 3 && (lower.includes(p) || p.includes(lower))) return true;
  }
  return false;
}

function guessGenericReplacement(name: string, state: GameState): GenericSlot {
  const protectedNames = buildProtectedEntityNames(state);
  if (isProtectedName(name, protectedNames)) {
    const bare = /^the\s+/i.test(name.trim()) ? name.trim() : `the ${name.trim()}`;
    return { afterThe: bare, afterA: bare.replace(/^the\s+/i, 'a '), bare };
  }

  if (/\b(keep|tower|fort|castle|hall|manor|estate|temple|cathedral)\b/i.test(name)) {
    // Prefer the live location name over opaque "this place".
    if (atNamedInterior(state)) {
      const loc = (state.currentLocation ?? '').trim();
      if (loc.length >= 2) {
        const bare = /^the\s+/i.test(loc) ? loc : `the ${loc}`;
        return { afterThe: bare, afterA: bare.replace(/^the\s+/i, 'a '), bare };
      }
      return { afterThe: 'the building', afterA: 'a building', bare: 'the building' };
    }
    {
      const loc = (state.currentLocation ?? '').trim();
      if (loc.length >= 2) {
        const bare = /^the\s+/i.test(loc) ? loc : `the ${loc}`;
        return { afterThe: bare, afterA: bare.replace(/^the\s+/i, 'a '), bare };
      }
      return { afterThe: 'the building', afterA: 'a building', bare: 'the building' };
    }
  }
  if (/\b(street|road|avenue|lane|alley|plaza)\b/i.test(name)) {
    return { afterThe: 'the nearby street', afterA: 'a nearby street', bare: 'a nearby street' };
  }
  if (/\b(blade|sword|gun|rifle|staff|wand|armor|relic|artifact)\b/i.test(name)) {
    return { afterThe: 'the piece of gear', afterA: 'a piece of gear', bare: 'a piece of gear' };
  }
  if (/\b(blessing|mark|brand|sigil|seal|pact)\b/i.test(name)) {
    {
      return { afterThe: 'the sign', afterA: 'a sign', bare: 'the sign' };
    }
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
 * Never rewrite REGISTRATION / STATUS chrome fields (Batch B — the Pellane: spam).
 */
function dropPlaceholderActorClauses(text: string): string {
  return text
    .replace(/\b(?:the|an) official(?:'s|’s)?\b/gi, '')
    .replace(/\bthe king(?:'s|’s)?\b/gi, '')
    .replace(/\b(?:a|the) (?:lone )?figure\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/^[,\s]+/gm, '')
    .replace(/\(\s*\)/g, '')
    .trim();
}

/**
 * Allowlist-only: official / King / figure may become a *real present person*.
 * Never map them onto the blue panel. If no person, drop the clause.
 */
export function scrubOfficialPlaceholder(text: string, state: GameState): string {
  if (!text) return text;
  if (!/\bthe official\b|\ban official\b|\bthe king\b|\ba figure\b|\bthe figure\b/i.test(text)) {
    return scrubPolityBleedInChrome(text);
  }
  const groundedOfficial =
    /\b(official|registrar|clerk|envoy|taxman|alderman)\b/i.test(
      [
        ...realPresentPeople(
          (state.sceneFacts?.present ?? []).map((p) =>
            typeof p === 'string' ? p : (p as { name?: string })?.name ?? ''
          )
        ),
        state.sceneFacts?.lastBeat ?? '',
      ].join(' ')
    );
  if (groundedOfficial && /\bthe official\b|\ban official\b/i.test(text)) {
    return scrubPolityBleedInChrome(text);
  }
  const people = realPresentPeople(
    (state.sceneFacts?.present ?? []).map((p) =>
      typeof p === 'string' ? p : (p as { name?: string })?.name ?? ''
    )
  ).filter((n) => !isPolityFactionOrPlaceToken(n));
  const person = people[0];
  if (!person) {
    return withProtectedChromeBlocks(text, dropPlaceholderActorClauses);
  }
  const the = /^the\s+/i.test(person) ? person : `the ${person}`;
  const a = the.replace(/^the\s+/i, 'a ');
  const poss = `${the}'s`;
  return withProtectedChromeBlocks(text, (body) =>
    body
      .replace(/\bthe official(?:'s|’s)\b/gi, poss)
      .replace(/\ban official\b/gi, a)
      .replace(/\bthe official\b/gi, the)
      .replace(/\bthe king(?:'s|’s)\b/gi, poss)
      .replace(/\bthe king\b/gi, the)
      .replace(/\b(?:a|the) (?:lone )?figure\b/gi, the)
  );
}

/** Run a rewrite on prose while freezing REGISTRATION / STATUS chrome blocks. */
export function withProtectedChromeBlocks(text: string, rewrite: (body: string) => string): string {
  const blocks: string[] = [];
  const masked = text.replace(
    /((?:^|\n)\s*(?:REGISTRATION|STATUS)\b[\s\S]*?)(?=(?:\n\s*\n)|$)/gi,
    (m) => {
      const i = blocks.length;
      blocks.push(m);
      return `\n\u0000CHROME${i}\u0000`;
    }
  );
  let out = rewrite(masked);
  out = out.replace(/\u0000CHROME(\d+)\u0000/g, (_, i) => blocks[Number(i)] ?? '');
  return scrubPolityBleedInChrome(out);
}

/**
 * Heal "the Pellane: the Pellane:" field-label contagion inside REGISTRATION / STATUS chrome.
 * Does not invent person slots — only strips polity tokens used as chrome labels.
 */
export function scrubPolityBleedInChrome(text: string): string {
  if (!text || !/\b(REGISTRATION|STATUS)\b/i.test(text)) return text;
  let next = text.replace(
    /(REGISTRATION\s*[—\-–:]?\s*)(?:(?:the\s+)?(?:Pellane|Lowmarket|Valespire|Ash Court)\s*:?\s*)+/gi,
    'REGISTRATION — '
  );
  next = next.replace(
    /(STATUS\s*[—\-–:]?\s*)(?:(?:the\s+)?(?:Pellane|Lowmarket|Valespire|Ash Court)\s*:?\s*)+/gi,
    'STATUS — '
  );
  next = next.replace(/\[\s*the\s+sign\s*\]/gi, '[Mark]');
  next = next.replace(/\bthe\s+(?:Pellane|Lowmarket|Valespire|Ash Court)\s*:/gi, '');
  return next.replace(/[ \t]{2,}/g, ' ');
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
  if (state.campaignBibleId) {
    try {
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
