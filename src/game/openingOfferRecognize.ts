/**
 * Opening offer accept/refuse recognition from tagged pads, chip identity,
 * and the minted accept/refuse persona — not only "take the kit" / "accept".
 */
import type { GameState } from './types';

const KEEP_OWN_KIT =
  /\bkeep your own(?:\s+earth)?\s+kit\b|\bkeep your kit\b|\bkeep your own(?:\s+earth)?\s+(?:gear|clothes)\b/i;

const ACCEPT_PERSONA_VERBS =
  /\b(?:walk with|go with|stay for|follow|join|help|take)\b/i;

const CLASSIC_ACCEPT = (
  /\b(?:i )?(?:agree|accept)\b/i.source
  + '|' + /\bi(?:'ll| will) (?:work|help|take|do)\b/i.source
  + '|' + /\bgive me the (?:kit|lamp|tabard|gloves|work)\b/i.source
  + '|' + /\byes to the work\b/i.source
  + '|' + /\btake the (?:deal|kit|offer|work|lamp)\b/i.source
);
const CLASSIC_ACCEPT_RE = new RegExp(CLASSIC_ACCEPT, 'i');

const CLASSIC_REFUSE = /^(?:i\s+)?(?:refuse|decline|turn down|say no to)\b/i;
const OFFER_NOUN = /\b(?:work|job|offer|kit|deal|cots|terms)\b/i;

function norm(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function words(s: string): string[] {
  return norm(s).toLowerCase().split(' ').filter(Boolean);
}

function givenName(name: string): string {
  const t = (name ?? '').replace(/^(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Sergeant|High Chanter|Priest|Priestess)\s+/i, '').trim();
  return t.split(/\s+/)[0] ?? '';
}

function mentionsPerson(text: string, name: string): boolean {
  const n = (name ?? '').trim();
  if (!n) return false;
  const hay = norm(text);
  if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay)) return true;
  const given = givenName(n);
  return given.length >= 2 && new RegExp(`\\b${given.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay);
}

/** Order-preserving word match so a short chip ("Walk with Wenna for water") hits the full pad. */
export function openingOfferPadIdentityMatch(input: string, label: string): boolean {
  const a = words(input);
  const b = words(label);
  if (!a.length || !b.length) return false;
  if (a.join(' ') === b.join(' ')) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length < 3) return false;
  let i = 0;
  for (const w of long) {
    if (w === short[i]) i += 1;
    if (i === short.length) return true;
  }
  return false;
}

function classicAccept(raw: string): boolean {
  const t = norm(raw);
  return !!t && CLASSIC_ACCEPT_RE.test(t);
}

function classicRefuse(raw: string): boolean {
  const t = norm(raw);
  return !!t && CLASSIC_REFUSE.test(t) && OFFER_NOUN.test(t);
}

function keepOwnKit(raw: string): boolean {
  return KEEP_OWN_KIT.test(norm(raw));
}

function mintedCastNames(state: GameState): string[] {
  return (state.openingEstablishment?.instance?.cast ?? []).map((c) => c.name).filter(Boolean);
}

function instanceChips(state: GameState, kind: 'accept' | 'refuse'): string[] {
  return (state.openingEstablishment?.instance?.offerChips ?? [])
    .filter((c) => c.kind === kind)
    .map((c) => c.label)
    .filter(Boolean);
}

function taggedPads(state: GameState, kind: 'accept' | 'refuse'): string[] {
  return (state.openingEstablishment?.offerPadKinds ?? [])
    .filter((p) => p.kind === kind)
    .map((p) => p.label)
    .filter(Boolean);
}

function matchesAnyPad(input: string, labels: string[]): boolean {
  return labels.some((label) => openingOfferPadIdentityMatch(input, label));
}

function personaAccept(state: GameState, raw: string): boolean {
  const t = norm(raw);
  if (!t || !ACCEPT_PERSONA_VERBS.test(t)) return false;
  return mintedCastNames(state).some((n) => mentionsPerson(t, n));
}

/**
 * Classify a page-1 / later-turn line as accepting or refusing the opening offer.
 * Refuse is decided first so "Keep your own kit" (and "stay with both") stays refuse.
 */
export function classifyOpeningOfferInput(state: GameState, raw: string): 'accept' | 'refuse' | 'none' {
  const t = norm(raw);
  if (!t) return 'none';
  if (keepOwnKit(t) || matchesAnyPad(t, taggedPads(state, 'refuse')) || matchesAnyPad(t, instanceChips(state, 'refuse')) || classicRefuse(t)) {
    return 'refuse';
  }
  if (matchesAnyPad(t, taggedPads(state, 'accept')) || matchesAnyPad(t, instanceChips(state, 'accept')) || classicAccept(t) || personaAccept(state, t)) {
    return 'accept';
  }
  return 'none';
}

/** Tag shaped pads so later clicks use chip identity, not a brittle phrase list. */
export function tagOpeningOfferPads(
  state: GameState,
  pads: string[],
): Array<{ label: string; kind: 'accept' | 'refuse' }> {
  const inst = state.openingEstablishment?.instance;
  const out: Array<{ label: string; kind: 'accept' | 'refuse' }> = [];
  const seen = new Set<string>();
  for (const pad of pads) {
    const label = norm(pad);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    // Tag from instance chips and persona/classic rules, not from already-stored tags
    // (those are what we are writing).
    const stale = state.openingEstablishment;
    const kind = classifyOpeningOfferInput(
      stale ? { ...state, openingEstablishment: { ...stale, offerPadKinds: undefined } } : state,
      label,
    );
    if (kind === 'none') {
      // Hear <lead> out is a common accept chip the persona-verb list does not cover.
      const lead = inst?.cast[0]?.name;
      if (lead && /^hear\b/i.test(label) && mentionsPerson(label, lead)) {
        seen.add(key);
        out.push({ label, kind: 'accept' });
      }
      continue;
    }
    seen.add(key);
    out.push({ label, kind });
  }
  return out;
}
