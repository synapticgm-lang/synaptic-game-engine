/**
 * 02aa — Fact-close from committed ledger, not CLOSED-card hope.
 * Given/delivered items stay gone. Resolved crises stay resolved.
 * Shape detectors — not one regex per Gemini quote.
 */

import type { GameState } from './types';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TAKES_IT =
  /\b([A-Z][a-z]+|[Tt]hey|[Hh]e|[Ss]he)\s+(?:\w+\s+){0,3}?(?:pick(?:s|ed)?\s+it\s+up|tuck(?:s|ed)?\s+it|take[sn]?\s+it|took\s+it)\b/g;
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

const GIVE_VERB = /\b(?:set|hand(?:s|ed)?|give[sn]?|gave|deliver(?:s|ed)?|pass(?:es|ed)?)\s+/gi;
const NOT_A_GIVE_VERB_BEFORE = /\b(?:a|an|one|the|his|her|their|your|my|its|each|other|free|left|right)\s*$/i;
const OWN_OBJECT = /^(?:their|his|her|its|someone's|somebody's)\b/i;
const OBJECT_DETERMINER = /^(?:(?:the|a|an|your|my)\s+)?/i;
const HANDOVER_AFTER = /^[^.!?]{0,96}?\b(?:to|over|across)\b/i;
const SET_DOWN_AFTER = /^[^.!?]{0,96}?\bdown\b/i;

function someoneElseTakesIt(body: string, pcName: string): boolean {
  const pc = pcName.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  for (const m of body.matchAll(TAKES_IT)) {
    const who = m[1].toLowerCase();
    if (who !== 'you' && who !== pc) return true;
  }
  return false;
}

/** The carried item each give verb hands over, read from the verb's own object. */
function itemsHandedOver(body: string, needles: string[], pcName: string): string[] {
  const out: string[] = [];
  const others = someoneElseTakesIt(body, pcName);
  for (const m of body.matchAll(GIVE_VERB)) {
    const at = m.index ?? 0;
    if (NOT_A_GIVE_VERB_BEFORE.test(body.slice(Math.max(0, at - 12), at))) continue;
    const rest = body.slice(at + m[0].length);
    if (OWN_OBJECT.test(rest)) continue;
    const obj = rest.replace(OBJECT_DETERMINER, '');
    const item = needles
      .filter((n) => new RegExp(`^${escapeRe(n)}\\b`, 'i').test(obj))
      .sort((a, b) => b.length - a.length)[0];
    if (!item) continue;
    const after = obj.slice(item.length);
    const setVerb = /^set\b/i.test(m[0]);
    const handed = setVerb ? SET_DOWN_AFTER.test(after) && others : HANDOVER_AFTER.test(after) || others;
    if (handed && !out.includes(item)) out.push(item);
  }
  return out;
}

export function harvestGivenAwayFromProse(state: GameState, prose: string): string[] {
  const body = (prose ?? '').trim();
  const locked = new Set((state.sceneFacts?.givenAway ?? []).map((n) => n.toLowerCase()));
  if (!body) return [...locked];
  for (const item of itemsHandedOver(body, knownItemNeedles(state), state.character?.name ?? '')) {
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
