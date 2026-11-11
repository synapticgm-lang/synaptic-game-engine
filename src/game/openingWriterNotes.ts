/**
 * Slim opening-page-1 notes for the writer packet and system prompt.
 * Imports types only so the edge graph stays capped (no hook decks).
 */
import type { GameState } from './types';

export const STORYTELLER_RETRY_MESSAGE = "The storyteller didn't answer — Try again";
export const STORYTELLER_RETRY_CHIP = 'Try again';

export function openingChoiceCountOf(engineMode: GameState['engineMode'] | undefined): number {
  return engineMode === 'dnd' ? 3 : 4;
}

export function openingChoiceCount(state: GameState): number {
  return openingChoiceCountOf(state.engineMode);
}

/** Short private rail + locked names. Safe to embed in the system prompt. */
export function formatOpeningPage1Rail(state: GameState): string {
  const est = state.openingEstablishment;
  if (!est || est.sceneWritten) return '';
  const inst = est.instance;
  if (!inst) return '';
  const n = openingChoiceCount(state);
  const people = inst.alone
    ? 'ALONE: do not invent a welcoming committee.'
    : `LOCKED PEOPLE (use these names): ${inst.cast.map((c) => `${c.name} — ${c.role}`).join('; ') || 'none'}`;
  const retiredNames = distinctiveRetiredNames(inst.retiredNames);
  const retired = retiredNames.length ? `Do not use retired catalog names: ${retiredNames.slice(0, 24).join(', ')}.` : '';
  const offer = inst.offerSummary ? `THE OFFER must be unmistakable in the prose: ${inst.offerSummary}` : '';
  const chips = inst.offerChips.length
    ? `End with exactly ${n} numbered choices. Prefer: ${inst.offerChips.map((c) => c.label).join('; ')}.`
    : `End with exactly ${n} numbered choices that follow from the prose.`;
  return [
    '【 OPENING PAGE 1 】',
    'Write the first prose the player will read. Novel-quality, concrete, present, no director notes, no menu language.',
    `LOCKED PLACE: ${inst.placeName} (${inst.placeKind}) — use this name.`,
    people,
    inst.factionName ? `LOCKED FACTION: ${inst.factionName}${inst.factionKind ? ` (${inst.factionKind})` : ''}` : '',
    inst.situation ? `SITUATION (private): ${inst.situation}` : '',
    inst.pressing ? `PRESSURE (private): ${inst.pressing}` : '',
    inst.how ? `HOW YOU ARRIVED (private): ${inst.how}` : '',
    offer,
    chips,
    retired,
    'Name the locked place and every locked person who is here. No "someone here", "a figure", or unnamed stand-ins when a locked name exists.',
    'Follow the Gamebook / GM writing style already in this system prompt.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Full player-input packet for the opening GM call (client builds this). */
export function formatOpeningWriterNotes(state: GameState, retryErrors?: string[]): string {
  const rail = formatOpeningPage1Rail(state);
  const inst = state.openingEstablishment?.instance;
  const extra = inst
    ? [
        inst.whoYouAre ? `WHO YOU ARE (private): ${inst.whoYouAre}` : '',
        inst.offerChips.length
          ? `Concrete offer chips (use these labels when they still follow from your prose):\n${inst.offerChips.map((c, i) => `  ${i + 1}. ${c.label} — ${c.note}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  const retry = retryErrors?.length
    ? `Your last draft failed these checks: ${retryErrors.join('; ')}. Rewrite the opening. Use the locked names exactly. Make the offer unmistakable. Name concrete people and the place.`
    : '';
  return [rail, extra, retry].filter(Boolean).join('\n\n');
}

/** Single words that are not distinctive proper names even when Title-Cased. */
export const COMMON_OPENING_LEXEMES = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'as',
  'you', 'your', 'yours', 'yourself', 'they', 'them', 'their', 'theirs', 'this', 'that', 'these',
  'those', 'who', 'what', 'why', 'how', 'when', 'where', 'both', 'each', 'every', 'some', 'any',
  'all', 'none', 'here', 'there', 'already', 'just', 'still',
  'walk', 'stay', 'take', 'hear', 'keep', 'look', 'wait', 'ask', 'stand', 'sit', 'lie', 'give',
  'sign', 'refuse', 'accept', 'speak', 'say', 'come', 'go', 'run', 'hold', 'carry', 'offer',
  'enter', 'leave', 'follow', 'turn', 'open', 'close', 'step', 'move', 'share', 'raise', 'draw',
  'put', 'hang', 'wake', 'arrive', 'return', 'call', 'tell', 'make', 'bring', 'find', 'see',
  'start', 'stop', 'begin', 'end', 'choose', 'decide', 'try', 'help', 'guard', 'watch', 'rest',
  'sleep', 'eat', 'drink', 'trade', 'buy', 'sell', 'hide', 'search', 'study',
  'salt', 'glass', 'earth', 'heat', 'light', 'water', 'scarf', 'bread', 'blanket', 'kit',
  'work', 'job', 'hunt', 'brand', 'iron', 'pact', 'oath', 'circle', 'panel', 'system',
  'wind', 'dust', 'ash', 'fire', 'stone', 'wood', 'gold', 'coin', 'blade', 'hand', 'pack',
  'gear', 'cloak', 'coat', 'food', 'waterskin', 'people', 'person', 'figure', 'someone',
  'anyone', 'everyone', 'nobody', 'nothing', 'something',
  'trail', 'road', 'camp', 'war', 'inn', 'ford', 'gate', 'keep', 'hall', 'ward', 'harbor',
  'harbour', 'waystation', 'station', 'wake', 'market', 'square', 'hollow', 'lane', 'court',
  'quay', 'mill', 'well', 'bridge', 'pass', 'crossing',
]);

const GENERIC_PLACE_BITS = new Set([
  'trail', 'road', 'camp', 'war', 'inn', 'ford', 'gate', 'keep', 'hall', 'ward', 'circle', 'court',
  'harbor', 'harbour', 'waystation', 'station', 'wake', 'market', 'square', 'hollow', 'lane',
  'quay', 'mill', 'well', 'bridge', 'pass', 'crossing', 'place',
]);

/** Honorifics are not distinctive retired stems — "his brother" must not fail a "Brother Oren" ban. */
const HONORIFIC_BITS = new Set([
  'brother', 'sister', 'father', 'mother', 'sir', 'lady', 'lord', 'captain', 'sergeant',
  'high', 'chanter', 'priest', 'priestess', 'tracker', 'scout', 'novice', 'elder',
  'master', 'mistress', 'doctor', 'dame', 'warden', 'keeper', 'ranger', 'hunter',
]);

export function isCommonOpeningLexeme(word: string): boolean {
  const k = (word ?? '').trim().toLowerCase();
  return !k || COMMON_OPENING_LEXEMES.has(k) || GENERIC_PLACE_BITS.has(k);
}

/** Full multi-word retired names plus distinctive stems — never single common words. */
export function distinctiveRetiredNames(retiredNames: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (n: string) => {
    const k = n.trim();
    if (!k) return;
    const key = k.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(k);
  };
  for (const r of retiredNames ?? []) {
    const parts = r.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    if (parts.length >= 2) push(r.trim());
    for (const p of parts) {
      if (
        p.length >= 4
        && !isCommonOpeningLexeme(p)
        && !GENERIC_PLACE_BITS.has(p.toLowerCase())
        && !HONORIFIC_BITS.has(p.toLowerCase())
      ) {
        push(p);
      }
    }
  }
  return out;
}

export function retiredNameNeedles(retired: string): string[] {
  return distinctiveRetiredNames([retired]);
}

export function isRetiredCatalogToken(token: string, retiredNames: string[] | undefined): boolean {
  if (!retiredNames?.length) return false;
  const t = (token ?? '').replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!t) return false;
  if (isCommonOpeningLexeme(t)) {
    return retiredNames.some((r) => r.toLowerCase() === t.toLowerCase() && !isCommonOpeningLexeme(r));
  }
  const lower = t.toLowerCase();
  for (const needle of distinctiveRetiredNames(retiredNames)) {
    const n = needle.toLowerCase();
    if (lower === n) return true;
    if (n.split(/\s+/).length >= 2 && (lower.includes(n) || n.includes(lower))) return true;
    const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(t)) return true;
  }
  return false;
}

export function filterRetiredFromAllowlist(names: string[], retiredNames: string[] | undefined): string[] {
  if (!retiredNames?.length) return names;
  return names.filter((n) => !isRetiredCatalogToken(n, retiredNames));
}

/** Short later-turn ban so retired catalog names cannot re-enter the system prompt after page 1. */
export function formatLaterTurnNameRail(state: GameState): string {
  const est = state.openingEstablishment;
  if (!est?.instance || !est.sceneWritten) return '';
  if (state.engineMode === 'pyoa') return '';
  const inst = est.instance;
  const locked = [
    inst.placeName,
    inst.settlementName,
    inst.factionName,
    ...(inst.cast ?? []).map((c) => c.name),
  ].filter(Boolean) as string[];
  const retired = distinctiveRetiredNames(inst.retiredNames).slice(0, 20);
  if (!locked.length && !retired.length) return '';
  return [
    '【 LOCKED NAMES 】',
    locked.length ? `Keep using these locked names: ${locked.join(', ')}.` : '',
    retired.length ? `Do not use retired catalog names: ${retired.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
