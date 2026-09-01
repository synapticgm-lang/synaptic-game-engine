/**
 * Harder post-GM commit gate — classifier only, no new CRAFT / critic LLM.
 * Atmosphere-only, missing pointer-card slot, or recycle-without-delta
 * must not commit as-is: strip prefix / stitch one concrete / retry once.
 */

import type { GameState } from './types';
import { compilePointerCardSlots } from './openingPointerCard';
import {
  detectAtmosphereReprint,
  detectLeadingCollage,
  detectSameRoomEssayHard,
  detectDialogueTreadmillHard,
  isAtmosphereOnlyBeat,
  playerAsksRepeat,
  recentGmBeatTexts,
  stripRecycledPrefix,
} from './semanticLoopDetector';

export type CommitGateReason =
  | 'atmosphere-only'
  | 'missing-pointer-slot'
  | 'recycle-without-delta'
  | 'same-room-essay'
  | 'craft-ignore';

export type CommitGateResult = {
  accept: boolean;
  reasons: CommitGateReason[];
};

const SLOT_STOP = new Set([
  'there', 'their', 'about', 'under', 'after', 'before', 'which', 'these', 'those',
  'happened', 'summoned', 'location', 'people', 'person', 'someone', 'something',
]);

function distinctiveTokens(raw: string): string[] {
  return (raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !SLOT_STOP.has(w));
}

function slotMentioned(prose: string, slot: string): boolean {
  const tokens = distinctiveTokens(slot);
  if (!tokens.length) return true;
  const hay = (prose ?? '').toLowerCase();
  return tokens.some((t) => hay.includes(t));
}

export function missingPointerCardSlot(state: GameState, prose: string): boolean {
  const est = state.openingEstablishment;
  if (!est) return false;
  const opening = !est.complete || (state.turn ?? 0) <= 2;
  if (!opening) return false;
  const slots = compilePointerCardSlots(state);
  if (!slots) return false;
  if (slots.where && !slotMentioned(prose, slots.where)) return true;
  if (slots.whoCount > 0 && slots.who && !slotMentioned(prose, slots.who)) return true;
  return false;
}

export function classifyBeatCommit(
  state: GameState,
  prose: string,
  playerInput?: string
): CommitGateResult {
  const reasons: CommitGateReason[] = [];
  const text = (prose ?? '').trim();
  if (!text) return { accept: true, reasons };
  if (playerAsksRepeat(playerInput ?? '')) return { accept: true, reasons };

  if (missingPointerCardSlot(state, text)) reasons.push('missing-pointer-slot');

  const afterOpening = state.openingEstablishment?.complete === true && (state.turn ?? 0) > 0;
  const recent = recentGmBeatTexts(state);
  if (afterOpening || recent.length > 0) {
    if (isAtmosphereOnlyBeat(text)) reasons.push('atmosphere-only');
    const collage = detectLeadingCollage(text, recent);
    if ((collage.hit && !collage.tailHasNewContent) || detectAtmosphereReprint(text, recent)) {
      reasons.push('recycle-without-delta');
    }
  }

  // Batch F — HARD same-room essay on inspect/wait/scout (pad interrupt alone is not enough).
  if (detectSameRoomEssayHard(text, recent, playerInput ?? '')) {
    if (!reasons.includes('same-room-essay')) reasons.push('same-room-essay');
    if (!reasons.includes('recycle-without-delta')) reasons.push('recycle-without-delta');
  }

  // Batch S — HARD dialogue treadmill (Wall Sergeant rain/leather recycle).
  if (detectDialogueTreadmillHard(text, recent, playerInput ?? '')) {
    if (!reasons.includes('recycle-without-delta')) reasons.push('recycle-without-delta');
  }

  return { accept: reasons.length === 0, reasons };
}

/**
 * Diegetic one-line delta when a beat is rejected.
 * Never emit stall chrome (Batch E) or "holds the beat / glance, a breath…" (Batch G).
 */
export function stitchCommitDelta(state: GameState): string {
  const slots = compilePointerCardSlots(state);
  const loc = (state.currentLocation || slots?.where || 'this room').replace(/\.$/, '');
  const people = (state.sceneFacts?.present ?? [])
    .map((p) => String(p).trim())
    .filter(
      (p) =>
        p
        && !/^figure\s+\d+$/i.test(p)
        && !/^bystanders?$/i.test(p)
        && !/^it$/i.test(p)
        && !/^(they|them|one|press|scattered\s+scale)$/i.test(p)
    );
  const present = people[0];
  const props = (state.sceneFacts?.props ?? []).map((p) => String(p).trim()).filter(Boolean);
  const empty = state.sceneFacts?.emptyContainers ?? [];
  const prop = props.find((p) => !empty.some((e) => p.toLowerCase().includes(e.toLowerCase()))) ?? props[0];
  const exitHint = (slots?.firstPressure ?? '').trim();
  const turn = state.turn ?? 0;
  const bank = [
    present
      ? `${present} shifts weight in ${loc} and leaves you one clear next move.`
      : '',
    prop
      ? `The ${prop} in ${loc} is done yielding — speak, leave, or take a stake.`
      : '',
    empty.length
      ? `The ${empty[0]} in ${loc} is empty. The room asks for an exit or a person, not another sift.`
      : '',
    exitHint
      ? `In ${loc}, a way out still waits — ${String(exitHint).slice(0, 48).replace(/\.$/, '')}.`
      : '',
    `In ${loc}, the empty is honest: choose an exit, a person, or a stake.`,
  ].filter(Boolean);
  return bank[turn % bank.length] || bank[bank.length - 1]!;
}

/** Banned verbatim stall loops from older commit-gate / recovery stitches. */
export function isVerbatimStallStub(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return (
    /\bthe moment has not moved on\b/i.test(text)
    || /\bfigure\s+\d+\s+is still here\b/i.test(text)
    || /\bis still here in [^—.\n]{2,60}\s*[—-]\s*the moment has not moved on\b/i.test(text)
    || /\bholds the beat\b/i.test(text)
    || /\ba glance,\s*a breath(?:,\s*a cost still unpaid)?\b/i.test(text)
    || /\ba cost still unpaid\b/i.test(text)
  );
}

/** Director / CRAFT / AUTHORITY chrome must never commit as GM body (Batch G). */
export function isDirectorChromeLeak(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return (
    /\bdo not invent\b/i.test(text)
    || /\btelegraph first\b/i.test(text)
    || /\bno prior cast\b/i.test(text)
    || /\bno debris,\s*no prior\b/i.test(text)
    || /\bFORBID:\s*/i.test(text)
    || /\bCRAFT:\s*/i.test(text)
    || /\bAUTHORITY:\s*/i.test(text)
    || /\bARC (?:BEAT|DIRECTOR)\b/i.test(text)
    || /\bTURN JOB:\s*/i.test(text)
    || /\bSNAPSHOT\b/i.test(text) && /\bPresence:\s*/i.test(text)
  );
}

/** Strip director chrome sentences; leave diegetic prose. */
export function scrubDirectorChrome(text: string): { prose: string; scrubbed: boolean } {
  if (!text?.trim()) return { prose: text ?? '', scrubbed: false };
  const parts = text.split(/(?<=[.!?])\s+/);
  const kept = parts.filter((s) => !isDirectorChromeLeak(s));
  const prose = kept.join(' ').replace(/\s{2,}/g, ' ').trim();
  return { prose, scrubbed: prose !== text.trim() };
}

export function repairRejectedBeat(
  state: GameState,
  prose: string,
  _reasons: CommitGateReason[] = []
): { prose: string; repaired: boolean; notes: string[] } {
  const notes: string[] = [];
  let next = prose ?? '';
  const recent = recentGmBeatTexts(state);
  const collage = detectLeadingCollage(next, recent);
  if (collage.hit && collage.tailHasNewContent) {
    const stripped = stripRecycledPrefix(next, collage);
    if (stripped !== next && stripped.trim().length > 16) {
      next = stripped;
      notes.push('Commit gate: stripped recycled prefix');
    }
  }

  const stillBad = !classifyBeatCommit(state, next).accept;
  if (stillBad) {
    const stitch = stitchCommitDelta(state);
    const hardEssay =
      _reasons.includes('same-room-essay')
      || _reasons.includes('craft-ignore')
      || isAtmosphereOnlyBeat(prose)
      || missingPointerCardSlot(state, prose);
    if (collage.hit && collage.tailHasNewContent && next.trim() && !_reasons.includes('same-room-essay')) {
      next = `${next} ${stitch}`.trim();
    } else if (hardEssay) {
      next = stitch;
    } else {
      const first = (prose.match(/^[^.!?]+[.!?]/) ?? [''])[0].trim();
      next = first && first.length > 12 ? `${first} ${stitch}`.trim() : stitch;
    }
    notes.push('Commit gate: stitched one concrete');
  }

  // Never leave banned stall chrome in the repaired draft.
  if (isVerbatimStallStub(next) || isDirectorChromeLeak(next)) {
    next = stitchCommitDelta(state);
    notes.push('Commit gate: replaced verbatim stall/director stub');
  }

  return { prose: next.trim(), repaired: notes.length > 0 && next.trim() !== (prose ?? '').trim(), notes };
}
