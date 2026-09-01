/**
 * ChoiceCompiler — legal beat edges + semantic fingerprint cooldown (Wave 2 MVP).
 */

import type { GameState } from './types';
import { canonicalizeIntent } from './semanticLoopDetector';
import { filterCooldownChoices, type OptionCooldown } from './optionDiversityContract';
import {
  isTopicExhausted,
  shouldForceNpcStageAdvance,
  presentNpcForPads,
} from './npcTopicFsm';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { enumerateLegalEdges, edgesToChoiceLabels } from './choiceEdge';
import { isEncounterEngaged, fleeAvailable, parleyAvailable } from './encounterTerminalFsm';
import { countPlayerIntentStreak, countLoiterFamilyStreak } from './beatFingerprint';
import { isPyoaBranchLocked, eligiblePyoaPadsAfterLock } from './pyoaBranchLedger';
import {
  ensurePyoaSpine,
  spineBibleSupported,
  spineChoiceLabels,
  spineForceEdgeAfterDelay,
  isSpineDelayPad,
} from './pyoaSpine';
import { isNameOriginKitCoverChoice, isPlayDemand } from './openingEstablishment';
import { isLookAroundAction } from './sandboxXp';
import { isAtmospherePlaceName } from './questPlay';
import { filterPadsAgainstOpenVignette } from './vignetteLock';
import { isInteriorMap } from './placeAuthority';
import { graphExitPads, isCameraRelativePad } from './mapEngine';

export type PlayerIntentFamily = 'demand' | 'inspect' | 'flee' | 'name' | 'talk' | 'travel' | 'other';

export type LastPlayerIntent = {
  family: PlayerIntentFamily;
  text: string;
  turn: number;
};

export function classifyPlayerIntent(input: string | undefined): PlayerIntentFamily {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return 'other';
  if (isPlayDemand(t)) return 'demand';
  if (/\b(run away|flee|escape|retreat)\b/i.test(t)) return 'flee';
  if (isLookAroundAction(t) || /\b(inspect|examine|look around|scan)\b/i.test(t)) return 'inspect';
  if (/\b(travel|enter|go through|walk through|head to)\b/i.test(t)) return 'travel';
  if (isNameOriginKitCoverChoice(t) || /^(?:[A-Z][a-z'-]{1,20})$/.test(t)) return 'name';
  if (/\b(ask|talk|speak|say|tell)\b/i.test(t)) return 'talk';
  return 'other';
}

function lastPlayerLine(state: GameState): string {
  if (state.sceneFacts?.lastPlayerIntent?.text) return state.sceneFacts.lastPlayerIntent.text;
  for (let i = (state.log ?? []).length - 1; i >= 0; i--) {
    const e = state.log[i];
    if (e.role === 'player' && e.content?.trim()) return e.content.trim();
  }
  return '';
}

function leftoverCoverOrOpeningChip(choice: string): boolean {
  return (
    isNameOriginKitCoverChoice(choice)
    || /\b(give them (?:your |a )?name|tell them who you are|waiting for a name|ask what is going on|approach the doorway)\b/i.test(
      choice
    )
  );
}

function isLookOrExamineRoomPad(choice: string): boolean {
  return /\b(look around|examine the room|inspect the room|scout the (?:area|room|cell)|get (?:your )?bearings|whats going on|where am i)\b/i.test(
    choice
  );
}

function isGenericInspectPad(choice: string): boolean {
  return (
    isLookOrExamineRoomPad(choice)
    || /\b(sift|search the (?:same|debris|rubble|room again)|look for anything else)\b/i.test(choice)
  );
}

function isFirstSpeechLecturePad(choice: string): boolean {
  return /\b(ask who (?:they|he|she) (?:are|is)|ask (?:them|him|her) (?:their|his|her) name|introduce yourself|ask what(?:'s| is) going on|ask (?:them )?to explain (?:everything|the situation)|hear (?:their|his|her) story)\b/i.test(
    choice
  );
}

function intentSupplements(family: PlayerIntentFamily, engaged: boolean): string[] {
  if (engaged) {
    if (family === 'flee') return ['Keep running', 'Try to flee', 'Find cover'];
    if (family === 'demand') return ['Demand they stand down', 'Press the attack'];
    return [];
  }
  if (family === 'demand') return ['Demand they send you back', 'Argue you do not belong here', 'Wait and watch'];
  if (family === 'inspect') return ['Check the exits', 'Wait and watch'];
  if (family === 'flee') return ['Keep running', 'Look for an exit', 'Find cover'];
  if (family === 'talk') return ['Ask a direct question', 'Press for leverage'];
  return [];
}

/** Named interactable from last beat / props (chest, door, panel) for pad supplement. */
export function namedPropPadsFromBeat(state: GameState): string[] {
  const props = state.sceneFacts?.props ?? [];
  const last = (state.sceneFacts?.lastBeat ?? '').toLowerCase();
  const pads: string[] = [];
  const consider = (re: RegExp, pad: string) => {
    if (props.some((p) => re.test(p)) || re.test(last)) {
      pads.push(pad);
    }
  };
  consider(/\bchests?\b/i, 'Check the chest');
  consider(/\bcrates?\b/i, 'Open the crate');
  consider(/\b(door|doorway)\b/i, 'Try the door');
  consider(/\b(blue )?panel\b/i, 'Inspect the panel');
  return pads;
}

function inspectTargetExhausted(state: GameState, choice: string): boolean {
  const canon = canonicalizeIntent(choice, state.turn);
  const loc = (state.currentLocation ?? 'unknown').toLowerCase();
  const ledger = state.qualityGovernance?.discoveryLedger ?? {};
  const searchedEmpty = state.sceneFacts?.searchedEmpty ?? [];
  const emptyContainers = state.sceneFacts?.emptyContainers ?? [];
  const lower = choice.toLowerCase();

  // Batch G — open/check crate|chest|box|barrel even when action isn't "inspect"
  const containerMatch = lower.match(/\b(crate|chest|box|barrel|trunk)\b/);
  if (containerMatch && /\b(open|check|search|loot|rummage|inspect|examine)\b/.test(lower)) {
    const target = containerMatch[1]!;
    if (
      emptyContainers.some((t) => t.toLowerCase() === target || t.toLowerCase().includes(target))
      || searchedEmpty.some((t) => t.toLowerCase() === target || t.toLowerCase().includes(target))
    ) {
      return true;
    }
  }

  if (isGenericInspectPad(choice)) {
    const roomKey = `object:room@${loc}`;
    const hereKey = `object:here@${loc}`;
    if ((ledger[roomKey]?.inspectionCount ?? 0) >= 1 || (ledger[hereKey]?.inspectionCount ?? 0) >= 1) {
      return true;
    }
    if (searchedEmpty.some((t) => /\b(here|room|debris|rubble|cell)\b/i.test(t))) return true;
  }

  if (canon.action === 'inspect' && canon.target) {
    const target = canon.target.toLowerCase();
    const evidenceKey = `object:${target}@${loc}`;
    if ((ledger[evidenceKey]?.inspectionCount ?? 0) >= 1) return true;
    if (searchedEmpty.some((t) => t.toLowerCase() === target || t.toLowerCase().includes(target))) {
      return true;
    }
    if (emptyContainers.some((t) => t.toLowerCase() === target || t.toLowerCase().includes(target))) {
      return true;
    }
  }
  return false;
}

/** True when a pad is loot/scout/wait under a live encounter (Batch G combat lock). */
function isEncounterForbiddenPad(choice: string): boolean {
  const lower = choice.toLowerCase();
  if (/\b(flee|run away|escape|retreat|parley|negotiate|press the attack|attack|fight|strike|engage|change position)\b/.test(lower)) {
    return false;
  }
  if (/\b(enemy|threat|wound|blade|guard|raider|bandit|corpse|body)\b/.test(lower) && /\b(inspect|examine|check|study)\b/.test(lower)) {
    return false;
  }
  return (
    /\b(open|check|loot|rummage)\b/.test(lower) && /\b(crate|chest|box|barrel|trunk|bag)\b/.test(lower)
  )
    || /\b(scout|wait and watch|^wait$|look around|examine the (?:room|area)|inspect the (?:room|area)|get (?:your )?bearings)\b/.test(lower)
    || isLookOrExamineRoomPad(choice);
}

/** Batch T — travel yo-yo lock while fight / standoff / parked drought encounter is live. */
function hasLiveStakes(state: GameState): boolean {
  return (
    isEncounterEngaged(state)
    || !!state.activeEncounter
    || !!state.sceneFacts?.pendingEncounter
  );
}

function isTravelPad(choice: string): boolean {
  const lower = choice.toLowerCase();
  return (
    /\b(travel(?:\s+(?:toward|to|into))?|go to|head (?:to|for|toward)|move to|leave for|walk to)\b/.test(lower)
    || /^travel\b/i.test(choice.trim())
  );
}

/** Batch U — count travel picks in the last N player lines. */
function countRecentTravelPicks(state: GameState, window = 5): number {
  const log = state.log ?? [];
  let count = 0;
  let seen = 0;
  for (let i = log.length - 1; i >= 0 && seen < window; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    seen += 1;
    if (isTravelPad(e.content ?? '')) count += 1;
  }
  return count;
}

function shouldStarveTravelPads(state: GameState, liveStakes: boolean): boolean {
  return liveStakes && countRecentTravelPicks(state) >= 2;
}

export type ChoiceFingerprintFamily =
  | 'walk_away'
  | 'inspect'
  | 'charter'
  | 'gate_queue'
  | 'wait'
  | 'travel'
  | 'generic';

export interface ChoiceFingerprintRecord {
  family: ChoiceFingerprintFamily;
  turn: number;
  count: number;
}

export interface GateDisposition {
  target: string;
  cooldownUntilTurn: number;
  kind: 'reject' | 'transform';
  message: string;
}

/** B024 — Hub gate disposition types */
export type HubGateType =
  | 'entrance'   // First arrival at hub
  | 'loiter'     // Standing around/waiting
  | 'vendor'     // Merchant/shop interaction
  | 'quest'      // Quest-related interaction
  | 'travel';    // Leaving hub

export interface HubBeatRecord {
  hubId: string;
  gateType: HubGateType;
  turn: number;
  count: number;
}

const HUB_BEAT_CAPS: Record<HubGateType, number> = {
  entrance: 1,   // Only arrive once
  loiter: 3,     // Max 3 wait/loiter beats
  vendor: 2,     // Max 2 merchant interactions
  quest: 999,    // Quest interactions unlimited
  travel: 999,   // Travel unlimited
};

const LITRPG_HUB_EXIT_DEADLINE = 50; // LitRPG must leave hub by turn 50 if loitering

const FAMILY_LIMIT = 3;
const FAMILY_WINDOW = 50;
const FAMILY_COOLDOWN = 8;

function classifyChoiceFamily(choice: string): ChoiceFingerprintFamily {
  const lower = choice.toLowerCase();
  if (/\b(walk away|leave|go another|step back)\b/.test(lower)) return 'walk_away';
  if (/\b(scout(?:\s+for\s+danger)?|ready yourself|look around|get (?:your )?bearings)\b/.test(lower)) {
    return 'inspect';
  }
  if (/\b(inspect|examine|check|study|investigate|look at)\b/.test(lower)) return 'inspect';
  if (/\b(charter|millstone)\b/.test(lower)) return 'charter';
  if (/\b(gate|queue|registration|registrar)\b/.test(lower)) return 'gate_queue';
  if (/\b(wait|stand around|do nothing)\b/.test(lower)) return 'wait';
  if (/\b(travel|go to|head to|move to)\b/.test(lower)) return 'travel';
  return 'generic';
}

function isStallFamily(family: ChoiceFingerprintFamily): boolean {
  return (
    family === 'wait' ||
    family === 'walk_away' ||
    family === 'inspect' ||
    family === 'gate_queue' ||
    family === 'travel'
  );
}

function fingerprintUsage(
  records: ChoiceFingerprintRecord[],
  family: ChoiceFingerprintFamily,
  turn: number
): number {
  return records.filter(
    (r) => r.family === family && turn - r.turn <= FAMILY_WINDOW
  ).reduce((s, r) => s + r.count, 0);
}

function familyOnCooldown(
  records: ChoiceFingerprintRecord[],
  family: ChoiceFingerprintFamily,
  turn: number
): boolean {
  const recent = records
    .filter((r) => r.family === family)
    .sort((a, b) => b.turn - a.turn);
  if (!recent.length) return false;
  const usage = fingerprintUsage(records, family, turn);
  if (usage < FAMILY_LIMIT) return false;
  const last = recent[0];
  return turn - last.turn < FAMILY_COOLDOWN;
}

export function updateChoiceFingerprints(
  choices: string[],
  turn: number,
  prev: ChoiceFingerprintRecord[] | undefined
): ChoiceFingerprintRecord[] {
  const records = [...(prev ?? [])].filter((r) => turn - r.turn <= FAMILY_WINDOW);
  for (const c of choices) {
    const family = classifyChoiceFamily(c);
    const idx = records.findIndex((r) => r.family === family && r.turn === turn);
    if (idx >= 0) {
      records[idx] = { ...records[idx], count: records[idx].count + 1 };
    } else {
      records.push({ family, turn, count: 1 });
    }
  }
  return records.slice(-40);
}

export interface CompileChoicesResult {
  choices: string[];
  notes: string[];
  gateBlocked?: GateDisposition;
}

function gateTravelTarget(input: string): string | null {
  const m = input.match(/(?:travel to|go to|head to|move to)\s+(?:the\s+)?(.+)/i);
  return m?.[1]?.trim().slice(0, 60) ?? null;
}

const GATE_TARGET_PATTERNS =
  /\b(gate|queue|circle|registrar|registration|sevenfold|palace approach|contract hall)\b/i;

/** B024 — Classify hub gate type from input */
export function classifyHubGate(input: string): HubGateType {
  const lower = input.toLowerCase();
  if (/\b(arrive|enter|approach|reach)\b/.test(lower)) return 'entrance';
  if (/\b(wait|stand|loiter|do nothing)\b/.test(lower)) return 'loiter';
  if (/\b(buy|sell|trade|merchant|shop|vendor)\b/.test(lower)) return 'vendor';
  if (/\b(quest|mission|ask about|talk to)\b/.test(lower)) return 'quest';
  if (/\b(travel|leave|go to|head to)\b/.test(lower)) return 'travel';
  return 'loiter'; // Default to loiter
}

/** B024 — Check hub beat cap exhaustion */
export function isHubBeatCapped(
  state: GameState,
  hubId: string,
  gateType: HubGateType
): boolean {
  const records = state.arcDirector?.hubBeatRecords ?? [];
  const count = records
    .filter(r => r.hubId === hubId && r.gateType === gateType)
    .reduce((sum, r) => sum + r.count, 0);
  return count >= HUB_BEAT_CAPS[gateType];
}

/** B024 — Record hub beat usage */
export function recordHubBeat(
  state: GameState,
  hubId: string,
  gateType: HubGateType
): GameState {
  const records = state.arcDirector?.hubBeatRecords ?? [];
  const existing = records.find(r =>
    r.hubId === hubId && r.gateType === gateType && r.turn === state.turn
  );

  let nextRecords: HubBeatRecord[];
  if (existing) {
    nextRecords = records.map(r =>
      r === existing ? { ...r, count: r.count + 1 } : r
    );
  } else {
    nextRecords = [
      ...records,
      { hubId, gateType, turn: state.turn, count: 1 }
    ].slice(-40); // Keep last 40 records
  }

  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      hubBeatRecords: nextRecords,
    },
  };
}

/** B024 — Check if LitRPG hub exit deadline exceeded */
export function shouldForceLitrpgHubExit(state: GameState): boolean {
  if (state.engineMode !== 'litrpg') return false;

  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  if (!hub) return false;

  const records = state.arcDirector?.hubBeatRecords ?? [];
  const hubRecords = records.filter(r => r.hubId === hub.id);
  if (!hubRecords.length) return false;

  // Count non-travel beats
  const loiterBeats = hubRecords.filter(r =>
    r.gateType === 'loiter' || r.gateType === 'vendor'
  );
  const totalLoiter = loiterBeats.reduce((sum, r) => sum + r.count, 0);

  // Force exit if too much loitering
  if (totalLoiter >= 4 && state.turn >= LITRPG_HUB_EXIT_DEADLINE) {
    return true;
  }

  return false;
}

/** Gate disposition matrix (B024) — reject/transform hub gate travel loops. */
export function checkGateDisposition(
  state: GameState,
  playerInput: string
): GateDisposition | null {
  const target = gateTravelTarget(playerInput);
  if (!target) return null;
  const lower = target.toLowerCase();
  if (!GATE_TARGET_PATTERNS.test(lower)) return null;

  const gates = state.arcDirector?.gateDispositions ?? {};
  const key = lower.replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const until = gates[key];
  if (until != null && state.turn < until) {
    return {
      target,
      cooldownUntilTurn: until,
      kind: 'reject',
      message: `Gate queue cooling down — try a different route or talk to someone present (until T${until}).`,
    };
  }
  if (hubBeatExhausted(state, `Travel toward ${target}`)) {
    return {
      target,
      cooldownUntilTurn: state.turn + 8,
      kind: 'transform',
      message: `Hub beats exhausted at this location — pick a crisis fork or talk path instead of ${target}.`,
    };
  }

  // B024 — Check typed gate caps
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  if (hub) {
    const gateType = classifyHubGate(playerInput);
    if (isHubBeatCapped(state, hub.id, gateType)) {
      return {
        target,
        cooldownUntilTurn: state.turn + 6,
        kind: 'transform',
        message: `Hub ${gateType} beats capped — try a different action or leave this location.`,
      };
    }
  }

  return null;
}

export function recordGateRejection(state: GameState, target: string): GameState {
  const key = target.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const cooldownUntilTurn = state.turn + 6;
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      gateDispositions: {
        ...(state.arcDirector?.gateDispositions ?? {}),
        [key]: cooldownUntilTurn,
      },
    },
  };
}

function hubBeatExhausted(state: GameState, choice: string): boolean {
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  if (!hub) return false;
  const keys = state.sandboxAwardKeys ?? [];
  const hubBeatKeys = keys.filter((k) => k.startsWith(`hub-beat:${hub.id}:`));
  if (hubBeatKeys.length < 2) return false;
  const lower = choice.toLowerCase();
  // I10 — after two hub beats at this hub, drop repeat travel/queue pads.
  if (/\b(gate|queue|registration|travel toward|return to)\b/.test(lower)) {
    return true;
  }
  return false;
}

/** Filter/supplement choice pad from legal edges + fingerprint cooldown. */
export function compileChoices(
  state: GameState,
  choices: string[],
  optionCooldowns?: Record<string, OptionCooldown>,
  playerInput?: string
): CompileChoicesResult {
  const notes: string[] = [];
  const turn = state.turn;
  const intentText = (playerInput ?? lastPlayerLine(state)).trim();
  const intent = classifyPlayerIntent(intentText);
  const fingerprints = state.arcDirector?.choiceFingerprints ?? [];
  const cooldownMap = new Map(Object.entries(optionCooldowns ?? state.qualityGovernance?.optionCooldowns ?? {}));
  const legalEdges = enumerateLegalEdges(state);
  const edgeLabels = edgesToChoiceLabels(legalEdges);

  const engaged = isEncounterEngaged(state);
  const liveStakes = hasLiveStakes(state);
  const travelStarve = shouldStarveTravelPads(state, liveStakes);
  const streak = countPlayerIntentStreak(state);
  const loiter = countLoiterFamilyStreak(state);
  const hardStreak = streak.count >= 5 && streak.key !== 'empty';
  const hardLoiter = loiter.count >= 4 && loiter.key === 'loiter';
  // Batch E — inspect/wait/scout treadmill in one room: interrupt earlier (≥3).
  const inspectTreadmill = loiter.count >= 3 && loiter.key === 'loiter';
  const pyoaLocked = state.engineMode === 'pyoa' && isPyoaBranchLocked(state);
  const npc = presentNpcForPads(state);
  const npcKey = npc
    ? npc.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    : '';
  const npcTacticAdvance =
    !!npc
    && (shouldForceNpcStageAdvance(state, npc)
      || Object.keys(state.arcDirector?.topicCommits ?? {}).some((k) => k.includes(npcKey)));
  // Batch S — talk/press recycle with same NPC: force scene move (not another leverage pad)
  const talkRecycle =
    !engaged
    && !!npc
    && (shouldForceNpcStageAdvance(state, npc)
      || (/\b(talk|ask|press|listen)\b/i.test(intentText)
        && (state.arcDirector?.npcTopics?.[npcKey] ?? []).length >= 2));
  const stallInterrupt = hardStreak || hardLoiter || inspectTreadmill || talkRecycle;

  let filtered = choices.filter((c) => {
    const lower = c.toLowerCase();
    if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, c)) {
      notes.push(`Branch lock drop: ${c.slice(0, 32)}`);
      return false;
    }
    const doorwayDest = c.match(/doorway(?: leading)? to\s+["“]?([^"”]+?)["”]?\s*$/i)?.[1];
    if (doorwayDest && isAtmospherePlaceName(doorwayDest)) {
      notes.push(`Atmosphere doorway drop: ${c.slice(0, 40)}`);
      return false;
    }
    if (
      state.activeDungeon
      && isInteriorMap(state.activeDungeon)
      && isCameraRelativePad(c)
    ) {
      notes.push(`Camera L/R drop: ${c.slice(0, 32)}`);
      return false;
    }
    // Batch T/U — travel yo-yo lock under live fight/standoff/pending drought encounter
    if ((liveStakes || travelStarve) && isTravelPad(c)) {
      notes.push(`Travel yo-yo lock: ${c.slice(0, 32)}`);
      return false;
    }
    if (engaged) {
      // 29a/31h/31r combat pad lock — fight/flee/parley only (no crate/scout/wait/travel)
      if (/\b(travel toward|travel to|go to|head to|head for|browse|merchant|shop|earth junk|phone|headphones|leatherman|keys from earth)\b/.test(lower)) {
        notes.push(`Encounter lock: ${c.slice(0, 32)}`);
        return false;
      }
      if (isEncounterForbiddenPad(c)) {
        notes.push(`Encounter lock idle/loot: ${c.slice(0, 32)}`);
        return false;
      }
      if (/\b(inspect|examine|check|study|look around|whats going on|where am i|wait and watch|walk away)\b/.test(lower) && !/\b(enemy|threat|wraith|hunter|wound|blade|guard|raider|bandit|corpse|body)\b/.test(lower)) {
        notes.push(`Encounter lock inspect: ${c.slice(0, 32)}`);
        return false;
      }
      if (/\b(flee|run away|escape|retreat)\b/.test(lower) && !fleeAvailable(state.activeEncounter)) {
        notes.push('Flee exhausted');
        return false;
      }
      if (/\b(parley|negotiate)\b/.test(lower) && !parleyAvailable(state.activeEncounter)) {
        notes.push('Parley exhausted');
        return false;
      }
    } else if (/^engage the threat$/i.test(c.trim()) || /^change position$/i.test(c.trim())) {
      // 31i — meta combat pads without a live encounter feed sealed stubs
      notes.push(`No-threat combat drop: ${c.slice(0, 32)}`);
      return false;
    }
    // 31i — after engine recovery, drop Wait/Status/Force-path that re-hit stubs
    if ((state.sceneFacts?.engineRecoveryStreak ?? 0) > 0) {
      if (/^(wait and watch|check status|force a path forward|change position|engage the threat)$/i.test(c.trim())) {
        notes.push(`Post-recovery meta drop: ${c.slice(0, 32)}`);
        return false;
      }
    }
    const family = classifyChoiceFamily(c);
    // 29b/29c — hard same-action + loiter interrupt: strip stall/travel families
    if (stallInterrupt && isStallFamily(family)) {
      notes.push(`Streak interrupt drop: ${family}`);
      return false;
    }
    if (family !== 'generic' && familyOnCooldown(fingerprints, family, turn)) {
      notes.push(`Cooldown family: ${family}`);
      return false;
    }
    // P1-5 — Drop exhausted inspect / sift-same targets (not CRAFT-only)
    if (inspectTargetExhausted(state, c)) {
      notes.push(`Inspect exhausted: ${c.slice(0, 32)}`);
      return false;
    }
    if (hubBeatExhausted(state, c)) {
      notes.push(`Hub beat exhausted: ${c.slice(0, 32)}`);
      return false;
    }
    if (
      (intent === 'demand' || intent === 'inspect' || intent === 'flee')
      && leftoverCoverOrOpeningChip(c)
    ) {
      notes.push(`Intent pad drop: ${c.slice(0, 32)}`);
      return false;
    }
    // After demand / flee, do not re-offer Examine the room as the lead stall
    if ((intent === 'demand' || intent === 'flee') && isLookOrExamineRoomPad(c)) {
      notes.push(`Intent stall drop: ${c.slice(0, 32)}`);
      return false;
    }
    // P1-6 — NPC tactic: drop first-speech lecture chips once topics advanced
    if (npcTacticAdvance && isFirstSpeechLecturePad(c)) {
      notes.push(`NPC tactic drop: ${c.slice(0, 32)}`);
      return false;
    }
    if (npc) {
      const canon = canonicalizeIntent(c, turn);
      const topic = `${canon.action}:${canon.target || 'general'}`.slice(0, 48);
      if (
        isTopicExhausted(npc, topic, state.arcDirector?.npcTopics)
        && /\b(ask|talk|speak|listen|press)\b/i.test(c)
      ) {
        notes.push(`Topic exhausted pad: ${c.slice(0, 32)}`);
        return false;
      }
    }
    return true;
  });

  if (stallInterrupt) {
    notes.push(
      talkRecycle
        ? `Dialogue treadmill interrupt: ${npc ?? 'npc'}`
        : hardLoiter
          ? `Hard loiter interrupt: ×${loiter.count}`
          : inspectTreadmill && !hardStreak
            ? `Inspect treadmill interrupt: ×${loiter.count}`
            : `Hard streak interrupt: ${streak.key}×${streak.count}`
    );
  }

  const cooldownResult = filterCooldownChoices(filtered, turn, cooldownMap);
  filtered = cooldownResult.filtered;
  if (cooldownResult.removed.length) {
    notes.push(`Pad cooldown removed ${cooldownResult.removed.length}`);
  }

  if (state.activeDungeon && isInteriorMap(state.activeDungeon)) {
    for (const pad of graphExitPads(state.activeDungeon)) {
      if (filtered.some((f) => f.toLowerCase() === pad.toLowerCase())) continue;
      if (isAtmospherePlaceName(pad.replace(/^.*\s+to\s+/i, ''))) continue;
      filtered.push(pad);
      notes.push(`Graph exit pad: ${pad.slice(0, 40)}`);
      if (filtered.length >= 6) break;
    }
  }

  // B018–B021 — pad primarily from legal beat edges when available
  if (legalEdges.length >= 3) {
    for (const label of edgeLabels) {
      if (filtered.some((f) => f.toLowerCase() === label.toLowerCase())) continue;
      if (engaged && isLookOrExamineRoomPad(label)) continue;
      if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, label)) continue;
      filtered.push(label);
      if (filtered.length >= 6) break;
    }
    notes.push(`Legal edges: ${legalEdges.length}`);
  } else if (filtered.length < 3) {
    const supplements: string[] = [];
    for (const label of edgeLabels) {
      if (!filtered.some((f) => f.toLowerCase() === label.toLowerCase())) {
        if (engaged && isLookOrExamineRoomPad(label)) continue;
        if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, label)) continue;
        supplements.push(label);
      }
    }
    if (!supplements.length) {
      const mandate = state.arcDirector?.lastMandate ?? '';
      if (state.activeEncounter) {
        supplements.push('Press the attack');
        if (fleeAvailable(state.activeEncounter)) supplements.push('Try to flee');
        if (parleyAvailable(state.activeEncounter)) supplements.push('Parley');
      } else if (mandate.includes('crisis') || state.engineMode === 'pyoa') {
        if (pyoaLocked) {
          supplements.push('Choose the risky fork', 'Face the crisis now', 'Press for leverage');
        } else {
          supplements.push('Choose the risky fork', 'Buy time', 'Call for help');
        }
      } else if (npcTacticAdvance) {
        supplements.push('Press for leverage', 'Change the subject', 'Walk away with consequence');
      } else if (state.engineMode === 'litrpg') {
        // 31i — no Check Status / Wait spam under drought (same dead path)
        supplements.push('Ask what they want', 'Scout the exit', 'Inspect the immediate surroundings');
      } else if (stallInterrupt) {
        // 29b/29c — no wait/walk-away/travel refill under hard streak/loiter
        supplements.push('Ask a direct question', 'Press for leverage', 'Scout the exit');
      } else {
        // 31i — drop Change position / Wait (meta verbs that mapped to stubs)
        supplements.push('Ask a direct question', 'Scout the exit', 'Inspect the surroundings');
      }
    }
    for (const s of supplements) {
      if (stallInterrupt) {
        const fam = classifyChoiceFamily(s);
        if (isStallFamily(fam)) continue;
      }
      if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, s)) continue;
      if (!filtered.some((f) => f.toLowerCase() === s.toLowerCase())) {
        filtered.push(s);
      }
      if (filtered.length >= 3) break;
    }
    notes.push(supplements.length ? 'Supplemented from edges/fallback' : 'Supplemented legal beat edges');
  }

  // Batch E/G — after inspect/wait/scout treadmill, force world-moving pads (not Scout/Wait).
  // Batch S — dialogue recycle drops Press/Ask and forces Leave/Travel.
  // Batch T — never offer Travel yo-yo while live stakes are up.
  if (stallInterrupt && !engaged) {
    const interruptPads = talkRecycle
      ? ['Leave through the nearest exit', 'Walk away with consequence']
      : ['Ask a direct question', 'Press for leverage'];
    const here = (state.currentLocation ?? '').toLowerCase();
    if (!liveStakes && !travelStarve) {
      for (const h of hubsForBibleId(state.campaignBibleId).slice(0, 3)) {
        if (h.name.toLowerCase() !== here) {
          interruptPads.unshift(`Travel toward ${h.name}`);
          break;
        }
      }
    }
    if (state.activeEncounter || state.sceneFacts?.pendingEncounter) {
      interruptPads.unshift('Press the attack');
    } else if (!talkRecycle) {
      interruptPads.push('Leave through the nearest exit');
    }
    for (const pad of interruptPads) {
      if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, pad)) continue;
      if (!filtered.some((f) => f.toLowerCase() === pad.toLowerCase())) {
        filtered.unshift(pad);
        notes.push(`Treadmill interrupt pad: ${pad.slice(0, 40)}`);
      }
      if (filtered.length >= 4) break;
    }
    // G6 — strip Scout/Wait after interrupt so Fate cannot soft-lock the novel
    filtered = filtered.filter((c) => {
      const lower = c.toLowerCase();
      if (/^(wait and watch|wait)$/i.test(c.trim()) || /\bscout\b/.test(lower)) {
        notes.push(`Post-loiter scout/wait drop: ${c.slice(0, 32)}`);
        return false;
      }
      if (talkRecycle && /\b(press for leverage|ask a direct question|talk to|ready yourself)\b/i.test(lower)) {
        notes.push(`Post-dialogue talk drop: ${c.slice(0, 32)}`);
        return false;
      }
      return true;
    });
  }

  // Chest / named prop pads when GM named them and not exhausted (never under live encounter)
  for (const pad of namedPropPadsFromBeat(state)) {
    if (engaged) continue;
    if (inspectTargetExhausted(state, pad)) continue;
    if (!filtered.some((f) => f.toLowerCase() === pad.toLowerCase())) {
      filtered.unshift(pad);
      notes.push(`Prop pad: ${pad}`);
    }
  }

  const intentPads = talkRecycle ? [] : intentSupplements(intent, engaged);
  if (intentPads.length) {
    for (const pad of intentPads) {
      if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, pad)) continue;
      if (inspectTargetExhausted(state, pad)) continue;
      if (!filtered.some((f) => f.toLowerCase() === pad.toLowerCase())) {
        filtered.unshift(pad);
      }
    }
    notes.push(`Intent pads: ${intent}`);
  }

  // Final pass: never leave Examine the room / Wait-Wait on locked PYOA or live encounter
  filtered = filtered.filter((c) => {
    if (engaged && (isLookOrExamineRoomPad(c) || isEncounterForbiddenPad(c))) return false;
    if ((liveStakes || travelStarve) && isTravelPad(c)) return false;
    if (pyoaLocked && !eligiblePyoaPadsAfterLock(state, c)) return false;
    if (talkRecycle && /\b(press for leverage|ask a direct question|talk to|ready yourself)\b/i.test(c)) {
      return false;
    }
    return true;
  });

  // Batch G — Fate soft-lock guard: after loiter exhaust, always keep ≥1 world-moving option
  if (!engaged && stallInterrupt) {
    const worldMoving = filtered.some((c) =>
      /\b(travel|leave|exit|ask|press for leverage|quest|attack|flee|parley|doorway|face the)\b/i.test(c)
    );
    if (!worldMoving) {
      const fallback = 'Leave through the nearest exit';
      if (!filtered.some((f) => f.toLowerCase() === fallback.toLowerCase())) {
        filtered.unshift(fallback);
        notes.push('Fate world-moving pad forced');
      }
    }
  }

  // Batch C — open hub vignette: do not invent a brand-new social cast
  const beforeVig = filtered.length;
  filtered = filterPadsAgainstOpenVignette(state, filtered);
  if (filtered.length < beforeVig) {
    notes.push(`Vignette cast lock dropped ${beforeVig - filtered.length}`);
  }

  // Engaged: ensure combat options exist for Fate
  if (engaged) {
    if (!filtered.some((c) => /\b(attack|fight|press the attack|engage)\b/i.test(c))) {
      filtered.unshift('Press the attack');
    }
    if (fleeAvailable(state.activeEncounter) && !filtered.some((c) => /\bflee\b/i.test(c))) {
      filtered.push('Try to flee');
    }
    if (parleyAvailable(state.activeEncounter) && !filtered.some((c) => /\bparley\b/i.test(c))) {
      filtered.push('Parley');
    }
  }

  // PYOA spine v1 — Thornferry pads = legal exits (Fate = turn the page)
  if (!engaged && state.engineMode === 'pyoa' && spineBibleSupported(state.campaignBibleId)) {
    const spineState = ensurePyoaSpine(state);
    const legal = spineChoiceLabels(spineState);
    const forceEdge = spineForceEdgeAfterDelay(spineState);
    if (legal.length) {
      if (forceEdge) {
        filtered = filtered.filter((c) => !isSpineDelayPad(c));
        notes.push('PYOA spine delay exhausted — force legal edge');
      }
      for (const label of legal) {
        if (!filtered.some((f) => f.toLowerCase() === label.toLowerCase())) {
          filtered.unshift(label);
          notes.push(`PYOA spine edge: ${label.slice(0, 32)}`);
        }
      }
      // Prefer spine exits; keep at most 2 non-spine pads
      const spineSet = new Set(legal.map((l) => l.toLowerCase()));
      const spineFirst = filtered.filter((c) => spineSet.has(c.toLowerCase()));
      const rest = filtered.filter((c) => !spineSet.has(c.toLowerCase()) && !isSpineDelayPad(c));
      filtered = [...spineFirst, ...rest.slice(0, forceEdge ? 0 : 2)].slice(0, 6);
    } else if (spineState.pyoaSpine?.endingId) {
      filtered = filtered.filter((c) => !isSpineDelayPad(c));
      if (!filtered.some((c) => /\b(aftermath|close|end|accept)\b/i.test(c))) {
        filtered.unshift('Accept the ending that follows');
      }
    }
  }

  return {
    choices: filtered.length ? filtered.slice(0, 6) : edgeLabels.slice(0, 3),
    notes,
  };
}

export function playerInputGateBlock(
  state: GameState,
  input: string
): { blocked: boolean; message?: string; state: GameState } {
  const gate = checkGateDisposition(state, input);
  if (!gate) return { blocked: false, state };
  const next = recordGateRejection(state, gate.target);
  return { blocked: true, message: gate.message, state: next };
}
