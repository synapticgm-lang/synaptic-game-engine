/**
 * Architecture 1 — Retrospective Narrator (2026-09-08b).
 * Code resolves facts first; the writer only narrates a completed event in past tense.
 */
import type { GameState, LogEntry, NarrativePerspective, ReadingLevel, Settings } from './types';
import { filterRetiredFromAllowlist, formatPlayerPronounRail, formatEstablishedOpeningScene, formatPcNameClashRail } from './openingWriterNotes';
import { isCatalogCastBlockedHere, scrubOpeningTurnProse } from './openingCatalogGuard';
import { foeCanSpeak } from './rules/srdMonsters';
import { isEncounterRoleLabel, proseEncounterLabel } from './proseItemName';
import { narratesPcInThirdPerson, pcPov, pcStorySubject, povExample } from './narrativePov';
import { cleanPlaceLabel, playerFacingLocation, proseRoomPlace, underwayHereLabel } from './locationName';
import { isCrowdFillerToken, isSystemWindowLabel, realPresentPeople } from './chromeAuthority';
import { selectRecentLogForContext } from './sceneContextTail';
import { formatInfoSheet } from './infoSheet';
import { buildFactSheet, formatFactSheetForWriter, inventoryGainedThisTurn, type FactSheet } from './factSheet';
import { formatRefRecords, formatSceneBlock, matchesOpeningWords, mentionFromScene, recalledSaidLines } from './sceneBlock';
import { splitProseSentences } from './proseSentences';
import { graphExitPads, matchGraphExitPad, shortRoomLabel } from './mapEngine';
import {
  hubAliasLabels,
  hubsForBibleId,
  isCampaignHubToken,
  matchHub,
  outdoorHubTravelChoices,
  parseTravelDestination,
  placeCardFor,
  placeFirstSight,
} from './outdoorHubs';
import { nearbyPlaceNames } from './placeNames';
import { isJourneyUnderway, isRoadLabel, isTripHere, meetingMoveBase, roadMeetingRef, travelBeatFact, withRoadMeetingEvent, writerEngineResult } from './travelJourney';
import { hasWriterCueChrome } from './writerCueLines';
import { peopleHere } from './scenePresence';
import { isBookForbiddenLedgerLine } from './ledgerToProse';
import { TALK_VERB } from './intentParser';
import { emptySceneFacts } from './sceneFacts';
import {
  isDeadFoeReopenedAsLiving,
  matchesLastKillName,
  type LastKill,
} from './combatAuthority';
import { openingCastRecords, presentNpcRecords, recordsForEntries, sheetMemoryLine } from './npcRecords';
import { hereSpotFact } from './hereSpot';
import { gateFactLines } from './skillGates';
import { sealedCastNames } from './beatContract';
import { ledgerChangeFact, ledgerReadChanges, ledgerReadStitch, ledgerSheetLine } from './litrpgSystemWindow';
import {
  applyOpeningHousingLine,
  formatSystemBlock,
  systemHousingWriterSentence,
  housingFromSystemBlock,
  hidesPart,
  systemHousingWriterClause,
  writerFacts,
  type SystemHousingId,
} from './systemHousing';
import { isNeverCastTitle } from './neverCast';
import { terminalFightOutcome } from './engineResult';
import { kitRefDisplay, turnUsesKit } from './inventory';
import { isAtmosphereOnlyBeat } from './semanticLoopDetector';
import {
  hallTalkAsksPanel,
  hallTalkAsksRefuse,
  hallTalkAsksStayLeave,
  hallTalkAsksWant,
  hallTalkAsksWhere,
  hallTalkAsksWho,
  isHallTalkPlayerLine,
  isOpeningCardActLine,
  cardSceneMentionTokens,
  hallTalkTopic,
  hallTopicAlreadyAnswered,
  isNameTelegramProse,
  isAcceptOfferLine,
  isOpeningNameGiveLine,
  lockedOpeningPcName,
  openingNameLockSpokenBeat,
  lineNamesOtherNpc,
  openingCastLabel,
  openingCastNames,
  openingCastStillHere,
  openingSpokenIdentityQuote,
  openingSpokenWant,
  openingWhoAskLine,
  proseAsksForPcName,
  shortCardOffer,
  shortCardWant,
  openOpeningOffer,
  openingSpokenRefuse,
  openingStayLeaveLine,
  openingWantLine,
  openingWhoAskLineFromLabel,
  playerAskedWhyPulled,
  sanitizeLockedNameBeat,
  countSameHallTopicRepeats,
  openingCastNote,
} from './openingEstablishment';
import { classifyOpeningOfferInput } from './openingOfferRecognize';
import {
  stateForRiteWriter,
  openingRiteRefuseWriterFact,
  openingRiteWriterOffer,
} from './openingRiteFacts';
export type EventOutcome =
  | 'killed'
  | 'bloodied'
  | 'hit'
  | 'missed'
  | 'fled'
  | 'caught'
  | 'spoke'
  | 'arrived'
  | 'set out'
  | 'left'
  | 'inspected'
  | 'looted'
  | 'waited'
  | 'used'
  | 'spawned'
  | 'defeated'
  | 'fight opened'
  | 'blocked'
  | 'slipped away'
  | 'unchanged'
  | 'resolved';
export interface CompletedEventPacket {
  turn: number;
  actor: string;
  /** 28n — PC name + gender so the writer prompt can follow the PC in third person. */
  pc?: { name: string | null; gender: string | null };
  verb: string;
  target?: string;
  outcome: EventOutcome;
  damage?: number;
  hp?: { current: number; max: number };
  loot: string[];
  xp: number;
  witnesses: string[];
  /** 29z3 — info-sheet lines for people here who have met the player. */
  knownBy?: string[];
  /** Engine-made townsfolk here: name, job, one motive, one fear, one way of speaking. */
  townsfolk?: string[];
  /** How people here are toward the player now, and the engine event that made them so. */
  stances?: string[];
  /** 29z3 — skill-gated locks in reach and whether they open. */
  gates?: string[];
  location: string;
  lastKill?: LastKill;
  justKilled: boolean;
  combatLive: boolean;
  mood?: string;
  phase?: string;
  allowlist: string[];
  playerAction: string;
  /** 29z8 — who/want/where… asked this turn, and how often the player has asked it (1 = first). */
  talkTopic?: string;
  talkAsked?: number;
  /** Code checks only (collage, talk repeat). The writer reads `infoSheet` instead. */
  recentBeats: string[];
  /**
   * The opening sentence of the last two committed beats and of earlier beats that answered this same
   * player line: already on the page wherever the camera now stands (`pageOpeners`).
   */
  pageOpeners?: string[];
  /** 29z9i — the diary the writer reads in place of raw recent turns (`infoSheet.ts`). */
  infoSheet?: string;
  /**
   * Talk envelope computed once on the client (`buildTalkEnvelope`) and stored on the packet.
   * The edge prints this string. It does not rebuild it (the edge talk module is a stub).
   */
  talkContext?: string;
  /** q72 — one fixed SCENE block (PRESENT/CREATURES/ITEMS/EXITS/SAID/RECENT[/HERE SO FAR]). */
  sceneBlock?: string;
  /** q72 — REF <id> records only for ids referenced this turn (cap 3). */
  refRecords?: string;
  /** 29z9k — reading level + swearing / violence-detail switches (Kid Mode forces child, both off). */
  reader?: ReaderFlags;
  /** 10c — consecutive inspect/wait in this HERE (0 during live combat). */
  inspectStreak: number;
  waitStreak: number;
  /** Ledger noun for tier-2/3 stitch (exit, searchedEmpty, or prop). */
  focusNoun?: string;
  /** 10d — card CAST / why, for hall-talk answers (not settle stubs). */
  answerWho?: string;
  answerWhoQuote?: string;
  answerWant?: string;
  /** 12d — stay/leave bargain from the card (grain-ship home/earth). */
  answerStayLeave?: string;
  /** 13a — offered page / ribbon line so card acts never settle-stub. */
  answerOffer?: string;
  /** The card's own want, handed to the writer as a fact when the player asks what they want at the card. */
  cardWant?: string;
  /** The card's offer while it is still open, with the same trigger as `cardWant`. */
  cardOffer?: string;
  /** XP-D1 OPEN — LitRPG Opening Rite pending offer; prose must end on it. */
  openingRiteOffer?: string;
  playerPronounRail?: string;
  /** The player's name is also a story NPC's name: two different people. */
  pcNameClash?: string;
  establishedOpeningScene?: string;
  /** XP-D1 OPEN — refuse path writer fact (System persists, no punishment). */
  openingRiteRefusePersist?: string;
  /** 11b — mode-safe spoken identity (no Pactborn on tabletop). */
  engineMode?: string;
  /** 14a — this-turn ledger ids for token prose. Single source with compileRefEnum. */
  refEnum?: LedgerRef[];
  /** 14a — bound uses after a successful JSON beat (harvest prefers these). */
  tokenRefs?: TokenUseRef[];
  /** 27a — ledger place facts for stitch banks. */
  placeDescriptor?: string;
  /**
   * On a ledger read: what changed on the window since the last painted plate (null when there is no
   * earlier plate). The code-painted plate is the window; the writer never gets the sheet.
   */
  ledgerChanges?: string[] | null;
  /** Frozen LitRPG system housing, as one plain paragraph of the parts that are on. */
  systemBlock?: string;
  /** The player read the System window (Inspect the panel / Check Status): a ledger read, not an act in the room. */
  ledgerRead?: boolean;
  /** 28g — the engine's resolved result for the player's action (fight / flee / parley / rest). Required fact. */
  engineResult?: string;
  /**
   * M2 — per-step reader outcomes (done / not done + reason) for FactSheet.beat.steps.
   * Claims and system text stay off this list.
   */
  readerStepResults?: Array<{ tried: string; done: boolean; reason: string }>;
  exitNames?: string[];
  /** 29y — did the state move this turn: the story narrates only the move the engine committed. */
  movement?: string;
  /** The journey leg committed this turn heads here (REF ENUM row): the travel line names it. */
  destinationRef?: LedgerRef;
  /**
   * M1 — one typed FactSheet for the writer (display names only). Replaces the second context
   * (info layer + info sheet dump). Settings slot reserved for 6b.
   */
  factSheet?: FactSheet;
}
// T10V — "Ping the System for bearings" is a ledger read (System answers with its plate), not an empty room act.
const LEDGER_READ_ACTION =
  /\bpanel\b|\bcheck status\b|\bping(?:\s+the)?\s+system\b|\bsystem\b[\s\S]{0,48}\bbearings\b|^(?:read the device|look inward|ask the world|check your level|reach into the pocket|ping the system(?:\s+for\s+bearings)?)$/i;
/** The one test for "the player read the ledger": the packet and the System window both ask it. */
export function isLedgerReadAction(action: string): boolean {
  return LEDGER_READ_ACTION.test((action ?? '').trim());
}
/** The floating panel is a ledger, not a prop, once the player is reading it. */
function stateWithoutSystemWindowProp(state: GameState): GameState {
  const props = state.sceneFacts?.props;
  if (!props?.some((p) => isSystemWindowLabel(p))) return state;
  return {
    ...state,
    sceneFacts: { ...state.sceneFacts!, props: props.filter((p) => !isSystemWindowLabel(p)) },
  };
}
function writerHousingClause(block?: string): string {
  return systemHousingWriterClause(housingFromSystemBlock(block));
}
/** What the player did on a ledger read, named for the frozen housing. The game paints the window itself. */
function ledgerReadEventLine(who: string, him: string, housing: SystemHousingId | null): string {
  switch (housing) {
    case 'worn_device': return `${who} read the worn device; the game shows the device.`;
    case 'private_window': return `${who} looked inward; the game shows the window.`;
    case 'world_status': return `${who} took stock of what the world knows of ${him}; the game shows what is known.`;
    case 'leftover_pocket': return `${who} reached into the pocket; the game shows the pocket.`;
    default: return `${who} read the System window; the game shows the window.`;
  }
}
function ledgerReadLabel(housing: SystemHousingId | null): string {
  switch (housing) {
    case 'worn_device': return 'DEVICE';
    case 'private_window': return 'WINDOW';
    case 'world_status': return 'STATUS';
    case 'leftover_pocket': return 'POCKET';
    default: return 'PANEL';
  }
}
/** The System window as a ref: a housed system that is not a worn device is not a thing in the scene. */
function housedWindowDisplay(state: GameState, prop: string): string | null {
  const housing = state.systemHousing?.housing;
  if (!housing) return prop;
  return housing === 'worn_device' ? 'worn device' : null;
}
/** `window` is the LitRPG System window: only the PC sees it, not a thing in the room. */
export type LedgerRefClass = 'place' | 'person' | 'creature' | 'corpse' | 'prop' | 'kit' | 'carried' | 'companion' | 'window' | 'meeting';
export type TokenUse = 'speaker' | 'actor' | 'addressed' | 'corpse' | 'prop_used' | 'worn' | 'place';
export interface LedgerRef {
  tok: string;
  id: string;
  display: string;
  klass: LedgerRefClass;
  /** How the writer may use this ref, printed on its REF ENUM line. */
  note?: string;
}
export interface TokenUseRef {
  tok: string;
  id: string;
  use: TokenUse;
}
const WRITER_RHYTHM_WINDOW = 2;
const WRITER_RHYTHM_CHAR_CAP = 500;
/** Same character bound as a stored NPC quote (recordSpokenTopics). The ellipsis matches the info-sheet clip. */
const EARLIER_PLAYER_CHARS = 180;

function renderEarlierPlayer(raw: string): string {
  if (raw.length <= EARLIER_PLAYER_CHARS) return raw;
  return `${raw.slice(0, EARLIER_PLAYER_CHARS - 1).trimEnd()}…`;
}

/**
 * A player line from at least eight turns ago, when this turn repeats its first four words.
 * Separate from NPC quote recall. Blank input does not read the log. At most two lines.
 * The embedded line keeps its opening and is cut at the NPC quote bound.
 */
export function recalledPlayerLines(state: GameState, playerInput: string): string[] {
  const turn = state.turn ?? 0;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of state.log ?? []) {
    if (entry.role !== 'player') continue;
    const saidTurn = entry.turn ?? 0;
    if (turn - saidTurn < 8) continue;
    const raw = String(entry.content ?? '').replace(/\s+/g, ' ').trim();
    const key = raw.toLowerCase();
    if (!raw || seen.has(key) || !matchesOpeningWords(playerInput ?? '', raw)) continue;
    seen.add(key);
    out.push(`EARLIER PLAYER (T${saidTurn}): "${renderEarlierPlayer(raw)}"`);
    if (out.length >= 2) break;
  }
  return out;
}

function lastPlayerAction(state: GameState, playerInput?: string): string {
  const typed = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (typed) return typed;
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.role === 'player' && log[i]?.content?.trim()) return String(log[i].content).trim();
  }
  return '';
}
/** TT31 — a tabletop beat is a short table description: at most this many words (asked in the packet, cut on commit). */
export const TABLETOP_BEAT_WORDS = 100;
export function classifyVerb(input: string): string {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (/\b(attack|fight|strike|engage|press the attack|slash|stab|punch)\b/i.test(t)) return 'attacked';
  if (/\b(flee|run away|escape|retreat)\b/i.test(t)) return 'fled';
  if (/\b(parley|negotiate|talk (?:it|them) down)\b/i.test(t)) return 'parleyed';
  if (/\b(travel|go to|head (?:to|for|toward)|return to|enter)\b/i.test(t)) return 'traveled';
  if (
    /\b(leave the scene|leave through|walk away)\b/i.test(t)
    && !hallTalkAsksStayLeave(t)
    && !playerAskedWhyPulled(t)
    && !isHallTalkPlayerLine(t)
  ) {
    return 'left';
  }
  if (/\b(leave|exit)\b/i.test(t) && !hallTalkAsksStayLeave(t) && !isHallTalkPlayerLine(t) && !playerAskedWhyPulled(t)) {
    return 'left';
  }
  if (
    isHallTalkPlayerLine(t)
    || playerAskedWhyPulled(t)
    || hallTalkAsksStayLeave(t)
    || isOpeningCardActLine(t)
    || /\b(ask|talk|speak|tell|say|press for|listen|you summoned me|get back home|to earth|cargo run)\b/i.test(t)
    || TALK_VERB.test(t)
  ) {
    return 'spoke';
  }
  if (
    /\b(where am(?: i)?|where are we|where is this|what(?:'s| is) going on|who (?:is|are|asks)|what'?s yours|ask what they want|what they want|what do you want|why should i|why .*(?:name|here|summon))\b/i.test(
      t
    )
  ) {
    return 'spoke';
  }
  if (/\b(loot|search the (?:body|corpse)|take from)\b/i.test(t)) return 'looted';
  if (/\b(use|drink|eat|equip|wield|draw)\b/i.test(t)) return 'used';
  // The line's first verb is the act: "Wait and watch" is a wait, not an inspection.
  if (/^(?:wait|rest|stay|hold still|hold position)\b/i.test(t)) return 'waited';
  if (/\b(inspect|examine|look around|search|scout|check|study|watch|analyze|read)\b/i.test(t)) {
    return 'inspected';
  }
  if (/\b(wait|rest|stay|hold)\b/i.test(t)) return 'waited';
  return 'acted';
}
const INTENT_REMAINDER =
  /^(?:what is going on|a direct question|what they want|what they wanted|with what you are holding|what you are holding|the surroundings|the immediate surroundings|around|the exit|leverage|for leverage|it|them|this|that)$/i;
function isIntentRemainderNoun(raw: string): boolean {
  const t = (raw ?? '').replace(/[.!?]+$/, '').replace(/^(?:the|a|an|with)\s+/i, '').trim();
  if (!t) return true;
  if (INTENT_REMAINDER.test(t)) return true;
  if (/\bwhat (?:is going on|they want|you are holding)\b/i.test(t)) return true;
  if (/\bdirect question\b/i.test(t)) return true;
  return false;
}
function livingLedgerPeople(state: GameState): string[] {
  const kill = state.sceneFacts?.lastKill;
  return realPresentPeople(state.sceneFacts?.present ?? []).filter((n) => !matchesLastKillName(n, kill));
}
function matchLedgerNoun(
  raw: string,
  state: GameState,
  opts: { allowCorpse: boolean }
): string | undefined {
  const t = (raw ?? '').replace(/[.!?]+$/, '').replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!t || isIntentRemainderNoun(t)) return undefined;
  const kill = state.sceneFacts?.lastKill;
  const corpse =
    kill?.name && kill.outcome === 'victory' && kill.remains ? kill.name : undefined;
  const pool = [
    ...livingLedgerPeople(state),
    state.activeEncounter?.name?.trim(),
    opts.allowCorpse ? corpse : undefined,
  ].filter((n): n is string => !!n);
  for (const n of pool) {
    const low = n.toLowerCase();
    const want = t.toLowerCase();
    if (want === low || want.includes(low) || low.includes(want)) return n;
    const last = low.split(/\s+/).pop() ?? '';
    if (last.length >= 4 && (want === last || want.includes(last))) return n;
  }
  return undefined;
}
function extractTarget(input: string, state: GameState): string | undefined {
  const t = (input ?? '').trim();
  const verb = classifyVerb(t);
  const allowCorpse =
    verb === 'looted' || verb === 'inspected' || /\b(body|corpse|loot)\b/i.test(t);
  const named = t.match(
    /\b(?:attack|fight|strike|talk(?:\s+to)?|ask|loot|use|travel(?:\s+to)?|go to|head to|leave|inspect|examine)\s+(?:the\s+)?(.+)$/i
  );
  const raw = (named?.[1] ?? '').replace(/[.!?]+$/, '').trim();
  if (raw) {
    const matched = matchLedgerNoun(raw, state, { allowCorpse: allowCorpse && verb !== 'spoke' });
    if (matched) {
      const kill = state.sceneFacts?.lastKill;
      if (verb === 'spoke' && matchesLastKillName(matched, kill)) {
        return livingLedgerPeople(state)[0];
      }
      return matched;
    }
  }
  const enc = state.activeEncounter?.name?.trim();
  if (enc && (verb === 'attacked' || verb === 'parleyed' || verb === 'fled')) return enc;
  const kill = state.sceneFacts?.lastKill;
  if (kill?.name && allowCorpse && verb !== 'spoke') return kill.name;
  if (verb === 'spoke') return livingLedgerPeople(state)[0];
  return undefined;
}
/** 29z9k — reading level and the two content switches, read from Kid Mode / cursing / violence settings. */
export type ReaderFlags = {
  level: ReadingLevel;
  swearing: boolean;
  violenceDetail: boolean;
  /** Cursing 'mild': swearing is on, but only now and then and never strong. */
  swearingMild?: true;
  /** Violence 'none': no blow, blood or wound on the page. */
  violenceNone?: true;
};
export function readerFlags(
  settings: Pick<Settings, 'contentMode' | 'cursingLevel' | 'violenceLevel' | 'readingLevel'>
): ReaderFlags {
  if (settings.contentMode === 'kid') return { level: 'child', swearing: false, violenceDetail: false };
  const flags: ReaderFlags = {
    level: settings.readingLevel === 'plain' ? 'plain' : 'standard',
    swearing: settings.cursingLevel !== 'none',
    violenceDetail: settings.violenceLevel === 'graphic',
  };
  if (settings.cursingLevel === 'mild') flags.swearingMild = true;
  if (settings.violenceLevel === 'none') flags.violenceNone = true;
  return flags;
}
const READER_LEVEL_NOTE: Record<ReadingLevel, string> = {
  plain: 'plain — write for a reader aged about 9 to 11: short whole sentences, name the place and the object, no metaphor that needs explaining, no sentence fragments',
  standard: 'standard — the usual adult voice',
  child: 'child — Kid Mode content rules apply; short whole sentences that name the place and the object',
};
export function formatReaderLine(r: ReaderFlags): string {
  return [
    `READER: ${READER_LEVEL_NOTE[r.level]}.`,
    !r.swearing
      ? 'Swearing: off (no swearing at all).'
      : r.swearingMild
        ? 'Swearing: mild (a mild word now and then, never strong swearing or slurs).'
        : 'Swearing: on (adult language allowed, never slurs).',
    r.violenceDetail
      ? 'Violence detail: on.'
      : r.violenceNone
        ? 'Violence detail: none (fights still happen; say who won and what it cost, never the blow, blood or a wound).'
        : 'Violence detail: off (fights still happen; show the blow and what it did, never gore or a lingering wound).',
  ].join(' ');
}
export type PacketBuildExtras = {
  xp?: number;
  /** 29z9k — reading level + content switches for the writer. */
  reader?: ReaderFlags;
  /** 28g — engine receipts for this action; the writer must state them. */
  engineResult?: string;
  /** M2 — ordered reader step outcomes for FactSheet beat lines. */
  readerStepResults?: Array<{ tried: string; done: boolean; reason: string }>;
  /** The travel engine's commit this turn: the only source of 'arrived' / 'set out' and the other travel results. */
  travel?: {
    arrived: boolean;
    underway: boolean;
    outcome?: 'set out' | 'arrived' | 'fight opened' | 'blocked' | 'unchanged' | 'slipped away';
  };
  damage?: number;
  loot?: string[];
  /** Inventory before this turn's commits. Gains are derived; callers do not hand-write loot. */
  priorState?: GameState;
};
function liveEncounterHp(state: GameState): { current: number; max: number } | undefined {
  const enc = state.activeEncounter;
  if (enc && typeof enc.hp === 'number') {
    return { current: enc.hp, max: Math.max(1, enc.maxHp || enc.hp) };
  }
  return undefined;
}
function isGenericHereLabel(raw: string): boolean {
  return !raw.trim() || /^(?:your surroundings|nearby cover|just ahead of you|this room)$/i.test(raw);
}
function locationLabel(state: GameState): string {
  const trip = underwayHereLabel(state);
  if (trip) return trip;
  const fromCover = (state.openingEstablishment?.answers?.where ?? '').trim();
  const live = proseRoomPlace(
    cleanPlaceLabel(playerFacingLocation(state) || String(state.currentLocation ?? '') || ''),
    state.activeDungeon?.dungeonName
  );
  const raw = !isGenericHereLabel(live) ? live : fromCover || live;
  if (raw && raw.length <= 48 && !/^alone\b/i.test(raw) && !/,/.test(raw) && !isGenericHereLabel(raw)) {
    return raw;
  }
  if (fromCover && isGenericHereLabel(live)) {
    return fromCover.length <= 72 ? fromCover : fromCover.slice(0, 72).trim();
  }
  const short = shortRoomLabel(raw, fromCover || 'this room');
  if (short && !isGenericHereLabel(short)) return short;
  return fromCover || short || 'this room';
}
function pushUnique(list: string[], seen: Set<string>, raw: string | undefined): void {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!name || name.length < 2) return;
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(name);
  const last = name.split(/\s+/).pop() ?? '';
  // Only a proper-noun tail is a short name ("Close" for Cathedral Close); "streets" from "Back streets" is not.
  if (last.length >= 5 && /^[A-Z]/.test(last) && last.toLowerCase() !== key) {
    const lastKey = last.toLowerCase();
    if (!seen.has(lastKey)) {
      seen.add(lastKey);
      list.push(last);
    }
  }
}
export type NounAllowlistOpts = {
  /** Hall talk: addressee + card CAST names only (plus HERE / card tokens). */
  hallTalk?: boolean;
  /** This turn's ENGINE RESULT: a pack item it names ("found Fine Longsword") is a ref the writer can name. */
  engineResult?: string;
  /** This turn's player line: tabletop worn kit it names is a ref. */
  action?: string;
};
/**
 * Ledger-only nouns. HERE short label, present named, opening CAST from the card,
 * companions, live encounter role, lastKill corpse, kit, props.
 * Hall talk strips novel present[] so a leftover invent cannot re-license itself.
 */
function castMentionNames(state: GameState): string[] {
  if (state.openingEstablishment?.castNpcIds?.length) {
    // Card cast is a ref only at the card's place or while present; on the road they are not in the scene.
    const atCard = openingCastBelongsHere(state);
    const here = new Set(presentNpcRecords(state).map((r) => r.npcName));
    return openingCastRecords(state)
      .filter((r) => atCard || here.has(r.npcName))
      .map((r) => r.npcName);
  }
  // 29y — a card role label with no NPC record ("the innkeep") belongs to the opening place only;
  // offered elsewhere it stood in for a priest, a weapon or a trap.
  return openingCastBelongsHere(state) ? openingCastNames(state) : [];
}
/**
 * No circling record still means "at the opening" to atOpeningPlace. A different previous place
 * means the move already happened, so a seed card's people are not this street's cast.
 */
function openingCastBelongsHere(state: GameState): boolean {
  if (!atOpeningPlace(state)) return false;
  const key = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const here = key(state.currentLocation);
  const where = key(state.openingEstablishment?.answers?.where || state.openingEstablishment?.card?.place);
  // Back at the opening, including a return from somewhere else. The previous sheet is the place left.
  if (where && here && (where === here || where.includes(here) || here.includes(where))) return true;
  const prev = key(state.previousLocationSheet?.name);
  if (prev && here && prev !== here) return false;
  if (where && here && where !== here && !where.includes(here) && !here.includes(where)) return false;
  return true;
}
function atOpeningPlace(state: GameState): boolean {
  const c = state.circling;
  if (!c?.lastLocation) return true;
  const key = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (c.openingPlace) return key(state.currentLocation) === key(c.openingPlace);
  return !c.prevPlace;
}
/** Opening hall talk: at the card's place and nobody has moved yet. Only then does talk narrow the turn's names. */
function beforeFirstMove(state: GameState): boolean {
  return openingCastBelongsHere(state) && !state.circling?.prevPlace;
}
/** Capitalised runs inside a place card description that do not open a sentence. */
function placeCardNames(description: string | undefined): string[] {
  const out: string[] = [];
  for (const sentence of (description ?? '').split(/(?<=[.!?;:])\s+/)) {
    const words = sentence.trim().split(/\s+/).slice(1).join(' ');
    for (const m of words.matchAll(/\b[A-Z][\w'’]+(?:\s+[A-Z][\w'’]+)*/g)) out.push(m[0].replace(/['’]s$/, ''));
  }
  return out;
}
/** The mention list is the REF ENUM's displays, plus the card's scene words, the place card's names, the player and the bible's hubs. */
export function compileNounAllowlist(
  state: GameState,
  extras: string[] = [],
  opts?: NounAllowlistOpts
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const ref of compileRefEnum(state, extras, opts)) pushUnique(out, seen, ref.display);
  // HERE paints a dungeon room in prose words; its map key and the dungeon stay nameable in plain prose.
  const key = String(state.currentLocation ?? '').trim();
  if (proseRoomPlace(key, state.activeDungeon?.dungeonName) !== key) {
    pushUnique(out, seen, key);
    pushUnique(out, seen, key.split(/\s+[—–-]\s+/)[0]);
  }
  for (const tok of cardSceneMentionTokens(state)) {
    pushUnique(out, seen, tok);
  }
  // The place card the info sheet prints as "What it is" ("Notice-board and Crown job postings."): its names were handed.
  for (const name of placeCardNames(placeCardFor(state, playerFacingLocation(state))?.description)) {
    pushUnique(out, seen, name);
  }
  const pc = (state.character?.name ?? '').trim();
  if (pc && !/^(you|adventurer|player)$/i.test(pc)) pushUnique(out, seen, pc);
  for (const h of hubsForBibleId(state.campaignBibleId)) {
    pushUnique(out, seen, h.name);
    for (const alias of hubAliasLabels(h)) pushUnique(out, seen, alias);
  }
  // This turn's road stop only, the name inside travelBeat ("The way passes the Old Well").
  const beat = ` ${travelBeatFact(state).toLowerCase()} `;
  for (const stop of Object.values(state.routeStops ?? {}).flat()) {
    const name = stop.name.toLowerCase();
    let at = name.length > 1 ? beat.indexOf(name) : -1;
    while (at >= 0) {
      const b = beat.charAt(at - 1);
      const a = beat.charAt(at + name.length) || ' ';
      const left = b < '0' || (b > '9' && b < 'a') || b > 'z';
      const right = a < '0' || (a > '9' && a < 'a') || a > 'z';
      if (left && right) {
        pushUnique(out, seen, stop.name);
        break;
      }
      at = beat.indexOf(name, at + 1);
    }
  }
  const retired = state.openingEstablishment?.instance?.retiredNames;
  const dropped = filterRetiredFromAllowlist(out, retired).filter((n) => !isCatalogCastBlockedHere(state, n));
  const keptHubs = out.filter(
    (n) => isCampaignHubToken(n, state.campaignBibleId) && !dropped.some((f) => f.toLowerCase() === n.toLowerCase())
  );
  return keptHubs.length ? [...dropped, ...keptHubs] : dropped;
}
/** Two cast labels name one person when one's words run whole inside the other's ("faces" / "the exhausted faces"). */
function sameCastPerson(a: string, b: string): boolean {
  const words = (s: string) => ` ${s.toLowerCase().replace(/^(?:the|a|an)\s+/, '').replace(/\s+/g, ' ').trim()} `;
  const x = words(a);
  const y = words(b);
  return x.includes(y) || y.includes(x);
}
function slugRefId(raw: string): string {
  return (raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
/**
 * A ref the writer may paint as a person or a place is a name or a short noun phrase. A card line
 * that is a sentence ("alone on the stone outline of a building that is gone"), a denial
 * ("Nobody here — only a footprint") or deixis ("the thief beside you") is not a thing to paint.
 */
export function isPaintableRefLabel(label: string): boolean {
  const t = (label ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^(?:no|nobody|no one|nothing|none|alone|only|empty)\b/i.test(t)) return false;
  if (/\b(?:you|your|yours|yourself|me|my)\b/i.test(t)) return false;
  if (/\b(?:that|who|which)\s+(?:is|are|was|were|has|have|had)\b/i.test(t)) return false;
  if (/\s[—–-]\s|[;:]/.test(t)) return false;
  return t.split(' ').length <= 8;
}
const SPEAKS: readonly TokenUse[] = ['speaker', 'actor', 'addressed']; // person/companion/live road meeting
const TOKEN_USES_FOR_CLASS: Record<LedgerRefClass, readonly TokenUse[]> = {
  place: ['place'],
  person: SPEAKS,
  creature: ['actor', 'addressed'],
  companion: SPEAKS,
  meeting: SPEAKS,
  corpse: ['corpse'],
  prop: ['prop_used'],
  kit: ['worn', 'prop_used'],
  carried: ['prop_used'],
  window: ['prop_used'],
};
/** `use` must match the ledger class — Lene cannot be `prop_used`. */
export function tokenUseMatchesClass(use: TokenUse, klass: LedgerRefClass): boolean {
  return TOKEN_USES_FOR_CLASS[klass].includes(use);
}
/**
 * This-turn ref enum. HERE, card CAST, present, companions, lastKill corpse, kit, props.
 * Hall talk matches compileNounAllowlist — leftover invent cannot re-license itself.
 */
export function compileRefEnum(
  state: GameState,
  extras: string[] = [],
  opts?: NounAllowlistOpts
): LedgerRef[] {
  const out: LedgerRef[] = [];
  const seenId = new Set<string>();
  const seenDisplay = new Set<string>();
  let n = 1;
  const add = (id: string, display: string, klass: LedgerRefClass, note?: string) => {
    const label = (display ?? '').replace(/\s+/g, ' ').trim();
    if (!label || label.length < 2) return;
    if (id !== 'here' && (klass === 'person' || klass === 'place' || klass === 'companion') && !isPaintableRefLabel(label)) return;
    const key = id.toLowerCase();
    const dkey = label.toLowerCase().replace(/^(?:the|a|an)\s+/, '');
    if (seenId.has(key) || seenDisplay.has(dkey)) return;
    seenId.add(key);
    seenDisplay.add(dkey);
    out.push({ tok: `t${n++}`, id, display: label, klass, ...(note ? { note } : {}) });
  };
  const pcName = (state.character?.name ?? '').trim() || 'the player character';
  const housingId = state.systemHousing?.housing;
  const windowNote = housingId
    ? systemHousingWriterClause(housingId)
    : `the System window: only ${pcName} sees it; nobody can touch it; no surface, heat or weight; it shows text`;
  // Known exits / journey ends first (settlement place refs the writer may bind by name).
  // Live HERE always after that (trip phrase while underway). Skipping HERE made placeTok fall
  // through to journey.from ("Nothing in Valespire…"); prepending HERE displaced the known
  // place toks a replay binds by. placeTok prefers id === 'here' regardless of list order.
  for (const place of nearbyPlaceNames(state)) add(`place:${slugRefId(place)}`, place, 'place');
  add('here', locationLabel(state), 'place');
  const castNote = openingCastNote(state);
  const castRows: string[] = [];
  for (const name of castMentionNames(state)) {
    if (isNeverCastTitle(name, state)) continue;
    // T10X — crowd fillers never CAST; ledger groups (roof-thieves) stay person refs.
    if (isCrowdFillerToken(name)) continue;
    // "faces" and "a steward behind the oak" are the same people as "the exhausted faces" / "the steward": one row each.
    if (castRows.some((prev) => sameCastPerson(prev, name))) continue;
    castRows.push(name);
    add(`cast:${slugRefId(name)}`, name, 'person', castNote);
  }
  if (!opts?.hallTalk) {
    const road = roadMeetingRef(state);
    if (road) add(`road:${slugRefId(road.display)}`, road.display, 'meeting', road.note);
    // T10RC5fix — speaker/person refs = peopleHere (lives-here location stamp + seats; road/neverCast/range).
    // Live foe stays on encounter: (s77), not present: — peopleHere includes them for talk, enum keeps one id.
    const foeKey = (state.activeEncounter?.name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const seated = peopleHere(state);
    for (const p of seated) {
      if (isNeverCastTitle(p, state)) continue;
      if (isCrowdFillerToken(p)) continue;
      if (foeKey && p.replace(/\s+/g, ' ').trim().toLowerCase() === foeKey) continue;
      add(`present:${slugRefId(p)}`, p, 'person');
    }
    const encName = state.activeEncounter?.name?.trim();
    if (encName && state.activeEncounter) {
      const enc = state.activeEncounter;
      if (typeof enc.canSpeak !== 'boolean') enc.canSpeak = foeCanSpeak(enc);
      // T10RC8 — role/catalog foeName is a kind label (proseEncounterLabel), not a person speaker.
      const role = isEncounterRoleLabel(encName);
      const display = role ? proseEncounterLabel(encName).label : encName;
      add(
        `encounter:${slugRefId(encName)}`,
        display,
        !role && enc.canSpeak ? 'person' : 'creature',
      );
    }
    const kill = state.sceneFacts?.lastKill;
    if (kill?.name && kill.remains && kill.outcome === 'victory') {
      add(`corpse:${slugRefId(kill.name)}`, kill.name, 'corpse');
    }
    // Tabletop: worn kit is a ref only on a turn that uses it, so the writer has no kit list to paste.
    const kitTurn = `${opts?.action ?? ''}\n${opts?.engineResult ?? ''}`;
    for (const item of state.inventory ?? []) {
      if (!item.equipped || !item.name) continue;
      if (state.engineMode === 'dnd' && !turnUsesKit(item.name, kitTurn)) continue;
      add(`kit:${slugRefId(item.name)}`, kitRefDisplay(item.name, state.engineMode === 'dnd'), 'kit');
    }
    for (const c of state.companions ?? []) {
      if (c.name) add(`companion:${slugRefId(c.name)}`, c.name, 'companion');
    }
  }
  const engineResult = (opts?.engineResult ?? '').toLowerCase();
  for (const item of engineResult ? state.inventory ?? [] : []) {
    if (item.equipped || !item.name || !engineResult.includes(item.name.toLowerCase())) continue;
    add(`kit:${slugRefId(item.name)}`, kitRefDisplay(item.name, state.engineMode === 'dnd'), 'carried', 'the engine result hands it over this turn; carried, not worn');
  }
  const addWindow = (label: string) => {
    if (state.engineMode !== 'litrpg') return;
    const display = housedWindowDisplay(state, label);
    if (display) add(`window:${slugRefId(label)}`, display, 'window', windowNote);
  };
  // A card prop the player now owns ("tabard" after the offer granted the visitor's tabard) is carried, not scenery.
  // Inventory never on screen stays unhanded.
  const owned = (state.inventory ?? []).map((i) => ({
    name: kitRefDisplay(i.name ?? '').toLowerCase().replace(/[\u2018\u2019]/g, "'"),
    worn: !!i.equipped,
  }));
  const ownedProp = (prop: string) => {
    const p = prop.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/^(?:the|a|an)\s+/, '').trim();
    return p ? owned.find((o) => o.name === p || o.name.endsWith(` ${p}`)) : undefined;
  };
  for (const prop of state.sceneFacts?.props ?? []) {
    const own = ownedProp(prop);
    if (own?.worn) continue;
    if (own) add(`kit:${slugRefId(prop)}`, prop, 'carried', 'carried, not worn');
    else if (isSystemWindowLabel(prop) && state.engineMode === 'litrpg') addWindow(prop);
    else add(`prop:${slugRefId(prop)}`, prop, 'prop');
  }
  const seatedExtra = new Set(peopleHere(state).map((n) => n.replace(/\s+/g, ' ').trim().toLowerCase()));
  for (const extra of extras) {
    if (!extra || isNeverCastTitle(extra, state)) continue;
    if (isSystemWindowLabel(extra)) addWindow(extra);
    // T10RC5 — extras not in peopleHere are absence facts, not speaker rows (road Dunn/Edda).
    else if (seatedExtra.has(extra.replace(/\s+/g, ' ').trim().toLowerCase())) {
      add(`extra:${slugRefId(extra)}`, extra, 'person');
    }
  }
  return out.filter((r) => {
    if (r.klass !== 'person' && r.klass !== 'meeting') return true;
    return !isCatalogCastBlockedHere(state, r.display);
  });
}
/**
 * Displays + labels the writer was handed this turn. One list for repeated-habit masks,
 * factCheck `handedPeople` (same label rule), and later P-5 / M.
 * Trip ground/ends join while underway (enum also has `here` as the trip phrase); not a second handmade checker.
 */
export function handedRefs(
  state: GameState,
  packet?: CompletedEventPacket,
  opts?: NounAllowlistOpts
): string[] {
  const refs = packet?.refEnum?.length ? packet.refEnum : compileRefEnum(state, [], opts);
  const j = state.journey;
  const rows: { display: string; note?: string }[] = [...refs];
  for (const s of [underwayHereLabel(state), j?.ground, j?.from, j?.to]) {
    const display = (s ?? '').trim();
    if (display.length >= 3) rows.push({ display });
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    for (const raw of [r.display, (r.note ?? '').split(';')[0]]) {
      const t = (raw ?? '').trim();
      if (t.length < 3) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      let i = 0;
      while (i < out.length && out[i]!.length >= t.length) i++;
      out.splice(i, 0, t);
    }
  }
  return out;
}
export function formatRefEnumForWriter(refs: LedgerRef[]): string {
  if (!refs.length) return 'REF ENUM: (none this turn)';
  return [
    'REF ENUM (id must be one of these; names in lines.text only as @tN — code paints the display):',
    ...refs.map((r) => `${r.tok}  ${r.id}  ${r.klass}  "${r.display}"${r.note ? `  (${r.note})` : ''}`),
  ].join('\n');
}
function isCombatVerb(verb: string): boolean {
  return verb === 'attacked' || verb === 'fled' || verb === 'parleyed';
}
function resolveOutcome(
  state: GameState,
  verb: string,
  playerInput: string,
  travel?: PacketBuildExtras['travel']
): EventOutcome {
  const leg = travel?.outcome;
  if (travel?.arrived || leg === 'arrived') return 'arrived';
  if (travel?.underway || leg === 'set out') return 'set out';
  if (leg === 'slipped away' || leg === 'fight opened' || leg === 'blocked') return leg;
  const kill = state.sceneFacts?.lastKill;
  const justKilled =
    !!kill?.name
    && kill.outcome === 'victory'
    && kill.remains
    && kill.turn === state.turn
    && !state.activeEncounter;
  if (justKilled && isCombatVerb(verb)) return 'killed';
  const enc = state.activeEncounter;
  if (enc && isCombatVerb(verb) && typeof enc.hp === 'number' && enc.maxHp) {
    if (enc.hp <= 0) return 'killed';
    if ((verb === 'fled' || /\bflee\b/i.test(playerInput)) && enc.caught) return 'caught';
    if (verb === 'fled' || /\bflee\b/i.test(playerInput)) return 'fled';
    if (verb === 'attacked') {
      if (enc.hp < enc.maxHp * 0.5) return 'bloodied';
      return 'hit';
    }
    if (verb === 'parleyed') return 'spoke';
  }
  // The fight engine settled an encounter this turn: its result, whatever words the player used.
  const settled = !enc
    ? [...(state.arcDirector?.encounterClearedReceipts ?? [])].reverse().find((r) => r.turn === state.turn)
    : undefined;
  if (settled) {
    if (settled.outcome === 'victory') return 'killed';
    if (settled.outcome === 'escape') return 'fled';
    if (settled.outcome === 'parleyResolved') return 'spoke';
    return 'defeated';
  }
  if (verb === 'fled') return 'fled';
  if (verb === 'spoke' || verb === 'parleyed') {
    if (justKilled && livingLedgerPeople(state).length === 0) return 'resolved';
    return 'spoke';
  }
  if (verb === 'left') return 'left';
  if (verb === 'looted') return 'looted';
  if (verb === 'inspected') return 'inspected';
  if (verb === 'used') return 'used';
  if (verb === 'waited') return 'waited';
  // A foe is 'spawned' only on the turn it goes live; a pending foe is still building and the outcome is the player's own.
  if (enc && !justKilled && enc.startedTurn === state.turn) return 'spawned';
  return 'unchanged';
}
function rhythmBeats(state: GameState): string[] {
  const tail = selectRecentLogForContext(state, Math.max(WRITER_RHYTHM_WINDOW * 4, 8));
  return tail
    .filter((e: LogEntry) => e.role === 'gm')
    .slice(-WRITER_RHYTHM_WINDOW)
    .map((e) => String(e.content ?? '').slice(0, WRITER_RHYTHM_CHAR_CAP));
}
/** The first sentence of each committed beat, as recorded fact for the writer. */
export function recordedBeatOpeners(beats: readonly string[]): string[] {
  return beats
    .map((b) => (splitProseSentences(String(b ?? '').replace(/\s+/g, ' ').trim())[0] ?? '').trim())
    .filter(Boolean);
}
const PAGE_SAME_ACTION_CAP = 2;
/**
 * Openers already printed. The last beat is always one: it is the line the new beat follows, even when it
 * was set at the place this turn's move leaves. Older beats count only while the scene tail keeps them (a
 * room left on an earlier move stays out). Earlier beats that answered the same player line come too, so a
 * repeated move ("Travel toward Lowmarket") is not opened the same way again.
 */
export function pageOpeners(state: GameState, action: string): string[] {
  const log = state.log ?? [];
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const gmAt = log.map((e, i) => (e.role === 'gm' && String(e.content ?? '').trim() ? i : -1)).filter((i) => i >= 0);
  const tail = new Set(selectRecentLogForContext(state, Math.max(WRITER_RHYTHM_WINDOW * 4, 8)));
  const picked = new Set(gmAt.slice(-WRITER_RHYTHM_WINDOW).filter((i, k, recent) => k === recent.length - 1 || tail.has(log[i])));
  const act = norm(action);
  if (act) {
    const same = gmAt.filter((i) => {
      const asked = [...log.slice(0, i)].reverse().find((e) => e.role === 'player');
      return !!asked && norm(String(asked.content ?? '')) === act && !picked.has(i);
    });
    for (const i of same.slice(-PAGE_SAME_ACTION_CAP)) picked.add(i);
  }
  const beats = [...picked].sort((a, b) => a - b).map((i) => String(log[i]?.content ?? '').slice(0, WRITER_RHYTHM_CHAR_CAP));
  return [...new Set(recordedBeatOpeners(beats))];
}
export type LoiterStreakFamily = 'inspect' | 'wait' | null;
export function classifyLoiterFamily(input: string): LoiterStreakFamily {
  const verb = classifyVerb(input);
  if (verb === 'inspected') return 'inspect';
  if (verb === 'waited') return 'wait';
  return null;
}
function hereKey(state: GameState): string {
  return (state.currentLocation ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}
/**
 * Persist inspect/wait depth on this HERE.
 * Reset on travel, leave, talk, combat, or location change.
 */
export function nextLoiterStreaks(
  state: GameState,
  playerInput?: string
): { inspectStreak: number; waitStreak: number; loiterHere: string } {
  const here = hereKey(state);
  const prevHere = (state.sceneFacts?.loiterHere ?? '').trim().toLowerCase();
  const action = lastPlayerAction(state, playerInput);
  const verb = classifyVerb(action);
  const fam = classifyLoiterFamily(action);
  const combat = !!state.activeEncounter;
  const leftScene =
    verb === 'traveled'
    || verb === 'left'
    || verb === 'spoke'
    || verb === 'parleyed'
    || verb === 'attacked'
    || verb === 'fled';
  const moved = !!prevHere && !!here && prevHere !== here;
  if (combat || leftScene) {
    return { inspectStreak: 0, waitStreak: 0, loiterHere: here };
  }
  if (!fam) {
    return { inspectStreak: 0, waitStreak: 0, loiterHere: here };
  }
  const prevInspect = !moved && prevHere === here ? state.sceneFacts?.inspectStreak ?? 0 : 0;
  const prevWait = !moved && prevHere === here ? state.sceneFacts?.waitStreak ?? 0 : 0;
  if (fam === 'inspect') {
    return { inspectStreak: prevInspect + 1, waitStreak: 0, loiterHere: here };
  }
  return { inspectStreak: 0, waitStreak: prevWait + 1, loiterHere: here };
}
function ledgerFocusNoun(state: GameState): string {
  const empty = (state.sceneFacts?.searchedEmpty ?? []).find((s) => (s ?? '').trim().length > 2);
  if (empty) return empty.trim();
  const prop = (state.sceneFacts?.props ?? []).find(
    (s) => (s ?? '').trim().length > 2 && !/^(here|room|air|dust|light)$/i.test(s.trim())
  );
  if (prop) return prop.trim();
  if (state.activeDungeon) {
    const pad = graphExitPads(state.activeDungeon)[0] ?? '';
    const dest = pad.replace(/^.*\s+to\s+/i, '').trim();
    if (dest.length > 1) return dest;
  }
  return '';
}
/** Writer-only: starve the 500-char same-room essay on inspect/wait retry. */
export function collapseLoiterWriterBeats(packet: CompletedEventPacket): string[] {
  const inspect = packet.inspectStreak ?? 0;
  const wait = packet.waitStreak ?? 0;
  if (inspect < 2 && wait < 2) return packet.recentBeats ?? [];
  const kind = inspect >= 2 ? 'inspect' : 'wait';
  const n = Math.max(inspect, wait);
  const focus = packet.focusNoun ? `; focus ${packet.focusNoun}` : '; no new props';
  return [`(HERE unchanged; ${kind} ×${n}${focus})`];
}
export function buildCompletedEventPacket(
  state: GameState,
  playerInput?: string,
  extras?: PacketBuildExtras
): CompletedEventPacket {
  const riteOffer = openingRiteWriterOffer(state);
  state = stateForRiteWriter(state);
  const action = lastPlayerAction(state, playerInput);
  const verb = classifyVerb(action);
  const target = extractTarget(action, state);
  const location = locationLabel(state);
  const kill = state.sceneFacts?.lastKill;
  const justKilled =
    !!kill?.name
    && kill.outcome === 'victory'
    && !!kill.remains
    && kill.turn === state.turn
    && !state.activeEncounter;
  const outcome = resolveOutcome(state, verb, action, extras?.travel);
  const witnesses = presentNpcRecords(state)
    .map((r) => r.npcName)
    .filter((n) => !matchesLastKillName(n, kill));
  const allowExtras: string[] = [];
  if (target && !isIntentRemainderNoun(target)) allowExtras.push(target);
  const hallTalk = (verb === 'spoke' || isHallTalkPlayerLine(action)) && beforeFirstMove(state);
  if (hallTalk) {
    const cast = openingCastLabel(state);
    if (cast) allowExtras.push(cast);
  }
  const ledgerRead = !!ledgerSheetLine(state) && isLedgerReadAction(action);
  // A ledger read is not an act in the room: the System window is not a ref the writer can bind as
  // an actor, a prop or a thing that answers. Scene mentions were still copying the prop through.
  const refOpts = { hallTalk, engineResult: extras?.engineResult, action };
  const sceneForWriter = ledgerRead ? stateWithoutSystemWindowProp(state) : state;
  const sceneBlock = [
    formatSceneBlock(sceneForWriter),
    ...recalledSaidLines(sceneForWriter, playerInput ?? ''),
    ...recalledPlayerLines(sceneForWriter, playerInput ?? ''),
  ]
    .filter(Boolean)
    .join('\n');
  const sceneMentions = mentionFromScene(sceneForWriter);
  const allowlist = [
    ...sceneMentions,
    ...compileNounAllowlist(state, allowExtras, refOpts),
  ].filter((n, i, arr) => {
    if ((ledgerRead || state.systemHousing) && isSystemWindowLabel(n)) return false;
    return arr.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i;
  });
  const refEnum = compileRefEnum(state, allowExtras, refOpts)
    .filter((r) => !ledgerRead || r.klass !== 'window');
  // q72: REF records only for ids referenced this turn (player line / chips / engine event), cap 3.
  const referencedIds: string[] = [];
  const actLower = (action ?? '').toLowerCase();
  for (const r of refEnum) {
    if (referencedIds.length >= 3) break;
    const needle = (r.display ?? '').toLowerCase();
    if (needle && actLower.includes(needle)) referencedIds.push(r.id);
  }
  for (const m of state.npcMemories ?? []) {
    if (referencedIds.length >= 3) break;
    if (actLower.includes(m.npcName.toLowerCase()) && !referencedIds.includes(m.npcId)) referencedIds.push(m.npcId);
  }
  const refRecords = formatRefRecords(state, referencedIds) || undefined;
  const movement = movementFact(state, action) || undefined;
  const leg = state.journey;
  const destinationRef = leg && /^Moved this turn: on from /.test(movement ?? '')
    ? refEnum.find((r) => r.klass === 'place' && r.display.toLowerCase() === leg.to.trim().toLowerCase())
    : undefined;
  const enc = state.activeEncounter;
  const hp = liveEncounterHp(state);
  // A housing with experience off grows XP hidden: the writer gets no XP fact.
  const xp = hidesPart(state.systemHousing, 'experience')
    ? 0
    : extras?.xp ?? (justKilled || outcome === 'killed' ? 25 : 0);
  const streaks = nextLoiterStreaks(state, playerInput);
  const focusNoun = ledgerFocusNoun(state);
  const placeFacts = ledgerPlaceFacts(state);
  const askedWantAtCard = hallTalkTopic(action) === 'want' && atOpeningPlace(state);
  const basePacket: CompletedEventPacket = {
    turn: state.turn,
    actor: 'you',
    pc: { name: state.character?.name ?? null, gender: state.character?.gender ?? null },
    verb,
    target,
    outcome,
    damage: extras?.damage,
    hp,
    loot: [...new Set([...(extras?.loot ?? []), ...inventoryGainedThisTurn(extras?.priorState, state)].map((name) => name.trim()).filter(Boolean))],
    xp,
    witnesses,
    knownBy: presentNpcRecords(state)
      .filter((r) => !matchesLastKillName(r.npcName, kill))
      .map((r) => sheetMemoryLine(r, state.character?.name))
      .filter(Boolean),
    gates: gateFactLines(state),
    location,
    lastKill: justKilled || (kill?.remains && kill.outcome === 'victory') ? kill : undefined,
    justKilled,
    combatLive: !!enc && !justKilled,
    mood: state.sceneFacts?.tension && state.sceneFacts.tension !== 'unknown' ? state.sceneFacts.tension : undefined,
    phase: justKilled ? 'cleared' : enc?.phase ? enc.phase : state.sceneFacts?.pendingEncounter ? 'pending' : 'idle',
    allowlist,
    refEnum,
    sceneBlock,
    refRecords,
    // A check chip's failure cost is menu text, not what the player did.
    playerAction: meetingMoveBase(action) || '(opening)',
    talkTopic: hallTalkTopic(action) ?? undefined,
    talkAsked: hallTalkTopic(action) ? countSameHallTopicRepeats(state, playerInput) : undefined,
    recentBeats: rhythmBeats(state),
    pageOpeners: pageOpeners(state, action),
    infoSheet: formatInfoSheet(state),
    reader: extras?.reader,
    inspectStreak: streaks.inspectStreak,
    waitStreak: streaks.waitStreak,
    focusNoun: focusNoun || undefined,
    answerWho: sceneAnswerWho(state) || undefined,
    answerWhoQuote: sceneAnswerWho(state)
      ? openingSpokenIdentityQuote(sceneAnswerWho(state), {
          location: state.currentLocation,
          engineMode: state.engineMode,
          state,
        }) || undefined
      : undefined,
    answerWant: openingWantLine(state) || undefined,
    answerStayLeave: openingStayLeaveLine(state) || undefined,
    answerOffer: shortCardOffer(state) || undefined,
    cardWant: askedWantAtCard ? shortCardWant(state) || undefined : undefined,
    cardOffer: askedWantAtCard && openOpeningOffer(state) ? shortCardOffer(state) || undefined : undefined,
    openingRiteOffer: riteOffer || state.sceneFacts?.openingRiteOffer || undefined,
    playerPronounRail: formatPlayerPronounRail(state) || undefined,
    pcNameClash: formatPcNameClashRail(state) || undefined,
    establishedOpeningScene: formatEstablishedOpeningScene(state) || undefined,
    openingRiteRefusePersist:
      openingRiteRefuseWriterFact(state) || state.sceneFacts?.openingRiteRefusePersist || undefined,
    engineMode: state.engineMode,
    placeDescriptor: placeFacts.descriptor || undefined,
    exitNames: placeFacts.exits.length ? placeFacts.exits : undefined,
    ledgerChanges: ledgerRead ? ledgerReadChanges(state) : undefined,
    systemBlock: state.systemHousing ? formatSystemBlock(state.systemHousing) : undefined,
    ledgerRead: ledgerRead || undefined,
    engineResult: withRoadMeetingEvent(state, extras?.engineResult) || undefined,
    readerStepResults: extras?.readerStepResults?.length ? extras.readerStepResults : undefined,
    movement,
    destinationRef,
  };
  // M1 — attach the one FactSheet after the packet fields exist (writer leaf + TurnLog hash).
  return {
    ...basePacket,
    factSheet: buildFactSheet(state, basePacket, playerInput),
  };
}

/**
 * The facts the writer was handed this turn, as one text.
 * M1: FactSheet is the single world-facts source; ENGINE RESULT + PLAYER stay on this record
 * so the line gate can read them even when only those fields were stamped (partial packet).
 */
export function handedWriterText(state: GameState, packet: Partial<CompletedEventPacket>): string {
  const typedExtra = String((packet as { playerInput?: string }).playerInput ?? '').trim();
  const player =
    (packet.playerAction && packet.playerAction !== '(opening)' ? packet.playerAction : '') || typedExtra;
  const sheet =
    packet.factSheet ??
    (packet.verb
      ? buildFactSheet(state, packet as CompletedEventPacket, player)
      : undefined);
  const facts = sheet ? formatFactSheetForWriter(sheet) : '';
  // Short ENGINE RESULT: lines are the line-gate record (same shape as pre-M1). Skip when the
  // FactSheet already carried them so a full packet does not double-dump.
  const engineLines = sheet?.beat.engineResult
    ? []
    : (packet.engineResult ?? '')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `ENGINE RESULT: ${l.trim()}`);
  return [
    facts,
    ...engineLines,
    packet.movement ?? '',
    ...(packet.ledgerChanges ?? []),
    player ? `PLAYER: ${player}` : '',
    ...(packet.allowlist ?? []),
  ].filter(Boolean).join('\n');
}
/** Same talk family as choiceRanking.actionFamily (inspect / wait / look win there first). */
const TALK_ACTION = /^(?![\s\S]*\b(?:inspect|examine|study|wait|ready yourself|watch|hold still|keep watch|look around|look over|survey|scout|scan)\b)[\s\S]*\b(?:talk|ask|speak|greet|offer)\b/i;
const TALK_STAYS = ' A talk, ask or offer with no move is valid play: answer it in dialogue here and do not travel.';
/**
 * 29y — one visit per place: the move the engine committed this turn, or that nothing moved.
 * 29z1 — on a talk turn with no move, say that talking in place is the play.
 */
export function movementFact(state: GameState, playerAction?: string): string {
  const stay = playerAction && TALK_ACTION.test(playerAction) ? TALK_STAYS : '';
  const line = movementLine(state, stay);
  const beat = travelBeatFact(state);
  return beat ? (line ? `${line} ${beat}` : beat) : line;
}
function movementLine(state: GameState, stay: string): string {
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  if (!here) return '';
  const c = state.circling;
  const movedNow = c?.movedTurn != null && c.movedTurn === state.turn;
  const j = state.journey;
  if (j && j.legsDone < j.legsTotal) {
    const ground = `the ${j.ground.toLowerCase()}`;
    return movedNow
      ? `Moved this turn: on from ${j.from} toward ${j.to}, now on ${ground}. Show ${ground} and what is on it; no arrival, and never tell how long the trip has taken or how far is left.`
      : `No move this turn: still on ${ground} between ${j.from} and ${j.to}. Do not narrate leaving or arriving.${stay}`;
  }
  const spot = hereSpotFact(state);
  if (spot && !movedNow) return spot;
  const prev = c?.prevPlace?.replace(/\s+/g, ' ').trim() ?? '';
  const from = prev && !isRoadLabel(prev) && prev.toLowerCase() !== here.toLowerCase() ? prev : '';
  if (movedNow && c?.shortReturnTurn === state.turn) {
    // 29z9j — short turn-back is a return to the same scene, not a new arrival.
    // T10AR — Free writer took "same scene" as license for null-delta ("nothing changed" /
    // "no one stepped forward" / "no new place picked out"; s9601 T160/T165). Keep return-not-
    // arrival ownership; still require showing the people/mood already on the ledger.
    const left = from ? ` from ${from}` : '';
    const nothing = from ? `; nothing more happens at ${from}` : '';
    return `Turned back this turn:${left} back to ${here}, a short way after leaving it. ${here} is the same scene as it was left: the same people, mood and open questions — show them on the return; never say nothing changed, that no one stepped forward, or that no new place was picked out. Not a new arrival${nothing}.`;
  }
  if (movedNow && from) {
    const pc = (state.character?.name ?? '').trim() || 'The player character';
    const walk = c?.tripArrivalTurn === state.turn
      ? ` ${pc} left ${from} on an earlier turn: the arrival is one sentence, with no account of the walk or how long it took, and never a step out of ${from}.`
      : '';
    return `Moved this turn: from ${from} to ${here}. Narrate one arrival at ${here}; nothing more happens at ${from}.${walk}`;
  }
  if (movedNow && c?.lastLocation) {
    return `Moved this turn: arrived at ${here}. Narrate one arrival at ${here}.`;
  }
  if (!c?.lastLocation) return '';
  return `No move this turn: at ${here} before and after. Do not narrate leaving, travelling or arriving.${stay}`;
}
type LedgerPlaceFacts = {
  place: string;
  descriptor: string;
  exits: string[];
  present: string[];
  leftBehind: string[];
  leftFrom: string;
};
function ledgerPlaceFacts(state: GameState): LedgerPlaceFacts {
  const place = (state.currentLocation || 'this place').replace(/\s+/g, ' ').trim();
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), place);
  // 27g — the stitch reads the same place card as the writer.
  const dungeonNode = state.activeDungeon?.nodes?.find((n) => n.id === state.activeDungeon?.currentNodeId);
  const inDungeonRoom = !!dungeonNode && place.toLowerCase().includes(dungeonNode.name.toLowerCase());
  const card = inDungeonRoom ? null : placeCardFor(state, place);
  const exits = inDungeonRoom && state.activeDungeon
    ? graphExitPads(state.activeDungeon).map((p) => p.replace(/^.*\s+to\s+/i, '').trim())
    : card?.exits?.length
      ? card.exits
      : outdoorHubTravelChoices(state, 3).map((c) => c.replace(/^Travel\s+(?:to|toward)\s+/i, '').trim());
  return {
    place: pagePlace(state, hub?.name ?? place) || 'this place',
    descriptor: inDungeonRoom ? '' : placeFirstSight(state, place),
    exits: exits.filter((e) => e.length > 1),
    present: sealedCastNames(state),
    leftBehind: recordsForEntries(state, state.sceneFacts?.leftBehind ?? []).map((r) => r.npcName),
    leftFrom: pagePlace(state, state.previousLocationSheet?.name ?? ''),
  };
}
/** Who can answer in this scene: a record present here; the opening role label only when no opening-cast record exists (so a left-behind NPC is never named). */
function sceneAnswerWho(state: GameState): string {
  const here = presentNpcRecords(state);
  if (here.length) return here[0].npcName;
  if (openingCastRecords(state).length) return '';
  return atOpeningPlace(state) ? openingCastLabel(state) : '';
}
/** A mapped place name for a page sentence. A road label or trip HERE is not a place. */
function pagePlace(state: GameState, name: string): string {
  const n = (name ?? '').replace(/\s+/g, ' ').trim();
  return n && !isRoadLabel(n) && !isTripHere(state, n) ? n : '';
}
/**
 * Brief 06 slice 3 — ledger stitch no longer paints canned miss prose.
 * Empty leaves the honest Try again path upstream.
 */
export function ledgerActionStitch(_state: GameState, _playerInput: string): string {
  return '';
}
function factToken(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Writer-leaf copy of a block. Drops a line only when every fact on it is already on the FactSheet.
 * A name, exit, scale, or quote the sheet does not carry stays. infoSheet and factSheet themselves are unchanged.
 */
export function writerLeafBlock(block: string, sheet: FactSheet | undefined): string {
  if (!block) return block;
  if (!sheet) return block;
  const place = factToken(sheet.place.name);
  const scale = factToken(sheet.place.scale ?? '');
  const exits = new Set(sheet.place.exits.map(factToken));
  const people = new Set(sheet.present.map((p) => factToken(p.name)));
  const recent = new Set(sheet.recent.map((r) => r.replace(/\s+/g, ' ').trim()));
  const lines = block.split('\n').flatMap((line) => {
    const said = line.startsWith('SAID:') ? saidWithoutRepeatedTimeline(line, recent) : line;
    const next = said.startsWith('NOW:') ? nowWithoutRepeatedPlace(said, place, scale) : said;
    if (!next || leafLineRepeatsSheet(next, { place, exits, people })) return [];
    return [next];
  });
  return lines.join('\n');
}

function saidWithoutRepeatedTimeline(line: string, recent: Set<string>): string {
  const parts = line.slice('SAID:'.length).trim().split(/;\s+/).filter((part) => {
    const text = part.replace(/\s+/g, ' ').trim();
    return text && !recent.has(text);
  });
  return parts.length ? `SAID: ${parts.join('; ')}` : '';
}

function nowWithoutRepeatedPlace(line: string, place: string, scale: string): string {
  const kept = line
    .slice('NOW:'.length)
    .split('·')
    .map((part) => part.trim())
    .filter((part) => {
      const token = factToken(part);
      if (!token) return false;
      if (place && token === place) return false;
      if (scale && token === scale) return false;
      return true;
    });
  return kept.length ? `NOW: ${kept.join(' · ')}` : '';
}

function taggedName(bit: string): { name: string; tag: string } {
  const match = bit.trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { name: factToken(bit), tag: '' };
  return { name: factToken(match[1] ?? ''), tag: factToken(match[2] ?? '') };
}

function leafLineRepeatsSheet(
  line: string,
  known: { place: string; exits: Set<string>; people: Set<string> }
): boolean {
  const location = line.match(/^Location:\s*(.+?)\.?\s*$/);
  if (location) return factToken(location[1] ?? '') === known.place;
  const places = line.match(/^PLACES:\s*(.+?)\s·\s*exits:\s*(.+)$/);
  if (places) {
    const here = factToken(places[1] ?? '');
    const listed = (places[2] ?? '').split(',').map((exit) => factToken(exit)).filter(Boolean);
    return here === known.place && listed.length > 0 && listed.every((exit) => known.exits.has(exit));
  }
  const noExits = line.match(/^PLACES:\s*(.+?)\s·\s*no named exits\s*$/i);
  if (noExits) return factToken(noExits[1] ?? '') === known.place && known.exits.size === 0;
  const present = line.match(/^PRESENT:\s*(.+)$/);
  if (present) {
    const body = (present[1] ?? '').trim();
    if (body === '(none)') return known.people.size === 0;
    const bits = body.split(',').map(taggedName).filter((bit) => bit.name);
    return bits.length > 0 && bits.every((bit) => known.people.has(bit.name) && (bit.tag === '' || bit.tag === 'person'));
  }
  const sceneExits = line.match(/^EXITS:\s*(.+)$/);
  if (sceneExits) {
    const body = (sceneExits[1] ?? '').trim();
    if (body === '(none)') return known.exits.size === 0;
    const bits = body.split(',').map(taggedName).filter((bit) => bit.name);
    return bits.length > 0 && bits.every((bit) => known.exits.has(bit.name) && (bit.tag === '' || bit.tag === 'road'));
  }
  return false;
}

/**
 * Short past-tense instruction + one FactSheet (M1). Facts only.
 * No SNAPSHOT/CRAFT essays. No "don't resurrect" lecture.
 * Second contexts (info layer / info sheet dump) are not appended here — FactSheet is the leaf.
 */
export function formatWriterFacingEvent(
  packet: CompletedEventPacket,
  opts?: { stricter?: boolean; perspective?: NarrativePerspective }
): string {
  const target = packet.target ? ` ${packet.verb === 'spoke' ? 'to ' : ''}${packet.target}` : '';
  const pov = pcPov(packet.pc, opts?.perspective);
  const who = pcStorySubject(pov);
  const thirdPerson = narratesPcInThirdPerson(pov);
  const panelRead = !!packet.ledgerRead;
  const lines: string[] = [];
  const talk = (packet.talkContext ?? '').trim();
  if (talk) lines.push(talk, '');
  lines.push(
    thirdPerson
      ? `Narrate this completed event in past tense, close third person on ${who} (${pov.he}/${pov.him}/${pov.his}) — never "you" for ${who} in the story.`
      : 'Narrate this completed event in past tense.',
    '',
  );
  // M1 — FactSheet is the single facts block (settings slot reserved for 6b).
  // T10TURNS — writerLeaf omits short ENGINE RESULT only (long form below). Timeline stays on WORLD FACTS.
  if (packet.factSheet) {
    lines.push(formatFactSheetForWriter(packet.factSheet, { writerLeaf: true }));
    lines.push('');
  }
  lines.push(
    'COMPLETED EVENT:',
    panelRead ? ledgerReadEventLine(who, pov.him, housingFromSystemBlock(packet.systemBlock)) : `${who} ${packet.verb}${target}.`,
    `Outcome: ${panelRead ? 'read the change below' : packet.outcome}.`,
  );
  // Content slot only — settled fact. "Already shown / write consequence" lives on PLAYER/ACTION
  // below. Do not glue those instructions into this line (live salt-road T4 echoed them as story).
  if (packet.engineResult) {
    const fightClose = terminalFightOutcome(packet.engineResult);
    // VR1-b: engineResult may include "Check success." / "Check failure." from outcomeFactFromRecord — one outcome fact.
    lines.push(
      `ENGINE RESULT: ${writerEngineResult(packet.engineResult, pcStorySubject(pcPov(packet.pc)))}`,
    );
    // Own instruction line (not inside the ENGINE RESULT content slot).
    if (fightClose && fightClose.outcome !== 'escaped') {
      lines.push(
        'Fight-close already on the combat log — narrate the moment and aftermath, do not restate it.',
      );
    }
  }
  if (panelRead) {
    const readHousing = housingFromSystemBlock(packet.systemBlock);
    const readShows = readHousing === 'world_status'
      ? 'Nothing shows these facts; they are simply known. Only the change is given, never the sheet, speech or story'
      : 'The game paints it; only the change is given, never the sheet, speech or story';
    lines.push(`${ledgerReadLabel(readHousing)} (game chrome: ${writerHousingClause(packet.systemBlock)} ${readShows}): ${ledgerChangeFact(packet.ledgerChanges)}`);
  }
  if (packet.reader) lines.push(formatReaderLine(packet.reader));
  // Housing scene physics only — never formatSystemBlock's "SYSTEM: … Known: health, …"
  // list (writers pasted that as STATUS: field = known into openings).
  {
    const housingId = housingFromSystemBlock(packet.systemBlock);
    if (housingId) lines.push(`HOUSING: ${systemHousingWriterSentence(housingId)}`);
  }
  if (packet.damage != null) lines.push(`Damage: ${packet.damage}.`);
  if (packet.hp) lines.push(`HP: ${packet.hp.current}/${packet.hp.max}.`);
  const locationLine = writerLeafBlock(`Location: ${packet.location}.`, packet.factSheet);
  if (locationLine) lines.push(locationLine);
  if (packet.movement) lines.push(packet.movement);
  if (packet.justKilled && packet.lastKill?.name) {
    lines.push(`Last kill: ${packet.lastKill.name} (corpse).`);
  } else if (packet.lastKill?.name && packet.lastKill.remains) {
    lines.push(`Corpse: ${packet.lastKill.name}.`);
  }
  if (packet.xp > 0) lines.push(`XP: ${packet.xp}.`);
  if (packet.loot.length) lines.push(`Loot: ${packet.loot.join(', ')}.`);
  if (packet.witnesses.length) lines.push(`Witnesses: ${packet.witnesses.join(', ')}.`);
  // q72: one SCENE block replaces overlapping PEOPLE / INFO SHEETS / HOW THEY ARE NOW / MENTION dumps.
  if (packet.sceneBlock) {
    const scene = writerLeafBlock(packet.sceneBlock, packet.factSheet);
    if (scene) lines.push(scene);
    if (packet.refRecords) lines.push(packet.refRecords);
    // Townsfolk sheet lines are not a SCENE row (job, motive, fear, speech, never the secret).
    if (packet.townsfolk?.length) lines.push(packet.townsfolk.join('\n'));
  } else {
    if (packet.knownBy?.length) lines.push(`INFO SHEETS (these people remember ${who}):\n${packet.knownBy.join('\n')}`);
    if (packet.townsfolk?.length) lines.push(`PEOPLE HERE (their sheets — play them this way; each one is only the @tN at the start of their line):\n${packet.townsfolk.join('\n')}`);
    if (packet.stances?.length) lines.push(`HOW THEY ARE NOW (set by what happened; play it, do not change it):\n${packet.stances.join('\n')}`);
  }
  if (packet.gates?.length) lines.push(`LOCKS:\n${packet.gates.join('\n')}`);
  if (packet.cardWant) lines.push(`What they want (their own reason; the answer says it in their words): ${packet.cardWant}`);
  if (packet.cardOffer) lines.push(`What they offer (still open; the player has not taken it): ${packet.cardOffer}`);
  if (packet.playerPronounRail) lines.push(packet.playerPronounRail);
  if (packet.pcNameClash) lines.push(packet.pcNameClash);
  if (packet.establishedOpeningScene) lines.push(packet.establishedOpeningScene);
  if (packet.openingRiteOffer) lines.push(packet.openingRiteOffer);
  if (packet.openingRiteRefusePersist) {
    lines.push(`OPENING RITE REFUSAL: ${packet.openingRiteRefusePersist}`);
  }
  if (packet.mood) lines.push(`Mood: ${packet.mood}.`);
  if (opts?.stricter) {
    lines.push('STRICT: Use only the nouns listed. Outcome is immutable.');
  }
  lines.push('');
  // MENTION list derives from SCENE (packet.allowlist already rebuilt from it when sceneBlock is set).
  lines.push(`YOU MAY ONLY MENTION: ${packet.allowlist.length ? packet.allowlist.join(', ') : 'none'}.`);
  lines.push('');
  lines.push('TOKEN PROSE — return JSON only (no markdown).');  // 28l — the count comes before the example and the example has four full lines: writers copy the
  // example's shape, and a one-line example came back as one place-name line.
  const whereWas = povExample(pov, { second: 'where you were', third: 'where {N} was', first: 'where I was' });
  const whatDid = povExample(pov, {
    second: 'what you did (only the act the player chose) and what came of it',
    third: 'what {N} did (only the act the player chose) and what came of it, told close on {him}',
    first: 'what I did (only the act the player chose) and what came of it',
  });
  // 29z8 — writers copy the shape. A place line on every turn came back as the same room described
  // again each turn, so once HERE is on the page and nobody moved, the shape opens on what changed.
  const writerBeats = collapseLoiterWriterBeats(packet);
  // `movement` also carries "No move this turn: …"; only a committed move re-opens the place.
  const placeGiven = writerBeats.length > 0 && !/^Moved this turn/.test(packet.movement ?? '') && packet.verb !== 'arrived';
  // A talk turn with someone here carries the answer as their own quoted words, said now: a shape with
  // no speech line came back as "he answered", and a repeated question came back as a report.
  const enumRefs = packet.refEnum ?? [];
  const personRef = enumRefs.find((r) => tokenUseMatchesClass('speaker', r.klass));
  const talkedTo = (packet.verb === 'spoke' || !!packet.talkTopic) && !!personRef;
  const askedBefore = talkedTo && (packet.talkAsked ?? 0) >= 2;
  // The shape names real REF ENUM rows by their own tokens: the writer binds by tok and code looks up the id.
  const dest = packet.destinationRef;
  const placeRef = enumRefs.find((r) => r.id === 'here') ?? enumRefs.find((r) => r.klass === 'place' && r.tok !== dest?.tok) ?? enumRefs.find((r) => r.klass === 'place');
  const placeTok = placeRef?.tok;
  // A ledger read has nobody acting on anything: no actor, no "how they answered" slot for the
  // window to fill. The two lines carry what the ledger told the PC.
  const actorTok = panelRead ? undefined : personRef?.tok;
  const housingClause = writerHousingClause(packet.systemBlock);
  const answerLine = panelRead
    ? `{"fn":"react","text":"<sentence: what that change meant to ${who} now, as plain words — ${housingClause}>"}`
    : talkedTo && actorTok
      ? `{"fn":"speech","speaker_tok":"${actorTok}","text":"<one full spoken sentence for @${actorTok} said now — include attribution yourself; code does not add quote marks or said-tags — not a report of what they said>"}`
      : `{"fn":"react","text":"<sentence: how ${actorTok ? `@${actorTok} or ` : ''}the room answered>"}`;
  const refsShape = [
    ...(placeTok ? [`{"tok":"${placeTok}","use":"place"}`] : []),
    ...(actorTok ? [`{"tok":"${actorTok}","use":"${talkedTo ? 'speaker' : 'actor'}"}`] : []),
    ...(dest && dest.tok !== placeTok ? [`{"tok":"${dest.tok}","use":"place"}`] : []),
  ].join(',');
  const didWhat = panelRead
    ? `what changed since ${who} last looked — ${housingClause}`
    : dest
      ? `${whatDid}, naming @${dest.tok} as where ${who} was headed`
      : whatDid;
  const hookLine = `{"fn":"hook","text":"<sentence: one thing ${who} can see or hear in front of them now — never a choice, a decision, a task still to do, or time passing>"}`;
  const bodyLines = placeGiven
    ? `{"fn":"action","text":"<sentence: ${didWhat} — the first thing that changed>"},${answerLine},${hookLine}`
    : `{"fn":"place","text":"<sentence: ${whereWas}${placeTok ? `, using @${placeTok}` : ''}>"},{"fn":"action","text":"<sentence: ${didWhat}>"},${answerLine},${hookLine}`;
  if (packet.engineMode === 'dnd') lines.push(`The whole beat is at most ${TABLETOP_BEAT_WORDS} words.`);
  if (placeGiven) {
    lines.push('HERE is already on the page. Open on what changed this turn. Do not narrate an arrival the beat did not grant.');
  }
  if (askedBefore) {
    lines.push('The player has asked this before. The answer is a new quoted line said now, in new words — not "they told" or "they said" about an earlier answer.');
  }
  lines.push('Shape (replace every <...> with your own words):');
  lines.push(`{"refs":[${refsShape}],"lines":[${bodyLines}]}`);
  lines.push('refs.use: speaker|actor|addressed|corpse|prop_used|worn|place. lines.fn: place|action|speech|react|hook.');
  lines.push('Name entities as @tN tokens from the REF ENUM; use no other names. refs.tok is the REF ENUM token itself (t5 means the t5 row); code looks up the id.');
  if (thirdPerson) lines.push(`The player character is ${who}: write that name plainly (no token) and ${pov.he}/${pov.him}/${pov.his} for them.`);
  lines.push(formatRefEnumForWriter(packet.refEnum ?? []));
  if (opts?.stricter) {
    lines.push('TOKEN REPAIR: fill only missing fn slots. Same REF ENUM. Do not invent ids.');
  }
  lines.push('');
  if (packet.infoSheet) {
    const info = writerLeafBlock(packet.infoSheet, packet.factSheet);
    if (info) lines.push(info);
    const loiter = writerBeats.find((b) => b.startsWith('(HERE unchanged'));
    if (loiter) lines.push(`GM: ${loiter}`);
  } else if (writerBeats.length) {
    lines.push(writerBeats.map((b) => `GM: ${b}`).join('\n'));
  } else {
    lines.push('GM: (opening)');
  }
  lines.push('');
  // T10ECHO / T10TURNS — UI already shows the typed act; never paste it into writer input.
  const act = (packet.playerAction ?? '').trim();
  const opening = !act || act === '(opening)';
  lines.push(opening ? 'PLAYER: (opening)' : 'PLAYER: (already shown in UI — do not restate)');
  if (!opening) {
    lines.push(
      `ACTION: write the consequence and world/NPC response for this beat — do not restate the player's act. Do not retell an arrival already written, and do not answer a different action.`,
    );
    if (packet.combatLive && WRITER_ATTACK.test(act)) {
      lines.push('The attack is on the page: show the blow landing, glancing or missing, and the foe answering it.');
    }
    lines.push('Plain speech: short concrete sentences a reader could say aloud. No abstract summary, no fragments.');
  }
  return lines.join('\n').trim();
}
const WRITER_ATTACK = /^(?:press the attack|attack|strike|swing|stab|slash|hit|charge|fight)\b/i;
export function mentionAllowlistHas(allowlist: string[], token: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return false;
  return allowlist.some((n) => {
    const a = n.toLowerCase();
    if (a === t || a.includes(t) || t.includes(a)) return true;
    const last = a.split(/\s+/).pop() ?? '';
    return last.length >= 4 && (last === t || t.endsWith(` ${last}`));
  });
}
function isInstructionVoice(text: string): boolean {
  return (
    /\bMy instruction says\b/i.test(text)
    || /\bThe instruction says\b/i.test(text)
    || /<system\b/i.test(text)
    || /\bledger[- ]honor\b/i.test(text)
    || /\bHonor the committed ledger\b/i.test(text)
    || /\bYOU MAY ONLY MENTION\b/.test(text)
    || /\bCOMPLETED EVENT:\b/.test(text)
    || /\bSTRICT:\s*Use only the nouns\b/i.test(text)
  );
}
function hasChoiceListLeak(text: string): boolean {
  if (!text?.trim()) return false;
  return (
    /(?:^|[.!?]\s+)\d+[.)]\s+[A-Z]/.test(text)
    || /\d+[.)]\s+(?:Meet|Descend|Observe|Scan|Inquire|Plunge|Turn to)\b/.test(text)
  );
}
function prematureLoot(prose: string, packet: CompletedEventPacket): boolean {
  if (packet.loot.length > 0 || packet.outcome === 'looted') return false;
  if (packet.justKilled || packet.outcome === 'killed') return false;
  if (!packet.combatLive && packet.outcome !== 'hit' && packet.outcome !== 'bloodied' && packet.outcome !== 'spawned') {
    return false;
  }
  return /\b(?:search(?:ed)? the (?:body|corpse)|found (?:an? )?(?:iron )?dagger|handful of copper|pouch of coins)\b/i.test(
    prose
  );
}
function aliveVsDeadContradiction(prose: string, packet: CompletedEventPacket): boolean {
  // The kill turn: the engine settled the fight before the writer, and the writer is telling those blows.
  if (packet.justKilled || packet.outcome === 'killed') return false;
  if (packet.lastKill && !packet.combatLive && isDeadFoeReopenedAsLiving(prose, packet.lastKill, false)) return true;
  if (packet.combatLive && (packet.outcome === 'hit' || packet.outcome === 'bloodied' || packet.outcome === 'missed')) {
    return /\b(?:crumpled to the stones|kicked the corpse|the (?:skirmisher|foe|hunter) was done|search(?:ed)? the body)\b/i.test(
      prose
    );
  }
  return false;
}
/** "lay still in the alley": after a body-position verb, "still" is motionless, not "yet in". */
const POSTURE_STILL = '(?<!\\b(?:lay|lie|lies|lying|stood|stands|standing|sat|sits|sitting|kept|keeps|held|holds|froze|hung|went)\\s)';
const HERE_CLAIM = new RegExp(
  `\\b(?:you (?:are|stand|wait|remain) (?:in|at|inside)|here in|back (?:in|at)|${POSTURE_STILL}still (?:in|at))\\s+(?:the\\s+)?([^.,!?;:]{2,48})`,
  'i'
);
/** The place phrase ends where the clause goes on ("here in the Close and questions waited"). */
const CLAUSE_GOES_ON = /\s+(?:and|but|or|as|while|where|when|with|before|after|until|so|then|because|though)\b.*$/i;
/** A quoted line is what a person said ("We'll take it back at Contract Hall"), not where the camera is. */
const QUOTED_SPEECH = /["“][^"“”]*["”]/g;
/** The place a sentence says the camera is in ("still in the close" → "close"), or '' when it claims none. */
export function claimedHerePlace(prose: string): string {
  const narration = (prose ?? '').replace(QUOTED_SPEECH, ' ');
  return narration.match(HERE_CLAIM)?.[1]?.replace(/\s+/g, ' ').replace(CLAUSE_GOES_ON, '').trim() ?? '';
}
/** The claim is HERE by HERE's own words: "the Close" or "close" for Cathedral Close. */
export function claimNamesHere(claim: string, here: string): boolean {
  const words = (s: string) =>
    (s ?? '').toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter((w) => w && !/^(?:the|a|an|of)$/.test(w));
  const c = words(claim);
  const h = new Set(words(here));
  return c.length > 0 && h.size > 0 && c.every((w) => h.has(w));
}
function wrongHereOnPacket(prose: string, packet: CompletedEventPacket): boolean {
  const here = (packet.location ?? '').replace(/\.$/, '').trim();
  if (!here || here.length < 3) return false;
  if (packet.outcome === 'arrived' || packet.outcome === 'set out' || packet.verb === 'traveled') return false;
  const claimed = claimedHerePlace(prose);
  if (!claimed || claimed.length < 4) return false;
  const claimCore = claimed.replace(/^(the|a|an)\s+/i, '').trim();
  if (!claimCore || !/[A-Z]/.test(claimCore)) return false;
  if (claimNamesHere(claimCore, here)) return false;
  // "looked back at Jax's face" points at a person, not a place.
  const people = [packet.pc?.name, ...(packet.refEnum ?? []).filter((r) => tokenUseMatchesClass('speaker', r.klass)).map((r) => r.display)]
    .map((n) => (n ?? '').replace(/^(the|a|an)\s+/i, '').trim().toLowerCase())
    .filter((n) => n.length > 1);
  if (people.some((p) => claimCore.toLowerCase().startsWith(p))) return false;
  const h = here.toLowerCase();
  const c = claimCore.toLowerCase();
  if (h === c || h.includes(c) || c.includes(h)) return false;
  return true;
}
export function proseViolatesEventPacket(
  prose: string,
  packet: CompletedEventPacket
): boolean {
  const body = (prose ?? '').trim();
  if (!body) return false;
  // 08b — do not reject ordinary off-list Title-Case. DeepSeek must commit when facts hold.
  if (aliveVsDeadContradiction(body, packet)) return true;
  if (isInstructionVoice(body)) return true;
  if (hasChoiceListLeak(body)) return true;
  if (prematureLoot(body, packet)) return true;
  if (wrongHereOnPacket(body, packet)) return true;
  return false;
}
/** Brief 06: canned packet stitch banks deleted — live AI prose or honest empty only. */
export const PACKET_STITCH_FINGERPRINTS: readonly string[] = [];
const OLD_LANDING_STUB =
  /You acted at landing|That beat closed\.\|The next move was yours\.\|The blow landed/i;
/** 13a/13b — retired 1–2 line droughts. Never commit these as the story body. */
export const RETIRED_DROUGHT_STUB =
  /Whatever you tried had already happened|Dust hung at/i;
export function isDroughtStubProse(text: string): boolean {
  return RETIRED_DROUGHT_STUB.test((text ?? '').trim());
}
const LEDGER_WAIT_FP = /The name \S+ already stood|The room waited on what you did next/i;
const COMBAT_CLOSE_FP = /You close with |loot is legal|The exchange goes badly\. You go down/i;
export function isUnaskedCombatClose(prose: string, playerInput: string): boolean {
  if (!COMBAT_CLOSE_FP.test(prose ?? '')) return false;
  return !/\b(attack|fight|auto[- ]?fight|strike|draw|press the attack)\b/i.test(playerInput ?? '');
}
function lastCommittedGmBody(state: GameState): string {
  const rows = [...(state.log ?? [])].reverse().filter((e) => e.role === 'gm');
  return String(rows[0]?.content ?? '').replace(/\s+/g, ' ').trim();
}
function sameBeat(a: string, b: string): boolean {
  const left = (a ?? '').replace(/\s+/g, ' ').trim();
  const right = (b ?? '').replace(/\s+/g, ' ').trim();
  return !!left && !!right && left === right;
}
/** True when the candidate is the last GM, or a cut-down reprint of it. */
export function isLastGmReprint(prose: string, lastGm: string): boolean {
  const body = (prose ?? '').replace(/\s+/g, ' ').trim();
  const prev = (lastGm ?? '').replace(/\s+/g, ' ').trim();
  if (!body || !prev) return false;
  if (sameBeat(body, prev)) return true;
  if (prev.includes(body) && body.length >= 24) return true;
  const head = body.slice(0, Math.min(48, body.length));
  if (head.length >= 24 && prev.includes(head)) return true;
  return false;
}
/**
 * Page when the clause check withheld a verdict: never canned miss prose (brief 06).
 */
export function pageWhenClauseWithheld(
  _state: GameState,
  _packet: CompletedEventPacket | undefined,
  _playerInput: string
): string {
  return '';
}

/**
 * Writer timeout / empty / reprint: keep usable writer text; otherwise empty (Try again upstream).
 * No fight / spoken / last-resort painters — empty miss is honest Try again (brief 06).
 */
export function bookBodyAfterWriterMiss(
  state: GameState,
  _packet: CompletedEventPacket | undefined,
  playerInput: string,
  writerText = ''
): { prose: string; status?: string } {
  const lastGm = lastCommittedGmBody(state);
  const raw = sanitizeLockedNameBeat(state, (writerText ?? '').replace(/\s+/g, ' ').trim());
  if (
    raw.length >= 24
    && /[a-z]/i.test(raw)
    && !isDroughtStubProse(raw)
    && !isNameTelegramProse(raw)
    && !LEDGER_WAIT_FP.test(raw)
    && !proseAsksForPcName(raw)
    && !isLastGmReprint(raw, lastGm)
    && !isUnaskedCombatClose(raw, playerInput)
  ) {
    return { prose: raw };
  }
  return { prose: '', status: 'Writer miss — honest Try again' };
}
export function isPacketStitchProse(text: string): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  if (OLD_LANDING_STUB.test(body) || RETIRED_DROUGHT_STUB.test(body)) return true;
  return PACKET_STITCH_FINGERPRINTS.some((fp) => body.includes(fp));
}
/**
 * Former packet-stitch writer: banks removed (brief 06). Callers get empty — never canned prose.
 */
export function assemblePacketStitch(
  _packet: CompletedEventPacket,
  _recentGm: string[] = []
): string {
  return '';
}
/**
 * After mechanics commit: attach packet, then the writer string.
 * Fate / useGame call this before callGm — packet always exists first.
 */
export function prepareRetrospectiveWriterInput(
  state: GameState,
  playerInput: string,
  extras?: PacketBuildExtras
): { state: GameState; packet: CompletedEventPacket; writerFacing: string } {
  const packet = buildCompletedEventPacket(state, playerInput, extras);
  const streaks = nextLoiterStreaks(state, playerInput);
  const facts = state.sceneFacts ?? emptySceneFacts(state.turn);
  const next = {
    ...state,
    completedEvent: packet,
    sceneFacts: {
      ...facts,
      inspectStreak: streaks.inspectStreak,
      waitStreak: streaks.waitStreak,
      loiterHere: streaks.loiterHere,
    },
  };
  return {
    state: next,
    packet,
    writerFacing: formatWriterFacingEvent(packet),
  };
}
