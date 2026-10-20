/**
 * q76a-INVARIANTS — per-turn rules checker (audit / stress / check-lap).
 * No third-party library; reuses travelPadBlocked, isDying, peopleHere, checkPlayCrimes,
 * checkSpecTag, formatPreRollLine, engineChips, isTravelPad, classifyEdgeType.
 * SRD 5.2.1 Death Saving Throws / Dropping to 0 Hit Points (Wizards of the Coast, CC BY 4.0):
 * while dying, only death-save / present-ally stabilise / potion chips.
 * Chip contract (feature-groups-plan §4): labels stay plain; CheckSpec / consequence stay on the record.
 */
import type { GameState } from '../types';
import type { CheckSpec } from '../checkMath';
import { travelPadBlocked, isTravelPad } from '../padUniverse';
import { isDying } from '../tabletop/roundFight';
import { peopleHere } from '../chipLegality';
import { checkPlayCrimes } from '../turnCheck';
import { checkSpecTag, formatPreRollLine } from '../rules/rollView';
import { engineChips } from '../choicePipeline';
import { classifyEdgeType } from '../graphChoices';

export type InvariantSeverity = 'P0' | 'P1';
export type InvariantViolation = { code: string; severity: InvariantSeverity; detail: string };
/** Plain label, or structured offered-chip record (CheckSpec / consequence off the label). */
export type TurnOption =
  | string
  | { label: string; check?: CheckSpec | null; consequence?: string; kind?: string };
export type TurnInvariantInput = {
  offeredOptions: TurnOption[];
  playerInput: string;
  typed: boolean;
  prose: string;
  answered?: boolean;
  visibleAnswer?: string;
  speakers?: string[];
};

const PRE_ROLL_TAIL = ' — rolling a d20…';

/**
 * Six turn invariants. Report-only; does not mutate play.
 */
export function checkTurnInvariants(
  before: GameState,
  after: GameState,
  turn: TurnInvariantInput,
): InvariantViolation[] {
  const out: InvariantViolation[] = [];
  const opts: Array<{ label: string; check?: CheckSpec | null; consequence?: string; kind?: string }> = [];
  const raw = turn.offeredOptions ?? [];
  for (let i = 0; i < raw.length; i++) {
    const o = raw[i]!;
    if (typeof o === 'string') {
      const label = o.trim();
      if (label) opts.push({ label });
    } else {
      const label = (o.label ?? '').trim();
      if (label) opts.push({ label, check: o.check, consequence: o.consequence, kind: o.kind });
    }
  }
  const blocked = travelPadBlocked(before);
  const dying = isDying(before);
  const input = (turn.playerInput ?? '').trim();
  const moved =
    (before.currentLocation ?? '') !== (after.currentLocation ?? '')
    || (!!before.journey && !!after.journey && (after.journey.legsDone ?? 0) > (before.journey.legsDone ?? 0));

  // (1) no travel offered or honoured when travelPadBlocked
  if (blocked) {
    for (let i = 0; i < opts.length; i++) {
      const label = opts[i]!.label;
      if (isTravelPad(label) || classifyEdgeType(label) === 'travel') {
        out.push({ code: 'travel-blocked', severity: 'P0', detail: `travel option offered while travelPadBlocked: "${label}"` });
      }
    }
    if (moved) {
      out.push({ code: 'travel-blocked', severity: 'P0', detail: 'travel honoured while travelPadBlocked (location or journey advanced)' });
    }
  }

  // (2) at 0 HP dying, only dying options
  if (dying) {
    const dyingLabels = new Set<string>();
    const chips = engineChips(before);
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i]!;
      if (c.kind === 'dying') dyingLabels.add(c.label.trim().toLowerCase());
    }
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i]!;
      const kindOk = o.kind === 'dying' || dyingLabels.has(o.label.toLowerCase());
      if (!kindOk || isTravelPad(o.label) || classifyEdgeType(o.label) === 'travel') {
        out.push({ code: 'dying-options', severity: 'P0', detail: `non-dying option while isDying: "${o.label}"` });
      }
    }
  }

  // (3) every typed line gets a visible answer
  const answered =
    (typeof turn.visibleAnswer === 'string' && turn.visibleAnswer.trim().length > 0) || turn.answered === true;
  if (turn.typed && input && !answered) {
    out.push({ code: 'typed-unanswered', severity: 'P0', detail: `typed line has no visible answer: "${input.slice(0, 80)}"` });
  }

  // (4) every speaker is engine-tagged present (q72 / peopleHere)
  const here = new Set<string>();
  for (const n of peopleHere(before)) {
    const t = n.trim().toLowerCase();
    if (t) here.add(t);
  }
  for (const n of peopleHere(after)) {
    const t = n.trim().toLowerCase();
    if (t) here.add(t);
  }
  const speakers = turn.speakers ?? [];
  for (let i = 0; i < speakers.length; i++) {
    const who = speakers[i]!;
    const low = who.trim().toLowerCase();
    let ok = !low || here.has(low);
    if (!ok) {
      for (const h of here) {
        if (h.includes(low) || low.includes(h)) { ok = true; break; }
      }
    }
    if (!ok) out.push({ code: 'absent-speaker', severity: 'P0', detail: `${who} speaks but is not engine-present` });
  }

  // (5) labels hold no CheckSpec / consequence field text
  for (let i = 0; i < opts.length; i++) {
    const opt = opts[i]!;
    const low = opt.label.toLowerCase();
    if (opt.consequence) {
      const c = opt.consequence.trim();
      if (c.length >= 4 && low.includes(c.toLowerCase())) {
        out.push({ code: 'label-outcome', severity: 'P0', detail: `label embeds consequence field: "${opt.label}"` });
        continue;
      }
    }
    const check = opt.check;
    if (!check) continue;
    const tag = checkSpecTag(check);
    if (tag && low.includes(tag.toLowerCase())) {
      out.push({ code: 'label-outcome', severity: 'P0', detail: `label embeds CheckSpec tag "${tag}": "${opt.label}"` });
      continue;
    }
    const pre = formatPreRollLine(check);
    const head = pre.endsWith(PRE_ROLL_TAIL) ? pre.slice(0, pre.length - PRE_ROLL_TAIL.length).trim() : pre.trim();
    if (head.length >= 4 && low.includes(head.toLowerCase())) {
      out.push({ code: 'label-outcome', severity: 'P0', detail: `label embeds CheckSpec pre-roll "${head}": "${opt.label}"` });
    }
  }

  // (6) no system/ledger terms — reuse checkPlayCrimes wrong-voice
  const crimes = checkPlayCrimes(before, after, input, turn.prose ?? '');
  for (let i = 0; i < crimes.p0.length; i++) {
    const f = crimes.p0[i]!;
    if (f.kind === 'wrong-voice' && f.detail.includes('system ledger')) {
      out.push({ code: 'system-ledger', severity: 'P0', detail: f.detail });
    }
  }
  return out;
}
