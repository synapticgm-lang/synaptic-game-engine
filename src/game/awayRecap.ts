/**
 * Recap on return (story RPG and LitRPG). The same real-time-away clock the tabletop away rest reads (the save's
 * last-activity stamp, or when the tab hid): back after an hour or more, the player gets a short recap built from
 * engine facts only — where they are, how they stand, who is with them, the last choices from the journal, who
 * still remembers something, and the main quest's next step. The writer is not asked to summarise.
 * Story RPG reads it as prose; LitRPG as a System log that reuses the System window's own lines.
 */
import type { GameState } from './types';
import { resumeMainQuestFocus } from './questPlay';
import { recentChoices } from './choiceJournal';
import { originLine } from './rules/rpgOrigin';
import { approvalBandLabel, recruitedCompanions } from './rules/companions';
import { buildLitrpgSystemWindow } from './litrpgSystemWindow';

const HOUR_MS = 3_600_000;
/** Real hours away before a recap is shown. */
export const RECAP_AFTER_HOURS = 1;
const RECAP_CHOICES = 3;

/** Why no recap applies (null when one does). */
export function awayRecapBlock(state: GameState): string | null {
  if (state.engineMode !== 'rpg' && state.engineMode !== 'litrpg') return 'not story RPG or LitRPG';
  if (!state.openingEstablishment?.complete) return 'opening not done';
  if (state.playPhase === 'down' || state.playPhase === 'ended') return 'play is over';
  return null;
}

export function awaySpan(hours: number): string {
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 24) return 'a day';
  const h = Math.floor(hours);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

function joinAnd(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function stillRemembers(state: GameState): string[] {
  return (state.arcDirector?.pyoaDelayedConsequences ?? [])
    .filter((c) => c.status === 'pending' && c.payload.awaitsNpc)
    .map((c) => c.payload.awaitsNpc!.trim());
}

function rpgRecap(state: GameState, span: string): string[] {
  const lines: string[] = [];
  const here = state.currentLocation?.trim();
  lines.push(`When you last stopped, ${span} ago, you were at ${here || 'the place you left off'}.`);
  const origin = originLine(state);
  if (origin) lines.push(origin);
  if (state.activeEncounter) lines.push(`You were in a fight with ${state.activeEncounter.name}.`);
  const party = recruitedCompanions(state);
  if (party.length) lines.push(`${joinAnd(party.map((c) => `${c.name} (${approvalBandLabel(state, c.name)})`))} ${party.length > 1 ? 'are' : 'is'} with you.`);
  const choices = recentChoices(state, RECAP_CHOICES);
  if (choices.length) lines.push(`Lately: ${choices.map((c) => lowerFirst(c.text.replace(/\.$/, ''))).join('; ')}.`);
  const remember = stillRemembers(state);
  if (remember.length) lines.push(`${joinAnd(remember)} ${remember.length > 1 ? 'have' : 'has'} not forgotten what you did.`);
  const focus = resumeMainQuestFocus(state);
  if (focus.quest && focus.nextObjective) lines.push(`${focus.quest.name}: next, ${lowerFirst(focus.nextObjective)}.`);
  else if (focus.quest) lines.push(`${focus.quest.name} is still yours to finish.`);
  return lines;
}

function litrpgRecap(state: GameState, span: string): string[] {
  const window = buildLitrpgSystemWindow(state);
  const lines = [`[System] Session resumed. Time away: ${span}.`];
  if (state.currentLocation?.trim()) lines.push(`[System] Location: ${state.currentLocation.trim()}`);
  if (state.activeEncounter) lines.push(`[System] Combat in progress: ${state.activeEncounter.name}`);
  for (const l of window?.lines ?? []) {
    if (/^(?:Name|Level|Class|HP|Party|Floor)\b/.test(l)) lines.push(`[System] ${l}`);
  }
  const focus = resumeMainQuestFocus(state);
  if (focus.quest) lines.push(`[System] Quest: ${focus.quest.name}${focus.nextObjective ? ` — next: ${focus.nextObjective}` : ''}`);
  return lines;
}

/** The recap for real time away, or null (under an hour, wrong mode, play over). */
export function buildAwayRecap(state: GameState, awayMs: number): string[] | null {
  if (!Number.isFinite(awayMs) || awayMs <= 0 || awayRecapBlock(state)) return null;
  const hours = awayMs / HOUR_MS;
  if (hours < RECAP_AFTER_HOURS) return null;
  const span = awaySpan(hours);
  return state.engineMode === 'litrpg' ? litrpgRecap(state, span) : rpgRecap(state, span);
}
