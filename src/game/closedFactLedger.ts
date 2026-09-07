/**
 * 02aa — Fact-close from committed ledger, not CLOSED-card hope.
 * Given/delivered items stay gone. Resolved crises stay resolved.
 * Shape detectors — not one regex per Gemini quote.
 */

import type { GameState } from './types';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const GIVE_CLAUSE =
  /\b(?:you\s+)?(?:set|hand(?:ed)?|give|gave|deliver(?:ed)?|pass(?:ed)?)\s+(?:the\s+)?([a-z]{3,24})\b[\s\S]{0,96}\b(?:down|over|to)\b/i;
const OTHER_TAKES =
  /\b(?:they|he|she)\b[\s\S]{0,80}\b(?:pick(?:s|ed)?\s+it\s+up|tuck(?:s|ed)?\s+it|take(?:s|n)?\s+it)\b/i;
const PC_POSSESSION =
  /\b(?:in\s+your\s+(?:palm|hand|hands|coat|pocket|chest|pack|bag)|sits\s+warm\s+in\s+your|warm\s+in\s+your\s+palm)\b/i;

const CRISIS_RESOLVE =
  /\b(?:water\s+begins\s+to\s+drain|pressure\s+(?:in\s+the\s+room\s+)?drops|flood\s+gate\s+flies\s+open|dropping\s+inch\s+by\s+inch|crisis\s+(?:is\s+)?(?:over|passed|averted)|out\s+into\s+the\s+sluice,\s+away)\b/i;
const CRISIS_REWIND =
  /\b(?:flood|sluice|millrace|water)\b[\s\S]{0,96}\b(?:worse than|still climbing|coming through|breast-high|fist-sized gap)\b/i;

function knownItemNeedles(state: GameState): string[] {
  const out: string[] = [];
  const push = (raw?: string) => {
    const n = (raw ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (n.length < 3) return;
    if (!out.includes(n)) out.push(n);
    const bare = n.replace(/^(the|a|an)\s+/, '');
    if (bare.length >= 3 && !out.includes(bare)) out.push(bare);
  };
  for (const i of state.inventory ?? []) push(i.name);
  for (const n of state.sceneFacts?.givenAway ?? []) push(n);
  return out;
}

function mentionedItems(text: string, needles: string[]): string[] {
  const hit: string[] = [];
  for (const item of needles) {
    if (new RegExp(`\\b${escapeRe(item)}\\b`, 'i').test(text) && !hit.includes(item)) {
      hit.push(item);
    }
  }
  const give = text.match(GIVE_CLAUSE);
  if (give?.[1] && !hit.includes(give[1].toLowerCase())) hit.push(give[1].toLowerCase());
  return hit;
}

export function harvestGivenAwayFromProse(state: GameState, prose: string): string[] {
  const body = (prose ?? '').trim();
  const locked = new Set((state.sceneFacts?.givenAway ?? []).map((n) => n.toLowerCase()));
  if (!body) return [...locked];
  const pcGives = GIVE_CLAUSE.test(body) || (/\b(?:you\s+)?(?:set|hand|give|deliver)\b/i.test(body) && OTHER_TAKES.test(body));
  if (!pcGives && !OTHER_TAKES.test(body)) return [...locked];
  const needles = knownItemNeedles(state);
  if (!needles.length && GIVE_CLAUSE.test(body)) {
    const m = body.match(GIVE_CLAUSE);
    if (m?.[1]) locked.add(m[1].toLowerCase());
  }
  for (const item of mentionedItems(body, needles.length ? needles : [...locked])) {
    locked.add(item);
  }
  return [...locked];
}

export function harvestResolvedCrisisFromProse(state: GameState, prose: string): string[] {
  const locked = new Set((state.sceneFacts?.resolvedCrises ?? []).map((n) => n.toLowerCase()));
  if (CRISIS_RESOLVE.test(prose ?? '')) locked.add('flood');
  return [...locked];
}

export function applyClosedFactHarvest(state: GameState, prose: string): GameState {
  const givenAway = harvestGivenAwayFromProse(state, prose);
  const resolvedCrises = harvestResolvedCrisisFromProse(state, prose);
  const prevG = state.sceneFacts?.givenAway ?? [];
  const prevC = state.sceneFacts?.resolvedCrises ?? [];
  if (
    givenAway.length === prevG.length &&
    resolvedCrises.length === prevC.length &&
    givenAway.every((n, i) => n === prevG[i])
  ) {
    return state;
  }
  return {
    ...state,
    sceneFacts: {
      ...(state.sceneFacts ?? {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: state.turn ?? 0,
      }),
      givenAway,
      resolvedCrises,
    },
  };
}

export function isGivenItemReopened(state: GameState, text: string): boolean {
  const given = state.sceneFacts?.givenAway ?? [];
  if (!given.length || !PC_POSSESSION.test(text ?? '')) return false;
  if (/\b(?:already\s+given|gone|empty\s+(?:palm|hand|pocket)|nothing\s+left)\b/i.test(text)) {
    return false;
  }
  return given.some((item) => new RegExp(`\\b${escapeRe(item)}\\b`, 'i').test(text));
}

export function isResolvedCrisisRewound(state: GameState, text: string): boolean {
  const crises = state.sceneFacts?.resolvedCrises ?? [];
  if (!crises.includes('flood')) return false;
  return CRISIS_REWIND.test(text ?? '');
}

export function isClosedLedgerViolation(state: GameState, text: string): boolean {
  return isGivenItemReopened(state, text) || isResolvedCrisisRewound(state, text);
}
