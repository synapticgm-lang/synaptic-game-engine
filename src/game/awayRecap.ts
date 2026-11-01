/**
 * Welcome-back recap (T10RECAP). When a save is resumed after real time away, one pure function builds
 * 3–4 plain lines from the ledger (where / who / quest / last beat). The UI only renders them — the
 * recap never mutates GameState, never rolls, never grants XP, and never calls a writer.
 *
 * Threshold default is RECAP_AFTER_HOURS (6), also stamped on HouseRules.recapAfterHours so the
 * house-rules menu can reach it later. All modes except Pick Your Own Adventure.
 */
import type { GameState, LogEntry } from './types';
import { resumeMainQuestFocus } from './questPlay';
import { recruitedCompanions } from './rules/companions';
import { peopleHere } from './scenePresence';

const HOUR_MS = 3_600_000;

/** Real hours away before the welcome-back card shows (default; HouseRules.recapAfterHours overrides). */
export const RECAP_AFTER_HOURS = 6;

/** Clamp the welcome-back threshold (1 hour … 7 days). */
export function clampRecapAfterHours(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : RECAP_AFTER_HOURS;
  return Math.max(1, Math.min(168, v));
}

/** ONE owner for the welcome-back hours threshold (houseRules on the save). */
export function recapAfterHoursOf(state: Pick<GameState, 'houseRules'> | null | undefined): number {
  const raw = state?.houseRules?.recapAfterHours;
  return clampRecapAfterHours(raw == null ? RECAP_AFTER_HOURS : raw);
}

/** Why no recap applies (null when one does). PYOA is excluded by order. */
export function awayRecapBlock(state: GameState): string | null {
  if (state.engineMode === 'pyoa') return 'pyoa';
  if (state.engineMode !== 'rpg' && state.engineMode !== 'litrpg' && state.engineMode !== 'dnd') {
    return 'unsupported mode';
  }
  if (!state.openingEstablishment?.complete) return 'opening not done';
  if (state.playPhase === 'down' || state.playPhase === 'ended') return 'play is over';
  return null;
}

export function awaySpan(hours: number): string {
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 24) return 'a day';
  const h = Math.max(1, Math.floor(hours));
  return `${h} hour${h === 1 ? '' : 's'}`;
}

function joinAnd(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Drop empty / undefined / Nobody-style placeholders — never print those words. */
function cleanLabel(raw: string | null | undefined): string | null {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/^(?:undefined|null|nobody|no one|none|n\/a|—|-)$/i.test(t)) return null;
  return t;
}

function stripMarkup(s: string): string {
  return s
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\[System\]\s*/gi, '')
    .replace(/[`*_#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Story RPG hides numbers; tabletop / LitRPG may keep them (mode-rules-matrix Numbers shown). */
function showsNumbers(state: GameState): boolean {
  return state.engineMode === 'dnd' || state.engineMode === 'litrpg';
}

function hideNumbers(s: string): string {
  return s
    .replace(/\b\d+\s*\/\s*\d+\s*HP\b/gi, '')
    .replace(/\b(?:HP|MP|XP|AC|DC|Level|Rank)\s*[:=]?\s*\d+(?:\s*\/\s*\d+)?\b/gi, '')
    .replace(/\b\d+\s*(?:HP|MP|XP)\b/gi, '')
    .replace(/\(\s*\+/g, '(')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

function plainLine(s: string, showNums: boolean): string | null {
  let t = stripMarkup(s);
  if (!showNums) t = hideNumbers(t);
  t = t.replace(/\s+/g, ' ').trim();
  if (!t || /^(?:undefined|null)$/i.test(t)) return null;
  if (t.length > 160) t = `${t.slice(0, 157).trim()}…`;
  return t;
}

const RAW_SYSTEM =
  /^(?:AUTHORITY|SNAPSHOT|CRAFT|BINDING|RAILS|RECORD|GM:|TURN JOB|STATUS|ARC DIRECTOR)/i;

function lastReceiptLine(state: GameState, showNums: boolean): string | null {
  const beat = cleanLabel(state.sceneFacts?.lastBeat);
  if (beat) {
    const plain = plainLine(beat, showNums);
    if (plain) return plain;
  }
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const e = log[i] as LogEntry | undefined;
    if (!e || e.role !== 'gm') continue;
    for (const raw of e.systemLog ?? []) {
      const cleaned = cleanLabel(raw);
      if (!cleaned || RAW_SYSTEM.test(cleaned)) continue;
      const plain = plainLine(cleaned, showNums);
      if (plain) return plain;
    }
    break;
  }
  return null;
}

function whereLine(state: GameState): string | null {
  const here = cleanLabel(state.currentLocation);
  if (!here) return null;
  return `You are at ${here}.`;
}

function whoLine(state: GameState): string | null {
  const party = recruitedCompanions(state)
    .map((c) => cleanLabel(c.name))
    .filter((n): n is string => !!n);
  if (party.length) {
    return `${joinAnd(party)} ${party.length > 1 ? 'are' : 'is'} with you.`;
  }
  const present = peopleHere(state)
    .map((n) => cleanLabel(n))
    .filter((n): n is string => !!n)
    .slice(0, 4);
  if (!present.length) return null;
  return `${joinAnd(present)} ${present.length > 1 ? 'are' : 'is'} here.`;
}

function questLine(state: GameState): string | null {
  const focus = resumeMainQuestFocus(state);
  const name = cleanLabel(focus.quest?.name);
  if (!name) return null;
  const next = cleanLabel(focus.nextObjective);
  if (next) return `${name}: next, ${lowerFirst(next)}.`;
  return `${name} is still open.`;
}

function lastLine(state: GameState): string | null {
  const showNums = showsNumbers(state);
  if (state.activeEncounter) {
    const foe = cleanLabel(state.activeEncounter.name);
    if (foe) {
      const hp =
        showNums && typeof state.activeEncounter.hp === 'number' && Number.isFinite(state.activeEncounter.hp)
          ? ` (${Math.max(0, Math.round(state.activeEncounter.hp))} HP)`
          : '';
      return `You were in a fight with ${foe}${hp}.`;
    }
  }
  const last = lastReceiptLine(state, showNums);
  return last ? `Last: ${last}` : null;
}

/**
 * Pure welcome-back lines from the save, or null (under threshold / blocked / nothing to say).
 * Omits any slot whose data is missing. Never prints undefined / Nobody / empty names.
 */
export function buildAwayRecap(state: GameState, awayMs: number): string[] | null {
  if (!Number.isFinite(awayMs) || awayMs <= 0 || awayRecapBlock(state)) return null;
  const hours = awayMs / HOUR_MS;
  if (hours < recapAfterHoursOf(state)) return null;
  const lines = [whereLine(state), whoLine(state), questLine(state), lastLine(state)].filter(
    (l): l is string => !!l,
  );
  return lines.length ? lines : null;
}
