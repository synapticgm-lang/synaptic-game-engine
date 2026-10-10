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
  detectTalkUltimatumRecycle,
  detectTalkQaShapeLoop,
  isAmbientStubRecycle,
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
import { isClosedKillRecycle, isDeadFoeReopenedAsLiving } from './combatAuthority';
import { isInventedClosedScenePerson } from './closedScenePerson';
import { isOneCameraFightViolation } from './oneCameraFight';
import { isStaleContextBleed } from './sceneContextTail';
import { isSlotGlueViolation, ledgerSlotPeople } from './slotGlue';
import { isSealedCardViolation, sealedCastNames } from './beatContract';
import { isExcludedPadProgress } from './padUniverse';
import { isClosedLedgerViolation } from './closedFactLedger';
import { ledgerNeverCastTitles } from './neverCast';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  isDroughtStubProse,
  lastResortStoryBody,
  proseViolatesEventPacket,
} from './completedEventPacket';

export type CommitGateReason =
  | 'atmosphere-only'
  | 'missing-pointer-slot'
  | 'recycle-without-delta'
  | 'same-room-essay'
  | 'craft-ignore'
  | 'event-packet';

export type CommitGateResult = {
  accept: boolean;
  reasons: CommitGateReason[];
  /** 28l — one plain problem line per failed check (the writer revision list). */
  details?: string[];
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
  const details: string[] = [];
  const flag = (reason: CommitGateReason, detail: string) => {
    if (!reasons.includes(reason)) reasons.push(reason);
    if (!details.includes(detail)) details.push(detail);
  };
  const recycle = (detail: string) => flag('recycle-without-delta', detail);
  const text = (prose ?? '').trim();
  if (!text) return { accept: true, reasons, details };
  if (playerAsksRepeat(playerInput ?? '')) return { accept: true, reasons, details };
  // 14a — leftover tokens / drought body never commit (stitch banks are not the success path).
  if (/@t\d+\b/.test(text)) flag('event-packet', 'Leftover @t tokens: write the names as words.');
  if (isDroughtStubProse(text)) flag('event-packet', 'Stub text: write a real beat.');

  if (missingPointerCardSlot(state, text)) flag('missing-pointer-slot', 'Name where you are and who is here.');

  const afterOpening = state.openingEstablishment?.complete === true && (state.turn ?? 0) > 0;
  const recent = recentGmBeatTexts(state);
  if (afterOpening || recent.length > 0) {
    if (isAtmosphereOnlyBeat(text)) flag('atmosphere-only', 'Mood only: add one concrete action or new fact.');
    const collage = detectLeadingCollage(text, recent);
    if ((collage.hit && !collage.tailHasNewContent) || detectAtmosphereReprint(text, recent)) {
      recycle('Reuses sentences from an earlier beat: write new ones.');
    }
  }

  // Batch F — HARD same-room essay on inspect/wait/scout (pad interrupt alone is not enough).
  if (detectSameRoomEssayHard(text, recent, playerInput ?? '')) {
    flag('same-room-essay', 'Same room described again: show one new detail or change.');
    recycle('Same room described again: show one new detail or change.');
  }
  // Batch S — HARD dialogue treadmill (Wall Sergeant rain/leather recycle).
  if (detectDialogueTreadmillHard(text, recent, playerInput ?? '')) recycle('Dialogue repeats the last exchange: move the talk forward.');
  if (detectTalkUltimatumRecycle(text, recent, playerInput ?? '')) recycle('The same demand is repeated: move the talk forward.');
  if (detectTalkQaShapeLoop(text, recent, playerInput ?? '')) recycle('Same question-and-answer shape as before: move the talk forward.');
  if (isAmbientStubRecycle(state, text)) recycle('Ambient filler repeated: write what happens.');
  // Batch V — combat purgatory (identical fist / little-true-effect loops).
  if (detectCombatPurgatoryHard(text, recent, playerInput ?? '')) recycle('Fight beat repeats with no effect: show a result.');
  // Batch W — stitch / codedSceneMove UI bleed must never commit.
  if (isStitchBankFingerprint(text)) recycle('Canned filler line: write a real beat.');
  // 02m — writer planning notes / instruction echo must never commit as story.
  if (isWriterMonologueLeak(text) || isDirectorChromeLeak(text)) recycle('Planning notes or instructions in the story: write only the story.');
  // 02h — SYSTEM / marker / mill-panel token salad must never commit.
  if (isTokenSaladLeak(text)) recycle('Garbled words: write plain sentences.');
  // 02x Lock D — HUD / RECORD / bracket-slot / SNAPSHOT chrome as the beat.
  if (isHudCombatChromeLeak(text) || isEngineChromeOnlyBeat(text)) recycle('Game UI text in the story: write the scene instead.');
  // 02x Lock C — exact prior GM body recycle (player-asked repeat already returned).
  if (isExactPriorGmBody(state, text)) recycle('Same text as the last beat: write a new one.');
  // 02j Lock C — destroyed charter / dead foe cannot reopen as live facts.
  if (isFactClosedViolation(state, text)) recycle('Reopens a closed fact (a destroyed item or a dead foe acting).');
  // 02z — sealed card: invented CAST, wrong HERE, excluded-pad-only progress.
  if (isSealedCardViolation(state, text, playerInput) || isExcludedPadProgress(state, text, playerInput)) {
    recycle('Invents a person or place not in the facts, or moves somewhere the player did not go.');
  }
  // 08b — packet: ledger contradictions only (living lastKill, instruction, lists, loot-too-early, wrong HERE).
  if (state.completedEvent && proseViolatesEventPacket(text, state.completedEvent)) {
    const d = 'Contradicts the completed event (dead foe acting, lists, early loot, or wrong place).';
    flag('event-packet', d);
    recycle(d);
  }

  return { accept: reasons.length === 0, reasons, details };
}

/** Lock C — prose that reopens a ledger-closed fact. */
export function isFactClosedViolation(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  if (isPyoaCharterClosed(state)) {
    if (
      /\b(?:millstone\s+)?charter\b/i.test(body)
      && /\b(?:clutch|hold|forge|burn|unused|fate|leave it to|will you (?:forge|burn)|takes? the charter|from your (?:hands|pack|pocket)|sell(?:s|ing)?|sold|hand(?:s|ed)? over|in your (?:pack|hand|hands|pocket|coat|kit|bag)|re-offers?|offers? you|weight|chest|tucked|against your|item-gain)\b/i.test(body)
      && !/\b(?:burned|destroyed|gone|ashes|already sold|empty pocket|nothing left|space where the charter)\b/i.test(body)
    ) {
      return true;
    }
  }
  const kill = state.sceneFacts?.lastKill;
  // The kill turn is the engine's settled fight being told, not a dead foe acting.
  if (kill?.name && kill.outcome === 'victory' && !state.activeEncounter && kill.turn !== state.turn) {
    if (isDeadFoeReopenedAsLiving(body, kill, false)) return true;
    if (isClosedKillRecycle(body, kill, false)) return true;
  }
  // 02p — role person who is not in this scene.
  if (isInventedClosedScenePerson(state, body)) return true;
  // 02q — one camera / one fight (leave-reach + steel, or closed foe blade-rez).
  if (isOneCameraFightViolation(state, body)) return true;
  // 02r — old-room camera or post-clear steel after a recent scene change.
  if (isStaleContextBleed(state, body)) return true;
  // 02t / 02v — deixis / kit object / companion name used as a slot.
  if (isSlotGlueViolation(body, ledgerSlotPeople(state), ledgerNeverCastTitles(state))) return true;
  if (isClosedLedgerViolation(state, body)) return true;
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
  const people = sealedCastNames(state).filter((p) => p && !isUnresolvedDeixisToken(p));
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
  if (engaged && foe) {
    const combatBank = [
      `${foe} keeps the alley mouth in ${loc}, blade ready. Press the attack, break contact, or offer parley.`,
      `Steel catches the light as ${foe} holds ground in ${loc}. The skirmish waits on your next move.`,
      `Dust kicks up under ${foe}'s boots in ${loc}. Strike hard, break contact, or talk them down — standing still costs you.`,
    ];
    return combatBank[turn % combatBank.length]!;
  }

  const recent = recentGmBeatTexts(state, 10);
  const stubUsed = recent.filter((b) => /shifts?,?\s+expecting you to act/i.test(b)).length;
  const bank = [
    present
      ? `Rain drums the awning while ${present} watches you from the stall — waiting for your next word in ${loc}.`
      : '',
    hubAlt
      ? `Grit stings your eyes on ${loc}. The road toward ${hubAlt} lies open if you mean to leave.`
      : '',
    `A vendor under a patched tarp meets your glance in ${loc}, then looks away — the moment is yours to break.`,
    stubUsed >= 2
      ? `The air on ${loc} tastes of wet stone. The next move is still yours.`
      : `Copper and wet stone smell thick in ${loc}. Someone nearby shifts, expecting you to act.`,
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
    // 02o — 4×4 T30: conversation-log dump + glued nonce (heartikuha / carefullyikuha)
    || /Consulting the FULL/i.test(text)
    || /Respond in the following exact XML/i.test(text)
    || /ikuha/i.test(text)
    // 02u — 02t T30: "no one" inflected as a noun/adj (LitRPG s43 + RPG s43)
    || /\bno\s+oneed\b/i.test(text)
    || /\bno\s+ones\b/i.test(text)
    || /\bno\s+oneked\b/i.test(text)
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

/**
 * 02m / 02v — model planning notes leaked as GM body.
 * Fingerprints + planning-voice only — not a novel deny-list of story nouns.
 * 02v tapes: LitRPG s42 T8, D&D s42 T18, RPG s42 T8.
 */
export function isWriterMonologueLeak(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return (
    /\bLet me write (?:this with good prose|it cleanly)\b/i.test(text)
    || /\bcompletes stage-2 receipt\b/i.test(text)
    || /\bStory first,\s*then\s+(?:system-log|system log|<xp-gain)\b/i.test(text)
    || /\bchoices are calculated separately\b/i.test(text)
    || /\bI only output narrative prose\b/i.test(text)
    || /\bThe instruction says\b/i.test(text)
    || /\bDo NOT emit numbered choice lists\b/i.test(text)
    || /\bI should keep it tight\b/i.test(text)
    || /\bI(?:['’]ll| will) make sure the prose follows\b/i.test(text)
    || /\bLet me write this with good prose\b/i.test(text)
    // 02v — planning-voice residual (in-character / tiers / tension meter)
    || /\bThis is a (?:good|strong) in-character (?:answer|response)\b/i.test(text)
    || /\bI should present this cleanly\b/i.test(text)
    || /\bwait for \w+ to choose\b/i.test(text)
    || /\bLet me re-read\b/i.test(text)
    || /\bper my typing obligations\b/i.test(text)
    || /\bUnder the above tiers\b/i.test(text)
    || /\bI must pick one concrete beat\b/i.test(text)
    || /\bnarrative tension is (?:maybe )?\d+\s*\/\s*10\b/i.test(text)
    || /\bif I want TENSION\b/i.test(text)
    || /\bI(?:['’]ll| will) write short,\s*evocative\b/i.test(text)
    // 02x — planner / imperative instruction-voice (shape, not a Gemini quote list)
    || /(?:^|[.!?]\s+)(?:No|Do not|Don't)\s+[a-z][^.]{2,60}\.\s*(?:No|Do not|Don't)\s+/m.test(text)
    || /(?:^|[.!?]\s+)End with (?:the|a|an)\b/m.test(text)
    || /\bno\s+(?:numbers?|tags?|loot)\b(?:\s*,\s*|\s+)no\s+(?:numbers?|tags?|loot|new named)/i.test(text)
    || /(?:^|[.!?]\s+)No\s+(?:tag|loot|numbers?|named)\b/m.test(text)
    || /\bthat isn['’]t (?:real|needed|required)\b/i.test(text)
    || /\b(?:passes|line(?:s)? up with)\s+(?:a concrete fact|the atlas)\b/i.test(text)
    || /\bthe interruption is good\b/i.test(text)
    // 02y — imperative craft / writer-order (shape, not a Gemini quote list)
    || /\bin no more than\s+\d+\s+words\b/i.test(text)
    || /\bdo not narrate\b/i.test(text)
    || /\bdo not address anyone\b/i.test(text)
    || /\bskip the (?:comma|period|colon|semicolon|tag)\b/i.test(text)
    || /\bdon['’]t add any closing words\b/i.test(text)
    || /\busing only sensory(?: detail)?\b/i.test(text)
    || /\bdo not write (?:single )?(?:you )?sentences\b/i.test(text)
    || /(?:^|[.!?]\s+)(?:Do not|Don't|Skip|Using only|In no more than)\b[^.]{0,80}\b(?:words?|narrate|address|comma|sentences?|closing words|sensory)\b/m.test(
      text
    )
    // 09c — packet instruction echoed as story
    || /\bnarrate this completed event\b/i.test(text)
    || /\bcompleted event in past tense\b/i.test(text)
    || /\bhere is the narrative of the completed event\b/i.test(text)
    || /\badhering to the (?:provided )?guidelines\b/i.test(text)
    || /\bYOU MAY ONLY MENTION\b/.test(text)
    || /\bCOMPLETED EVENT:\s*/.test(text)
  );
}

/** Director / CRAFT / AUTHORITY chrome must never commit as GM body (Batch G). */
export function isDirectorChromeLeak(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return (
    isWriterMonologueLeak(text)
    || /\bdo not invent\b/i.test(text)
    || /\btelegraph first\b/i.test(text)
    || /\bno prior cast\b/i.test(text)
    || /\bno debris,\s*no prior\b/i.test(text)
    || /\bFORBID:\s*/i.test(text)
    || /\bCRAFT:\s*/i.test(text)
    || /\bAUTHORITY:\s*/i.test(text)
    || /\bARC (?:BEAT|DIRECTOR)\b/i.test(text)
    || /\bTURN JOB:\s*/i.test(text)
    || /\bSNAPSHOT\b/i.test(text) && /\b(?:Location|Presence|Crowd|Exits):\s*/i.test(text)
    || /\bSNAPSHOT\b/i.test(text) && /={3,}/.test(text)
    || /\bencou?nter initiated\s*:/i.test(text)
  );
}

/** Lock D — combat HUD / RECORD / bracket-slot templates in the book. */
export function isHudCombatChromeLeak(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return (
    /\(\s*\d+\s*\/\s*\d+\s*HP\s*\)/i.test(text)
    || /\bstill stands\s*\(\s*\d+/i.test(text)
    || /\bRECORD\s+\d+\b/.test(text)
    || /\[(?:the|a|an)\s+[a-z][a-z'-]{1,24}\]/.test(text)
  );
}

/** Lock D — the whole turn is engine chrome (31i sealed-manifest stub shape). */
export function isEngineChromeOnlyBeat(text: string | undefined): boolean {
  const raw = (text ?? '').trim();
  if (!raw) return false;
  const stripped = raw
    .replace(/\(\s*\d+\s*\/\s*\d+\s*HP\s*\)/gi, '')
    .replace(/\bstill stands\s*\([^)]*\)/gi, '')
    .replace(/\bRECORD\s+\d+\b[^.]*\.?/g, '')
    .replace(/\[(?:the|a|an)\s+[^\]]+\]/gi, '')
    .replace(/={2,}/g, '')
    .replace(/\bSNAPSHOT\b[:\s]*/gi, '')
    .replace(/\b(?:Location|Presence|Crowd|Exits|HP|MP):\s*[^\n]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (isHudCombatChromeLeak(raw) || isDirectorChromeLeak(raw)) && stripped.length < 28;
}

function normalizeCommittedBeat(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Lock C — exact duplicate of a recent committed GM body. */
export function isExactPriorGmBody(state: GameState, text: string): boolean {
  const body = normalizeCommittedBeat(text);
  if (body.length < 24) return false;
  return recentGmBeatTexts(state, 6).some((b) => normalizeCommittedBeat(b) === body);
}

/** Warden / collage / commit-gate rejects must not paint the writer body. */
export function isBlockedPaint(notes: string[], state: GameState, prose: string): boolean {
  const hit = (notes ?? []).some(
    (n) =>
      /Narrative does not resolve the player action/i.test(n)
      || /Collage reject: no new tail/i.test(n)
      || /Commit gate:.*recycle-without-delta/i.test(n)
  );
  return hit || isExactPriorGmBody(state, prose);
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
  _reasons: CommitGateReason[] = [],
  opts: { stripOnly?: boolean } = {}
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

  // 28l — normal play keeps the writer's prose: strip the recycled prefix only, never swap in a stitch.
  if (opts.stripOnly) {
    return { prose: next.trim(), repaired: notes.length > 0 && next.trim() !== (prose ?? '').trim(), notes };
  }
  const classified = classifyBeatCommit(state, next);
  const stillBad =
    !classified.accept
    || _reasons.includes('event-packet')
    || _reasons.includes('atmosphere-only')
    || _reasons.includes('same-room-essay');
  if (stillBad) {
    const lastPlayer = [...(state.log ?? [])].reverse().find((e) => e.role === 'player')?.content ?? '';
    const event =
      state.completedEvent
      ?? (state.activeEncounter && lastPlayer ? buildCompletedEventPacket(state, String(lastPlayer)) : undefined);
    const resort = lastResortStoryBody(state, event);
    const stitch = event
      ? assemblePacketStitch(event, recentGmBeatTexts(state, 10))
      : codedSceneMove(state);
    const settleStall = (t: string) =>
      /Nothing listed had moved on|The moment at .+ settled|the room(?: at .+)? held its place|You still had the next move|You close with |loot is legal/i.test(
        t ?? ''
      );
    const sameAsRejected =
      resort.prose.replace(/\s+/g, ' ').trim() === (prose ?? '').replace(/\s+/g, ' ').trim();
    let move =
      !isDroughtStubProse(resort.prose)
      && !settleStall(resort.prose)
      && !sameAsRejected
      && !/writer did not return a new beat/i.test(resort.prose)
      && !isAtmosphereOnlyBeat(resort.prose)
        ? resort.prose
        : !isDroughtStubProse(stitch) && !settleStall(stitch)
          ? stitch
          : resort.prose;
    if (
      (isAtmosphereOnlyBeat(move) || settleStall(move))
      && stitch
      && !isDroughtStubProse(stitch)
      && !settleStall(stitch)
      && !isAtmosphereOnlyBeat(stitch)
    ) {
      move = stitch;
    }
    const hardEssay =
      _reasons.includes('same-room-essay')
      || _reasons.includes('craft-ignore')
      || _reasons.includes('event-packet')
      || isAtmosphereOnlyBeat(prose)
      || missingPointerCardSlot(state, prose);
    // 13b — last good GM / card paragraph, not Dust-hung drought stitch.
    if (hardEssay || _reasons.includes('atmosphere-only') || _reasons.includes('recycle-without-delta')) {
      next = move;
    } else if (collage.hit && collage.tailHasNewContent && next.trim() && next.trim().length > 40) {
      next = `${next} ${move}`.trim();
    } else {
      next = move;
    }
    notes.push(isDroughtStubProse(move) ? 'Commit gate: packet stitch' : 'Commit gate: last-resort body');
  }

  // Never leave banned stall / stitch bank / director chrome / drought in the repaired draft.
  if (
    isVerbatimStallStub(next)
    || isDirectorChromeLeak(next)
    || isStitchBankFingerprint(next)
    || isDroughtStubProse(next)
  ) {
    const resort = lastResortStoryBody(state, state.completedEvent);
    next = !isDroughtStubProse(resort.prose)
      ? resort.prose
      : state.completedEvent
        ? assemblePacketStitch(state.completedEvent, recentGmBeatTexts(state, 10))
        : codedSceneMove(state);
    notes.push('Commit gate: replaced stall/stitch-bank stub');
  }

  return { prose: next.trim(), repaired: notes.length > 0 && next.trim() !== (prose ?? '').trim(), notes };
}
