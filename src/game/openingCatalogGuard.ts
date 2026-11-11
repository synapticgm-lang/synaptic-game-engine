/**
 * Later-turn opening-scene guard: catalog hook-cast must not stand in for the
 * per-game minted people, and empty inscription / quote slots must not ship.
 * Applies while the player is still at the minted opening place.
 */
import type { GameState } from './types';
import { isRetiredCatalogToken } from './openingWriterNotes';

const CATALOG_CAST_FULL = [
  'Captain Sera Quill',
  'Sera Quill',
  'High Chanter Orel Vane',
  'Orel Vane',
  'Brother Oren',
  'Kessa Cinder',
];

function norm(name: string): string {
  return (name ?? '').replace(/^(?:the|a|an)\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function stillAtOpeningPlace(state: GameState): boolean {
  const inst = state.openingEstablishment?.instance;
  if (!inst) return false;
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const pin = (
    state.openingEstablishment?.answers?.where
    || state.openingEstablishment?.pinnedAt
    || inst.placeName
    || ''
  )
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!here || !pin || here !== pin) return false;
  return !(state.log ?? []).some(
    (e) => e.role === 'player' && /\b(?:travel toward|travel to|go to|head to|leave for|set out)\b/i.test(e.content ?? ''),
  );
}

/** Minted people / faction locked to this game's opening. */
export function openingLockedPersonNames(state: GameState): string[] {
  const inst = state.openingEstablishment?.instance;
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string) => {
    const n = (raw ?? '').replace(/\s+/g, ' ').trim();
    if (!n) return;
    const key = n.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(n);
  };
  push(state.character?.name);
  for (const member of inst?.cast ?? []) {
    push(member.name);
    const given = member.name.replace(/^(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Sergeant|High Chanter|Priest|Priestess)\s+/i, '').split(/\s+/)[0];
    push(given);
  }
  push(inst?.factionName);
  push(inst?.groupLabel);
  return out;
}

function namesMatch(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const last = (s: string) => s.split(/\s+/).pop() ?? '';
  const lx = last(x);
  const ly = last(y);
  return lx.length >= 4 && ly.length >= 4 && lx === ly;
}

function isLockedPerson(state: GameState, name: string): boolean {
  return openingLockedPersonNames(state).some((n) => namesMatch(n, name));
}

/**
 * True when `name` is a catalog hook / bible person who must not appear in this
 * opening scene (still at the minted place). False once the player has travelled.
 */
export function isCatalogCastBlockedHere(state: GameState, name: string): boolean {
  const label = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!label) return false;
  if (!state.openingEstablishment?.instance) return false;
  if (!stillAtOpeningPlace(state)) return false;
  if (isLockedPerson(state, label)) return false;
  const retired = state.openingEstablishment.instance.retiredNames;
  if (isRetiredCatalogToken(label, retired)) return true;
  if (CATALOG_CAST_FULL.some((n) => namesMatch(n, label))) return true;
  for (const mem of state.npcMemories ?? []) {
    const memName = (mem.npcName ?? '').trim();
    if (!memName || isLockedPerson(state, memName)) continue;
    if (String(mem.npcId ?? '').startsWith('opening-cast-')) continue;
    if (namesMatch(memName, label)) return true;
  }
  return false;
}

export function filterBlockedCatalogNames(state: GameState, names: string[]): string[] {
  return names.filter((n) => !isCatalogCastBlockedHere(state, n));
}

/** Minted person or faction to attribute the opening offer to — never a raw catalog group label. */
export function openingOfferAttribution(state: GameState): string {
  const inst = state.openingEstablishment?.instance;
  const lead = inst?.cast[0]?.name?.trim();
  if (lead) return lead;
  const faction = inst?.factionName?.trim();
  if (faction) return faction;
  const group = inst?.groupLabel?.trim();
  if (group) return group;
  return '';
}

/** Raw catalog group/faction labels must not appear as "from X" on the accept receipt. */
export function isBannedOpeningAttribution(state: GameState, label: string): boolean {
  const text = (label ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return true;
  if (isLockedPerson(state, text)) return false;
  const retired = state.openingEstablishment?.instance?.retiredNames;
  if (retired && isRetiredCatalogToken(text, retired)) return true;
  return false;
}

const EMPTY_INSCRIPTION = /\bThey read:\s*\.?\s*/gi;
const EMPTY_QUOTE_LEAD = /(?<=said,\s*)["“]\s+(?=[a-z])/g;
const EMPTY_QUOTE_LINE = /["“]\s+is a rite to finish[^"”]*["”]?/gi;

function nameInText(text: string, name: string): boolean {
  const n = (name ?? '').replace(/\s+/g, ' ').trim();
  if (n.length < 4) return false;
  return new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
}

function dropCatalogSentences(state: GameState, prose: string): string {
  const parts = (prose ?? '').split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  const retired = state.openingEstablishment?.instance?.retiredNames;
  for (const part of parts) {
    const t = part.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const lockedHit = openingLockedPersonNames(state).some((n) => nameInText(t, n));
    if (lockedHit) {
      kept.push(t);
      continue;
    }
    const catalogHit =
      CATALOG_CAST_FULL.some((n) => nameInText(t, n) && !isLockedPerson(state, n))
      || (retired ?? []).some((n) => n.length >= 4 && isRetiredCatalogToken(n, retired) && nameInText(t, n))
      || (state.npcMemories ?? []).some((m) => {
        const memName = (m.npcName ?? '').trim();
        return memName.length >= 4 && isCatalogCastBlockedHere(state, memName) && nameInText(t, memName);
      });
    if (catalogHit) continue;
    kept.push(t);
  }
  return kept.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Drop empty inscription / quote slots and catalog-cast sentences from a later-turn beat.
 */
export function scrubOpeningTurnProse(state: GameState, prose: string): string {
  let text = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return text;
  text = text.replace(EMPTY_INSCRIPTION, '');
  text = text.replace(EMPTY_QUOTE_LINE, '');
  text = text.replace(EMPTY_QUOTE_LEAD, '"');
  text = text.replace(/\s+\./g, '.').replace(/\s{2,}/g, ' ').trim();
  if (state.openingEstablishment?.instance && stillAtOpeningPlace(state)) {
    text = dropCatalogSentences(state, text);
  }
  return text.replace(/\s+/g, ' ').trim();
}

export function proseHasEmptySlot(prose: string): boolean {
  const t = (prose ?? '').replace(/\s+/g, ' ');
  return /\bThey read:\s*\./i.test(t) || /said,\s*["“]\s+/i.test(t) || /["“]\s+is a rite to finish/i.test(t);
}

export const CATALOG_CAST_LEAK_RE = /Captain Sera Quill|Sera Quill|High Chanter Orel Vane|Orel Vane|Brother Oren|Kessa Cinder/i;
