import { registerWriterIntroductions } from './writerIntroductions';
import { applyCollectedFacts, collectTurnTimelineFacts, leavePlaceVisit, tag } from './timeline';
/**
 * Headless Fate autoplay — Seedable Fate's Pick + GM path with wardens.
 * Ship A: mirrors client commit (callGm → runWarden → structural → choices → prose)
 * without React UI / memorable art / comic jobs.
 *
 * Capacity: enableAutoplayTestLab() so Free week-cap never stops the run.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { clampSystemHousing, isSystemHousingId, rollSystemHousing } from './systemHousing';
import {
  applyAutoPlayerStallRules,
  chipProgressScore,
  chipProgressWeights,
  creditCommittedProgress,
  nudgeIfStuck,
  recordCirclingTurn,
  turnProgress,
} from './choiceRanking';
import { applyRememberedThreatPick } from './placeThreats';
import { applyPlayPhaseAfterHp, deathQuestReceipt } from './playPhase';
import { pathToFileURL } from 'node:url';
import { buildContextPrompt as buildClientContextPrompt } from './systemPrompt';
import {
  getCampaignBibleById,
  getCampaignBiblesByEngineMode,
  formatCampaignStoryName,
  isNsfwCampaign,
  type CampaignBible,
} from '@/data/campaigns';
import { callGm, callGmRepair } from './aiService';
import {
  enableAutoplayWriter,
  getAutoplayWriterOverride,
  parseAutoplayWriterKind,
  type AutoplayWriterKind,
} from './autoplayWriter';
import { rowProvenance, TRAINING_SEATS, type RowProvenance, type TrainingSeat } from './modelIds';
import { buildResolutionUserPayload, isUnresolvedActionNarrative, unresolvedActionReason } from './actionResolution';
import { validateActionHard } from './actionValidation';
import { seedStateFromCampaignBible, applyCampaignCharacter } from './campaignSeed';
import { ensureCampaignContract } from './campaignContract';
import {
  padChoicesToCount,
  resolvePipelineChoices,
  normalizeStoryCorpus,
} from './choicePipeline';
import { postFilterGmOutput } from './contentPostFilter';
import { createDefaultSettings, createInitialState, fitKitToHousing } from './defaults';
/** AI agent goal modes for guided autoplay. */
export type AiAgentMode = 'default' | 'maxlevel' | 'storyfollower' | 'completionist';
import {
  classifyTurnFailure,
  gmProxyTimeoutMsForState,
  isDnsResolutionFailure,
  shouldAutoRetryTurn,
  TURN_TRANSPORT_DNS_PAUSE_MS,
  TURN_TRANSPORT_MAX_AUTO_RETRIES,
  transportRetryBackoffMs,
} from './errorRepairWarden';
import { applyFactLocks } from './factLocks';
import { mulberry32, pickWeightedChoice, type Rng } from './fatePick';
import { formatTabletopSheet, seedNumber } from './tabletop/characterBuild';
import { autoTabletopCreation, creationRecord } from './tabletop/creationFlow';
import { seedWorldLedgerFactions } from './factionStandings';
import {
  LAUNCH_GM_PERSONALITY_IDS,
  LAUNCH_LITRPG_SYSTEM_PERSONALITY_IDS,
  isGmVoiceProfileId,
  resolveLitrpgSystemPersonality,
  resolvePyoaGmPersonality,
  resolveRpgGmPersonality,
  resolveTabletopGmPersonality,
  type GmPersonalityId,
  type SystemPersonalityId,
} from './gmVoiceProfile';
import { withUpdatedHookArc } from './hookArc';
import { mediatePlayerInput } from './inputMediation';
import { readWellbeing } from './wellbeing';
import { groundPlayerAction, parsePlayerIntent } from './intentParser';
import { scanAndScrubLeaks } from './leakScanner';
import { ensureTurnProse, stripResidualMechanicTags } from './narrativeSanitize';
import {
  applyOpeningAnswer,
  ensureSealedOpeningBag,
  isAloneArrivalOpening,
  isAloneArrivalPick,
  pendingRequiredCovers,
  resolveOpeningHookPick,
  resolveOpeningMode,
  resolveOpeningPrompts,
  resolveOpeningRegistrar,
  seedCoverAnswers,
  shouldStitchOpeningContinue,
  openingCastNames,
  hallTalkTopics,
} from './openingEstablishment';
import { headlessOpeningContinueTurn } from './liveDrive';
import { applyCommittedNarrative, seedOpeningSceneFacts } from './sceneFacts';
import { hookLockForWarden, seedHookLockFromPickedHook } from './hookLock';
import { enforceCameraOnProse, enforceCameraOnState, resolveNextLocation } from './travelAuthority';
import { syncSheetToMovedHere } from './locationMemory';
import { applyOpeningContract, ensureStarterLookCharacter, stitchOpeningScene } from './openingStitch';
import {
  authoredPageText,
  authoredStartPage,
  ensurePyoaSpine,
  initUmbraSpine,
  isAuthoredPyoaBook,
  spineChoiceLabels,
} from './pyoaSpine';
import { seedStoryPlaces } from './storyDataBoundary';
import {
  seedOutdoorHubPlaces,
  hubsForBible,
  matchHub,
  hubsForBibleId,
  hubLinkedQuestCount,
} from './outdoorHubs';
import { applyWriterNewPlaces, ensurePlaceOnMap, newPlacesFromWriterPayload } from './placeRegistry';
import { openTalkQuestCard, spokenLines } from './settlementQuestCards';
import { resolveHubArrival, hubBeatAwardKey } from './hubEncounters';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { placeQuestGivers, presentNpcRecords, seedOpeningCastLocations } from './npcRecords';
import { starterArrival } from './questGiver';
import {
  clearVignetteOnHubLeave,
  hubBeatContactIfPresent,
  openVignetteFromHubBeat,
} from './vignetteLock';
import { seedWorldMapPlaces } from './worldMapAuthority';
import { maybeRevealFromLocation } from './worldAtlas';
import { harvestNarrativePeople, scrubInventedGeography } from './narrativeHarvest';
import { applySocialLedgerTurn } from './npcMemory';
import { advanceSceneLedger, stampSceneLedger } from './sceneLedger';
import { maybeAutoCloseDungeon } from './dungeonLifecycle';
import {
  extractUpdates,
  parseActionTags,
  stripActionTags,
  stripChoiceList,
  eventsToQuestUpdates,
} from './parser';
import { scrubOfficialPlaceholder } from './narrativeScrub';
import { isChromePersonToken } from './chromeAuthority';
import { countTurnReceipts, countRunReceipts, type ReceiptCounts } from './receiptTelemetry';
import type { RunManifest } from './runManifest';
import { BUILD_STAMP } from './runManifest';
import { applySandboxXpAwards } from './sandboxXp';
import { applyCharacterXpGain, characterXpGainBetween } from './characterXp';
import {
  applyGovernanceCommit,
  applyGovernanceToProse,
  filterGovernanceChoices,
  processMetaInput,
} from './qualityGovernance';
import { writerWordsGuard } from './writerWords';
import {
  commitTalkStageAfterTurn,
  runArcDirectorBeforeGm,
  formatArcDirectorMandateBlock,
  formatArcStatusReceipts,
  preserveArcQuestProgress,
  xpGainVoiceAside,
  type ArcDirectorResult,
} from './arcDirector';
import { applyQuestAddProposals, ensureQuestFloor } from './questGenerator';
import { planSceneThreads } from './openThreads';
import { carryLimitOn, resolveInspirationReroll, withHouseRules } from './rules/houseRules';
import { bookBodyAfterWriterMiss, handedRefs, isDroughtStubProse, isLastGmReprint, isUnaskedCombatClose, ledgerActionStitch, outageSpokenLine, readerFlags } from './completedEventPacket';
import { prepareWriterInputWithTownsfolk } from './townsfolk';
import { applyGraphExitTravel } from './mapEngine';
import { maybeEnterInteriorDungeon } from './enterInterior';
import { advanceDungeonCard } from './dungeonCard';
import { tokenLineVerdicts } from './tokenProse';
import { runWriterTurnWithFightRetry, thisTurnsEventCheck, writerTurnIssues, type WriterTurnResult, type WriterTurnRetryResult } from './writerTurn';
import { drainWriterRawIssues, drainWriterUsage } from './gmProxy';
import {
  classifyResponsePath,
  formatTalkWriterFacing,
  tallyResponsePaths,
  type ResponsePath,
  type WriterOutcome,
} from './talkEnvelope';
import {
  composeFreeMudTurn,
  formatMicroFlavorPrompt,
  mudDisplayBody,
  shouldSkipMicroFlavor,
  shouldUseSilentMudTurn,
  type FreeMudTurn,
} from './freeMudPresentation';
import {
  applyCombatClearTag,
  consumeTagTriggerOnInput,
} from './tagTrigger';
import { applyOpeningOfferChoice } from './openingOffer';
import { beatCommitFromReceipts, validateProseAgainstBeat } from './beatCommit';
import {
  attachSealedManifest,
  buildSealedManifest,
  formatSealedManifestBlock,
  applyRenderFallback,
  canUseFallback,
  consecutiveRecoveryExceeded,
  clearEngineRecoveryStreak,
  isBannedFallbackStub,
  markEngineRecoveryCommit,
  type RenderFallbackReason,
} from './sealedManifest';
import { hashCanonicalState } from './replayHash';
import { commitTurnRecord } from './stateTx';
import { validateEvalRun, type EvalHarnessResult } from './evalHarness';
import { playerInputGateBlock } from './choiceCompiler';
import { filterSystemLogForEngine, reconcileXpStatusLines } from './systemLog';
import { beatFingerprint, isSameBeat, isNearClone, buildBeatNoveltyRetryBlock, beatSimilarity } from './beatFingerprint';
import {
  playerAsksRepeat,
  playerAsksContinuation,
  recentGmBeatTexts,
  shouldRetryUnaskedCollage,
} from './semanticLoopDetector';
import { enforcePerspective } from './perspectiveWarden';
import { buildPlayTranscript, buildStoryReviewExport, buildNarrationOnlyStoryExport, commitOfferedTurn, resolveOfferedChoices, withOfferedChoices } from './playTranscript';
import { dropAbsentListenerChips, peopleHere } from './chipLegality';
import { withLitrpgSystemWindow } from './litrpgSystemWindow';
import {
  applyProseWarden,
  crowdSizeForWarden,
  collectSceneObjectNames,
  scrubFalseArrivalWhenHere,
} from './proseWarden';
import { ensureEncounterSpawnPreface } from './combatAuthority';
import { engineResultFact } from './engineResult';
import { applyStoryRpgTurn, romanceAllowed } from './storyRpgProgress';
import { applyTabletopQuestTurn } from './tabletopQuestProgress';
import { isDying } from './tabletop/roundFight';
import { resolveShopChip } from './shopChips';
import { encounterBlocksTravel, settleParleyAfterProse } from './encounterTerminalFsm';
import { classifyBeatCommit, isBlockedPaint, notesForCommittedBody, repairRejectedBeat, sentenceRejectedInDraft } from './beatCommitGate';
import { scrubOneCameraFight } from './oneCameraFight';
import { commitTravel, pinClockTimeOfDay, travelEngineLines, travelOutcome } from './travelJourney';
import { readabilityGatePass } from './readabilityGate';
import { checkPlayerTurn, type TurnCheck } from './turnCheck';
import { grantLevelSkills } from './skillGates';
import { compactTrafficGist } from './openingPointerCard';
import {
  syncQuestsFromPlay,
  questsLockedDuringOpening,
  revealQuestsFromHubLinks,
  applyBiomeSaneQuestSites,
  revealLocalStarterQuest,
} from './questPlay';
import { hookCtxFromState, withMatchedLitRpgSpine } from '@/data/quests/litrpgMainSpines';
import { touchPlaceVisit } from './places';
import { buildTurnMandate } from './sceneFocus';
import { groundedWeaponNames, listEmptySearchTargets } from './searchContinuity';
import { applyStructuralEvents } from './structuralEvents';
import {
  disableAutoplayTestLab,
  enableAutoplayTestLab,
  type HostedAiTier,
} from './testLab';
import type { EngineMode, GameState, LogEntry, Settings } from './types';
export type { EngineMode };
import { runWarden } from './warden';
import { emptyWorldLedger } from './worldSim';
import { storyStartTextTurnsForTier } from './capacityLedger';
import { setActiveSubscriptionTier } from './subscriptionTiers';
import { storyHasBody } from './parser';
export type FateMode = 'fate' | 'first-pad';
export type FateAutoplayCliOpts = {
  turns: number;
  seed: number;
  bibleId: string;
  /** LitRPG systemPersonality or gmPersonality for other modes. */
  personality: string;
  /** 28b — `--inputs "a|b|c"` scripted player lines (blank = normal pick). */
  inputs?: string[];
  /** `--route <place>` — from turn 2, travel toward this place until arrived, then normal picks. */
  routeTo?: string;
  engineMode?: EngineMode;
  aiTier: HostedAiTier;
  mode: FateMode;
  aiAgentMode?: AiAgentMode;
  dryRun: boolean;
  matrix: boolean;
  /** Balanced matrix: 10 per test mode (LitRPG / tabletop / RPG). */
  matrix40: boolean;
  /** Cap matrix combos (0 = no cap). */
  matrixLimit: number;
  /**
   * ~7h StoryForge night @ observed matrix-40×100 pace (~1.6s p50, ~2070 turns/h):
   * 3×500 AI-agent spines + 3× matrix-40×100 ≈ 13,500 turns (~6.5h).
   */
  nightStoryforge: boolean;
  /** 4 engine modes × 3 AI agents × turns (default 300) → 4 mode Gemini packs + telemetry. */
  modesAgents300: boolean;
  /** Run only the 27w worst cell per mode (4 runs under --modes-agents-300). */
  worstCellsOnly?: boolean;
  /** Run only the 29b alternate-flagship cell per mode (4 runs under --modes-agents-300). */
  altCellsOnly?: boolean;
  /** Regenerate mode Gemini packs from an existing batch (no re-run). */
  splitModesGemini?: boolean;
  /** Also write optional combined 12-run Gemini file (default off). */
  combinedGemini?: boolean;
  /** Resume an existing modes-agents batch folder (skip completed cells). */
  resumeDir?: string;
  resumeFrom?: string;
  /** Batch folder for --split-modes-gemini. */
  batchDir?: string;
  outRoot: string;
  characterName: string;
  /** GM writer: default (hosted Free via edge), or flash-lite / openrouter / gateway (all OpenRouter). */
  writer?: AutoplayWriterKind;
  /** `--writer-model <provider/model>` — OpenRouter model id; default Flash Lite. */
  writerModel?: string;
};
export type MatrixCombo = {
  engineMode: EngineMode;
  bibleId: string;
  bibleTitle: string;
  personalityId: string;
  seed: number;
};
export type TurnTelemetry = {
  turn: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  bibleId: string;
  engineMode?: EngineMode;
  personalityId: string;
  seed: number;
  fatePick: string;
  offeredChoices: string[];
  offeredChoiceIds: string[];
  /** q43-OCD — offered-chip record (label, actionId, kind, cooldownReturn) for cooldown / OPT-7. */
  offeredChips?: Array<{
    label: string;
    actionId: string;
    kind: string;
    cooldownReturn?: boolean;
  }>;
  playerInput: string;
  gmText: string;
  systemLog: string[];
  questUnlocks: string[];
  itemsEquipped: string[];
  itemsUsed: string[];
  xpGained?: number;
  level?: number;
  characterXp?: number;
  xpToNext?: number;
  /** 28b — every stored place card (hub revisit check: a card is built once, reused on return). */
  placeCards?: Array<{ name: string; cardBuiltTurn?: number; description?: string; exits?: string[] }>;
  loopFlags: { officialCount: number; atmosphereRepeat: boolean; strangerCount: number };
  error?: string;
  failKind?: string;
  transportRetries: number;
  /** Gateway DNS ENOTFOUND — harness pauses / aborts cell. */
  dnsFailure?: boolean;
  repairNote?: string;
  dryRun?: boolean;
  receiptCounts?: ReceiptCounts;
  arcStatusReceipts?: string[];
  /** 29z1 — turnProgress for this turn (loop stop + thumbs no-progress count). */
  progress?: boolean;
  progressReasons?: string[];
  /** 29z2 — tester check: P0 (ghost/impossible chip, ignored action, open-ground interior, unset quest place) + thumbs-down. */
  turnCheck?: TurnCheck;
  sealedManifestHash?: string;
  replayHash?: string;
  renderFallbackUsed?: boolean;
  snapshotGist?: import('./openingPointerCard').SnapshotGist;
  /** 08c Free MUD — optional flavor quote + receipt lines for scoring. */
  presentation?: 'mud-receipt' | 'standard';
  flavorQuote?: string;
  receiptLines?: string[];
  /** 12f — A page1 / B cover / C hall / D Silent / E callGm */
  responsePath?: ResponsePath;
  /** 12f — E only: first accept, quality retry, or stitch/render fallback */
  writerOutcome?: WriterOutcome;
  /** Lap 13 — the sentences the commit gate rejected, their reasons, and the engine fact. */
  rejectedWriterText?: string;
  rejectedReason?: string;
  /** Lap 13 — each rejected sentence and its one repair (a `bug` means the repair failed). */
  sentenceRepairs?: import('./writerTurn').SentenceRepair[];
  /** Lap 37 — a talk turn's missing quoted answer and its one repair request. */
  answerRepair?: import('./writerTurn').SentenceRepair;
  /** The engine settled a fight the first draft left out: how the beat was made whole. */
  fightRetry?: 'retried' | 'added' | 'painted';
  draftRetry?: 'retried' | 'painted';
  /** RC-R1 — fight outcome shown once on the engine combat-log channel (not in prose). */
  outcomeShown?: 'engine';
  /** A whole-beat warden block (unresolved / collage): logged, the draft stays. */
  blockedPaintReason?: string;
  engineFact?: string;
  /** Open quests the writer must not read out (the fact checker's step-leak list when the packet hides them). */
  openQuests?: Array<{ title: string; step: string }>;
  /** 28g — diagnostics: raw writer reply (first 600 chars), token line verdicts, accept path. */
  writerRawHead?: string;
  /** Full raw writer reply, so a draft-vs-final check can see every line. */
  writerRaw?: string;
  /** Text after each post-writer step that changed it (render first, final last). */
  stageTrace?: { stage: string; text: string }[];
  tokenVerdicts?: string[];
  tokenPath?: string;
  retryTokenVerdicts?: string[];
  /** 28l — writer HTTP calls this turn (incl. transport retries) and ms spent in them. */
  writerCalls?: number;
  writerMs?: number;
  /** 28l — code-found problems on the first draft, and whether a stitch/canned line was painted. */
  draftProblems?: string[];
  /** 29z9 — who / want / where: code added the addressee's own line, or found no real line to add (logged, not marked). */
  spokenLine?: import('./spokenAnswer').SpokenAnswer;
  stitchedLine?: boolean;
  /** 28l — raw writer issues on the committed beat (training signal; see `writerTurnIssues`). */
  writerIssues?: string[];
  wardenNotes?: string[];
  /** 28w — provider-reported token use summed over this turn's model calls (null = not reported). */
  writerUsage?: import('./gmProxy').TurnWriterUsageWithCost;
} & Partial<RowProvenance>;
export type RunSummary = {
  runId: string;
  bibleId: string;
  bibleTitle: string;
  engineMode: EngineMode;
  personalityId: string;
  seed: number;
  requestedTurns: number;
  completedTurns: number;
  dryRun: boolean;
  aiTier: HostedAiTier;
  aiAgentMode?: AiAgentMode;
  startedAt: string;
  endedAt: string;
  errorCount: number;
  timeoutCount: number;
  transportRetryCount: number;
  latencyMs: { p50: number; p95: number; mean: number };
  issueTurns: Array<{ turn: number; error?: string; failKind?: string }>;
  outDir: string;
  runManifest?: RunManifest;
  receiptTotals?: ReceiptCounts;
  evalHarness?: EvalHarnessResult;
  finalReplayHash?: string;
  readabilityGate?: {
    pass: boolean;
    p0Count: number;
    p1Count?: number;
    violations: Array<{ kind: string; turn: number; quote: string }>;
  };
  /** 12f — A–E share + E accept/retry/fallback */
  pathCounts?: ReturnType<typeof tallyResponsePaths>;
};
function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}
function latencyStats(ms: number[]): { p50: number; p95: number; mean: number } {
  if (!ms.length) return { p50: 0, p95: 0, mean: 0 };
  const sorted = [...ms].sort((a, b) => a - b);
  const mean = Math.round(ms.reduce((a, b) => a + b, 0) / ms.length);
  return { p50: percentile(sorted, 50), p95: percentile(sorted, 95), mean };
}
export function isBlankCanvasBible(id: string): boolean {
  return id.startsWith('blank-canvas');
}
/** PYOA books are unfinished: never tested. Only these modes run in harnesses. */
export const TEST_ENGINE_MODES: readonly EngineMode[] = ['litrpg', 'dnd', 'rpg'];
export const DEFAULT_TEST_BIBLE_BY_MODE: Readonly<Record<string, string>> = {
  litrpg: 'summoned-pact',
  dnd: 'cursed-keep',
  rpg: 'salt-road-heist',
};
/** `--game-mode` value → engine mode (tabletop = dnd). Null for PYOA / unknown. */
export function parseTestGameMode(raw: string): EngineMode | null {
  const v = raw.trim().toLowerCase();
  if (v === 'litrpg') return 'litrpg';
  if (v === 'tabletop' || v === 'dnd') return 'dnd';
  if (v === 'rpg' || v === 'story-rpg') return 'rpg';
  return null;
}
/** True for any bible that plays as PYOA (its engine mode is pyoa, e.g. Thornferry Road). */
export function isTestExcludedBible(id: string): boolean {
  const bible = getCampaignBibleById(id);
  return !bible || bible.engineMode === 'pyoa';
}
function testableBibles(engineMode: EngineMode): CampaignBible[] {
  return getCampaignBiblesByEngineMode(engineMode).filter(
    (b) => !isBlankCanvasBible(b.id) && !isTestExcludedBible(b.id)
  );
}
/** Launch matrix: mode × ready premade (skip blank) × Launch narrator (full cartesian). */
export function enumerateLaunchMatrix(baseSeed = 1): MatrixCombo[] {
  const combos: MatrixCombo[] = [];
  let i = 0;
  for (const engineMode of TEST_ENGINE_MODES) {
    const bibles = testableBibles(engineMode);
    const personalities =
      engineMode === 'litrpg'
        ? LAUNCH_LITRPG_SYSTEM_PERSONALITY_IDS
        : LAUNCH_GM_PERSONALITY_IDS;
    for (const bible of bibles) {
      for (const personalityId of personalities) {
        combos.push({
          engineMode,
          bibleId: bible.id,
          bibleTitle: bible.title,
          personalityId,
          seed: baseSeed + i,
        });
        i += 1;
      }
    }
  }
  return combos;
}
/**
 * One cell per ready premade (skip blank): first Launch narrator for that mode.
 * Used by auto-improve curriculum so we cover every bible without full cartesian.
 */
export function enumeratePremadesOnce(baseSeed = 1): MatrixCombo[] {
  const combos: MatrixCombo[] = [];
  let i = 0;
  for (const engineMode of TEST_ENGINE_MODES) {
    const bibles = testableBibles(engineMode);
    const personalities =
      engineMode === 'litrpg'
        ? LAUNCH_LITRPG_SYSTEM_PERSONALITY_IDS
        : LAUNCH_GM_PERSONALITY_IDS;
    const personalityId = personalities[0]!;
    for (const bible of bibles) {
      combos.push({
        engineMode,
        bibleId: bible.id,
        bibleTitle: bible.title,
        personalityId,
        seed: baseSeed + i,
      });
      i += 1;
    }
  }
  return combos;
}
/**
 * Balanced matrix: 10 per test mode (LitRPG / tabletop / RPG); PYOA is never tested.
 * Every premade at least once when count ≤ 10; extras cycle narrator + seed.
 * Modes with more than 10 ready premades use the first 10; the rest are deferred (listed in notes).
 */
export function buildBalancedMatrix40(baseSeed = 1): {
  combos: MatrixCombo[];
  deferred: Array<{ engineMode: EngineMode; bibleId: string; bibleTitle: string }>;
  notes: string[];
} {
  const perMode = 10;
  const combos: MatrixCombo[] = [];
  const deferred: Array<{ engineMode: EngineMode; bibleId: string; bibleTitle: string }> = [];
  const notes: string[] = [];
  let slot = 0;
  for (const engineMode of TEST_ENGINE_MODES) {
    const all = testableBibles(engineMode);
    const personalities =
      engineMode === 'litrpg'
        ? LAUNCH_LITRPG_SYSTEM_PERSONALITY_IDS
        : LAUNCH_GM_PERSONALITY_IDS;
    let chosen = all;
    if (all.length > perMode) {
      chosen = all.slice(0, perMode);
      for (const b of all.slice(perMode)) {
        deferred.push({ engineMode, bibleId: b.id, bibleTitle: b.title });
      }
      notes.push(
        `${engineMode}: ${all.length} premades → using first ${perMode}; deferred: ${deferred
          .filter((d) => d.engineMode === engineMode)
          .map((d) => d.bibleId)
          .join(', ')}`
      );
    }
    for (let i = 0; i < perMode; i++) {
      const bible = chosen[i % chosen.length]!;
      const personalityId = personalities[i % personalities.length]!;
      combos.push({
        engineMode,
        bibleId: bible.id,
        bibleTitle: bible.title,
        personalityId,
        seed: baseSeed + slot,
      });
      slot += 1;
    }
    if (all.length < perMode) {
      notes.push(
        `${engineMode}: ${all.length} premades → ${perMode} runs (extras cycle narrator/seed on repeated premades)`
      );
    } else if (all.length === perMode) {
      notes.push(`${engineMode}: ${all.length} premades × cycled narrators = ${perMode} runs`);
    }
  }
  return { combos, deferred, notes };
}
export function matrixBudgetLines(turnsPerRun: number, comboCount?: number): string[] {
  const full = enumerateLaunchMatrix();
  const n = comboCount ?? full.length;
  const byMode = new Map<EngineMode, number>();
  for (const c of full) {
    byMode.set(c.engineMode, (byMode.get(c.engineMode) ?? 0) + 1);
  }
  const minMin = Math.round((n * turnsPerRun * 45) / 60);
  const maxMin = Math.round((n * turnsPerRun * 75) / 60);
  const runs12hOptimistic = Math.floor((12 * 60) / Math.max(1, (turnsPerRun * 45) / 60));
  const runs12hPessimistic = Math.floor((12 * 60) / Math.max(1, (turnsPerRun * 75) / 60));
  const m40 = buildBalancedMatrix40();
  const m40Min = Math.round((m40.combos.length * turnsPerRun * 45) / 60);
  const m40Max = Math.round((m40.combos.length * turnsPerRun * 75) / 60);
  return [
    `Full Launch cartesian: ${full.length} combos (mode × premade × narrator; blank skipped).`,
    ...[...byMode.entries()].map(([m, c]) => `  - ${m}: ${c}`),
    `At N=${turnsPerRun}: full cartesian ≈ ${Math.round((full.length * turnsPerRun * 45) / 60)}–${Math.round((full.length * turnsPerRun * 75) / 60)} min.`,
    `Balanced matrix-40: ${m40.combos.length} runs → ≈ ${m40Min}–${m40Max} min (~${(m40Min / 60).toFixed(1)}–${(m40Max / 60).toFixed(1)} h) at 45–75s/turn.`,
    `12h sequential ≈ ${runs12hPessimistic}–${runs12hOptimistic} runs of N=${turnsPerRun}.`,
    ...m40.notes.map((line) => `  note: ${line}`),
  ];
}
function resolvePersonalities(
  engineMode: EngineMode,
  personalityRaw: string
): { systemPersonality?: SystemPersonalityId; gmPersonality?: GmPersonalityId; personalityId: string } {
  if (engineMode === 'litrpg') {
    const id = resolveLitrpgSystemPersonality(personalityRaw);
    return { systemPersonality: id, personalityId: id };
  }
  if (engineMode === 'dnd') {
    const id = resolveTabletopGmPersonality(personalityRaw);
    return { gmPersonality: id, personalityId: id };
  }
  if (engineMode === 'rpg') {
    const id = resolveRpgGmPersonality(personalityRaw);
    return { gmPersonality: id, personalityId: id };
  }
  const id = resolvePyoaGmPersonality(personalityRaw);
  return { gmPersonality: id, personalityId: id };
}
export function buildNewGameState(opts: {
  bibleId: string;
  characterName: string;
  seed: number;
  personality: string;
  engineMode?: EngineMode;
  /** Tabletop: walk the inn-book creation pages with seeded picks. Off for runs recorded before creation. */
  tabletopCreation?: boolean;
}): { state: GameState; bible: CampaignBible; personalityId: string } {
  const bible = getCampaignBibleById(opts.bibleId);
  if (!bible) throw new Error(`Unknown bible id: ${opts.bibleId}`);
  if (isBlankCanvasBible(bible.id)) {
    throw new Error(`Blank canvas ${bible.id} is skipped for autoplay — pick a ready premade.`);
  }
  const engineMode = opts.engineMode ?? bible.engineMode;
  const voices = resolvePersonalities(engineMode, opts.personality);
  const storyName = formatCampaignStoryName(bible.title);
  const base = createInitialState(storyName, engineMode, bible.archetype, String(opts.seed));
  let systemHousing: GameState['systemHousing'] = undefined;
  if (engineMode === 'litrpg') {
    const rolled = rollSystemHousing(String(opts.seed));
    const pin = process.env.SGM_AUTOPLAY_HOUSING;
    systemHousing = isSystemHousingId(pin)
      ? clampSystemHousing({ housing: pin, parts: rolled.parts })
      : rolled;
  }
  // Force deterministic seed string for opening hook pick
  const seededBase: GameState = {
    ...base,
    seed: String(opts.seed),
    saveId: `fate-${opts.seed}-${bible.id}-${Date.now()}`,
    systemHousing,
  };
  const seeded = fitKitToHousing(seedStateFromCampaignBible(seededBase, bible));
  const namedSeeded = { ...seeded, storyName };
  const mergedCharacter = ensureStarterLookCharacter(
    applyCampaignCharacter(
      { ...namedSeeded.character, name: opts.characterName || 'Jax' },
      bible
    )
  );
  const openingMode = resolveOpeningMode(bible, engineMode);
  const openingPromptsRaw = resolveOpeningPrompts(bible, engineMode, bible.archetype);
  const registrar = resolveOpeningRegistrar(bible, engineMode, bible.archetype);
  const picked = resolveOpeningHookPick(bible, namedSeeded.seed);
  const coverAnswers = {
    ...seedCoverAnswers(bible, mergedCharacter, picked?.location),
    name: mergedCharacter.name,
  };
  const aloneArrival = isAloneArrivalPick(picked);
  const openingPrompts = applyOpeningContract(
    openingPromptsRaw,
    bible,
    aloneArrival,
    namedSeeded.seed ?? namedSeeded.saveId ?? '0'
  );
  // Auto-complete covers so Fate is never blocked on name/look chips.
  const pendingCovers = pendingRequiredCovers(openingPrompts, mergedCharacter, openingMode);
  for (const p of pendingCovers) {
    if (p.kind === 'name') coverAnswers.name = mergedCharacter.name;
    if (p.kind === 'location') {
      coverAnswers.where = coverAnswers.where || picked?.location || bible.startingLocation || 'Here';
    }
    if (p.kind === 'appearance') {
      coverAnswers.look = coverAnswers.look || 'everyday street clothes, tired eyes';
      coverAnswers.wear = coverAnswers.wear || coverAnswers.look;
    }
    if (p.kind === 'kit') {
      coverAnswers.kit = coverAnswers.kit || 'street clothes';
    }
  }
  const honeymoon = storyStartTextTurnsForTier('free');
  const rawNewState: GameState = {
    ...namedSeeded,
    character: mergedCharacter,
    currentLocation:
      picked?.location
      || coverAnswers.where
      || bible.startingLocation
      || namedSeeded.currentLocation,
    currentCoordinates: { q: 0, r: 0, tier: 2, z: 0 },
    choices: [],
    log: [],
    worldLedger: seedWorldLedgerFactions(emptyWorldLedger(), bible),
    places: seedStoryPlaces(
      seedWorldMapPlaces(
        seedOutdoorHubPlaces([], bible, namedSeeded.worldAtlas),
        namedSeeded.worldAtlas,
        { seed: namedSeeded.seed, authoredQuestCount: (s) => hubLinkedQuestCount(bible, s) }
      ),
      bible,
      hubsForBible(bible).length > 0
    ),
    sandboxAwardKeys: [],
    mapFocusPlace: null,
    pendingGeneratedOpening: false,
    storyStartTextTurnsRemaining: honeymoon,
    pyoaSpine: bible.id === 'umbra-protocol' ? initUmbraSpine() : namedSeeded.pyoaSpine,
    openingEstablishment: {
      pending: [],
      answers: coverAnswers,
      complete: true,
      registrar,
      sceneWritten: true,
      mode: openingMode,
      pickedHook: picked?.text,
      pickedHookId: picked?.location
        ? picked.location.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)
        : undefined,
      pickedHookFallback: picked?.page1 || picked?.fallback,
      aloneArrival,
      hookLock: seedHookLockFromPickedHook(picked?.text, picked?.fallback, 0),
      castNpcIds: picked?.castNpcIds ?? [],
      ...(picked?.card ? { card: picked.card } : {}),
    },
    gmPersonality: voices.gmPersonality,
    systemPersonality: voices.systemPersonality,
  };
  const sealed = ensureSealedOpeningBag(rawNewState, openingPromptsRaw);
  const state = withUpdatedHookArc(
    ensureCampaignContract(
      {
        ...sealed,
        quests: revealLocalStarterQuest(
          sealed.quests ?? [],
          withMatchedLitRpgSpine(bible.starterQuests ?? [], hookCtxFromState({
            ...sealed,
            campaignBibleId: bible.id,
          })),
          { ...starterArrival({ ...sealed, campaignBibleId: bible.id }), alone: aloneArrival }
        ),
        recentBeatFingerprints: [],
        stateTxLog: [],
      },
      bible
    )
  );
  const placed = placeQuestGivers(seedOpeningCastLocations(state));
  const built = engineMode === 'dnd' && opts.tabletopCreation
    ? autoTabletopCreation(placed, mulberry32(seedNumber(`tt-fate:${opts.seed}`)))
    : placed;
  return { state: built, bible, personalityId: voices.personalityId };
}
export function stampOpening(state: GameState): GameState {
  // q50-MAP2 — opening HERE on the place record with hub-graph exits (no atlas / discovered write).
  state = ensurePlaceOnMap(state, state.currentLocation);
  const text = stitchOpeningScene(state);
  const seeded = seedOpeningSceneFacts({ ...state, turn: 1 });
  const facts = applyCommittedNarrative({ ...state, sceneFacts: seeded, turn: 1 }, text, 1);
  const gmBase: LogEntry = {
    id: uid(),
    turn: 0,
    role: 'gm',
    content: text,
    timestamp: Date.now(),
    systemLog: state.engineMode === 'dnd' ? formatTabletopSheet(state) : [],
  };
  const withChoices = {
    ...state,
    turn: 0,
    log: [gmBase],
    choices: [],
  };
  const gm = withLitrpgSystemWindow(withOfferedChoices(gmBase, withChoices), state);
  const authoredChips = isAuthoredPyoaBook(state.campaignBibleId)
    ? spineChoiceLabels(ensurePyoaSpine(state))
    : null;
  const next: GameState = {
    ...withChoices,
    turn: 1,
    sceneFacts: facts,
    log: [gm],
    choices: authoredChips ?? gm.offeredChoices ?? resolveOfferedChoices(withChoices),
  };
  return next;
}
/** Extract quest unlocks from this turn by comparing quest arrays. */
function extractQuestUnlocksFromTurn(prev: GameState, next: GameState): string[] {
  const prevIds = new Set((prev.quests ?? []).filter(q => q.revealed).map(q => q.id));
  const unlocked = (next.quests ?? [])
    .filter(q => q.revealed && !prevIds.has(q.id))
    .map(q => q.name);
  return unlocked;
}
/** Extract items equipped this turn by comparing equipped slots. */
function extractEquippedItems(prev: GameState, next: GameState): string[] {
  const prevEquipped = new Set(
    (prev.inventory ?? []).filter(i => i.equipped).map(i => i.name)
  );
  const equipped = (next.inventory ?? [])
    .filter(i => i.equipped && !prevEquipped.has(i.name))
    .map(i => i.name);
  return equipped;
}
/** Extract items used/consumed this turn by comparing inventory counts. */
function extractUsedItems(prev: GameState, next: GameState): string[] {
  const prevCounts = new Map<string, number>();
  for (const item of prev.inventory ?? []) {
    prevCounts.set(item.name, (prevCounts.get(item.name) ?? 0) + (item.quantity ?? 1));
  }
  const used: string[] = [];
  const nextCounts = new Map<string, number>();
  for (const item of next.inventory ?? []) {
    nextCounts.set(item.name, (nextCounts.get(item.name) ?? 0) + (item.quantity ?? 1));
  }
  for (const [name, prevCount] of prevCounts) {
    const nextCount = nextCounts.get(name) ?? 0;
    if (nextCount < prevCount) {
      used.push(name);
    }
  }
  return used;
}
/** Detect loop/stuck patterns for StoryForge filtering. */
function detectLoopFlags(gmText: string, state: GameState): {
  officialCount: number;
  atmosphereRepeat: boolean;
  strangerCount: number;
} {
  const officialCount = (gmText.match(/\bthe official\b/gi) || []).length;
  const strangerCount = (gmText.match(/\bthe stranger\b/gi) || []).length;
  const recent = state.recentBeatFingerprints ?? [];
  const fp = beatFingerprint(gmText);
  const atmosphereRepeat = recent.length > 0 && recent.slice(-3).some((r) => beatSimilarity(fp, r) >= 0.72);
  return { officialCount, atmosphereRepeat, strangerCount };
}
/** Smart choice picker based on AI agent goals. */
function pickGoalOrientedChoice(
  offered: string[],
  state: GameState,
  mode: AiAgentMode,
  rng: Rng
): string {
  // 28o — default play prefers chips that move the game on (unexplored exits, quest step), same scores as the chip rank.
  if (mode === 'default' || offered.length === 0) {
    return pickWeightedChoice(offered, chipProgressWeights(state, offered), rng);
  }
  // Score each choice based on the agent's goal
  const scored = offered.map((choice, index) => {
    let score = 0;
    const lower = choice.toLowerCase();
    if (mode === 'maxlevel') {
      // Prefer combat, explore, quest, travel (XP drip), vendor
      if (/\b(?:fight|attack|engage|battle|challenge|strike|defend)\b/i.test(choice)) score += 8;
      if (/\b(?:accept|take on|pursue|resume).*quest|quest focus|pact work\b/i.test(choice)) score += 6;
      if (/\b(?:travel toward|travel to|return to)\b/i.test(choice)) score += 5;
      if (/\b(?:explore|search|investigate|scout|map)\b/i.test(choice)) score += 4;
      if (/\b(?:ask|talk|speak|inquire)\b/i.test(choice)) score += 3;
      if (/\b(?:browse|prices|wares|junk|fence|vendor|stall)\b/i.test(choice)) score += 3;
      if (/\b(?:walk the battlement|listen from a corner|watch the gate queue)\b/i.test(choice)) score -= 4;
      if (/\b(?:rest|wait|idle|look around)\b/i.test(choice)) score -= 5;
    } else if (mode === 'storyfollower') {
      // Prefer main quest, dialogue, and story beats
      if (/\b(?:main|primary|quest focus|pact|resume)\b/i.test(choice)) score += 7;
      if (/\b(?:talk|speak|ask|tell|inquire)\b/i.test(choice)) score += 5;
      if (/\b(?:continue|proceed|follow|accept)\b/i.test(choice)) score += 3;
      if (/\b(?:travel toward|travel to)\b/i.test(choice)) score += 2;
      if (/\b(?:walk the battlement|browse the nearest stall)\b/i.test(choice)) score -= 3;
      const mainQuest = (state.quests ?? []).find((q) => q.revealed && q.type === 'main');
      if (mainQuest && lower.includes(mainQuest.name.toLowerCase())) score += 6;
      const side = (state.quests ?? []).find((q) => q.revealed && q.type === 'side' && q.status === 'active');
      if (side && lower.includes(side.name.toLowerCase())) score += 4;
    } else if (mode === 'completionist') {
      // Prefer side quests, exploration, and collecting
      if (/\bside\b.*\bquest\b|\botherworld junk\b|\bfence\b/i.test(choice)) score += 7;
      if (/\b(?:explore|search|investigate|scout|map)\b/i.test(choice)) score += 5;
      if (/\b(?:collect|gather|loot|salvage|browse)\b/i.test(choice)) score += 4;
      if (/\b(?:travel toward|travel to|visit)\b/i.test(choice)) score += 4;
      if (/\b(?:ask|talk|inquire)\b/i.test(choice)) score += 3;
      if (/\b(?:listen from a corner|walk the battlement)\b/i.test(choice)) score -= 4;
      const isTravel = /\btravel (?:to|toward)\b/i.test(choice);
      if (isTravel) {
        const visited = new Set(
          (state.places ?? [])
            .filter((p) => (p.lastVisitedTurn != null && p.lastVisitedTurn >= 0) || p.arcStatus === 'visited' || p.arcStatus === 'cleared')
            .map((p) => p.name.toLowerCase())
        );
        const hubInChoice = (state.places ?? []).find((p) => lower.includes(p.name.toLowerCase()));
        if (hubInChoice && !visited.has(hubInChoice.name.toLowerCase())) {
          score += 5;
        }
      }
    }
    // Shared: penalize recently offered identical labels (from recentChoices)
    const recent = (state.recentChoices ?? []).slice(-5).flatMap((e) => e.choices.map((c) => c.toLowerCase().trim()));
    if (recent.filter((c) => c === lower).length >= 2) score -= 6;
    score -= Math.min(6, chipProgressScore(state, choice) - 3);
    return { choice, index, score };
  });
  // Sort by score (descending), then shuffle tied scores
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return rng() - 0.5;
  });
  // Pick from top 3 scored choices randomly (or all if fewer)
  const topChoices = scored.slice(0, Math.min(3, scored.length));
  const picked = topChoices[Math.floor(rng() * topChoices.length)];
  return picked.choice;
}
const writerPromptSink: { dir?: string; turn: number } = { turn: 0 };
async function saveWriterPrompt(state: GameState, payload: string): Promise<void> {
  if (!writerPromptSink.dir) return;
  let body: string;
  try {
    const edgePath = pathToFileURL(
      join(process.cwd(), 'supabase', 'functions', '_shared', 'gm', 'masterPrompt.ts')
    ).href;
    const edge = (await import(/* @vite-ignore */ edgePath)) as {
      buildContextPrompt: (s: GameState, input: string, lore: unknown[]) => string;
    };
    body = `# source: edge _shared/gm\n${edge.buildContextPrompt(state, payload, [])}`;
  } catch {
    body = `# source: client (edge import failed)\n${buildClientContextPrompt(state, payload, [])}`;
  }
  const nn = String(writerPromptSink.turn).padStart(2, '0');
  writeFileSync(join(writerPromptSink.dir, `turn-${nn}.txt`), body + '\n');
}
/** 28l — writer HTTP calls and time spent in them, reset at the start of each headless turn. */
const writerCallMeter = { calls: 0, ms: 0 };
async function callGmWithRetries(
  state: GameState,
  payload: string,
  settings: Settings
): Promise<{
  text: string;
  systemLog: string[];
  transportRetries: number;
  failKind?: string;
  dnsFailure?: boolean;
}> {
  let lastErr: unknown;
  let transportRetries = 0;
  let sawDns = false;
  const timeoutMs = gmProxyTimeoutMsForState(state, {
    writerTier: settings.subscriptionTier === 'mid' || settings.subscriptionTier === 'high'
      ? settings.subscriptionTier
      : 'free',
  });
  for (let attempt = 0; attempt <= TURN_TRANSPORT_MAX_AUTO_RETRIES; attempt++) {
    const callStarted = Date.now();
    writerCallMeter.calls += 1;
    try {
      await saveWriterPrompt(state, payload);
      const result = await callGm(state, payload, settings, [], undefined, undefined, timeoutMs).finally(() => {
        writerCallMeter.ms += Date.now() - callStarted;
      });
      return {
        text: result.text ?? '',
        systemLog: result.systemLog ?? [],
        transportRetries,
      };
    } catch (err) {
      lastErr = err;
      const kind = classifyTurnFailure(err);
      if (isDnsResolutionFailure(err)) sawDns = true;
      if (!shouldAutoRetryTurn(kind) || attempt >= TURN_TRANSPORT_MAX_AUTO_RETRIES) {
        return {
          text: '',
          systemLog: [],
          transportRetries,
          failKind: kind,
          dnsFailure: sawDns || isDnsResolutionFailure(err),
        };
      }
      transportRetries = attempt + 1;
      const pauseMs = isDnsResolutionFailure(err)
        ? TURN_TRANSPORT_DNS_PAUSE_MS
        : transportRetryBackoffMs(attempt, kind);
      await new Promise((r) => setTimeout(r, pauseMs));
    }
  }
  return {
    text: '',
    systemLog: [],
    transportRetries,
    failKind: classifyTurnFailure(lastErr),
    dnsFailure: sawDns || isDnsResolutionFailure(lastErr),
  };
}
/**
 * One headless turn: Fate pick → callGm → runWarden → structural → choice pad → prose wardens.
 */
export async function headlessFateTurn(
  state: GameState,
  settings: Settings,
  rng: Rng,
  meta: {
    bibleId: string;
    personalityId: string;
    seed: number;
    mode: FateMode;
    aiAgentMode: AiAgentMode;
    dryRun: boolean;
    /** Typed human line (live-drive opening script). Skips chip pick. */
    playerInputOverride?: string;
  }
): Promise<{ state: GameState; telemetry: TurnTelemetry }> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  writerCallMeter.calls = 0;
  writerCallMeter.ms = 0;
  drainWriterRawIssues();
  drainWriterUsage();
  // q45-OCD3: record the pad the player saw this turn (not the post-commit next pad).
  const offeredPadAtStart = state.offeredPad;
  const offeredChipsAtStart = offeredPadAtStart?.chips;
  const offered = (offeredPadAtStart?.choices?.length ? offeredPadAtStart.choices : resolveOfferedChoices(state));
  const fatePick =
    meta.playerInputOverride?.trim()
      ? meta.playerInputOverride.trim()
      : meta.mode === 'first-pad'
        ? offered[0] ?? 'Look around'
        : applyRememberedThreatPick(
            state,
            offered,
            applyAutoPlayerStallRules(state, offered, pickGoalOrientedChoice(offered, state, meta.aiAgentMode, rng)).pick
          ).pick;
  let playerInput = fatePick;
  let repairNote: string | undefined;
  const mediated = mediatePlayerInput(playerInput);
  if (mediated.action === 'block') {
    playerInput = 'Look around';
    repairNote = 'input_blocked→Look around';
  } else {
    playerInput = mediated.text;
  }
  const displayLine = playerInput;
  const lastGm = [...state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
  const hard = validateActionHard(playerInput, state, lastGm);
  if (!hard.valid) {
    playerInput = hard.rewritten || 'Look around';
    repairNote = (repairNote ? `${repairNote}; ` : '') + `hard_gate→${playerInput}`;
  }
  // A chip no longer on the pad is not the action the writer is told. The engine still runs the
  // resolved line; the packet's PLAYER line is the grounded action (gm-facing would put the chip back).
  const onPad = offered.some((c) => c.trim().toLowerCase() === playerInput.trim().toLowerCase());
  let writerAction = playerInput;
  if (!onPad && (parsePlayerIntent(playerInput, state).kind === 'attack' || parsePlayerIntent(playerInput, state).kind === 'search' || parsePlayerIntent(playerInput, state).kind === 'use_item')) {
    const grounded = groundPlayerAction(playerInput, state);
    if (grounded.rewritten && grounded.text && grounded.text !== playerInput) {
      writerAction = grounded.text;
      repairNote = (repairNote ? `${repairNote}; ` : '') + 'stale_chip';
    }
  }
  // 17g — page 1 / unlocked-name covers stitch. After sceneWritten + locked name, writer owns
  // hall / Look / Wait / inspect. First already-told who/want/refuse still stitches.
  if (shouldStitchOpeningContinue(state, playerInput)) {
    const next = await headlessOpeningContinueTurn(state, playerInput);
    const ended = Date.now();
    return {
      state: next.state,
      telemetry: {
        turn: next.state.turn,
        startedAt,
        endedAt: new Date(ended).toISOString(),
        durationMs: ended - started,
        bibleId: meta.bibleId,
        engineMode: state.engineMode,
        personalityId: meta.personalityId,
        seed: meta.seed,
        fatePick,
        offeredChoices: next.offeredChoices,
        offeredChoiceIds: next.offeredChoices.map((_, i) => `choice-${next.state.turn}-${i}`),
        playerInput,
        gmText: next.gmText,
        systemLog: [],
        questUnlocks: [],
        itemsEquipped: [],
        itemsUsed: [],
        loopFlags: { officialCount: 0, atmosphereRepeat: false, strangerCount: 0 },
        transportRetries: 0,
        repairNote: (repairNote ? `${repairNote}; ` : '') + 'hall_talk_stitch',
        responsePath: classifyResponsePath({
          state,
          playerInput,
          subscriptionTier: settings.subscriptionTier,
        }),
      },
    };
  }
  if (state.openingEstablishment && !meta.dryRun) {
    const stepped = await applyOpeningAnswer(state, playerInput);
    state = { ...stepped.state, pendingGeneratedOpening: false };
  }
  const govInputState = processMetaInput(state, playerInput).state;
  let arcState = withHouseRules(govInputState, settings);
  const gate = playerInputGateBlock(arcState, playerInput);
  arcState = gate.state;
  // q76b — dry-run / stress: travel + stub writer only (no ArcDirector / dungeon / writer prep).
  if (meta.dryRun) {
    let arcStatusReceipts: string[] = [];
    const dyingTurn = isDying(govInputState);
    const hereBeforeMove = arcState.currentLocation ?? '';
    const graphMoved = dyingTurn ? arcState : applyGraphExitTravel(arcState, playerInput);
    const travelCommit = dyingTurn || graphMoved !== arcState ? null : commitTravel(arcState, playerInput);
    arcState = travelCommit?.state ?? graphMoved;
    if (travelCommit?.receipt) arcStatusReceipts = [...arcStatusReceipts, travelCommit.receipt, ...(travelCommit.extra ?? [])];
    arcState = syncSheetToMovedHere(arcState, state.currentLocation);
    if (!dyingTurn) arcState = maybeEnterInteriorDungeon(arcState, playerInput);
    if (arcState.currentLocation && arcState.currentLocation !== hereBeforeMove) {
      arcState = applyPresentTrimOnTravel(arcState, hereBeforeMove, arcState.currentLocation);
      arcState = ensurePlaceOnMap(arcState, arcState.currentLocation, hereBeforeMove);
    }
    const here = (arcState.currentLocation ?? 'here').trim() || 'here';
    const who = peopleHere(arcState)[0];
    const act = String(displayLine ?? '').trim() || 'Look around';
    const stubGm = who
      ? `At ${here}, you ${act}. The scene held. ${who} answered from where they stood.`
      : `At ${here}, you ${act}. The scene held.`;
    const playerEntry: LogEntry = { id: uid(), turn: state.turn, role: 'player', content: displayLine, timestamp: Date.now() };
    const gmBase: LogEntry = {
      id: uid(), turn: state.turn + 1, role: 'gm', content: stubGm, timestamp: Date.now(),
      systemLog: ['Dry run — stub writer, no GM call', ...arcStatusReceipts].slice(0, 12),
    };
    const prevLog = arcState.log ?? state.log;
    // Stress speed: reuse this turn's offered pad (full compiler is the live/non-dry path).
    const nextChoices = offered.length ? offered : ['Look around', 'Wait', 'Check what you carry'];
    const midBase: GameState = { ...arcState, turn: state.turn + 1, log: [...prevLog, playerEntry, gmBase] };
    const gm: LogEntry = { ...gmBase, offeredChoices: nextChoices };
    const next: GameState = {
      ...midBase,
      log: [...prevLog, playerEntry, gm],
      choices: nextChoices,
      offeredPad: state.offeredPad
        ? { ...state.offeredPad, turn: midBase.turn, choices: nextChoices }
        : { turn: midBase.turn, choices: nextChoices },
    };
    const ended = Date.now();
    const choiceIds: string[] = [];
    for (let i = 0; i < offered.length; i++) choiceIds.push(`choice-${next.turn}-${i}`);
    return {
      state: next,
      telemetry: {
        turn: next.turn, startedAt, endedAt: new Date(ended).toISOString(), durationMs: ended - started,
        bibleId: meta.bibleId, engineMode: state.engineMode, personalityId: meta.personalityId, seed: meta.seed,
        fatePick, offeredChoices: offered, offeredChoiceIds: choiceIds, playerInput, gmText: stubGm,
        systemLog: gm.systemLog ?? [], questUnlocks: [], itemsEquipped: [], itemsUsed: [],
        loopFlags: { officialCount: 0, atmosphereRepeat: false, strangerCount: 0 },
        transportRetries: 0, repairNote, dryRun: true,
        responsePath: classifyResponsePath({ state, playerInput, subscriptionTier: settings.subscriptionTier }),
      },
    };
  }
  let arcBlock = '';
  let arcStatusReceipts: string[] = [];
  let arcResult: ArcDirectorResult | undefined;
  let sealedManifestBlock = '';
  if (arcState.openingEstablishment?.complete) {
    const arc = runArcDirectorBeforeGm(arcState, playerInput);
    arcResult = arc;
    arcState = arc.state;
    arcBlock = formatArcDirectorMandateBlock(arc);
    arcStatusReceipts = formatArcStatusReceipts(arc);
    const manifest = buildSealedManifest(arcState, playerInput, arc);
    arcState = attachSealedManifest(arcState, manifest);
    sealedManifestBlock = formatSealedManifestBlock(manifest);
    // OPT-2 — fill open-quest floor from the record before the writer.
    {
      const floor = ensureQuestFloor(arcState);
      arcState = floor.state;
      if (floor.notes.length) arcStatusReceipts = [...arcStatusReceipts, ...floor.notes];
    }
    // TT-T1 — open-thread list + bring at least one forward into this scene.
    arcState = planSceneThreads(arcState);
  }
  // 08c Tag & Trigger — consume claim pad before packet/writer.
  {
    const claimed = consumeTagTriggerOnInput(arcState, playerInput);
    if (claimed.receipt) {
      arcState = claimed.state;
      arcStatusReceipts = [...arcStatusReceipts, claimed.receipt];
    }
  }
  const offerTurn = applyOpeningOfferChoice(arcState, playerInput);
  arcState = offerTurn.state;
  arcStatusReceipts = [...arcStatusReceipts, ...offerTurn.receipts];
  const arcXp = (arcResult?.xpAwards ?? []).reduce((n, a) => n + (a.amount ?? 0), 0);
  const dyingTurn = isDying(govInputState);
  const hereBeforeMove = arcState.currentLocation ?? '';
  const graphMoved = dyingTurn ? arcState : applyGraphExitTravel(arcState, playerInput);
  const travelCommit = dyingTurn || graphMoved !== arcState ? null : commitTravel(arcState, playerInput);
  arcState = travelCommit?.state ?? graphMoved;
  if (travelCommit?.receipt) arcStatusReceipts = [...arcStatusReceipts, travelCommit.receipt, ...(travelCommit.extra ?? [])];
  arcState = syncSheetToMovedHere(arcState, state.currentLocation);
  // 28g — harness parity with useGame: 'Enter …' at a dungeon site opens the interior dungeon.
  if (!dyingTurn) arcState = maybeEnterInteriorDungeon(arcState, playerInput);
  // 28i — dungeon card turn: room facts, room actions (move/search/open), foes, loot, dungeon XP.
  const dungeonTurn = dyingTurn
    ? { state: arcState, receipts: [] as string[] }
    : advanceDungeonCard(arcState, playerInput, arcResult?.systemReceipts ?? []);
  arcState = dungeonTurn.state;
  arcStatusReceipts = [...arcStatusReceipts, ...dungeonTurn.receipts];
  const storyTurn = dyingTurn
    ? { state: arcState, receipts: [] as string[] }
    : applyStoryRpgTurn(arcState, playerInput, { romance: romanceAllowed(settings) });
  arcState = storyTurn.state;
  arcStatusReceipts = [...arcStatusReceipts, ...storyTurn.receipts];
  const tabletopTurn = dyingTurn
    ? { state: arcState, receipts: [] as string[] }
    : applyTabletopQuestTurn(arcState, playerInput, state.currentLocation ?? '');
  arcState = tabletopTurn.state;
  arcStatusReceipts = [...arcStatusReceipts, ...tabletopTurn.receipts];
  // TT-H1: Inspiration reroll chip (CheckResultRecord die).
  const inspirationTurn = resolveInspirationReroll(arcState, playerInput);
  if (inspirationTurn) {
    arcState = inspirationTurn.state;
    arcStatusReceipts = [...arcStatusReceipts, ...inspirationTurn.receipts];
  }
  // OPT-6: headless resolves shop chips through the same resolveShopChip as live play.
  const shopTurn = dyingTurn ? null : resolveShopChip(arcState, playerInput);
  if (shopTurn) {
    arcState = shopTurn.state;
    arcStatusReceipts = [...arcStatusReceipts, ...shopTurn.receipts];
  }
  // 28j — anti-circling: record this turn, then a nudge from engine facts after 3 turns with no progress.
  arcState = recordCirclingTurn(arcState, playerInput, [...(arcResult?.systemReceipts ?? []), ...arcStatusReceipts], state);
  const nudge = nudgeIfStuck(arcState);
  arcState = nudge.state;
  const circlingRecorded = arcState;
  arcStatusReceipts = [...arcStatusReceipts, ...nudge.receipts];
  for (const n of nudge.notes) console.info(`[anti-circling] ${n}`);
  if (arcState.currentLocation && arcState.currentLocation !== hereBeforeMove) {
    arcState = applyPresentTrimOnTravel(arcState, hereBeforeMove, arcState.currentLocation);
    // q50-MAP2 — arrival at a place with no record (or seed stub without exits).
    arcState = ensurePlaceOnMap(arcState, arcState.currentLocation, hereBeforeMove);
  }
  // 28g — the engine's resolved result for this action is a required fact for the writer and the warden.
  const engineFact = engineResultFact([
    ...(arcResult?.systemReceipts ?? []),
    ...(arcResult?.fightFacts ? [arcResult.fightFacts] : []),
    ...offerTurn.receipts,
    ...dungeonTurn.receipts,
    ...storyTurn.receipts,
    ...(tabletopTurn.facts ?? []),
    ...(shopTurn?.facts ?? []),
    ...nudge.receipts,
    ...(travelCommit ? travelEngineLines(travelCommit) : []),
  ], arcState.engineMode);
  const preparedEvent = prepareWriterInputWithTownsfolk(arcState, writerAction, {
    xp: arcXp,
    engineResult: engineFact,
    travel: travelOutcome(travelCommit, hereBeforeMove, arcState),
    reader: readerFlags(settings),
  });
  arcState = preparedEvent.state;
  const useMud = shouldUseSilentMudTurn({
    subscriptionTier: settings.subscriptionTier,
    openingComplete: arcState.openingEstablishment?.complete === true,
    playerInput,
  });
  let mudTurn: FreeMudTurn | null = null;
  const intent = parsePlayerIntent(playerInput, state);
  const turnMandate = buildTurnMandate(playerInput, intent, state, playerInput);
  const deterministicBlock = `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${state.character.name} (Lvl ${state.character.level})
HP: ${state.character.hp}/${state.character.maxHp}
Location: ${state.currentLocation}
OUTCOME FOR THIS ACTION: Narrate consequences of the player action. Story first.
Do NOT print dice notation or CODE ENFORCED.
-------------------------------------------------
`;
  const silentMud = useMud && shouldSkipMicroFlavor();
  const payload = useMud
    ? (silentMud ? '' : formatMicroFlavorPrompt(preparedEvent.packet))
    : formatTalkWriterFacing(preparedEvent.packet, arcState, { perspective: settings.perspective });
  // 08d Silent Engine — receipts only; never call DeepSeek for micro-flavor.
  const authoredBook = isAuthoredPyoaBook(arcState.campaignBibleId);
  const authoredBeat = authoredBook
    ? (authoredPageText(arcState) || authoredStartPage()).trim()
    : '';
  const gmResult = authoredBook
    ? { text: authoredBeat, systemLog: [] as string[], transportRetries: 0 }
    : silentMud
      ? { text: '', systemLog: [] as string[], transportRetries: 0 }
      : await callGmWithRetries(arcState, payload, settings);
  let error: string | undefined;
  let gmText = gmResult.text;
  // q50-MAP2 — structured newPlaces only (never prose). Validate + register before accept.
  arcState = applyWriterNewPlaces(arcState, newPlacesFromWriterPayload(gmResult.text));
  let gmSystemLog = gmResult.systemLog ?? [];
  let transportRetries = gmResult.transportRetries;
  let renderFallbackUsed = false;
  const writerRawHead = gmText.replace(/\s+/g, ' ').trim().slice(0, 600) || undefined;
  const tokenVerdicts = arcState.completedEvent && gmText.trim()
    ? tokenLineVerdicts(gmText, arcState, arcState.completedEvent)
    : undefined;
  // 29z8 — one writer pass: the first draft is the beat; code checks are logged, never re-asked.
  let writerTurn: WriterTurnRetryResult | null = null;
  const stageTrace: { stage: string; text: string }[] = [];
  const traceStage = (stage: string, text: string) => {
    if (stageTrace[stageTrace.length - 1]?.text !== text) stageTrace.push({ stage, text });
  };
  const writerPacket = arcState.completedEvent ?? preparedEvent.packet;
  if (!useMud && !authoredBook && writerPacket) {
    writerTurn = await runWriterTurnWithFightRetry({
      firstRaw: gmResult.text,
      packet: writerPacket,
      check: { state: arcState, playerInput, intent, engineFact, previousGm: '' },
      rewrite: async (problem) => {
        const again = await callGmWithRetries(arcState, `${payload}\n\n${problem}`, settings);
        transportRetries += again.transportRetries;
        return again.text;
      },
      repair: async (request) => {
        const started = Date.now();
        writerCallMeter.calls += 1;
        try {
          return await callGmRepair(arcState, request, settings);
        } finally {
          writerCallMeter.ms += Date.now() - started;
        }
      },
    });
    for (const r of writerTurn.repairs ?? []) {
      if (r.bug) console.warn(`[writer] sentence repair bug — ${r.bug}: "${r.sentence.slice(0, 120)}"`);
    }
    if (writerTurn.answerRepair?.bug) console.warn(`[writer] answer repair bug — ${writerTurn.answerRepair.bug}`);
    if (writerTurn.fightRetry) console.info(`[writer] settled fight left out — ${writerTurn.fightRetry}`);
    if (writerTurn.draftRetry) console.info(`[writer] blocking draft — ${writerTurn.draftRetry}`);
    traceStage('render', writerTurn.firstDraft);
    if (writerTurn.fightDraft) traceStage(writerTurn.draftRetry ? 'draft-rewrite' : 'fight-rewrite', writerTurn.fightDraft);
    traceStage('finishCommittedProse+spoken', writerTurn.prose);
    gmText = writerTurn.prose;
    if (writerTurn.combatLog) gmSystemLog = [...gmSystemLog, writerTurn.combatLog];
    if ((writerTurn.path === 'json' || writerTurn.path === 'json-partial') && writerTurn.refs?.length && arcState.completedEvent) {
      arcState = {
        ...arcState,
        completedEvent: { ...arcState.completedEvent, tokenRefs: writerTurn.refs },
      };
    }
  }
  if (useMud) {
    // Free MUD: receipt is primary; Silent Engine never invents a flavor quote.
    mudTurn = composeFreeMudTurn(preparedEvent.packet, {
      arcReceipts: arcStatusReceipts,
      flavorRaw: silentMud ? '' : gmResult.text,
      gold: arcState.gold,
      silent: silentMud,
    });
    arcState = applyCombatClearTag(arcState, preparedEvent.packet);
    gmText = mudTurn.content.trim() || mudDisplayBody(mudTurn);
    gmSystemLog = [...mudTurn.receiptLines];
    if (!silentMud && (gmResult.failKind === 'auth' || gmResult.dnsFailure)) {
      error = `GM empty/fail (${gmResult.dnsFailure ? 'network_dns' : gmResult.failKind ?? 'empty'})`;
    }
    arcState = clearEngineRecoveryStreak(arcState);
  } else if (!gmText.trim()) {
    // Outage only (every writer call came back empty): the spoken card line keeps the turn alive.
    const spoken = outageSpokenLine(arcState, preparedEvent.packet?.verb, playerInput);
    if (spoken) {
      gmText = spoken;
      renderFallbackUsed = true;
    }
  }
  {
    const lastGmRow = [...(arcState.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
    if (!useMud && !gmText.trim()) {
      const painted = bookBodyAfterWriterMiss(arcState, preparedEvent.packet, playerInput, gmText);
      if (painted.prose && !isDroughtStubProse(painted.prose) && !isLastGmReprint(painted.prose, lastGmRow)) {
        gmText = painted.prose;
        if (painted.status) gmSystemLog = [...gmSystemLog, painted.status];
        renderFallbackUsed = true;
      }
    }
  }
  if (!useMud && !gmText.trim()) {
    const failLabel = gmResult.dnsFailure
      ? 'network_dns'
      : gmResult.failKind === 'rate_limit'
        ? 'rate_limit'
        : gmResult.failKind
          ? gmResult.failKind
          : 'empty';
    error = `GM empty/fail (${failLabel})`;
    // 31i — never commit banned HUD stubs; one diegetic stitch max, then FAIL empty
    const sealed = arcState.sealedManifest ?? buildSealedManifest(arcState, playerInput, arcResult);
    if (consecutiveRecoveryExceeded(arcState) || !canUseFallback(sealed)) {
      gmText = '';
      gmSystemLog = [
        ...gmSystemLog,
        'Turn FAIL — refused second engine recovery / exhausted transport (ledger unchanged)',
      ];
      renderFallbackUsed = false;
    } else {
      const reason: RenderFallbackReason =
        gmResult.failKind === 'timeout'
          ? 'timeout'
          : gmResult.failKind
            ? 'fail'
            : 'empty';
      try {
        const fallback = applyRenderFallback(sealed, arcState, reason);
        gmText = fallback.prose;
        if (isBannedFallbackStub(gmText)) {
          gmText = '';
          gmSystemLog = [...gmSystemLog, ...fallback.systemLog, 'Turn FAIL — banned stub blocked'];
        } else {
          gmSystemLog = [...gmSystemLog, ...fallback.systemLog];
          arcState = markEngineRecoveryCommit(attachSealedManifest(arcState, fallback.manifestUpdated));
          renderFallbackUsed = true;
        }
      } catch {
        gmText = '';
        gmSystemLog = [...gmSystemLog, 'Turn FAIL — manifest fallback exhausted'];
      }
    }
  } else {
    arcState = clearEngineRecoveryStreak(arcState);
  }
  // Hard FAIL — do not invent story; keep prior world, stamp telemetry
  // 08c Free MUD: receipt-only turns are valid — never hard-fail on empty flavor.
  if (!useMud && !gmText.trim() && error) {
    const ended = Date.now();
    const failTurn = state.turn + 1;
    return {
      state: {
        ...arcState,
        turn: failTurn,
        log: [
          ...(arcState.log ?? state.log ?? []),
          {
            id: `fail-${failTurn}-${ended}`,
            role: 'system' as const,
            content: error,
            timestamp: ended,
          },
        ],
      },
      telemetry: {
        turn: failTurn,
        startedAt,
        endedAt: new Date(ended).toISOString(),
        durationMs: ended - started,
        bibleId: meta.bibleId,
        engineMode: state.engineMode,
        personalityId: meta.personalityId,
        seed: meta.seed,
        fatePick,
        offeredChoices: offered,
        offeredChoiceIds: offered.map((_, i) => `choice-${failTurn}-${i}`),
        playerInput,
        gmText: '',
        systemLog: gmSystemLog,
        questUnlocks: [],
        itemsEquipped: [],
        itemsUsed: [],
        loopFlags: { officialCount: 0, atmosphereRepeat: false, strangerCount: 0 },
        error,
        failKind: gmResult.dnsFailure
          ? 'network_dns'
          : gmResult.failKind ?? 'empty',
        transportRetries,
        dnsFailure: gmResult.dnsFailure === true,
        renderFallbackUsed: false,
        responsePath: classifyResponsePath({
          state: arcState,
          playerInput,
          subscriptionTier: settings.subscriptionTier,
        }),
      },
    };
  }
  const askedRepeat = playerAsksRepeat(playerInput);
  let usedPacketStitch = false;
  const tokenPath: string | undefined = writerTurn?.path;
  const retryTokenVerdicts: string[] | undefined = undefined;
  let rejectedWriterText: string | undefined;
  let rejectedReason: string | undefined;
  if (writerTurn?.repairs?.length) {
    rejectedWriterText = writerTurn.repairs.map((r) => r.sentence).join(' ').replace(/\s+/g, ' ').trim().slice(0, 300) || undefined;
    rejectedReason = [...new Set(writerTurn.repairs.map((r) => r.flag))].join(' | ').slice(0, 300);
  }
  let blockedPaintReason: string | undefined;
  const words = writerWordsGuard(
    !!writerTurn && !renderFallbackUsed && gmText === writerTurn.prose,
    (s, draft) => sentenceRejectedInDraft(arcState, s, draft, playerInput)
  );
  const rawEvents = parseActionTags(gmText);
  const warden = await runWarden(arcState, rawEvents, gmText, playerInput, intent, lastGm, engineFact);
  // OPT-2 — writer quest-add binds to a generated quest or is dropped (`unbound quest`).
  const questAddGate = applyQuestAddProposals(warden.events, arcState);
  arcState = questAddGate.state;
  if (questAddGate.notes.length) arcStatusReceipts = [...arcStatusReceipts, ...questAddGate.notes];
  const events = questAddGate.events;
  const narrativeSource = useMud ? gmText : words.step('runWarden', gmText, warden.scrubbedNarrative ?? gmText);
  traceStage('runWarden', narrativeSource);
  const structural = applyStructuralEvents(arcState, events, {
    strictEncumbrance: carryLimitOn(arcState, settings),
    playerInput,
  });
  let working = structural.state;
  let cleanText = words.step(
    'stripTags+choiceList',
    narrativeSource,
    stripResidualMechanicTags(stripChoiceList(stripActionTags(narrativeSource)))
  );
  traceStage('stripTags+choiceList', cleanText);
  cleanText = postFilterGmOutput(cleanText, settings, {
    nsfw: isNsfwCampaign(getCampaignBibleById(meta.bibleId)),
  });
  traceStage('postFilterGmOutput', cleanText);
  cleanText = words.step('ensureTurnProse', cleanText, ensureTurnProse(cleanText, playerInput));
  traceStage('ensureTurnProse', cleanText);
  cleanText = words.step('applyFactLocks', cleanText, applyFactLocks(state, cleanText, playerInput));
  traceStage('applyFactLocks', cleanText);
  cleanText = words.step('enforcePerspective', cleanText, enforcePerspective(cleanText, settings, state.character.name));
  traceStage('enforcePerspective', cleanText);
  if (arcResult?.beatCommitted) {
    validateProseAgainstBeat(
      beatCommitFromReceipts({
        type: arcResult.systemReceipts.some((r) => /^Encounter:/i.test(r))
          ? 'combat'
          : 'quest_stage',
        receipts: arcResult.systemReceipts,
        xpAwards: arcResult.xpAwards,
      }),
      cleanText
    );
  }
  cleanText = words.step('applyProseWarden', cleanText, applyProseWarden(cleanText, {
    currentLocation: working.currentLocation ?? state.currentLocation,
    priorLocation: state.previousSceneFacts?.location ?? state.currentLocation,
    aloneArrival: isAloneArrivalOpening(working) || isAloneArrivalOpening(state),
    crowdSize: crowdSizeForWarden(working, cleanText),
    crowdPresent:
      working.sceneFacts?.crowd === 'present' ||
      working.sceneFacts?.crowd === 'sparse' ||
      crowdSizeForWarden(working, cleanText) > 0,
    fleeFailed: working.activeEncounter?.caught === true,
    inventory: working.inventory ?? state.inventory,
    sceneProps: collectSceneObjectNames(working),
    searchedEmpty: listEmptySearchTargets(working.sceneFacts ?? state.sceneFacts),
    playerInput,
    groundedWeapons: groundedWeaponNames(working),
    playerName: working.character?.name ?? state.character?.name,
    knownPlaces: [
      ...(working.places ?? state.places ?? []).map((p) => p.name).filter(Boolean),
      state.currentLocation,
      working.previousLocationSheet?.name,
    ].filter((n): n is string => !!n && n.trim().length > 2),
    hasLiveEncounter: !!(working.activeEncounter ?? state.activeEncounter),
    recentlyClearedEncounter:
      (working.arcDirector?.lastEncounterClearedTurn ??
        state.arcDirector?.lastEncounterClearedTurn) === working.turn ||
      (working.arcDirector?.lastEncounterClearedTurn ??
        state.arcDirector?.lastEncounterClearedTurn) ===
        working.turn - 1,
    presentNames: [
      ...(working.sceneFacts?.present ?? []),
      ...(state.sceneFacts?.present ?? []),
      ...((working.companions ?? state.companions ?? []).map((c) => c.name)),
      ...((working.npcMemories ?? state.npcMemories ?? []).map((n) => n.npcName)),
    ].filter((n) => n && !isChromePersonToken(n)),
    namedCast: openingCastNames(working),
    ledgerState: working,
    isThisTurnsEvent: thisTurnsEventCheck({ state: working, playerInput }),
    lastKill: working.sceneFacts?.lastKill ?? state.sceneFacts?.lastKill,
    currentTurn: state.turn,
    hookLock: hookLockForWarden(working, cleanText),
    npcMemories: working.npcMemories ?? state.npcMemories,
  }));
  traceStage('applyProseWarden', cleanText);
  {
    const prefaced = ensureEncounterSpawnPreface(working, cleanText);
    cleanText = words.step('ensureEncounterSpawnPreface', cleanText, prefaced.prose);
    traceStage('ensureEncounterSpawnPreface', cleanText);
    working = prefaced.state;
    arcStatusReceipts = [...arcStatusReceipts, ...prefaced.receipts];
  }
  let blockedPaint = isBlockedPaint(warden.notes, state, cleanText);
  {
    const settled = settleParleyAfterProse(working, cleanText, playerInput);
    working = settled.state;
    if (settled.xpAward && settled.xpAward.amount > 0 && !blockedPaint) {
      const leveled = applyCharacterXpGain(working.character, settled.xpAward.amount);
      working = {
        ...working,
        character: leveled.character,
        systemLog: [
          ...(working.systemLog ?? []),
          ...settled.receipts,
          `XP Gained: ${settled.xpAward.amount} (${settled.xpAward.reason})`,
        ],
      };
    } else if (settled.receipts.length) {
      working = {
        ...working,
        systemLog: [...(working.systemLog ?? []), ...settled.receipts],
      };
    }
  }
  cleanText = words.step('scrubOfficialPlaceholder', cleanText, scrubOfficialPlaceholder(cleanText, working));
  traceStage('scrubOfficialPlaceholder', cleanText);
  cleanText = words.step('scrubInventedGeography', cleanText, scrubInventedGeography(cleanText, working));
  traceStage('scrubInventedGeography', cleanText);
  const harvested = harvestNarrativePeople(working, cleanText, state.turn + 1, {
    refs: writerTurn && (writerTurn.path === 'json' || writerTurn.path === 'json-partial') ? writerTurn.refs : undefined,
    refEnum: writerPacket?.refEnum,
  });
  working = harvested.state;
  working = {
    ...working,
    sceneFacts: applyCommittedNarrative(working, cleanText, state.turn + 1),
  };
  working = maybeRevealFromLocation(working, working.currentLocation);
  working = maybeAutoCloseDungeon(working);
  const leak = scanAndScrubLeaks(cleanText);
  if (leak.notes.length) cleanText = words.step('scanAndScrubLeaks', cleanText, leak.clean);
  traceStage('scanAndScrubLeaks', cleanText);
  {
    const govProse = applyGovernanceToProse(working, cleanText, playerInput);
    cleanText = words.step('applyGovernanceToProse', cleanText, govProse.prose);
    traceStage('applyGovernanceToProse', cleanText);
    if (govProse.notes.length) warden.notes.push(...notesForCommittedBody(govProse.notes, cleanText === govProse.prose));
  }
  // 28l — a flagged beat stays the writer's prose (the one revision already ran); the flag only withholds XP.
  if (blockedPaint || isBlockedPaint(warden.notes, state, cleanText)) {
    blockedPaintReason = warden.notes.find((n) => /Narrative does not resolve|Collage reject|Commit gate/i.test(n)) ?? 'blocked paint';
    if (!cleanText.trim()) {
      cleanText = ledgerActionStitch(working, playerInput);
      usedPacketStitch = true;
      traceStage('ledgerActionStitch', cleanText);
    }
    blockedPaint = true;
  }
  const updates = extractUpdates(working, narrativeSource);
  if (updates.character) {
    const { xp: _x, xpToNext: _n, level: _l, hp: _h, maxHp: _mh, ...safeChar } = updates.character as Record<string, unknown>;
    void _x; void _n; void _l; void _h; void _mh;
    working = {
      ...working,
      character: { ...working.character, ...safeChar } as typeof working.character,
    };
  }
  if (updates.currentLocation) {
    working = {
      ...working,
      currentLocation: resolveNextLocation(working, { proposed: updates.currentLocation }),
    };
  }
  // 29u — travel committed HERE before the writer (ground between, or the arrival); prose never moves it.
  const fromLoc = state.currentLocation;
  if (travelCommit?.handled && travelCommit.state.currentLocation) {
    const here = resolveNextLocation(working, {
      travelCommit,
      proposed: travelCommit.state.currentLocation,
    });
    const hereBefore = working.currentLocation ?? fromLoc ?? '';
    working = {
      ...working,
      currentLocation: here,
      journey: travelCommit.state.journey ?? null,
      worldHour: travelCommit.state.worldHour,
      worldDay: travelCommit.state.worldDay,
      roadDay: travelCommit.state.roadDay,
      lastLongRestAt: travelCommit.state.lastLongRestAt,
      daysWithoutFood: travelCommit.state.daysWithoutFood,
      sceneFacts: pinClockTimeOfDay(working.sceneFacts, travelCommit.state),
      places: travelCommit.arrived
        ? touchPlaceVisit(working.places ?? state.places ?? [], here, state.turn + 1, working)
        : working.places,
    };
    if (hereBefore !== here) working = applyPresentTrimOnTravel(working, hereBefore, here);
    working = syncSheetToMovedHere(working, fromLoc);
  }
  working = enforceCameraOnState(working, playerInput);
  cleanText = words.step('enforceCameraOnProse', cleanText, enforceCameraOnProse(cleanText, working, playerInput, fromLoc));
  traceStage('enforceCameraOnProse', cleanText);
  cleanText = words.step('scrubOneCameraFight', cleanText, scrubOneCameraFight(cleanText, working, playerInput));
  traceStage('scrubOneCameraFight', cleanText);
  // 02g — prepend can land after the warden; strip mill / already-here arrivals once more.
  cleanText = words.step(
    'scrubFalseArrivalWhenHere',
    cleanText,
    scrubFalseArrivalWhenHere(cleanText, working.currentLocation, [], false, fromLoc)
  );
  traceStage('scrubFalseArrivalWhenHere', cleanText);
  if (words.notes.length) warden.notes.push(...words.notes);
  const pipeline = authoredBook
    ? {
        choices: spineChoiceLabels(ensurePyoaSpine(working)),
        regenerated: false,
        rejectedCount: 0,
      }
    : await resolvePipelineChoices({
        gmText: narrativeSource,
        state: working,
        loreCards: [],
        settings,
        lastPlayerAction: playerInput,
      });
  const storyProse = normalizeStoryCorpus(cleanText);
  let finalChoices = authoredBook
    ? pipeline.choices
    : padChoicesToCount(
        pipeline.choices.length ? pipeline.choices : [],
        working,
        storyProse,
        3,
        playerInput
      );
  if (!authoredBook) {
    const govChoices = filterGovernanceChoices(working, finalChoices, playerInput);
    finalChoices = govChoices.choices;
    if (govChoices.notes.length) warden.notes.push(...govChoices.notes);
  } else {
    const book = authoredPageText(working) || authoredBeat;
    if (book) cleanText = book;
    finalChoices = spineChoiceLabels(ensurePyoaSpine(working));
  }
  const nextTurn = state.turn + 1;
  const questsBefore = [...(state.quests ?? [])];
  let updatedQuests = preserveArcQuestProgress(
    arcState.quests,
    syncQuestsFromPlay(
      eventsToQuestUpdates(events, working.quests ?? [], nextTurn),
      gmSystemLog,
      `${playerInput}\n${cleanText}\n${working.currentLocation ?? ''}\n${(working.sceneFacts?.present ?? []).join(' ')}`,
      { locked: questsLockedDuringOpening(state) }
    )
  );
  {
    const heard = commitTalkStageAfterTurn(
      { ...working, quests: updatedQuests, arcDirector: arcState.arcDirector, runManifest: arcState.runManifest },
      writerTurn?.speech,
      nextTurn,
      playerInput
    );
    if (heard.receipts.length) {
      updatedQuests = heard.state.quests ?? updatedQuests;
      arcState = { ...arcState, arcDirector: heard.state.arcDirector, runManifest: heard.state.runManifest };
      working = { ...working, stateTxLog: heard.state.stateTxLog };
      arcStatusReceipts = [...arcStatusReceipts, ...heard.receipts];
    }
  }
  // 29e — hub linkedQuestIds reveal on travel / location change (parity with useGame)
  {
    const traveled = travelCommit?.arrived === true;
    const justArrived =
      !!working.currentLocation &&
      !!state.currentLocation &&
      working.currentLocation !== state.currentLocation;
    if (traveled || justArrived) {
      working = applyPresentTrimOnTravel(
        working,
        state.currentLocation ?? '',
        working.currentLocation ?? ''
      );
      const arrival = resolveHubArrival(
        {
          ...working,
          places: working.places ?? state.places,
          sandboxAwardKeys: working.sandboxAwardKeys ?? state.sandboxAwardKeys,
        },
        working.currentLocation
      );
      if (arrival) {
        const keys = [...(working.sandboxAwardKeys ?? state.sandboxAwardKeys ?? [])];
        const visitIdx = keys.filter((k) => k.startsWith('hub-beat:' + arrival.hub.id + ':')).length;
        const beatKey = hubBeatAwardKey(arrival.hub.id, 'v' + String(visitIdx), nextTurn);
        if (!keys.includes(beatKey)) {
          keys.push(beatKey);
          const linkIds = [
            ...(arrival.hub.linkedQuestIds ?? []),
            ...(arrival.beat.revealQuestId ? [arrival.beat.revealQuestId] : []),
          ];
          updatedQuests = revealQuestsFromHubLinks(
            updatedQuests,
            linkIds,
            arrival.hub.name
          );
          updatedQuests = applyBiomeSaneQuestSites(working, updatedQuests);
          let sceneFacts = working.sceneFacts;
          if (/^(social|vendor)$/i.test(arrival.beat.kind) && sceneFacts) {
            const openVignette = openVignetteFromHubBeat({
              hubId: arrival.hub.id,
              hubName: arrival.hub.name,
              beatId: arrival.beat.id,
              kind: arrival.beat.kind,
              contactName: hubBeatContactIfPresent(
                [...(sceneFacts.present ?? []), ...presentNpcRecords(working).map((m) => m.npcName)],
                arrival.beat.contactName
              ),
              pressure: arrival.beat.pressure,
              turn: nextTurn,
              prev: sceneFacts.openVignette,
            });
            if (openVignette) sceneFacts = { ...sceneFacts, openVignette };
          }
          sceneFacts =
            clearVignetteOnHubLeave(
              sceneFacts,
              state.currentLocation,
              working.currentLocation,
              (name) => matchHub(hubsForBibleId(meta.bibleId), name)?.id ?? null
            ) ?? sceneFacts;
          working = { ...working, sandboxAwardKeys: keys, sceneFacts };
        }
      }
    }
  }
  updatedQuests = applyBiomeSaneQuestSites(working, updatedQuests);
  // Code-owned sandbox XP (hub discover / NPC meet / landmark / quest) — was missing in headless.
  const sandboxXp = applySandboxXpAwards(
    {
      ...working,
      sandboxAwardKeys: working.sandboxAwardKeys ?? state.sandboxAwardKeys,
      arcDirector: arcState.arcDirector,
    },
    {
      playerAction: playerInput,
      locationName: working.currentLocation,
      previousLocationName: state.currentLocation,
      questsBefore,
      questsAfter: updatedQuests,
      events,
      encounterCleared: !!(state.activeEncounter && !working.activeEncounter),
      endedEncounter: state.activeEncounter ?? null,
      enemyKilled: false,
      turn: nextTurn,
    }
  );
  let character = working.character;
  let levelNotes: string[] = [];
  const sandboxNotes = [...sandboxXp.notes, ...sandboxXp.lootNotes];
  if (sandboxXp.items.length) working = { ...working, inventory: [...(working.inventory ?? []), ...sandboxXp.items] };
  const sandboxKeys = sandboxXp.awardKeys;
  if (sandboxXp.xp > 0) {
    const leveled = applyCharacterXpGain(character, sandboxXp.xp, working.engineMode, working.systemHousing);
    character = leveled.character;
    levelNotes = leveled.notes;
  }
  working = applySocialLedgerTurn({
    state: {
      ...working,
      character,
      places: sandboxXp.places ?? working.places,
      sandboxAwardKeys: sandboxKeys,
      quests: updatedQuests,
    },
    playerAction: playerInput,
    gainedItemNames: [],
    questsBefore,
    questsAfter: updatedQuests,
    turn: nextTurn,
    talkTopics: hallTalkTopics(playerInput),
    gmText: cleanText,
    speechLines: writerTurn?.speech,
    metNames: harvested.people,
  });
  working = {
    ...working,
    character,
    places: sandboxXp.places ?? working.places,
    sandboxAwardKeys: sandboxKeys,
    quests: updatedQuests,
    // 29a — prefer working (may be null after terminal clear); only fall back if working omitted encounter
    activeEncounter:
      'activeEncounter' in working
        ? (working.activeEncounter ?? null)
        : (arcState.activeEncounter ?? null),
    arcDirector: sandboxXp.npcRelationships
      ? { ...arcState.arcDirector, npcRelationships: sandboxXp.npcRelationships }
      : arcState.arcDirector,
    runManifest: arcState.runManifest,
  };
  {
    const xpVoice = xpGainVoiceAside(working, sandboxXp.xp);
    working = xpVoice.state;
    if (xpVoice.line) sandboxNotes.push(xpVoice.line);
  }
  {
    const talkCard = openTalkQuestCard(working, spokenLines(cleanText), nextTurn);
    if (talkCard.card) working = { ...working, places: talkCard.places };
  }
  if (arcState.sceneFacts?.worldTags?.length) {
    working = {
      ...working,
      sceneFacts: {
        crowd: working.sceneFacts?.crowd ?? 'unknown',
        noise: working.sceneFacts?.noise ?? 'unknown',
        present: working.sceneFacts?.present ?? [],
        props: working.sceneFacts?.props ?? [],
        lastBeat: working.sceneFacts?.lastBeat ?? '',
        updatedTurn: nextTurn,
        ...working.sceneFacts,
        worldTags: Array.from(
          new Set([...(working.sceneFacts?.worldTags ?? []), ...arcState.sceneFacts.worldTags])
        ),
      },
    };
  }
  // Track recent choices for live-style dedupe (agent + pipeline).
  const recentChoices = [
    ...(state.recentChoices ?? []),
    { turn: nextTurn, choices: finalChoices },
  ].slice(-10);
  let filteredSystemLog = filterSystemLogForEngine(
    useMud && mudTurn
      ? [...mudTurn.receiptLines, ...arcStatusReceipts, ...sandboxNotes, ...levelNotes]
      : [...gmSystemLog, ...arcStatusReceipts],
    state.engineMode
  );
  if (!useMud) {
    filteredSystemLog = reconcileXpStatusLines(filteredSystemLog, [
      ...arcStatusReceipts,
      ...sandboxNotes,
      ...levelNotes,
    ]);
    if (sandboxXp.lootNotes.length) filteredSystemLog = [...filteredSystemLog, ...filterSystemLogForEngine(sandboxXp.lootNotes, state.engineMode)];
  } else {
    // Dedupe receipt lines while keeping order
    const seen = new Set<string>();
    filteredSystemLog = filteredSystemLog.filter((l) => {
      const k = l.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  const questUnlocks = updatedQuests
    .filter((q) => {
      const before = questsBefore.find((b) => b.id === q.id);
      return q.revealed === true && before?.revealed !== true;
    })
    .map((q) => q.name);
  const mudBody = useMud && mudTurn
    ? mudTurn.content.trim() || mudDisplayBody(mudTurn)
    : cleanText;
  const fp = beatFingerprint(mudBody || filteredSystemLog.join(' '));
  const writerIssues = useMud || authoredBook
    ? []
    : writerTurnIssues(drainWriterRawIssues(), [...warden.notes, ...(writerTurn?.remaining ?? [])]);
  const writerUsage = drainWriterUsage();
  const playerEntry: LogEntry = {
    id: uid(),
    turn: state.turn,
    role: 'player',
    content: displayLine,
    timestamp: Date.now(),
  };
  const gmBase: LogEntry = {
    id: uid(),
    turn: nextTurn,
    role: 'gm',
    content: mudBody,
    timestamp: Date.now(),
    systemLog: filteredSystemLog,
    snapshotGist: compactTrafficGist({ ...working, turn: nextTurn }),
    ...(writerIssues.length ? { writerIssues } : {}),
    ...(warden.notes.length ? { wardenNotes: [...warden.notes] } : {}),
    ...(writerUsage ? { writerUsage } : {}),
    ...(useMud && mudTurn
      ? {
          presentation: 'mud-receipt' as const,
          flavorQuote: mudTurn.flavorQuote || undefined,
        }
      : {}),
  };
  const committedLog = [...state.log, playerEntry, gmBase];
  finalChoices = dropAbsentListenerChips({ ...working, log: committedLog }, finalChoices, mudBody);
  const mid: GameState = {
    ...working,
    turn: nextTurn,
    quests: updatedQuests,
    choices: finalChoices,
    recentChoices,
    recentBeatFingerprints: [...(state.recentBeatFingerprints ?? []), fp].slice(-12),
    log: committedLog,
  };
  const gm = withLitrpgSystemWindow(withOfferedChoices(gmBase, mid), working, playerInput);
  const next: GameState = {
    ...mid,
    log: [...state.log, playerEntry, gm],
    choices: gm.offeredChoices ?? finalChoices,
    lastUpdated: Date.now(),
  };
  let governed = next;
  {
    const govCommit = applyGovernanceCommit(state, next, playerInput);
    governed = { ...next, ...govCommit.patches };
    if (govCommit.xpAward && govCommit.xpAward.amount > 0 && !blockedPaint) {
      const leveled = applyCharacterXpGain(governed.character, govCommit.xpAward.amount);
      governed = { ...governed, character: leveled.character };
    }
  }
  governed = creditCommittedProgress(circlingRecorded, governed, playerInput);
  {
    const granted = grantLevelSkills(governed, state.character?.level ?? 1);
    governed = granted.state;
    if (granted.receipts.length) {
      filteredSystemLog = [...filteredSystemLog, ...granted.receipts];
      const log = [...(governed.log ?? [])];
      const last = log[log.length - 1];
      if (last?.role === 'gm') log[log.length - 1] = { ...last, systemLog: [...(last.systemLog ?? []), ...granted.receipts] };
      governed = { ...governed, log };
    }
  }
  if (typeof governed.character?.hp === 'number') {
    // Same end-of-run rule as live play (useGame): LitRPG/RPG lifeline; tabletop death ends the run.
    const hp = governed.character.hp;
    governed = applyPlayPhaseAfterHp(governed, hp, nextTurn);
    const extra = [...(governed.lifelineReceipts ?? [])];
    governed = { ...governed, lifelineReceipts: undefined };
    const receipt = (governed.character?.hp ?? 0) <= 0 ? deathQuestReceipt(governed) : null;
    if (receipt) extra.push(receipt);
    if (extra.length) {
      for (const line of extra) {
        if (!filteredSystemLog.includes(line)) filteredSystemLog = [...filteredSystemLog, line];
      }
      const log = [...(governed.log ?? [])];
      const last = log[log.length - 1];
      if (last?.role === 'gm') log[log.length - 1] = { ...last, systemLog: [...(last.systemLog ?? []), ...extra] };
      governed = { ...governed, log };
    }
  }
  {
    const record = commitTurnRecord(state, governed, filteredSystemLog, { why: `Player: ${playerInput.slice(0, 120)}` });
    governed = advanceSceneLedger(state, record.state);
    governed = stampSceneLedger(governed, mudBody, handedRefs(governed));
    governed = registerWriterIntroductions(governed, mudBody);
    if (record.lines.length) {
      filteredSystemLog = [...filteredSystemLog, ...record.lines];
      const log = [...(governed.log ?? [])];
      const last = log[log.length - 1];
      if (last?.role === 'gm') log[log.length - 1] = { ...last, systemLog: [...(last.systemLog ?? []), ...record.lines] };
      governed = { ...governed, log };
    }
  }
  // q72: same per-turn timeline collector as useGame (both runtime paths).
  {
    const gainedNames: string[] = [];
    for (const it of governed.inventory ?? []) {
      if (!(state.inventory ?? []).some((x) => x.id === it.id || x.name === it.name)) gainedNames.push(it.name);
    }
    const turnFacts = collectTurnTimelineFacts({
      turn: nextTurn,
      playerAction: playerInput,
      stateBefore: state,
      stateAfter: {
        currentLocation: governed.currentLocation,
        activeEncounter: governed.activeEncounter,
        activeDungeon: governed.activeDungeon,
        character: governed.character,
        quests: governed.quests,
      },
      events: [],
      systemLog: filteredSystemLog,
      newItemNames: gainedNames,
      wardenNotes: warden.notes,
    });
    let timelineState = { ...governed, turn: nextTurn };
    if (governed.currentLocation && governed.currentLocation !== state.currentLocation) {
      timelineState = leavePlaceVisit({ ...timelineState, currentLocation: state.currentLocation });
      timelineState = { ...timelineState, currentLocation: governed.currentLocation };
    }
    timelineState = applyCollectedFacts(timelineState, turnFacts);
    if (writerTurn?.spoken?.status === 'added' && writerTurn.spoken.line && writerTurn.spoken.speaker) {
      const spk = writerTurn.spoken.speaker;
      timelineState = tag(
        timelineState,
        'said',
        'said',
        { id: `person:${spk.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: spk },
        writerTurn.spoken.line.slice(0, 120)
      );
    }
    governed = {
      ...governed,
      timeline: timelineState.timeline,
      entityRecords: timelineState.entityRecords,
      placeVisitLog: timelineState.placeVisitLog,
      places: timelineState.places ?? governed.places,
      npcMemories: timelineState.npcMemories ?? governed.npcMemories,
    };
  }
  // q43-OCD: same shared pad commit as useGame (pad → stamp → replay hash). Writes recentOfferedActions
  // so LitRPG/RPG cooldown and tabletop 08:41 repeat suppression work in fate-autoplay.
  governed = commitOfferedTurn({ ...governed, choices: finalChoices }, gm.id);
  const responsePath = classifyResponsePath({
    state: arcState,
    playerInput,
    subscriptionTier: settings.subscriptionTier,
  });
  const writerOutcome: WriterOutcome | undefined =
    responsePath !== 'E'
      ? undefined
      : renderFallbackUsed || usedPacketStitch
        ? 'fallback'
        : 'accepted';
  const ended = Date.now();
  const receiptCounts = countTurnReceipts(governed, nextTurn);
  const stampedGm = [...(governed.log ?? [])].reverse().find((e) => e?.role === 'gm');
  const offeredChips = offeredChipsAtStart ?? offeredPadAtStart?.chips;
  return {
    state: governed,
    telemetry: {
      turn: nextTurn,
      startedAt,
      endedAt: new Date(ended).toISOString(),
      durationMs: ended - started,
      bibleId: meta.bibleId,
      engineMode: state.engineMode,
      personalityId: meta.personalityId,
      seed: meta.seed,
      fatePick,
      offeredChoices: offered,
      offeredChoiceIds: offered.map((_, i) => `choice-${nextTurn}-${i}`),
      offeredChips,
      playerInput,
      gmText: mudBody,
      snapshotGist: compactTrafficGist(governed),
      systemLog: filteredSystemLog,
      questUnlocks,
      itemsEquipped: extractEquippedItems(state, next),
      itemsUsed: extractUsedItems(state, next),
      xpGained: characterXpGainBetween(state.character, governed.character, state.engineMode),
      level: governed.character?.level,
      characterXp: governed.character?.xp,
      xpToNext: governed.character?.xpToNext,
      placeCards: (governed.places ?? [])
        .filter((p) => p.cardBuiltTurn != null)
        .map((p) => ({ name: p.name, cardBuiltTurn: p.cardBuiltTurn, description: p.description, exits: p.exits })),
      loopFlags: detectLoopFlags(mudBody, state),
      error,
      failKind: gmResult.failKind,
      transportRetries,
      dnsFailure: gmResult.dnsFailure === true,
      repairNote,
      receiptCounts,
      arcStatusReceipts,
      sealedManifestHash: arcState.sealedManifest?.beatEffectsHash,
      replayHash: hashCanonicalState(governed),
      renderFallbackUsed,
      presentation: useMud ? 'mud-receipt' : 'standard',
      location: governed.currentLocation,
      flavorQuote: mudTurn?.flavorQuote || undefined,
      receiptLines: mudTurn?.receiptLines,
      responsePath,
      writerOutcome,
      rejectedWriterText,
      rejectedReason,
      sentenceRepairs: writerTurn?.repairs?.length ? writerTurn.repairs : undefined,
      answerRepair: writerTurn?.answerRepair,
      fightRetry: writerTurn?.fightRetry,
      draftRetry: writerTurn?.draftRetry,
      outcomeShown: writerTurn?.outcomeShown,
      blockedPaintReason,
      engineFact: engineFact || undefined,
      openQuests: (arcState.quests ?? [])
        .filter((q) => q.status === 'active' && q.revealed)
        .map((q) => ({ title: q.name, step: (q.objectives ?? []).find((o) => !o.completed && !o.optional)?.description ?? '' })),
      writerRawHead,
      writerRaw: gmResult.text || undefined,
      stageTrace: stageTrace.length ? stageTrace : undefined,
      tokenVerdicts,
      tokenPath,
      retryTokenVerdicts,
      writerCalls: writerCallMeter.calls,
      writerMs: writerCallMeter.ms,
      draftProblems: writerTurn?.problems.length ? writerTurn.problems : undefined,
      spokenLine:
        writerTurn?.spoken?.status === 'added' || writerTurn?.spoken?.status === 'no-line'
          ? writerTurn.spoken
          : undefined,
      stitchedLine: renderFallbackUsed || usedPacketStitch,
      writerIssues: writerIssues.length ? writerIssues : undefined,
      wardenNotes: warden.notes.length ? [...warden.notes] : undefined,
      writerUsage: writerUsage ?? undefined,
    },
  };
}
/** JSON that cannot throw on cycles (CAST/state leaks) or kill a T50 write. */
function safeJsonLine(value: unknown, pretty = false): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (val && typeof val === 'object') {
          if (seen.has(val as object)) return '[Circular]';
          seen.add(val as object);
        }
        if (typeof val === 'string' && val.length > 200_000) {
          return `${val.slice(0, 200_000)}…[truncated]`;
        }
        return val;
      },
      pretty ? 2 : undefined
    );
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
  }
}
export async function runFateAutoplay(opts: {
  turns: number;
  seed: number;
  bibleId: string;
  personality: string;
  engineMode?: EngineMode;
  aiTier: HostedAiTier;
  mode: FateMode;
  aiAgentMode?: AiAgentMode;
  dryRun: boolean;
  outRoot: string;
  characterName: string;
  /** When set, forces Flash Lite (or default hosted) for this run via client GM path. */
  writer?: AutoplayWriterKind;
  /** OpenRouter model id for the client writer; default Flash Lite. */
  writerModel?: string;
  /** 28b — scripted player lines per turn (harness only); a blank entry = normal pick. */
  inputs?: string[];
  /** `--route <place>` — from turn 2, travel toward this place until arrived, then normal picks. */
  routeTo?: string;
  /** 28g — LOOP STOP auto-stop (default on). false or env SGM_AUTOPLAY_LOOP_STOP=off turns it off. */
  loopStop?: boolean;
  /** 28j — continue from <runDir>/snapshot.json. */
  resumeFrom?: string;
}): Promise<RunSummary> {
  enableAutoplayTestLab(opts.aiTier);
  setActiveSubscriptionTier(opts.aiTier);
  const writerKind = opts.writer ?? 'default';
  const writerOverride = enableAutoplayWriter(writerKind, opts.writerModel);
  if (writerOverride) {
    console.log(
      `[autoplay-writer] ${writerOverride.route} model=${writerOverride.model} — ${writerOverride.note}`
    );
  }
  const settings: Settings = {
    ...createDefaultSettings(),
    subscriptionTier: opts.aiTier,
    classicMemorableImages: false,
    visualMode: 'classic',
    gmVoiceProfileId: isGmVoiceProfileId(opts.personality) ? opts.personality : 'cold-system',
  };
  const tabletopCreationRun = process.env.SGM_AUTOPLAY_TT_CREATION !== 'off';
  const { state: raw, bible, personalityId } = buildNewGameState({
    bibleId: opts.bibleId,
    characterName: opts.characterName,
    seed: opts.seed,
    personality: opts.personality,
    engineMode: opts.engineMode,
    tabletopCreation: tabletopCreationRun,
  });
  let state = stampOpening(raw);
  if (raw.character.srd) console.log(`[fate-autoplay] tabletop creation: ${creationRecord(raw)}`);
  let startIndex = 0;
  if (opts.resumeFrom) {
    const snapPath = join(opts.resumeFrom, 'snapshot.json');
    const snap = JSON.parse(readFileSync(snapPath, 'utf8')) as { loopIndex: number; state: GameState };
    state = snap.state;
    startIndex = snap.loopIndex;
    console.log(`[fate-autoplay] resumed from ${snapPath} at loop turn ${startIndex} (game turn ${state.turn})`);
  }
  const rng = mulberry32(opts.seed);
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = `${bible.id}_${personalityId}_s${opts.seed}`;
  const outDir = join(opts.outRoot, `${runId}_${slug}`);
  mkdirSync(outDir, { recursive: true });
  writerPromptSink.dir = join(outDir, 'writer-prompts');
  mkdirSync(writerPromptSink.dir, { recursive: true });
  const turns: TurnTelemetry[] = [];
  const startedAt = new Date().toISOString();
  let fatal: string | undefined;
  let dnsFailStreak = 0;
  // 28g — LOOP STOP: the same GM line on its second repeat (3rd time), or 5 turns in a row with
  // no progress (29z1: turnProgress — a new chip label is not progress; a bounce is not movement).
  const loopStopOn = opts.loopStop !== false && process.env.SGM_AUTOPLAY_LOOP_STOP !== 'off';
  const gmSeen = new Map<string, number>();
  let noProgress = 0;
  const routeTo = opts.routeTo?.trim() ?? '';
  let routeReached = false;
  const turnsPath = join(outDir, 'turns.jsonl');
  const heartbeatPath = join(outDir, 'heartbeat.json');
  const crashPath = join(outDir, 'crash.log');
  // Truncate turns file once; append per turn so a mid-run kill keeps all completed turns.
  writeFileSync(turnsPath, '');
  // 28j — GameState snapshot every 10 turns and at stop (resume with --resume-from <runDir>).
  const writeSnapshot = (loopIndex: number) =>
    writeFileSync(join(outDir, 'snapshot.json'), JSON.stringify({ loopIndex, turn: state.turn, savedAt: new Date().toISOString(), state }) + '\n');
  try {
    for (let i = startIndex; i < opts.turns; i++) {
      const turnNo = i + 1;
      if (state.playPhase === 'ended') {
        fatal = `PLAY ENDED: the run is over before turn ${turnNo}`;
        console.log(`[fate-autoplay] ${fatal}`);
        break;
      }
      writerPromptSink.turn = turnNo;
      writeFileSync(
        heartbeatPath,
        JSON.stringify(
          {
            pid: process.pid,
            turn: turnNo,
            of: opts.turns,
            bibleId: bible.id,
            seed: opts.seed,
            aiAgentMode: opts.aiAgentMode ?? 'default',
            at: new Date().toISOString(),
          },
          null,
          2
        ) + '\n'
      );
      try {
        const turnStart = state;
        if (routeTo && (state.currentLocation ?? '').trim().toLowerCase() === routeTo.toLowerCase()) routeReached = true;
        const routeLine = routeTo && !routeReached && i >= 1 ? `Travel toward ${routeTo}` : undefined;
        const result = await headlessFateTurn(state, settings, rng, {
          bibleId: bible.id,
          personalityId,
          seed: opts.seed,
          mode: opts.mode,
          aiAgentMode: opts.aiAgentMode ?? 'default',
          dryRun: opts.dryRun,
          playerInputOverride: routeLine ?? (opts.inputs?.[i] || undefined),
        });
        state = result.state;
        {
          // 29z1 — the one progress meaning, stored on the row for the loop stop and the thumbs count.
          const tel = result.telemetry;
          const p = turnProgress(turnStart, state, [...(tel.arcStatusReceipts ?? []), ...(tel.systemLog ?? [])]);
          tel.progress = p.progressed;
          tel.progressReasons = p.reasons;
          const prev = turns[turns.length - 1];
          if (!tel.error) tel.turnCheck = checkPlayerTurn(turnStart, state, { ...tel, previousPick: prev ? prev.fatePick || prev.playerInput : undefined });
        }
        Object.assign(result.telemetry, turnProvenance(result.telemetry, writerOverride?.model));
        turns.push(result.telemetry);
        appendFileSync(turnsPath, safeJsonLine(result.telemetry) + '\n');
        if (turnNo % 10 === 0) writeSnapshot(turnNo);
        console.log(
          `[fate-autoplay] turn ${turnNo}/${opts.turns} ${result.telemetry.durationMs}ms pick="${String(result.telemetry.fatePick ?? '').slice(0, 56)}"${
            result.telemetry.error ? ` ERR=${result.telemetry.error}` : ''
          }${result.telemetry.failKind ? ` kind=${result.telemetry.failKind}` : ''}`
        );
        if (result.telemetry.error && result.telemetry.failKind === 'auth') {
          fatal = result.telemetry.error;
          break;
        }
        // 31i — DNS ENOTFOUND: pause cell after 2 consecutive (do not stamp 34 instant stubs)
        if (result.telemetry.dnsFailure || result.telemetry.failKind === 'network_dns') {
          dnsFailStreak += 1;
          if (dnsFailStreak >= 2) {
            fatal = 'DNS ENOTFOUND — pausing curriculum cell (Gateway unreachable)';
            console.warn(`[fate-autoplay] ${fatal} after turn ${turnNo}`);
            break;
          }
        } else {
          dnsFailStreak = 0;
        }
        if (loopStopOn) {
          const tel = result.telemetry;
          const gm = String(tel.gmText ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
          const seen = gm.length >= 24 ? (gmSeen.get(gm) ?? 0) + 1 : 0;
          if (gm.length >= 24) gmSeen.set(gm, seen);
          noProgress = tel.progress ? 0 : noProgress + 1;
          const reason =
            seen >= 3
              ? `same GM line a third time: "${gm.slice(0, 80)}"`
              : noProgress >= 5
                ? '5 turns with no progress (no XP, loot, quest change, fight won, new place or social change)'
                : '';
          if (reason) {
            fatal = `LOOP STOP: ${reason} (turn ${turnNo})`;
            console.warn(`[fate-autoplay] ${fatal}`);
            break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack || ''}` : String(err);
        appendFileSync(
          crashPath,
          `[${new Date().toISOString()}] turn ${turnNo} threw:\n${msg}\n\n`
        );
        const failedAt = Date.now();
        const failTel: TurnTelemetry = {
          turn: state.turn + 1,
          startedAt: new Date(failedAt).toISOString(),
          endedAt: new Date(failedAt).toISOString(),
          durationMs: 0,
          bibleId: bible.id,
          engineMode: state.engineMode,
          personalityId,
          seed: opts.seed,
          fatePick: '(crash)',
          offeredChoices: [],
          offeredChoiceIds: [],
          playerInput: '(crash — see crash.log)',
          gmText: '',
          systemLog: [`Autoplay turn threw: ${err instanceof Error ? err.message : String(err)}`],
          questUnlocks: [],
          itemsEquipped: [],
          itemsUsed: [],
          loopFlags: { officialCount: 0, atmosphereRepeat: false, strangerCount: 0 },
          transportRetries: 0,
          error: err instanceof Error ? err.message : String(err),
          failKind: 'client_bug',
        };
        Object.assign(failTel, turnProvenance(failTel, writerOverride?.model));
        turns.push(failTel);
        appendFileSync(turnsPath, safeJsonLine(failTel) + '\n');
        // Keep going — one bad turn must not kill a multi-hour batch.
      }
    }
  } finally {
    writerPromptSink.dir = undefined;
    // Keep Test Lab override for matrix multi-run; caller clears at process end.
  }
  const endedAt = new Date().toISOString();
  const servedModel = servedWriterModel(turns);
  const durations = turns.map((t) => t.durationMs);
  const issueTurns = turns
    .filter((t) => t.error || t.failKind)
    .map((t) => ({ turn: t.turn, error: t.error, failKind: t.failKind }));
  const summary: RunSummary = {
    runId,
    bibleId: bible.id,
    bibleTitle: bible.title,
    engineMode: state.engineMode,
    personalityId,
    seed: opts.seed,
    requestedTurns: opts.turns,
    completedTurns: turns.length,
    dryRun: opts.dryRun,
    aiTier: opts.aiTier,
    aiAgentMode: opts.aiAgentMode,
    startedAt,
    endedAt,
    errorCount: turns.filter((t) => t.error).length,
    timeoutCount: turns.filter((t) => t.failKind === 'timeout').length,
    transportRetryCount: turns.reduce((n, t) => n + (t.transportRetries || 0), 0),
    latencyMs: latencyStats(durations),
    issueTurns,
    outDir,
    runManifest: state.runManifest,
    receiptTotals: countRunReceipts(state),
    finalReplayHash: hashCanonicalState(state),
    pathCounts: tallyResponsePaths(turns),
  };
  summary.evalHarness = validateEvalRun(state, summary, turns);
  const readability = readabilityGatePass(state);
  // 29z2 — tester turn-check P0s fail the run the same way as readability P0s.
  const turnP0 = turns.flatMap((t) =>
    (t.turnCheck?.p0 ?? []).map((f) => ({ kind: `turn-${f.kind}`, turn: t.turn, quote: f.detail.slice(0, 160) }))
  );
  summary.readabilityGate = {
    pass: readability.pass && turnP0.length === 0,
    p0Count: readability.p0Count + turnP0.length,
    p1Count: readability.p1Count,
    violations: [...readability.violations, ...turnP0],
  };
  writeFileSync(join(outDir, 'transcript.md'), buildPlayTranscript(state));
  if (state.runManifest) {
    writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(state.runManifest, null, 2) + '\n');
  }
  writeFileSync(
    join(outDir, 'story-for-gemini.md'),
    buildStoryReviewExport(state, {
      personalityId,
      aiAgentMode: opts.aiAgentMode,
      seed: opts.seed,
      codeBaseline: '2026-08-26u+ client (HUD stamp at export)',
      errorNote:
        summary.errorCount > 0
          ? `${summary.errorCount} errors / ${summary.timeoutCount} timeouts (see summary.json issueTurns)`
          : 'no turn errors recorded in summary',
    })
  );
  writeFileSync(
    join(outDir, 'story-narration-only.md'),
    buildNarrationOnlyStoryExport(state, {
      personalityId,
      aiAgentMode: opts.aiAgentMode,
      seed: opts.seed,
      codeBaseline: BUILD_STAMP,
      errorNote:
        summary.errorCount > 0
          ? `${summary.errorCount} errors / ${summary.timeoutCount} timeouts`
          : undefined,
    })
  );
  writeSnapshot(startIndex + turns.length);
  writeFileSync(join(outDir, 'turns.jsonl'), turns.map((t) => safeJsonLine(t)).join('\n') + '\n');
  writeFileSync(join(outDir, 'summary.json'), safeJsonLine(summary, true) + '\n');
  writeFileSync(join(outDir, 'eval.json'), safeJsonLine(summary.evalHarness, true) + '\n');
  writeFileSync(
    join(outDir, 'meta.json'),
    JSON.stringify(
      {
        ...summary,
        ...rowProvenance({
          teacherModel: servedModel ?? getAutoplayWriterOverride()?.model ?? writerOverride?.model ?? null,
          mode: state.engineMode,
        }),
        fatal,
        ...(raw.character.srd ? { tabletopCreation: true, tabletopBuild: creationRecord(raw) } : {}),
        capacity: 'autoplay Test Lab override (unlimited text/memorable for this process only)',
        note: 'For review + optional StoryForge/SFT ingest. Not auto-trained into live GM.',
        writer: writerOverride
          ? {
              kind: writerOverride.kind,
              model: servedModel ?? getAutoplayWriterOverride()?.model ?? writerOverride.model,
              baseUrl: writerOverride.baseUrl,
              route: writerOverride.route,
              note: getAutoplayWriterOverride()?.note ?? writerOverride.note,
              startedModel: writerOverride.model,
            }
          : {
              kind: 'default',
              model: servedModel,
              route: 'gm-turn',
              note: 'No --writer override; model is the id gm-turn reported for the turns it wrote (null when none came back).',
            },
        activeOverride: getAutoplayWriterOverride()
          ? {
              model: getAutoplayWriterOverride()!.model,
              route: getAutoplayWriterOverride()!.route,
            }
          : null,
      },
      null,
      2
    ) + '\n'
  );
  return summary;
}
/** Provenance of one turn row: the id the provider returned for this turn, else the model the run asked for. */
export function turnProvenance(
  tel: Pick<TurnTelemetry, 'writerUsage' | 'engineMode'> & { playerInput?: string },
  requestedModel?: string | null
): RowProvenance {
  return rowProvenance({
    teacherModel: tel.writerUsage?.modelId ?? requestedModel ?? null,
    mode: tel.engineMode ?? null,
    wellbeingFlagged: readWellbeing(tel.playerInput ?? '').flags.length > 0,
  });
}
/** The model id(s) the writer server reported for the run's turns, in first-seen order; null when none reported. */
export function servedWriterModel(turns: ReadonlyArray<Pick<TurnTelemetry, 'writerUsage'>>): string | null {
  const ids = [...new Set(turns.map((t) => t.writerUsage?.modelId).filter((id): id is string => !!id))];
  return ids.length ? ids.join(', ') : null;
}
export function parseFateArgs(argv: string[]): FateAutoplayCliOpts {
  const defaults: FateAutoplayCliOpts = {
    turns: 20,
    seed: 1,
    bibleId: 'summoned-pact',
    personality: 'cold-system',
    aiTier: 'free',
    mode: 'fate',
    dryRun: false,
    matrix: false,
    matrix40: false,
    matrixLimit: 0,
    nightStoryforge: false,
    modesAgents300: false,
    outRoot: join(process.cwd(), 'scripts', 'fate-autoplay', 'runs'),
    characterName: 'Jax',
    writer: 'default',
  };
  const out = { ...defaults };
  let bibleGiven = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? '';
    if (a === '--turns') out.turns = Math.max(1, Number(next()) || 20);
    else if (a === '--seed') out.seed = Number(next()) || 1;
    else if (a === '--bible') {
      out.bibleId = next();
      bibleGiven = true;
    } else if (a === '--personality') out.personality = next();
    else if (a === '--engine' || a === '--mode-engine' || a === '--game-mode') {
      const raw = next();
      const mode = parseTestGameMode(raw);
      if (!mode) throw new Error(`Unsupported test game mode "${raw}" (use litrpg | tabletop | rpg; PYOA is never tested).`);
      out.engineMode = mode;
    }
    else if (a === '--ai-tier') {
      const t = next();
      out.aiTier = t === 'mid' || t === 'high' ? t : 'free';
    } else if (a === '--pick-mode') {
      const m = next();
      out.mode = m === 'first-pad' ? 'first-pad' : 'fate';
    } else if (a === '--ai-agent-mode') {
      const m = next();
      out.aiAgentMode = ['maxlevel', 'storyfollower', 'completionist'].includes(m)
        ? (m as AiAgentMode)
        : 'default';
    } else if (a === '--writer') {
      out.writer = parseAutoplayWriterKind(next());
    } else if (a === '--writer-model') out.writerModel = next().trim();
    else if (a === '--seat') {
      const seat = next().trim().toLowerCase();
      if (!(seat in TRAINING_SEATS)) throw new Error(`Unknown --seat "${seat}" (use ${Object.keys(TRAINING_SEATS).join(' | ')}).`);
      out.writer = 'flash-lite';
      out.writerModel = TRAINING_SEATS[seat as TrainingSeat];
    }
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--matrix-40' || a === '--matrix40') out.matrix40 = true;
    else if (a === '--matrix') out.matrix = true;
    else if (a === '--matrix-limit') out.matrixLimit = Math.max(0, Number(next()) || 0);
    else if (a === '--night-storyforge' || a === '--night-sf') out.nightStoryforge = true;
    else if (a === '--modes-agents-300' || a === '--modes-agents') out.modesAgents300 = true;
    else if (a === '--worst-cells-only' || a === '--worst-cells') out.worstCellsOnly = true;
    else if (a === '--alt-cells-only' || a === '--alt-cells') out.altCellsOnly = true;
    else if (a === '--split-modes-gemini') out.splitModesGemini = true;
    else if (a === '--combined-gemini') out.combinedGemini = true;
    else if (a === '--resume-dir') out.resumeDir = next();
    else if (a === '--resume-from') out.resumeFrom = next();
    else if (a === '--batch-dir') out.batchDir = next();
    else if (a === '--inputs') out.inputs = next().split('|').map((s) => s.trim());
    else if (a === '--route') out.routeTo = next();
    else if (a === '--out') out.outRoot = next();
    else if (a === '--name') out.characterName = next();
    else if (a === '--help' || a === '-h') {
      out.turns = -1;
    }
  }
  if (out.engineMode && !bibleGiven) out.bibleId = DEFAULT_TEST_BIBLE_BY_MODE[out.engineMode] ?? out.bibleId;
  return out;
}
export { disableAutoplayTestLab, enableAutoplayTestLab };