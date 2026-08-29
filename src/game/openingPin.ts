/**
 * 29c — pin opening hook NPCs into scene presence so Free T1–12 don't forget Silas / Vessa.
 */

import type { CampaignBible } from './campaignBibleTypes';
import type { GameState } from './types';
import { isChromePersonToken } from './chromeAuthority';

const OPENING_PIN_TURN_CAP = 20;

/** Extract Title-Case person names from opener prose (light heuristic). */
export function extractNamesFromHookText(text: string | undefined): string[] {
  if (!text) return [];
  const names: string[] = [];
  const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  let m: RegExpExecArray | null;
  const stop = new Set([
    'The', 'You', 'Your', 'A', 'An', 'And', 'Or', 'But', 'When', 'Where', 'What',
    'Who', 'Why', 'How', 'This', 'That', 'These', 'Those', 'With', 'From', 'Into',
    'Before', 'After', 'Beside', 'Armored', 'Guild', 'System', 'Status', 'Earth',
    'Circle', 'Sevenfold', 'Harbor', 'Quay', 'Keep', 'Inn', 'Church', 'Road',
    'Salt', 'Camp', 'Waystation', 'Alley', 'Ward', 'Rest', 'Ashline', 'Yard',
    'Place', 'Name', 'Look', 'Kit', 'Wear', 'Where', 'Origin', 'Appearance',
    'Designation', 'Registration', 'Panel', 'Official', 'Speaker', 'Palm',
    'Eye', 'Level', 'Location',
  ]);
  while ((m = re.exec(text)) !== null) {
    const n = m[1]!;
    if (stop.has(n.split(/\s+/)[0]!)) continue;
    if (n.length < 3) continue;
    if (!names.some((x) => x.toLowerCase() === n.toLowerCase())) names.push(n);
  }
  return names.slice(0, 3);
}

/** Bible opening contacts — first 1–2 named NPCs for the flagship opener. */
export function openingNpcFromBible(bible: CampaignBible | undefined | null): string[] {
  if (!bible) return [];
  const fromKey = (bible.keyNPCs ?? []).map((n) => n.name).filter(Boolean);
  const out: string[] = [];
  for (const n of fromKey) {
    if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
    if (out.length >= 2) break;
  }
  return out;
}

export function resolveOpeningPinnedNames(
  state: GameState,
  bible?: CampaignBible | null
): string[] {
  const existing = state.openingEstablishment?.pinnedNpcNames ?? [];
  if (existing.length) return existing;
  if (state.openingEstablishment?.aloneArrival) return [];
  const fromHook = extractNamesFromHookText(
    state.openingEstablishment?.pickedHook ?? state.openingEstablishment?.pickedHookFallback
  );
  const fromBible = openingNpcFromBible(bible);
  const merged = [...fromHook, ...fromBible];
  const out: string[] = [];
  for (const n of merged) {
    if (isChromePersonToken(n)) continue;
    if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
    if (out.length >= 2) break;
  }
  return out;
}

/** Stamp pinned names on openingEstablishment + ensure sceneFacts.present. */
export function ensureOpeningNpcPinned(
  state: GameState,
  bible?: CampaignBible | null
): GameState {
  if (state.openingEstablishment?.aloneArrival) return state;
  if ((state.turn ?? 0) > OPENING_PIN_TURN_CAP) return state;

  const pinned = resolveOpeningPinnedNames(state, bible);
  if (!pinned.length) return state;

  const present = [...(state.sceneFacts?.present ?? [])];
  let changed = false;
  for (const n of pinned) {
    if (isChromePersonToken(n)) continue;
    if (!present.some((p) => p.toLowerCase() === n.toLowerCase())) {
      present.push(n);
      changed = true;
    }
  }

  const est = state.openingEstablishment;
  const needStamp =
    !est?.pinnedNpcNames?.length ||
    pinned.some((n) => !(est.pinnedNpcNames ?? []).some((p) => p.toLowerCase() === n.toLowerCase()));

  if (!changed && !needStamp) return state;

  return {
    ...state,
    sceneFacts: {
      ...state.sceneFacts,
      present,
    },
    openingEstablishment: est
      ? { ...est, pinnedNpcNames: pinned }
      : {
          pending: [],
          answers: {},
          complete: true,
          pinnedNpcNames: pinned,
        },
  };
}

export function formatOpeningPinMandate(state: GameState): string | null {
  const pinned = state.openingEstablishment?.pinnedNpcNames ?? [];
  if (!pinned.length) return null;
  if ((state.turn ?? 0) > OPENING_PIN_TURN_CAP) return null;
  if (state.openingEstablishment?.aloneArrival) return null;
  return `OPENING PIN (BINDING): ${pinned.join(', ')} remain present and consequential this beat — do not forget, replace with stranger/kit nouns, or soft-reset the opening offer.`;
}
