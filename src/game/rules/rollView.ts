/**
 * Shared rules engine — shown roll lines and VR1 pre-roll / result text from CheckResultRecord.
 * Never rolls. SRD 5.2.1 (WotC CC BY 4.0): DC hidden before the roll unless the effect states it.
 */
import type { DiceAnimationMode } from '../types';
import type { CheckResultRecord } from '../checkRules';
import type { CheckSpec } from '../checkMath';

const ABILITY_NAME: Record<string, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};
const SKILL_NAME: Record<string, string> = {
  athletics: 'Athletics', acrobatics: 'Acrobatics', perception: 'Perception', investigation: 'Investigation',
  stealth: 'Stealth', thievery: 'Sleight of Hand', persuasion: 'Persuasion', arcana: 'Arcana', survival: 'Survival',
};

/** UI tag from CheckSpec — never rewrite the chip label (plan §4). */
export function checkSpecTag(spec: CheckSpec): string {
  const ab = ABILITY_NAME[spec.ability] ?? spec.ability;
  if (spec.kind === 'attack') return 'attack roll';
  if (spec.kind === 'save') return `${ab} save`;
  const sk = spec.skill ? (SKILL_NAME[spec.skill] ?? spec.skill) : undefined;
  if (spec.kind === 'contest') return sk ? `${ab} (${sk}) contest` : `${ab} contest`;
  return sk ? `${ab} (${sk}) roll` : `${ab} roll`;
}

/** Pre-roll line; DC only when dcShown. */
export function formatPreRollLine(spec: CheckSpec): string {
  const ab = ABILITY_NAME[spec.ability] ?? spec.ability;
  const sk = spec.skill ? (SKILL_NAME[spec.skill] ?? spec.skill) : undefined;
  const stem = spec.kind === 'contest' ? 'contest' : 'check';
  let head = spec.kind === 'save' ? `${ab} save` : spec.kind === 'attack' ? 'Attack roll'
    : sk ? `${ab} (${sk}) ${stem}` : `${ab} ${stem}`;
  if (spec.dcShown) head += ` (DC ${spec.dc})`;
  return `${head} — rolling a d20…`;
}

/** Result line from CheckResultRecord (VR1-5). */
export function formatResultLine(rec: CheckResultRecord): string {
  if (rec.auto) return `${rec.label}: no roll (${rec.auto}) — ${rec.outcome}`;
  const dice = rec.advState === 'normal' ? `d20 ${rec.kept}`
    : `d20 (${rec.advState === 'advantage' ? 'adv' : 'dis'}: ${rec.d20s.join(', ')}) ${rec.kept}`;
  let mods = '';
  for (let i = 0; i < rec.mods.length; i++) {
    const m = rec.mods[i]!;
    if (m.value === 0) continue;
    mods += `${mods ? ' ' : ''}${m.value >= 0 ? '+ ' : '− '}${Math.abs(m.value)} (${m.label})`;
  }
  return `${dice}${mods ? ` ${mods}` : ''} = ${rec.total} vs DC ${rec.dc} — ${rec.outcome}`;
}

/** Writer outcome fact from the record (VR1-b). SRD 5.2.1: result settled before narration (WotC CC BY 4.0). */
export function outcomeFactFromRecord(rec: CheckResultRecord): string {
  return `Check ${rec.outcome}.`;
}

const signedMod = (n: number) => `${n >= 0 ? '+' : '−'} ${Math.abs(n)}`;

/**
 * STATUS presentation of a flee/parley CheckResultRecord (VR1-b).
 * Maths come only from the record (+ foe side for Escape contests); not a second roll path.
 * SRD 5.2.1 Escape contest / Influence check (WotC CC BY 4.0).
 */
export function formatBreakAwayStatus(
  kind: 'flee' | 'parley',
  rec: CheckResultRecord,
  foe?: { name: string; die: number; mod: number },
): string {
  const mod = rec.mods.reduce((s, m) => s + m.value, 0);
  if (kind === 'flee' && foe) {
    const foeTotal = foe.die + foe.mod;
    return `Flee check: d20 ${rec.kept} ${signedMod(mod)} = ${rec.total} vs ${foe.name} d20 ${foe.die} ${signedMod(foe.mod)} = ${foeTotal} — ${rec.outcome}`;
  }
  return `Parley check: d20 ${rec.kept} ${signedMod(mod)} vs DC ${rec.dc} — ${rec.outcome}`;
}

/** STATUS: completed VR1 result shapes (not the pre-roll "rolling a d20…" cue — that has no kept die). */
export function isVr1RollLine(line: string): boolean {
  const t = (line ?? '').trim();
  if (t.endsWith(' — rolling a d20…')) return false;
  const okEnd = t.endsWith(' — success') || t.endsWith(' — failure');
  if (!okEnd) return false;
  if (t.startsWith('d20 ') && t.includes(' vs DC ')) return true;
  // formatCheckRecord from CheckResultRecord (travel jobs, Extended Travel): "… d20 (N) … vs DC N — …"
  if (t.includes(' d20 (') && t.includes(' vs DC ')) return true;
  return t.includes(': no roll (');
}

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
