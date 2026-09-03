/**
 * 02i — Closed pad universe.
 * Starve / treadmill at enumeration: excluded families are not born, not refilled.
 */

import type { GameState } from './types';
import { realPresentPeople } from './chromeAuthority';
import {
  encounterBlocksTravel,
  fleeAvailable,
  isEncounterEngaged,
  parleyAvailable,
} from './encounterTerminalFsm';

export type ExcludedPadFamily = 'travel' | 'leave';

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
  return out;
}

export function isExcludedPadLabel(
  choice: string,
  excluded: ReadonlySet<ExcludedPadFamily>
): boolean {
  if (!choice.trim()) return false;
  if (excluded.has('travel') && isTravelPad(choice)) return true;
  if (excluded.has('leave') && isLeaveFamilyPad(choice)) return true;
  return false;
}

export function isExcludedEdge(
  edge: { kind: string; label: string },
  excluded: ReadonlySet<ExcludedPadFamily>
): boolean {
  if (excluded.has('travel') && (edge.kind === 'travel' || isTravelPad(edge.label))) return true;
  if (excluded.has('leave') && isLeaveFamilyPad(edge.label)) return true;
  return false;
}

export function filterPadsByUniverse(
  pads: string[],
  excluded: ReadonlySet<ExcludedPadFamily>
): string[] {
  return pads.filter((p) => !isExcludedPadLabel(p, excluded));
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
  const people = realPresentPeople(state.sceneFacts?.present ?? []);
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
  const kept = filterPadsByUniverse(out, excluded);
  if (kept.length) return kept;
  return ['Inspect the immediate surroundings'];
}

export function ensureClosedUniversePad(
  pads: string[],
  state: GameState,
  excluded: ReadonlySet<ExcludedPadFamily> = excludedPadFamilies(state)
): string[] {
  const kept = filterPadsByUniverse(pads.filter((p) => !!p?.trim()), excluded);
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
