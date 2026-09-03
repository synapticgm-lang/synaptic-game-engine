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
  detectCombatPurgatoryHard,
  isAtmosphereOnlyBeat,
  playerAsksRepeat,
  recentGmBeatTexts,
  stripRecycledPrefix,
} from './semanticLoopDetector';
import { isUnresolvedDeixisToken, realPresentPeople } from './chromeAuthority';
import { isEncounterEngaged } from './encounterTerminalFsm';
import { hubsForBibleId } from './outdoorHubs';
import { isPyoaCharterClosed } from './pyoaBranchLedger';
import { isDeadFoeReopenedAsLiving } from './combatAuthority';

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

  // Batch V — combat purgatory (identical fist / little-true-effect loops).
  if (detectCombatPurgatoryHard(text, recent, playerInput ?? '')) {
    if (!reasons.includes('recycle-without-delta')) reasons.push('recycle-without-delta');
  }

  // Batch W — stitch / codedSceneMove UI bleed must never commit.
  if (isStitchBankFingerprint(text)) {
    if (!reasons.includes('recycle-without-delta')) reasons.push('recycle-without-delta');
  }

  // 02h — SYSTEM / marker / mill-panel token salad must never commit.
  if (isTokenSaladLeak(text)) {
    if (!reasons.includes('recycle-without-delta')) reasons.push('recycle-without-delta');
  }

  // 02j Lock C — destroyed charter / dead foe cannot reopen as live facts.
  if (isFactClosedViolation(state, text)) {
    if (!reasons.includes('recycle-without-delta')) reasons.push('recycle-without-delta');
  }

  return { accept: reasons.length === 0, reasons };
}

/** Lock C — prose that reopens a ledger-closed fact. */
export function isFactClosedViolation(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  if (isPyoaCharterClosed(state)) {
    if (
      /\b(?:millstone\s+)?charter\b/i.test(body)
      && /\b(?:clutch|hold|forge|burn|unused|fate|leave it to|will you (?:forge|burn)|takes? the charter|from your (?:hands|pack|pocket)|sell(?:s|ing)?|sold|hand(?:s|ed)? over|in your (?:pack|hand|hands|pocket)|re-offers?|offers? you)\b/i.test(body)
      && !/\b(?:burned|destroyed|gone|ashes|already sold|empty pocket|nothing left)\b/i.test(body)
    ) {
      return true;
    }
  }
  const kill = state.sceneFacts?.lastKill;
  if (kill?.name && kill.outcome === 'victory' && !state.activeEncounter) {
    if (isDeadFoeReopenedAsLiving(body, kill, false)) return true;
  }
  return false;
}

/**
 * Diegetic scene-move when a beat is rejected — coded prose, never director bank strings.
 * Batch U — stitch/commit-gate meta lines must not commit as GM body.
 * Batch V — never emit "Nothing in X shifts until…" / truncated hook recycle (Gemini T43-44 / T4).
 */
export function codedSceneMove(state: GameState): string {
  const slots = compilePointerCardSlots(state);
  const loc = (state.currentLocation || slots?.where || 'this room').replace(/\.$/, '');
  const people = realPresentPeople(state.sceneFacts?.present ?? []).filter(
    (p) => p && !isUnresolvedDeixisToken(p)
  );
  const present = people[0];
  const foe =
    state.activeEncounter?.name?.trim()
    || state.sceneFacts?.pendingEncounter?.name?.trim()
    || '';
  const engaged = isEncounterEngaged(state) || !!state.sceneFacts?.pendingEncounter;
  const hubAlt = hubsForBibleId(state.campaignBibleId)
    .map((h) => h.name)
    .find((n) => n.toLowerCase() !== loc.toLowerCase());
  const turn = state.turn ?? 0;
  const enc = state.activeEncounter;
  const hpLine =
    engaged && foe && enc && typeof enc.hp === 'number' && typeof enc.maxHp === 'number'
      ? ` ${foe} still stands (${Math.max(0, enc.hp)}/${enc.maxHp} HP).`
      : '';

  if (engaged && foe) {
    const combatBank = [
      `${foe} keeps the alley mouth in ${loc}, blade ready.${hpLine} Press the attack, break contact, or offer parley.`,
      `Steel catches the light as ${foe} holds ground in ${loc}.${hpLine} The skirmish waits on your next move.`,
      `Dust kicks up under ${foe}'s boots in ${loc}.${hpLine} Strike hard, break contact, or talk them down — standing still costs you.`,
    ];
    return combatBank[turn % combatBank.length]!;
  }

  const bank = [
    present
      ? `Rain drums the awning while ${present} watches you from the stall — waiting for your next word in ${loc}.`
      : '',
    hubAlt
      ? `Grit stings your eyes on ${loc}. The road toward ${hubAlt} lies open if you mean to leave.`
      : '',
    `A vendor under a patched tarp meets your glance in ${loc}, then looks away — the moment is yours to break.`,
    `Copper and wet stone smell thick in ${loc}. Someone nearby shifts, expecting you to act.`,
  ].filter(Boolean);
  return bank[turn % bank.length] || bank[bank.length - 1]!;
}

/** @deprecated alias — use codedSceneMove */
export function stitchCommitDelta(state: GameState): string {
  return codedSceneMove(state);
}

/** Batch U — meta stitch / commit-gate / director bank fingerprints (never commit as story). */
export function isStitchBankFingerprint(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return (
    /\bthe beat needs an exit\b/i.test(text)
    || /\bstill holds the line in\b/i.test(text)
    || /\bstrike,\s*parley,\s*or break contact now\b/i.test(text)
    || /\bNothing more yields here\b/i.test(text)
    || /\bwaits on a real answer\b/i.test(text)
    || /\bnot another sift\b/i.test(text)
    || /\bLeave or commit\b/i.test(text)
    || /\btalk to someone who will move\b/i.test(text)
    || /\bdoes not wait:\s*face\b/i.test(text)
    // Batch V — prior codedSceneMove meta + truncated hook recycle
    || /\bNothing in .+ shifts until you leave,\s*speak,\s*or commit to a stake\b/i.test(text)
    || /\buntil you leave,\s*speak,\s*or commit to a stake\b/i.test(text)
    || /\boffers nothing new\. You could leave toward\b/i.test(text)
    || /\bA way out still waits in\b/i.test(text)
    // Batch W — prior codedSceneMove UI bleed (Vault hook is valid opening contract — not a stitch leak)
    || /\binvite a real move\b/i.test(text)
    || /\bA question hangs\b/i.test(text)
    || /\bash still sifts between the stones\b/i.test(text)
    || /\bWind cuts along the cracked stones\b/i.test(text)
    || /\bside lane toward\b/i.test(text)
    || /\bwaiting to see if you speak,\s*buy,\s*or leave\b/i.test(text)
    || /\bmarket din in .+ thins for a breath\b/i.test(text)
  );
}

/** 02j Lock D — shape heuristic for novel entropy dumps (not fingerprint-only). */
export function isEntropyShapeSalad(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text;
  if (/\bXP_next\b|controlXP|SECRETAR|lyricwe\b/i.test(t)) return true;
  if (/[•▁]/.test(t) && /\b\w+_\w+\b/.test(t)) return true;
  if (/\b\w+[A-Z]\w*_\w+\b/.test(t) && /[a-z]{3,}[A-Z]/.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  const weird = words.filter((w) => /[_•▁]/.test(w) || /\d/.test(w) && /[a-zA-Z]/.test(w)).length;
  return weird / words.length > 0.25;
}

/** 02h — model/system token salad that Gemini stop-early'd (RPG T32, D&D T14, PYOA T13). */
export function isTokenSaladLeak(text: string | undefined): boolean {
  if (isEntropyShapeSalad(text)) return true;
  if (!text?.trim()) return false;
  return (
    /Spine-free/i.test(text)
    || /<\/=SYSTEM/i.test(text)
    || /<\/litAwn_marker>/i.test(text)
    || /begin▁of▁file/i.test(text)
    || /begin_of_file/i.test(text)
    || /\\f===/.test(text)
    || /\f===/.test(text)
    || /A MILL AT the panel/i.test(text)
    || /Obliged thesaurus/i.test(text)
  );
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
    // Batch T — old diegetic stitch banks read as system logs
    || /\bis done yielding\b/i.test(text)
    || /\bthe room asks for\b/i.test(text)
    || /\bleaves you one clear next move\b/i.test(text)
    || /\bshifts weight in .+\band leaves you one clear\b/i.test(text)
    || /\bencou?nter initiated\b/i.test(text)
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
    || /\bencou?nter initiated\s*:/i.test(text)
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
    const move = codedSceneMove(state);
    const hardEssay =
      _reasons.includes('same-room-essay')
      || _reasons.includes('craft-ignore')
      || isAtmosphereOnlyBeat(prose)
      || missingPointerCardSlot(state, prose);
    // Batch U — never sandwich collage + meta stitch; force a single coded scene move.
    if (hardEssay || _reasons.includes('atmosphere-only') || _reasons.includes('recycle-without-delta')) {
      next = move;
    } else if (collage.hit && collage.tailHasNewContent && next.trim() && next.trim().length > 40) {
      next = `${next} ${move}`.trim();
    } else {
      next = move;
    }
    notes.push('Commit gate: coded scene move');
  }

  // Never leave banned stall / stitch bank / director chrome in the repaired draft.
  if (isVerbatimStallStub(next) || isDirectorChromeLeak(next) || isStitchBankFingerprint(next)) {
    next = codedSceneMove(state);
    notes.push('Commit gate: replaced stall/stitch-bank stub');
  }

  return { prose: next.trim(), repaired: notes.length > 0 && next.trim() !== (prose ?? '').trim(), notes };
}
