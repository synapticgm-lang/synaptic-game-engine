/**
 * 02i — Closed pad universe.
 * Starve / treadmill at enumeration: excluded families are not born, not refilled.
 */

import type { GameState } from './types';
import {
  encounterBlocksTravel,
  fleeAvailable,
  isEncounterEngaged,
  parleyAvailable,
} from './encounterTerminalFsm';
import { filterClosedScenePersonPads } from './closedScenePerson';
import { sealedCastNames } from './beatContract';
import { isPyoaCharterClosed, isPyoaItemDestroyed } from './pyoaBranchLedger';
import { isPlaceTitleTalkPad, ledgerPlaceTitles } from './slotGlue';
import { ledgerNeverCastTitles } from './neverCast';
import { isLastKillTalkPad, matchesLastKillName } from './combatAuthority';

const TALK_QA_SHAPE =
  /\b(?:what\s+do\s+i\s+want|what\s+i\s+want|what\s+do\s+you\s+want|i\s+want\s+(?:the|that|this)|you\s+want\s+something\s+from\s+me|i\s+told\s+you\s+what\s+i\s+want)\b/i;

function isTalkQaLoopStarved(state: GameState): boolean {
  const bodies: string[] = [];
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0 && bodies.length < 3; i--) {
    if (log[i]?.role === 'gm' && log[i]?.content?.trim()) bodies.push(String(log[i].content));
  }
  return bodies.length >= 3 && bodies.every((b) => TALK_QA_SHAPE.test(b));
}

export type ExcludedPadFamily = 'travel' | 'leave' | 'talk' | 'use' | 'ask';

export function isTravelPad(choice: string): boolean {
  const lower = choice.toLowerCase();
  return (
    /\b(travel(?:\s+(?:toward|to|into))?|go to|head (?:to|for|toward)|move to|leave (?:for|toward)|walk to|return to)\b/.test(
      lower
    ) || /^travel\b/i.test(choice.trim())
  );
}

/** Leave / Walk away / Accept-ending — the PYOA mill-loop family. */
export function isLeaveFamilyPad(choice: string): boolean {
  return /\b(leave through|walk away|go another direction|accept the ending)\b/i.test(choice);
}

export function isNamedTalkPad(choice: string): boolean {
  const t = (choice ?? '').trim();
  if (!t || /^ask a direct question$/i.test(t)) return false;
  return /\b(talk to|ask)\s+\S/i.test(t);
}

export function isUseCharterPad(choice: string): boolean {
  return /\b(use|inspect|read|hand over)\b[\w\s']{0,28}\b(?:millstone\s+)?charter\b/i.test(choice);
}

export function shouldStarveTalkPads(state: GameState): boolean {
  if (sealedCastNames(state).length === 0) return true;
  if (isTalkQaLoopStarved(state)) return true;
  return false;
}

export function shouldStarveUsePads(state: GameState): boolean {
  return isPyoaCharterClosed(state) || isPyoaItemDestroyed(state, 'charter');
}

/** Ask-topic family starved after the same talk/ask pad 3× in the last 5 player turns. */
export function shouldStarveAskPads(state: GameState): boolean {
  if (isTalkQaLoopStarved(state)) return true;
  const picks: string[] = [];
  const log = state.log ?? [];
  let seen = 0;
  for (let i = log.length - 1; i >= 0 && seen < 5; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    seen += 1;
    const t = (e.content ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (/\b(ask|talk|press|listen)\b/.test(t)) picks.push(t);
  }
  if (picks.length < 3) return false;
  const last = picks[0];
  return picks.filter((p) => p === last).length >= 3;
}

function countRecentMatchingPicks(
  state: GameState,
  window: number,
  match: (text: string) => boolean
): number {
  const log = state.log ?? [];
  let seen = 0;
  let count = 0;
  for (let i = log.length - 1; i >= 0 && seen < window; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    seen += 1;
    if (match(e.content ?? '')) count += 1;
  }
  return count;
}

export function countRecentTravelPicks(state: GameState, window = 5): number {
  return countRecentMatchingPicks(state, window, isTravelPad);
}

export function countRecentLeavePicks(state: GameState, window = 4): number {
  return countRecentMatchingPicks(state, window, isLeaveFamilyPad);
}

export function countRecentTravelOrWalkPicks(state: GameState, window = 5): number {
  return countRecentMatchingPicks(
    state,
    window,
    (t) => isTravelPad(t) || /\b(walk away|leave through|go another direction)\b/i.test(t)
  );
}

function hasLiveStakes(state: GameState): boolean {
  return (
    isEncounterEngaged(state) ||
    !!state.activeEncounter ||
    !!state.sceneFacts?.pendingEncounter
  );
}

/** Travel yo-yo / live encounter / hub walk treadmill. */
export function shouldStarveTravelPads(state: GameState): boolean {
  if (hasLiveStakes(state) || encounterBlocksTravel(state)) return true;
  if (countRecentTravelPicks(state, 5) >= 2) return true;
  if (countRecentTravelOrWalkPicks(state, 5) >= 3) return true;
  return false;
}

/** PYOA mill leave-loop + hub Leave/Walk yo-yo. */
export function shouldStarveLeavePads(state: GameState): boolean {
  return countRecentLeavePicks(state, 4) >= 2;
}

/**
 * Single source of truth for this compile.
 * Either starve locks both travel and leave so refill cannot yo-yo the other family.
 */
export function excludedPadFamilies(state: GameState): ReadonlySet<ExcludedPadFamily> {
  const out = new Set<ExcludedPadFamily>();
  if (shouldStarveTravelPads(state)) {
    out.add('travel');
    out.add('leave');
  }
  if (shouldStarveLeavePads(state)) {
    out.add('leave');
    out.add('travel');
  }
  if (shouldStarveTalkPads(state)) {
    out.add('talk');
    if (isTalkQaLoopStarved(state)) out.add('ask');
  }
  if (shouldStarveUsePads(state)) out.add('use');
  if (shouldStarveAskPads(state)) out.add('ask');
  return out;
}

export function isExcludedPadLabel(
  choice: string,
  excluded: ReadonlySet<ExcludedPadFamily>
): boolean {
  if (!choice.trim()) return false;
  if (excluded.has('travel') && isTravelPad(choice)) return true;
  if (excluded.has('leave') && isLeaveFamilyPad(choice)) return true;
  if (excluded.has('talk') && isNamedTalkPad(choice)) return true;
  if (excluded.has('use') && isUseCharterPad(choice)) return true;
  if (excluded.has('ask') && isNamedTalkPad(choice) && /\b(ask|press|listen)\b/i.test(choice)) return true;
  return false;
}

export function isExcludedEdge(
  edge: { kind: string; label: string },
  excluded: ReadonlySet<ExcludedPadFamily>
): boolean {
  if (excluded.has('travel') && (edge.kind === 'travel' || isTravelPad(edge.label))) return true;
  if (excluded.has('leave') && isLeaveFamilyPad(edge.label)) return true;
  if (excluded.has('talk') && (edge.kind === 'talk' || isNamedTalkPad(edge.label))) return true;
  if (excluded.has('use') && isUseCharterPad(edge.label)) return true;
  if (excluded.has('ask') && isNamedTalkPad(edge.label) && /\b(ask|press|listen)\b/i.test(edge.label)) {
    return true;
  }
  return false;
}

export function filterPadsByUniverse(
  pads: string[],
  excluded: ReadonlySet<ExcludedPadFamily>,
  state?: GameState
): string[] {
  const family = pads.filter((p) => !isExcludedPadLabel(p, excluded));
  const titles = state ? ledgerNeverCastTitles(state) : [];
  const grounded = titles.length
    ? family.filter((p) => !isPlaceTitleTalkPad(p, titles) && !isPlaceTitleTalkPad(p, ledgerPlaceTitles(state)))
    : family;
  return state ? filterClosedScenePersonPads(grounded, state) : grounded;
}

/** Scene-grounded talk / inspect / combat — never Travel or Leave. */
export function closedUniverseFallbacks(
  state: GameState,
  excluded: ReadonlySet<ExcludedPadFamily> = excludedPadFamilies(state)
): string[] {
  const out: string[] = [];
  const live =
    isEncounterEngaged(state) ||
    !!state.activeEncounter ||
    !!state.sceneFacts?.pendingEncounter;
  if (live) {
    out.push('Press the attack');
    if (fleeAvailable(state.activeEncounter)) out.push('Try to flee');
    if (parleyAvailable(state.activeEncounter)) out.push('Parley');
  }
  const lastKill = state.sceneFacts?.lastKill;
  const people = sealedCastNames(state).filter(
    (p) => !matchesLastKillName(p, lastKill) && !isLastKillTalkPad(`Talk to ${p}`, lastKill)
  );
  for (const p of people.slice(0, 2)) {
    if (/sergeant|guard|warden/i.test(p)) out.push(`Talk to ${p}`);
    else if (/fence|contact|handler|merchant|vendor/i.test(p)) out.push(`Talk to ${p}`);
    else out.push(`Ask ${p} what they want`);
  }
  const banks = people.length
    ? [
        people[0] ? `Talk to ${people[0]}` : 'Ask a direct question',
        'Take a stake in what is unfolding',
        'Inspect the immediate surroundings',
      ]
    : [
        'Ask a direct question',
        'Press for leverage',
        'Listen for the real answer',
        'Take a stake in what is unfolding',
        'Inspect the immediate surroundings',
      ];
  for (const pad of banks) {
    if (!out.some((c) => c.toLowerCase() === pad.toLowerCase())) out.push(pad);
  }
  const kept = filterPadsByUniverse(out, excluded, state).filter(
    (p) => !isLastKillTalkPad(p, lastKill)
  );
  if (kept.length) return kept;
  return ['Inspect the immediate surroundings'];
}

export function ensureClosedUniversePad(
  pads: string[],
  state: GameState,
  excluded: ReadonlySet<ExcludedPadFamily> = excludedPadFamilies(state)
): string[] {
  const kept = filterPadsByUniverse(pads.filter((p) => !!p?.trim()), excluded, state);
  if (kept.length) return kept;
  return closedUniverseFallbacks(state, excluded);
}

/** After stance/path density — drop any family the universe excluded. */
export function sealPadUniverse(
  pads: string[],
  state: GameState,
  excluded: ReadonlySet<ExcludedPadFamily> = excludedPadFamilies(state)
): string[] {
  return ensureClosedUniversePad(pads, state, excluded);
}

const TRAVEL_ONLY_PROGRESS =
  /\byou leave\b[\s\S]{0,80}\breach\b|\btravel toward\b|\byou reach\b/i;

/** Post-call: the beat's only progress is a pad family the ledger already excluded. */
export function isExcludedPadProgress(
  state: GameState,
  prose: string,
  _playerInput?: string
): boolean {
  const body = (prose ?? '').trim();
  if (!body) return false;
  const excluded = excludedPadFamilies(state);
  const hasOther =
    /\b(ask|talk|says?|nods?|blade|strike|inspect|search|wait)\b/i.test(body);
  if (excluded.has('travel') && TRAVEL_ONLY_PROGRESS.test(body) && !hasOther) return true;
  if (excluded.has('leave') && /\b(walk away|leave through|accept the ending)\b/i.test(body) && !hasOther) {
    return true;
  }
  if (
    excluded.has('use')
    && /\b(?:millstone\s+)?charter\b/i.test(body)
    && /\b(use|clutch|from your (?:hands|pack|pocket))\b/i.test(body)
  ) {
    return true;
  }
  return false;
}
