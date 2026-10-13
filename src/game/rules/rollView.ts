/**
 * Shared rules engine — what a shown roll line says about its d20. The engine has already rolled and printed the
 * line; this only reads the kept die back so the player's dice skin and animation mode can show it. It never rolls.
 */
import type { DiceAnimationMode } from '../types';

export interface ShownD20 {
  /** The die the engine kept (the higher with Advantage, the lower with Disadvantage). */
  kept: number;
  /** Both dice when two were rolled. */
  dice: number[];
  adv: 'advantage' | 'disadvantage' | null;
  crit: boolean;
  fumble: boolean;
}

/** Every d20 form the engine presenters print: "d20 14", "d20 (14)", "d20 (adv: 3, 17) 17", "d20:14", "d20(14)", "d20=14", "d20 = 14". */
const D20_SOURCE = String.raw`\bd20\s*(?:\(\s*(adv|dis)\s*:\s*(\d{1,2})\s*,\s*(\d{1,2})\s*\)(?:\s+(\d{1,2})\b)?|\(\s*(\d{1,2})\s*\)|[:=]\s*(\d{1,2})\b|\s(\d{1,2})\b)`;

/** The first d20 a line shows. */
export function shownD20(line: string): ShownD20 | null {
  const m = new RegExp(D20_SOURCE, 'i').exec(line ?? '');
  return m ? readD20(m) : null;
}

/** A shown line cut into plain text and the d20 rolls in it, in order; joining every `text` gives the line back. */
export type RollLinePart = { text: string; roll?: ShownD20 };

export function splitRollLine(line: string): RollLinePart[] {
  const parts: RollLinePart[] = [];
  let at = 0;
  for (const m of (line ?? '').matchAll(new RegExp(D20_SOURCE, 'gi'))) {
    const roll = readD20(m);
    if (!roll) continue;
    if (m.index! > at) parts.push({ text: line.slice(at, m.index) });
    parts.push({ text: m[0], roll });
    at = m.index! + m[0].length;
  }
  if (at < (line ?? '').length) parts.push({ text: line.slice(at) });
  return parts;
}

function readD20(m: RegExpMatchArray): ShownD20 | null {
  let dice: number[];
  let kept: number;
  let adv: ShownD20['adv'] = null;
  if (m[1]) {
    adv = m[1].toLowerCase() === 'adv' ? 'advantage' : 'disadvantage';
    dice = [Number(m[2]), Number(m[3])];
    kept = m[4] ? Number(m[4]) : adv === 'advantage' ? Math.max(...dice) : Math.min(...dice);
  } else {
    kept = Number(m[5] ?? m[6] ?? m[7]);
    dice = [kept];
  }
  if (!Number.isInteger(kept) || kept < 1 || kept > 20) return null;
  return { kept, dice, adv, crit: kept === 20, fumble: kept === 1 };
}

/** How long the player's chosen roll animation runs; Excited grows with the number rolled. */
export function rollAnimationMs(mode: DiceAnimationMode, kept: number): number {
  if (mode === 'static') return 0;
  if (mode === 'normal') return 450;
  return Math.round(700 + (Math.max(1, Math.min(20, kept)) / 20) * 800);
}

/** Excited only: how big the tumble gets, 1 (a 1) to 1.35 (a 20). */
export function rollAnimationScale(mode: DiceAnimationMode, kept: number): number {
  if (mode !== 'excited') return 1;
  return Math.round((1 + (Math.max(1, Math.min(20, kept)) / 20) * 0.35) * 100) / 100;
}

export interface DiceRollHookDetail {
  kept: number;
  crit: boolean;
  fumble: boolean;
  mode: DiceAnimationMode;
  material: string | null;
  source: 'engine' | 'tray';
}

/** Sound hook: fired once when a roll is shown (never for Static). A sound pack listens for `sgm:dice-roll`. */
export const DICE_ROLL_EVENT = 'sgm:dice-roll';

export function emitDiceRoll(detail: DiceRollHookDetail): void {
  if (detail.mode === 'static' || typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DiceRollHookDetail>(DICE_ROLL_EVENT, { detail }));
}
