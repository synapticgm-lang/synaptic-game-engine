/**
 * Live AI opening (non-PYOA): commit structured writer output, derive journal/rite,
 * shape concrete offer chips, never fall back to authored page 1.
 * Fail only on throw / empty / unparseable / leaked JSON structure — no prose quality gates.
 */
import type { GameState, Quest, Settings } from './types';
import { openingInstanceOf, givenNameOf, escapeRe } from './openingInstance';
import { isCampaignHubToken } from './outdoorHubs';
import { tagOpeningOfferPads } from './openingOfferRecognize';
import {
  formatOpeningWriterNotes,
  isCommonOpeningLexeme,
  openingChoiceCount,
  openingProseLeaksStructuredJson,
  readOpeningStructuredOutput,
  retiredNameNeedles,
  rewriteOpeningMarkup,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
} from './openingWriterNotes';

export { openingProseLeaksStructuredJson };

export { formatOpeningWriterNotes, openingChoiceCount, STORYTELLER_RETRY_CHIP, STORYTELLER_RETRY_MESSAGE };

export type LiveOpeningWriter = (state: GameState, playerInput: string, settings: Settings) => Promise<string>;

export interface LiveOpeningSuccess {
  ok: true;
  prose: string;
  retried: boolean;
  pads: string[];
  journal: DerivedOpeningJournal;
  rite: DerivedOpeningRite;
}

export interface LiveOpeningFailure {
  ok: false;
  error: string;
  pads: string[];
}

export type LiveOpeningResult = LiveOpeningSuccess | LiveOpeningFailure;

export interface DerivedOpeningJournal {
  title: string;
  description: string;
  objectives: string[];
}

export interface DerivedOpeningRite {
  giverName: string;
  riteTitle: string;
  offerSentence: string;
  acceptChip: string;
  refuseChip: string;
}

let testWriter: LiveOpeningWriter | null = null;

export function setLiveOpeningWriterForTests(writer: LiveOpeningWriter | null): void {
  testWriter = writer;
}

export function isVitestEnv(): boolean {
  try {
    if (typeof process !== 'undefined' && (process.env?.VITEST || process.env?.VITEST_WORKER_ID)) return true;
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string; VITEST?: boolean } }).env?.VITEST) {
      return true;
    }
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string } }).env?.MODE === 'test') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Person names match the full name, or the first or last name on its own. */
export function mentionsName(text: string, name: string): boolean {
  const parts = [name, ...name.split(/\s+/).filter((p) => p.length >= 2 && !isCommonOpeningLexeme(p))];
  return parts.some((p) => new RegExp(`\\b${escapeRe(p)}\\b`, 'i').test(text));
}

/** Distinctive tokens of a minted place — never a generic suffix such as Trail or Crossing. */
export function distinctivePlaceTokens(placeName: string): string[] {
  return (placeName ?? '')
    .split(/\s+/)
    .map((p) => p.replace(/['’]s$/i, ''))
    .filter((p) => p.length >= 4 && !isCommonOpeningLexeme(p));
}

/**
 * Required places match the full minted name (case-insensitive), or a distinctive
 * non-generic token (for example "Vossleigh" from "Vossleigh Crossing").
 * A generic suffix alone (Trail, Road, Hollow, Crossing) is not enough.
 */
export function mentionsPlaceName(text: string, placeName: string): boolean {
  const place = (placeName ?? '').trim();
  if (!place) return false;
  if (new RegExp(`\\b${escapeRe(place)}\\b`, 'i').test(text)) return true;
  return distinctivePlaceTokens(place).some((p) => new RegExp(`\\b${escapeRe(p)}\\b`, 'i').test(text));
}

function lockedPlaceNames(state: GameState): string[] {
  const inst = openingInstanceOf(state);
  return [inst?.placeName, inst?.settlementName, inst?.nearbyLandmark].filter(Boolean) as string[];
}

/** Resolve a label to a locked place (full name or distinctive token), if it is one. */
function lockedPlaceFor(state: GameState, name: string): string | undefined {
  const key = (name ?? '').trim().toLowerCase();
  if (!key) return undefined;
  for (const place of lockedPlaceNames(state)) {
    if (place.toLowerCase() === key) return place;
    if (distinctivePlaceTokens(place).some((t) => t.toLowerCase() === key)) return place;
  }
  return undefined;
}

function mentionsOpeningName(state: GameState, text: string, name: string): boolean {
  const place = lockedPlaceFor(state, name);
  if (place) return mentionsPlaceName(text, place);
  return mentionsName(text, name);
}

/** Deterministic mock used in unit tests so CI never hits the network. */
export function mockLiveOpeningProse(state: GameState): string {
  const inst = openingInstanceOf(state);
  const place = inst?.placeName || state.currentLocation || 'the opening place';
  const lead = inst?.cast[0];
  const second = inst?.cast[1];
  const offer = inst?.offerSummary || inst?.offerChips.find((c) => c.kind === 'accept')?.note || 'an offer already on the table';
  const people = lead
    ? second
      ? `${lead.name} is already in motion, and ${second.name} has not looked away.`
      : `${lead.name} is already in motion and has not looked away.`
    : 'The place is quiet enough that you can hear your own breath.';
  const offerLine = lead
    ? `The offer is plain: ${offer}. You can take it, or you can keep your own kit.`
    : `Nothing has been pressed into your hands. ${offer}`;
  return [
    `${place} is already under you, named and ordinary, not a blur.`,
    people,
    inst?.pressing ? inst.pressing : 'Whatever pulled you here has not finished with you.',
    offerLine,
    inst?.how ? inst.how : 'You have not yet decided which way to move.',
  ]
    .filter(Boolean)
    .join(' ');
}

const PAD_ITEM_NOUNS = /^(?:kit|crates?|loft|scarf|waterskin|skin|brand-?iron|iron|hunt|cloak|coat|bread|blanket|water|pact|contract|work|job|dock)$/i;
const PAD_STOP_WORDS = /^(?:with|from|your|their|this|that|keep|take|walk|hear|offer|own|the|and|for|you|a|an)$/i;

/** Item nouns named by an accept chip (kit, crate, scarf, …) that the page-1 prose must mention. */
function acceptChipItemNouns(label: string): string[] {
  return (label ?? '')
    .split(/\s+/)
    .map((w) => w.replace(/['’]s$/i, '').replace(/[^A-Za-z-]/g, ''))
    .filter((w) => PAD_ITEM_NOUNS.test(w));
}

function chipFollowsProse(label: string, prose: string, kind?: 'accept' | 'refuse' | 'alt'): boolean {
  if (kind === 'refuse') return true;
  const missingItem = acceptChipItemNouns(label).some(
    (w) => !new RegExp(`\\b${escapeRe(w)}s?\\b`, 'i').test(prose)
  );
  if (missingItem) return false;
  const words = label.split(/\s+/).filter((w) => w.length >= 4 && !PAD_STOP_WORDS.test(w));
  if (!words.length) return acceptChipItemNouns(label).length === 0 || !missingItem;
  return words.some((w) => new RegExp(`\\b${escapeRe(w.replace(/'s$/, ''))}\\b`, 'i').test(prose));
}

const OPTION_STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'for', 'from', 'with', 'your', 'you', 'own', 'about', 'what',
  'around', 'first', 'into', 'onto', 'over', 'under', 'this', 'that', 'their', 'them', 'then',
]);

const INSPECT_VERBS = /^(look|study|inspect|examine|search|scout)\b/i;

function optionContentWords(label: string): string[] {
  return (label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !OPTION_STOP.has(w));
}

/** True when two pads are the same action or share too many normalised content words. */
export function optionsAreNearDuplicates(a: string, b: string): boolean {
  const ta = (a ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const tb = (b ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!ta || !tb) return false;
  if (ta === tb) return true;
  const wa = optionContentWords(ta);
  const wb = optionContentWords(tb);
  if (!wa.length || !wb.length) return false;
  const sb = new Set(wb);
  const inter = wa.filter((w) => sb.has(w));
  const union = new Set([...wa, ...wb]);
  if (inter.length / union.size >= 0.45) return true;
  if (inter.length >= 2 && inter.length / Math.min(new Set(wa).size, new Set(wb).size) >= 0.7) return true;
  if (INSPECT_VERBS.test(ta) && INSPECT_VERBS.test(tb)) {
    const drop = /^(look|study|inspect|examine|search|scout|around|immediate|ground)$/;
    const pa = wa.filter((w) => !drop.test(w));
    const pb = wb.filter((w) => !drop.test(w));
    if (!pa.length || !pb.length) return true;
    if (pa.some((w) => pb.includes(w))) return true;
  }
  return false;
}
const SUBORDINATORS = /^(?:after|before|when|while|because|as|if|though|although|until|unless|since|once|whereas|whilst)$/i;
const COORDINATORS = /^(?:and|but|then|or)$/i;

/** The clause immediately containing a pronoun, starting after the nearest coordinator or subordinator. */
function clauseAround(sentence: string, index: number): { intro: string; body: string } {
  const before = sentence.slice(0, index);
  const split = before.split(/\b((?:after|before|when|while|because|as|if|though|although|until|unless|since|once|whereas|whilst|and|but|then|or)\s+)/i);
  if (split.length === 1) return { intro: '', body: sentence };
  const intro = (split[split.length - 2] ?? '').trim();
  const body = (split[split.length - 1] ?? '') + sentence.slice(index);
  return { intro, body };
}

/**
 * Gender the prose actually assigns to this person.
 * Only sentences that name them and do not also name another proper person are used.
 * A pronoun is accepted only when it is the grammatical subject straight after the
 * name's own clause, or when the sentence has no other possible referent.
 * "Nell took the scarf after he tossed it" does not make Nell a "he".
 */
export function prosePronounForName(prose: string, name: string): 'he' | 'she' | 'unknown' {
  const given = givenNameOf(name);
  const nameRe = new RegExp(`\\b${escapeRe(name)}\\b|\\b${escapeRe(given)}\\b`, 'i');
  const sentences = (prose ?? '').split(/(?<=[.!?])(?:\s+|$)/).map((s) => s.trim()).filter(Boolean);
  const hits = sentences.filter((s) => nameRe.test(s));
  const exclusive = hits.filter((s) => {
    const spans = s.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) ?? [];
    return !spans.some((span) => {
      if (nameRe.test(span)) return false;
      if (/^(The|A|An|You|Your|They|This|That|Here|There|Then|And|But|With|From|Into)$/.test(span)) return false;
      if (isCommonOpeningLexeme(span) || INSPECT_VERBS.test(span)) return false;
      return true;
    });
  });
  const licensed: string[] = [];
  for (const sentence of exclusive) {
    const re = /\b(he|him|his|she|her|hers)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sentence))) {
      const { intro, body } = clauseAround(sentence, m.index);
      const introWord = intro.replace(/\s+/g, ' ').trim().replace(/[,:;]+$/, '');
      if (SUBORDINATORS.test(introWord)) continue;
      const clauseHasName = nameRe.test(body) || (!introWord && nameRe.test(sentence));
      const continuesNameClause = COORDINATORS.test(introWord) && nameRe.test(sentence.slice(0, m.index));
      if (!clauseHasName && !continuesNameClause) continue;
      licensed.push(m[0]);
    }
  }
  const blob = licensed.join(' ');
  if (!blob) return 'unknown';
  const he = /\b(?:he|him|his)\b/i.test(blob);
  const she = /\b(?:she|her|hers)\b/i.test(blob);
  if (he && !she) return 'he';
  if (she && !he) return 'she';
  return 'unknown';
}

export function optionPronounErrors(
  label: string,
  prose: string,
  names: string[],
  state?: GameState
): string[] {
  const errors: string[] = [];
  const he = /\b(?:he's|he is|he was|what he's)\b/i.test(label) || /\bwhat he\b/i.test(label);
  const she = /\b(?:she's|she is|she was|what she's)\b/i.test(label) || /\bwhat she\b/i.test(label);
  if (!he && !she) return errors;
  const mentioned = names.filter((n) => mentionsName(label, n));
  const target = mentioned[0];
  if (!target) {
    errors.push(`option uses a pronoun without a named person: ${label}`);
    return errors;
  }
  let g = prosePronounForName(prose, target);
  if (g === 'unknown' && state) {
    const member = openingInstanceOf(state)?.cast.find((c) => mentionsName(target, c.name) || mentionsName(c.name, target));
    if (member?.gender === 'male') g = 'he';
    if (member?.gender === 'female') g = 'she';
  }
  if (he && g !== 'he') errors.push(`option pronoun does not match the prose for ${givenNameOf(target)}: ${label}`);
  if (she && g !== 'she') errors.push(`option pronoun does not match the prose for ${givenNameOf(target)}: ${label}`);
  return errors;
}

function knownOpeningNames(state: GameState): string[] {
  const inst = openingInstanceOf(state);
  return [
    inst?.placeName,
    inst?.settlementName,
    inst?.factionName,
    inst?.nearbyLandmark,
    ...(inst?.cast ?? []).map((c) => c.name),
    ...(inst?.cast ?? []).map((c) => givenNameOf(c.name)),
  ].filter(Boolean) as string[];
}

function optionNameMayMissProse(state: GameState, name: string): boolean {
  if (isCampaignHubToken(name, state.campaignBibleId)) return true;
  const landmark = openingInstanceOf(state)?.nearbyLandmark?.trim();
  if (!landmark) return false;
  return mentionsPlaceName(name, landmark) || mentionsName(name, landmark) || mentionsPlaceName(landmark, name);
}

function properNamesInOption(label: string, state: GameState): string[] {
  const known = knownOpeningNames(state);
  const found: string[] = [];
  for (const n of known) {
    if (mentionsOpeningName(state, label, n) && !found.some((f) => f.toLowerCase() === n.toLowerCase())) found.push(n);
  }
  const leadingVerb = /^(Ask|Walk|Take|Hear|Keep|Look|Wait|Stand|Watch|Study|Accept|Refuse|Give|Offer|Stay|Step|Tell|Say|Cross|Join|Check|Speak|Head|Show|Go|Come|Follow|Leave|Enter|Open|Bring|Find|Call|Listen|Hold|Run|Hide|Move|Turn|Point)\s+/i;
  const spans = label.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) ?? [];
  for (const raw of spans) {
    const span = raw.replace(leadingVerb, '').trim();
    if (!span) continue;
    if (isCommonOpeningLexeme(span) || INSPECT_VERBS.test(span)) continue;
    if (/^(Ask|Walk|Take|Hear|Keep|Look|Wait|Stand|Watch|Study|Accept|Refuse|Give|Offer|Stay|Step|Tell|Say|Cross|Join|Check|Speak|Head|Show|Go|Come|Follow|Leave|Enter|Open|Bring|Find|Call|Listen|Hold|Run|Hide|Move|Turn|Point)$/i.test(span)) continue;
    if (span.split(/\s+/).every((w) => isCommonOpeningLexeme(w) || INSPECT_VERBS.test(w))) continue;
    if (found.some((f) => f.toLowerCase() === span.toLowerCase() || f.toLowerCase().includes(span.toLowerCase()))) continue;
    found.push(span);
  }
  return found;
}

export function validateOpeningOptions(state: GameState, prose: string, options: string[]): string[] {
  const errors: string[] = [];
  const n = openingChoiceCount(state);
  const labels = (options ?? []).map((s) => (s ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (labels.length !== n) errors.push(`need exactly ${n} options`);
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      if (optionsAreNearDuplicates(labels[i]!, labels[j]!)) {
        errors.push(`near-duplicate options: ${labels[i]} / ${labels[j]}`);
      }
    }
  }
  const inst = openingInstanceOf(state);
  const names = knownOpeningNames(state);
  for (const label of labels) {
    for (const r of inst?.retiredNames ?? []) {
      const needles = retiredNameNeedles(r);
      if (needles.some((w) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(label))) {
        errors.push(`retired name ${r} in option: ${label}`);
      }
    }
    for (const name of properNamesInOption(label, state)) {
      if (!mentionsOpeningName(state, prose, name) && !optionNameMayMissProse(state, name)) {
        errors.push(`option names ${name}, which is not in the prose`);
      }
    }
    errors.push(...optionPronounErrors(label, prose, names, state));
    const member = inst?.cast.find((c) => mentionsName(label, c.name));
    if (member?.gender) {
      const heOpt = /\b(?:he is|he was|he's|what he's)\b/i.test(label) || /\bwhat he\b/i.test(label);
      const sheOpt = /\b(?:she is|she was|she's|what she's)\b/i.test(label) || /\bwhat she\b/i.test(label);
      if (heOpt && member.gender !== 'male') errors.push(`option pronoun does not match minted gender for ${member.name}: ${label}`);
      if (sheOpt && member.gender !== 'female') errors.push(`option pronoun does not match minted gender for ${member.name}: ${label}`);
    }
  }
  return errors;
}

export function validateOpeningJournalTitle(state: GameState, title: string): string[] {
  const errors: string[] = [];
  const t = (title ?? '').replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');
  if (!t) {
    errors.push('missing journal title');
    return errors;
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 8) errors.push('journal title longer than 8 words');
  if (/^(?:the|a|an|and|or|of|to|for|from|with|on|at|in|is|are|was|were)$/i.test(words[words.length - 1] ?? '')) {
    errors.push('journal title is a clipped mid-sentence');
  }
  if (/\b(?:offer|contract)\b/i.test(t) && words.length >= 6) {
    errors.push('journal title is a clipped mid-sentence');
  }
  if (isCommaSeparatedProperNounList(t, state)) {
    errors.push('journal title is a list of names and places');
  }
  const inst = openingInstanceOf(state);
  for (const r of inst?.retiredNames ?? []) {
    const needles = retiredNameNeedles(r);
    if (needles.some((w) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(t))) {
      errors.push(`retired name ${r} in journal title`);
    }
  }
  return errors;
}

const TITLE_FUNCTION_WORDS = /^(?:the|a|an|and|or|of|to|for|from|with|on|at|in|into|by|as|after|before|their|them|his|her|its|dark|light|over|under|upon|what|who|when|how|why)$/i;

function isLockedTitlePart(state: GameState, part: string): boolean {
  const inst = openingInstanceOf(state);
  if (!inst) return false;
  if (lockedPlaceFor(state, part) || (inst.placeName && mentionsPlaceName(part, inst.placeName))) return true;
  if (inst.settlementName && mentionsPlaceName(part, inst.settlementName)) return true;
  if (inst.nearbyLandmark && mentionsPlaceName(part, inst.nearbyLandmark)) return true;
  if (inst.factionName && mentionsName(part, inst.factionName)) return true;
  return (inst.cast ?? []).some((c) => mentionsName(part, c.name));
}

function isBareProperListItem(part: string): boolean {
  const words = part.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 2) return false;
  if (words.some((w) => TITLE_FUNCTION_WORDS.test(w))) return false;
  return words.every((w) => /^[A-Z][A-Za-z'’-]*$/.test(w));
}

/** Reject only real name/place lists, not scene titles such as "The Gate, After Dark". */
function isCommaSeparatedProperNounList(title: string, state: GameState): boolean {
  const commaParts = title.split(',').map((s) => s.trim()).filter(Boolean);
  if (commaParts.length < 2) return false;
  const parts = commaParts.flatMap((p) => p.split(/\s+and\s+/i).map((s) => s.trim()).filter(Boolean));
  if (parts.length < 2) return false;
  if (parts.every((p) => isLockedTitlePart(state, p))) return true;
  return parts.every((p) => isBareProperListItem(p) || isLockedTitlePart(state, p)) && parts.some((p) => isBareProperListItem(p) || isLockedTitlePart(state, p));
}



/** Deterministic pads: distinct verbs, no pronouns, no look/study duplicates. */
export function fallbackOpeningPads(state: GameState, prose: string): string[] {
  const n = openingChoiceCount(state);
  const inst = openingInstanceOf(state);
  const labels: string[] = [];
  const push = (label: string | undefined) => {
    const t = (label ?? '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (labels.some((x) => optionsAreNearDuplicates(x, t))) return;
    if ((inst?.retiredNames ?? []).some((r) => retiredNameNeedles(r).some((w) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(t)))) return;
    const names = properNamesInOption(t, state);
    if (names.some((nm) => !mentionsOpeningName(state, prose, nm) && !optionNameMayMissProse(state, nm))) return;
    if (optionPronounErrors(t, prose, knownOpeningNames(state), state).length) return;
    labels.push(t);
  };
  const chips = inst?.offerChips ?? [];
  const refuse = chips.filter((c) => c.kind === 'refuse');
  const acceptFollow = chips.filter((c) => c.kind !== 'refuse' && chipFollowsProse(c.label, prose, c.kind));
  for (const c of refuse) {
    if (labels.length >= n) break;
    push(c.label);
  }
  // Prefer pads derived from the committed prose over accept chips that name an unseen item.
  for (const scenePad of padsFromOpeningProse(prose)) {
    if (labels.length >= n) break;
    push(scenePad);
  }
  for (const c of acceptFollow) {
    if (labels.length >= n) break;
    push(c.label);
  }
  for (const member of inst?.cast ?? []) {
    if (labels.length >= n) break;
    if (!mentionsName(prose, member.name)) continue;
    push(`Ask ${givenNameOf(member.name)} about the deal`);
  }
  if (inst?.placeName && labels.length < n && mentionsName(prose, inst.placeName)) {
    push(`Look around ${inst.placeName}`);
  }
  const fillers = ['Watch the road', 'Keep your own kit', 'Take a slow breath', 'Wait and listen', 'Stand your ground'];
  for (const f of fillers) {
    if (labels.length >= n) break;
    push(f);
  }
  return labels.slice(0, n);
}

function padsFromOpeningProse(prose: string): string[] {
  const text = prose ?? '';
  const pairs: Array<[RegExp, string]> = [
    [/\bcrates?\b/i, 'Check the crates'],
    [/\bloft\b/i, 'Step down from the loft'],
    [/\bloading dock\b/i, 'Cross the loading dock'],
    [/\bthe crew\b/i, 'Join the waiting crew'],
    [/\bprints?\b/i, 'Study the prints more closely'],
    [/\bwaterskin\b/i, 'Ask about the waterskin'],
    [/\bscarf\b/i, 'Ask about the pilgrim scarf'],
    [/\bbrand-?iron\b/i, 'Ask about the brand-iron'],
    [/\bwarehouse\b/i, 'Walk the warehouse floor'],
  ];
  const out: string[] = [];
  for (const [re, label] of pairs) {
    if (re.test(text) && !out.includes(label)) out.push(label);
  }
  return out;
}

export function shapeOpeningPads(state: GameState, prose: string): string[] {
  return fallbackOpeningPads(state, prose);
}

/** Use the prose pronoun only when a sentence is clearly about that person; otherwise no pronoun. */
export function askPadFor(name: string, prose: string): string {
  const given = givenNameOf(name);
  const g = prosePronounForName(prose, name);
  if (g === 'he') return `Ask ${given} what he's after`;
  if (g === 'she') return `Ask ${given} what she's after`;
  return `Ask ${given} about the deal`;
}

function clipJournalTitle(raw: string, maxWords = 8): string {
  let t = (raw ?? '').replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');
  t = t.replace(/^(?:the offer on the table:\s*)/i, '');
  if (!t) return '';
  if (/^hear \S+ out$/i.test(t)) return '';
  const words = t.split(' ').filter(Boolean);
  if (!words.length) return '';
  const clipped = words.slice(0, maxWords).join(' ');
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

function titleFromScene(prose: string, leadName: string | undefined, place: string): string {
  const fromScene = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (!fromScene) return '';
  const hit = fromScene.match(/\b(?:waterskin|scarf|brand-iron|brand iron|pact|hunt|blanket|bread|cloak)\b/i);
  if (!hit || hit.index == null) return '';
  const words = fromScene.split(' ').filter(Boolean);
  // Find the word that contains the match; take a short whole-word window around it.
  let acc = 0;
  let at = 0;
  for (let i = 0; i < words.length; i++) {
    if (acc <= hit.index && hit.index < acc + words[i]!.length + 1) {
      at = i;
      break;
    }
    acc += words[i]!.length + 1;
  }
  const slice = words.slice(Math.max(0, at - 3), at + 5);
  return clipJournalTitle(slice.join(' '));
}


/** Only turn a concrete offered object into a title fragment — not "X is here with a reason". */
function concreteOfferItem(note: string | undefined, leadName?: string): string {
  const t = (note ?? '').replace(/^.*?\boffers\s+/i, '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (/\bis here with a reason\b/i.test(t)) return '';
  if (/^hear \S+ out$/i.test(t)) return '';
  const lead = leadName ? givenNameOf(leadName) : '';
  if (lead && t.toLowerCase().startsWith(lead.toLowerCase())) return '';
  const words = t.split(' ').filter(Boolean);
  if (words.length > 6) return '';
  return t.replace(/[.,;:]+$/, '');
}

export function deriveOpeningJournal(state: GameState, prose?: string, preferredTitle?: string): DerivedOpeningJournal {
  const inst = openingInstanceOf(state);
  const lead = inst?.cast[0];
  const place = inst?.placeName || state.currentLocation || 'this place';
  const offer = inst?.offerSummary || inst?.offerChips.find((c) => c.kind === 'accept')?.note;
  const accept = inst?.offerChips.find((c) => c.kind === 'accept');
  const fromScene = (prose ?? '').replace(/\s+/g, ' ').trim();
  const itemFromNote = concreteOfferItem(accept?.note, lead?.name);
  const sceneDefault = lead ? `${givenNameOf(lead.name)} at ${place}` : `Arrival at ${place}`;
  const preferred = (preferredTitle ?? '').replace(/\s+/g, ' ').trim();
  const title =
    (preferred && !validateOpeningJournalTitle(state, preferred).length ? clipJournalTitle(preferred) : '')
    || clipJournalTitle(itemFromNote && lead ? `${givenNameOf(lead.name)}'s ${itemFromNote}` : itemFromNote || '')
    || clipJournalTitle(concreteOfferItem(offer, lead?.name))
    || clipJournalTitle(accept?.label && !/^hear \S+ out$/i.test(accept.label) ? accept.label : '')
    || titleFromScene(fromScene, lead?.name, place)
    || sceneDefault;
  const description = [
    lead ? `${lead.name} is here — ${lead.role}.` : `You are on your own at ${place}.`,
    offer ? `The offer on the table: ${offer}` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const objectives = [
    `Get your bearings in ${place}`,
    lead ? `Hear why ${givenNameOf(lead.name)} is here with you` : 'Learn why you arrived',
    'Decide whether to take the offer or keep your own kit',
  ];
  return { title, description, objectives };
}

export function deriveOpeningRite(state: GameState, prose?: string): DerivedOpeningRite {
  const inst = openingInstanceOf(state);
  const lead = inst?.cast[0];
  const accept = inst?.offerChips.find((c) => c.kind === 'accept');
  const refuse = inst?.offerChips.find((c) => c.kind === 'refuse');
  const offerBit = inst?.offerSummary || accept?.note || 'what is being offered';
  const fromProse = (prose ?? '').match(/([^.!?]{0,80}\b(?:offer|will you|waterskin|scarf|brand|pact|rite|hunt)[^.!?]*[.!?])/i)?.[1];
  return {
    giverName: lead?.name ?? inst?.factionName ?? 'the registrar',
    riteTitle: accept ? `The opening offer` : 'The opening',
    offerSentence: fromProse?.trim() || `Will you take ${offerBit}?`,
    acceptChip: accept?.label ?? (lead ? `Hear ${givenNameOf(lead.name)} out` : 'Step forward'),
    refuseChip: refuse?.label ?? 'Keep your own kit',
  };
}

export function derivedJournalQuest(state: GameState, prose?: string, preferredTitle?: string): Quest {
  const j = deriveOpeningJournal(state, prose, preferredTitle);
  const inst = openingInstanceOf(state);
  return {
    id: 'opening-live-journal',
    name: j.title,
    description: j.description,
    status: 'active',
    type: 'main',
    revealed: true,
    location: inst?.placeName,
    giver: inst?.cast[0]?.name,
    objectives: j.objectives.map((d, i) => ({ id: `opening-obj-${i + 1}`, description: d, completed: false })),
  };
}

function hideCatalogStarter(q: Quest, privateSpineId?: string): Quest {
  const id = q.id ?? '';
  if (id === 'opening-live-journal') return q;
  if (privateSpineId && id === privateSpineId) return { ...q, revealed: false, status: q.status === 'active' ? 'hidden' : q.status };
  if (/^opening-rite:/.test(id)) return q;
  if (/^(?:sp-quest-1|si-quest-1)$/.test(id) || /-spine-/.test(id) || /Hear why Pellane wanted you/i.test(q.name ?? '')) {
    return { ...q, revealed: false };
  }
  return q;
}

export const failedOpeningPads = [STORYTELLER_RETRY_CHIP];

/** True when opening prose is empty or whitespace-only and must not be committed. */
export function isBlankOpeningProse(text: string | undefined | null): boolean {
  return !(text ?? '').replace(/\s+/g, ' ').trim();
}

export function applyFailedLiveOpening(state: GameState): GameState {
  // offeredPad is the ActionBar source; leave it stale and scene chips stay clickable.
  const turn = state.turn ?? 0;
  return {
    ...state,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: true }),
      sceneWritten: false,
      sceneWriteError: STORYTELLER_RETRY_MESSAGE,
    },
    choices: failedOpeningPads,
    offeredPad: {
      turn,
      choices: [...failedOpeningPads],
      chips: failedOpeningPads.map((label) => ({
        label,
        actionId: 'opening:try-again',
        kind: 'opening-retry',
      })),
    },
  };
}

export function applySuccessfulLiveOpening(
  state: GameState,
  prose: string,
  extras?: { pads?: string[]; journalTitle?: string }
): GameState {
  // parse (caller) → rewrite markup → leak gate
  const clean = rewriteOpeningMarkup(prose, state.engineMode).trim();
  if (isBlankOpeningProse(clean) || openingProseLeaksStructuredJson(clean)) {
    return applyFailedLiveOpening(state);
  }
  const pads = extras?.pads?.length ? extras.pads : shapeOpeningPads(state, clean);
  const journal = derivedJournalQuest(state, clean, extras?.journalTitle);
  const privateSpineId = state.openingEstablishment?.privateSpineId;
  const quests = [...(state.quests ?? [])];
  const idx = quests.findIndex((q) => q.id === journal.id);
  if (idx >= 0) quests[idx] = journal;
  else quests.unshift(journal);
  const visible = quests.map((q) => hideCatalogStarter(q, privateSpineId));
  return {
    ...state,
    currentLocation: openingInstanceOf(state)?.placeName || state.currentLocation,
    quests: visible,
    choices: pads,
    offeredPad: null,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: true }),
      sceneWritten: true,
      sceneWriteError: undefined,
      sceneProse: clean,
      offerPadKinds: tagOpeningOfferPads(state, pads),
    },
  };
}

type OpeningDraft = { prose: string; options: string[]; journalTitle: string; structured: boolean };

function draftFromWriterRaw(raw: string): OpeningDraft {
  const parsed = readOpeningStructuredOutput(raw);
  if (parsed) return { ...parsed, structured: true };
  // The opening call is json_schema-only. Never fall back to free prose.
  return { prose: '', options: [], journalTitle: '', structured: true };
}

/** Deterministic JSON reply for unit tests so CI never hits the network. */
export function mockLiveOpeningStructuredReply(state: GameState): string {
  const prose = mockLiveOpeningProse(state);
  return JSON.stringify({
    prose,
    options: fallbackOpeningPads(state, prose),
    journalTitle: deriveOpeningJournal(state, prose).title,
  });
}

async function runWriter(
  writer: LiveOpeningWriter,
  state: GameState,
  settings: Settings
): Promise<OpeningDraft> {
  const input = formatOpeningWriterNotes(state) || '(opening)';
  const raw = await writer(state, input, settings);
  const parsed = draftFromWriterRaw(raw);
  // parse → rewrite markup → structure leak gate
  return { ...parsed, prose: rewriteOpeningMarkup(parsed.prose, state.engineMode).trim() };
}

function withFallbackPadsAndTitle(
  state: GameState,
  draft: OpeningDraft,
  prose: string
): OpeningDraft {
  let next: OpeningDraft = { ...draft, prose };
  if (validateOpeningOptions(state, prose, next.options).length) {
    next = { ...next, options: fallbackOpeningPads(state, prose) };
  }
  if (validateOpeningJournalTitle(state, next.journalTitle).length) {
    next = { ...next, journalTitle: deriveOpeningJournal(state, prose).title };
  }
  return next;
}

/** Commit path: structured prose present and not a leaked JSON shell. No English quality gates. */
function openingDraftCommits(d: OpeningDraft): boolean {
  return !!d.prose.trim() && !openingProseLeaksStructuredJson(d.prose);
}

export async function writeLiveOpening(
  state: GameState,
  settings: Settings,
  deps?: { writer?: LiveOpeningWriter }
): Promise<LiveOpeningResult> {
  let writer = deps?.writer ?? testWriter;
  if (!writer && isVitestEnv()) {
    writer = async (s) => mockLiveOpeningStructuredReply(s);
  }
  if (!writer) {
    const { callOpeningGm } = await import('./aiService');
    writer = (s, input, settings) => callOpeningGm(s, input, settings);
  }
  const fail = (): LiveOpeningFailure => ({ ok: false, error: STORYTELLER_RETRY_MESSAGE, pads: failedOpeningPads });
  let draft: OpeningDraft;
  try {
    draft = await runWriter(writer, state, settings);
  } catch {
    return fail();
  }
  if (!openingDraftCommits(draft)) return fail();
  draft = withFallbackPadsAndTitle(state, draft, draft.prose);
  return {
    ok: true,
    prose: draft.prose,
    retried: false,
    pads: draft.options,
    journal: deriveOpeningJournal(state, draft.prose, draft.journalTitle),
    rite: deriveOpeningRite(state, draft.prose),
  };
}

