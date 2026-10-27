/**
 * M1 — one structured TurnLog record per turn.
 * Shape is stable for orders 7 and 10B (cost/time). Written through fate-autoplay turns.jsonl
 * and client debugLogger / telemetry — NO new DB table (DB frozen).
 *
 * Documented fields below are the contract. Do not rename without updating 7 / 10B readers.
 */

import type { FactSheet } from './factSheet';
import { hashFactSheet } from './factSheet';

/** One dice roll the engine made this turn (SRD die + mods + DC + result). */
export interface TurnLogDiceRoll {
  /** Die expression, e.g. "d20", "2d6". */
  die: string;
  mods: number;
  dc?: number;
  total: number;
  result: 'hit' | 'miss' | 'success' | 'failure' | 'crit' | 'fumble' | 'other';
  label?: string;
}

/** AI role cost/time for this turn (writer / repair / check). */
export interface TurnLogAiRole {
  role: 'writer' | 'repair' | 'check' | 'other';
  model?: string;
  /** Prompt + completion tokens when the provider reported them. */
  tokensIn?: number;
  tokensOut?: number;
  /** USD when known; null = not reported. */
  costUsd?: number | null;
  latencyMs?: number;
}

/** Checker / gate verdict lines (engine fact gate, commit gate, etc.). */
export interface TurnLogCheckerVerdict {
  checker: string;
  verdict: 'pass' | 'fail' | 'repair' | 'skip';
  detail?: string;
}

/** Minimal state snapshot for diffing (extend carefully — orders 7/10B depend on stability). */
export interface TurnLogStateSlice {
  location?: string;
  hp?: number;
  maxHp?: number;
  gold?: number;
  xp?: number;
  level?: number;
  questTitles?: string[];
}

/**
 * One turn's structured log. Fate writes the full object onto turns.jsonl as `turnLog`.
 * Client debugLogger records a compact TURN_LOG event with the same shape.
 */
export interface TurnLog {
  /** Schema version — bump when a required field is renamed/removed. */
  v: 1;
  turn: number;
  input: string;
  /** Parsed intent kind/label when available (M2 deepens this). */
  parsedIntent?: { kind: string; label: string };
  /** Engine beat outcomes (display). */
  engineBeats: string[];
  diceRolls: TurnLogDiceRoll[];
  stateBefore: TurnLogStateSlice;
  stateAfter: TurnLogStateSlice;
  /** Hash of the FactSheet handed to the writer. */
  factSheetHash: string;
  /** Optional compact sheet for offline bank re-record (omit in hot client path if large). */
  factSheet?: FactSheet;
  ai: TurnLogAiRole[];
  checkerVerdicts: TurnLogCheckerVerdict[];
  finalProse: string;
  chipsOffered: string[];
  /** Wall-clock for the whole turn. */
  latencyMs: number;
  startedAt?: string;
  endedAt?: string;
}

export function sliceState(state: {
  currentLocation?: string;
  character?: { hp?: number; maxHp?: number; xp?: number; level?: number };
  gold?: number;
  quests?: Array<{ title?: string; name?: string; status?: string }>;
}): TurnLogStateSlice {
  const questTitles = (state.quests ?? [])
    .filter((q) => q.status === 'active' || q.status === 'revealed' || !q.status)
    .map((q) => q.title || q.name || '')
    .filter(Boolean)
    .slice(0, 8);
  return {
    location: state.currentLocation,
    hp: state.character?.hp,
    maxHp: state.character?.maxHp,
    gold: state.gold,
    xp: state.character?.xp,
    level: state.character?.level,
    questTitles: questTitles.length ? questTitles : undefined,
  };
}

export interface BuildTurnLogArgs {
  turn: number;
  input: string;
  parsedIntent?: { kind: string; label: string };
  engineBeats?: string[];
  diceRolls?: TurnLogDiceRoll[];
  stateBefore: TurnLogStateSlice;
  stateAfter: TurnLogStateSlice;
  factSheet: FactSheet;
  /** Include full sheet on the log (fate bank re-record). Default false on client. */
  includeFactSheet?: boolean;
  ai?: TurnLogAiRole[];
  checkerVerdicts?: TurnLogCheckerVerdict[];
  finalProse: string;
  chipsOffered: string[];
  latencyMs: number;
  startedAt?: string;
  endedAt?: string;
}

export function buildTurnLog(args: BuildTurnLogArgs): TurnLog {
  const hash = hashFactSheet(args.factSheet);
  return {
    v: 1,
    turn: args.turn,
    input: args.input,
    parsedIntent: args.parsedIntent,
    engineBeats: args.engineBeats ?? [],
    diceRolls: args.diceRolls ?? [],
    stateBefore: args.stateBefore,
    stateAfter: args.stateAfter,
    factSheetHash: hash,
    factSheet: args.includeFactSheet ? args.factSheet : undefined,
    ai: args.ai ?? [],
    checkerVerdicts: args.checkerVerdicts ?? [],
    finalProse: args.finalProse,
    chipsOffered: args.chipsOffered,
    latencyMs: args.latencyMs,
    startedAt: args.startedAt,
    endedAt: args.endedAt,
  };
}

/** Harvest dice-looking lines from engine STATUS / fight facts into TurnLogDiceRoll[]. */
export function diceRollsFromReceipts(receipts: string[]): TurnLogDiceRoll[] {
  const out: TurnLogDiceRoll[] = [];
  for (const line of receipts) {
    // SRD-style: "d20 11 + 5 = 16 vs DC 15" or "d20 7 + 5 = 12 vs AC 8"
    const m = line.match(
      /\b(d\d+(?:\/d\d+)?)\s*(?:\([^)]*\))?\s*(\d+)?\s*(?:\+\s*(\d+))?\s*=\s*(\d+)(?:\s*vs\s*(?:DC|AC)\s*(\d+))?/i
    );
    if (!m) continue;
    const total = Number(m[4]);
    const dc = m[5] != null ? Number(m[5]) : undefined;
    const mods = m[3] != null ? Number(m[3]) : 0;
    let result: TurnLogDiceRoll['result'] = 'other';
    if (dc != null) result = total >= dc ? 'success' : 'failure';
    else if (/\bhit\b/i.test(line)) result = 'hit';
    else if (/\bmiss\b/i.test(line)) result = 'miss';
    else if (/\bcrit/i.test(line)) result = 'crit';
    out.push({
      die: m[1]!.toLowerCase(),
      mods,
      dc,
      total,
      result,
      label: line.length > 120 ? `${line.slice(0, 117)}…` : line,
    });
  }
  return out.slice(0, 24);
}
