/**
 * 02q / 02s — One camera / one fight.
 * Ledger owns HERE and the live foe. Arrival prepend and last-beat steel
 * cannot share a page. 02s: the stamp runs after commit — refuse it on steel.
 * No SNAPSHOT / CRAFT / NEVER lines.
 */

import type { GameState } from './types.ts';
import { isEncounterEngaged } from './encounterTerminalFsm.ts';
import { isDeadFoeCorpseOk, isDeadFoeReopenedAsLiving, matchesLastKillName } from './combatAuthority.ts';
import { ensureTravelArrivalProse } from './outdoorHubs.ts';

const LEAVE_REACH =
  /\bYou leave\s+.+?\s+behind and reach\s+.+?\./i;

const FIGHT_BLEED =
  /\b(blade|throat|handspan|skirmisher|mid-arc|press(?:es)? the attack|parry|lunges?)\b/i;

export function isLiveFightCamera(state: GameState): boolean {
  return (
    isEncounterEngaged(state)
    || !!state.activeEncounter
    || !!state.sceneFacts?.pendingEncounter
  );
}

export function shouldSkipTravelArrivalPrepend(state: GameState): boolean {
  return isLiveFightCamera(state);
}

export function isLeaveReachFightBleed(text: string): boolean {
  const t = (text ?? '').trim();
  if (!t || !LEAVE_REACH.test(t)) return false;
  return FIGHT_BLEED.test(t);
}

export function proseHasFightBleed(text: string): boolean {
  return FIGHT_BLEED.test((text ?? '').trim());
}

/**
 * Post-commit arrival stamp. Never glue `You leave X and reach Y` onto a
 * steel beat (02r D&D T28 / RPG T14). Live fight skips the stamp entirely.
 */
export function stampTravelArrivalIfSafe(
  prose: string,
  dest: string,
  from: string | null | undefined,
  state?: Pick<GameState, 'activeEncounter' | 'sceneFacts'>
): string {
  const body = prose ?? '';
  if (state && shouldSkipTravelArrivalPrepend(state as GameState)) return body;
  if (proseHasFightBleed(body)) return body;
  const stamped = ensureTravelArrivalProse(body, dest, from ?? null);
  if (isLeaveReachFightBleed(stamped)) return body;
  return stamped;
}

export function isOneCameraFightViolation(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  if (isLeaveReachFightBleed(body)) return true;
  const kill = state.sceneFacts?.lastKill;
  if (kill?.name && kill.outcome === 'victory' && !state.activeEncounter) {
    if (isDeadFoeReopenedAsLiving(body, kill, false)) return true;
    const tokens = body.match(/\b[A-Za-z][A-Za-z'-]{3,}\b/g) ?? [];
    if (
      FIGHT_BLEED.test(body)
      && !isDeadFoeCorpseOk(body)
      && tokens.some((t) => matchesLastKillName(t.replace(/['’]s$/i, ''), kill))
    ) {
      return true;
    }
  }
  return false;
}

function stripLeaveReach(text: string): string {
  return text.replace(/\bYou leave\s+[^.]+?\s+behind and reach\s+[^.]+?\.\s*/gi, '').trim();
}

function dropFightBleedSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !FIGHT_BLEED.test(s))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Warden: live fight keeps the room; arrival travel drops leftover steel. */
export function scrubOneCameraFight(
  text: string,
  state: Pick<GameState, 'activeEncounter' | 'sceneFacts'>,
  playerInput?: string
): string {
  let next = (text ?? '').trim();
  if (!next) return next;
  const live = isLiveFightCamera(state as GameState);
  if (live && LEAVE_REACH.test(next)) {
    next = stripLeaveReach(next);
  }
  const arrival = /^(?:travel\s+toward|return\s+to|enter\b|go (?:inside|in|through|into)|head (?:inside|through|into|to))\b/i.test(
    (playerInput ?? '').trim()
  );
  if (arrival && !live && (isLeaveReachFightBleed(next) || proseHasFightBleed(next))) {
    const kept = dropFightBleedSentences(next);
    if (kept.length > 12) next = kept;
  }
  return next;
}

/** Warden path when only a live-fight flag exists (no full GameState). */
export function scrubLeaveReachDuringFight(text: string, liveFight: boolean): string {
  if (!liveFight || !LEAVE_REACH.test(text ?? '')) return text ?? '';
  return stripLeaveReach(text);
}
