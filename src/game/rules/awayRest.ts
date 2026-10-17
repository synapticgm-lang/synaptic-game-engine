/**
 * Real-time rest while away (tabletop). A player who stops somewhere safe and comes back an hour or more later
 * finds a short rest taken; back after a night away, a long rest. Human Resourceful Inspiration
 * (when held off) comes from applyRestHeal. One rest per return, never more than one long rest.
 *
 * The rest itself is the same rest the "Take a short rest" / "Rest for the night" chips run (recoveryRules), so
 * HP, Hit Dice, spell slots and the game clock move by the same numbers. The recap is built from engine facts
 * only (place, HP, the journal's next step, the rest receipt); the writer is not asked to summarise.
 */
import type { GameState } from '../types';
import { applyRestHeal, isSafeHubRest, TABLETOP_LONG_REST_CHIP, TABLETOP_SHORT_REST_CHIP } from '../recoveryRules';
import { advanceClock } from '../travelJourney';
import { resumeMainQuestFocus } from '../questPlay';
import { houseRulesOf, REST_HOURS } from './houseRules';

const HOUR_MS = 3_600_000;

export interface AwayRest {
  state: GameState;
  kind: 'short' | 'long';
  /** Lines for the "While you were away" box. */
  recap: string[];
}

/** Real hours away before each rest counts (at least an hour, and at least a night for a long rest). */
export function awayRestThresholds(state: Pick<GameState, 'houseRules'>): { short: number; long: number } {
  const hours = REST_HOURS[houseRulesOf(state).restVariant];
  return { short: Math.max(1, hours.short), long: Math.max(8, hours.long) };
}

/** Why no away rest applies (null when one does). */
export function awayRestBlock(state: GameState): string | null {
  if (state.engineMode !== 'dnd' || !state.character?.srd) return 'not a tabletop sheet';
  if (state.tabletopCreation && state.tabletopCreation.stage !== 'done') return 'character not built';
  if (state.playPhase === 'down' || state.playPhase === 'ended') return 'play is over';
  const ds = state.deathSaves;
  if (ds && !ds.dead && !ds.stable) return 'dying';
  if (state.roundCombat || !isSafeHubRest(state, TABLETOP_LONG_REST_CHIP)) return 'not somewhere safe';
  return null;
}

function awaySpan(hours: number): string {
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 24) return 'a day';
  const h = Math.floor(hours);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

/**
 * The rest earned by real time away, or null. `awayMs` is the real time since the last activity; the caller
 * reads it from the save's last-activity stamp so the engine, not the writer, owns the clock.
 */
export function applyAwayRest(state: GameState, awayMs: number): AwayRest | null {
  if (!Number.isFinite(awayMs) || awayMs <= 0 || awayRestBlock(state)) return null;
  const hoursAway = awayMs / HOUR_MS;
  const need = awayRestThresholds(state);
  const kind = hoursAway >= need.long ? 'long' : hoursAway >= need.short ? 'short' : null;
  if (!kind) return null;

  const rest = applyRestHeal(state, kind === 'long' ? TABLETOP_LONG_REST_CHIP : TABLETOP_SHORT_REST_CHIP);
  const restHours = REST_HOURS[houseRulesOf(state).restVariant][kind];
  // Nothing to recover still lets the hours pass.
  const clock = rest.receipt ? null : advanceClock(state, restHours);
  let next = rest.receipt ? rest.state : clock!.state;
  const lines: string[] = [];
  if (rest.receipt) lines.push(rest.receipt, ...(rest.dieLine ? [rest.dieLine] : []), ...(rest.after ?? []));
  else lines.push(`Rest: ${kind} rest — nothing to recover (${clock!.note})`);
  // TT-H1: no second Inspiration grant here — Human Resourceful is already in applyRestHeal after lines.

  const ch = next.character;
  const focus = resumeMainQuestFocus(next).resumeCopy;
  return {
    state: next,
    kind,
    recap: [
      `While you were away (${awaySpan(hoursAway)}), you rested at ${next.currentLocation || 'a safe place'}.`,
      ...lines,
      `HP: ${ch.hp}/${ch.maxHp || ch.hp}`,
      ...(focus ? [focus] : []),
    ],
  };
}
