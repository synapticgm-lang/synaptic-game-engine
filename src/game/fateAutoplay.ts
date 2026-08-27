/**
 * Headless Fate autoplay — Seedable Fate's Pick + GM path with wardens.
 * Ship A: mirrors client commit (callGm → runWarden → structural → choices → prose)
 * without React UI / memorable art / comic jobs.
 *
 * Capacity: enableAutoplayTestLab() so Free week-cap never stops the run.
 */

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getCampaignBibleById,
  getCampaignBiblesByEngineMode,
  formatCampaignStoryName,
  isNsfwCampaign,
  type CampaignBible,
} from '@/data/campaigns';
import { callGm } from './aiService';
import { buildResolutionUserPayload } from './actionResolution';
import { validateActionHard } from './actionValidation';
import { seedStateFromCampaignBible, applyCampaignCharacter } from './campaignSeed';
import { ensureCampaignContract } from './campaignContract';
import {
  padChoicesToCount,
  resolvePipelineChoices,
  normalizeStoryCorpus,
} from './choicePipeline';
import { postFilterGmOutput } from './contentPostFilter';
import { createDefaultSettings, createInitialState } from './defaults';

/** AI agent goal modes for guided autoplay. */
export type AiAgentMode = 'default' | 'maxlevel' | 'storyfollower' | 'completionist';
import {
  classifyTurnFailure,
  gmProxyTimeoutMsForState,
  shouldAutoRetryTurn,
  TURN_TRANSPORT_MAX_AUTO_RETRIES,
  transportRetryBackoffMs,
} from './errorRepairWarden';
import { applyFactLocks } from './factLocks';
import { mulberry32, pickFateChoice, type Rng } from './fatePick';
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
import { parsePlayerIntent } from './intentParser';
import { scanAndScrubLeaks } from './leakScanner';
import { ensureTurnProse, stripResidualMechanicTags } from './narrativeSanitize';
import {
  ensureSealedOpeningBag,
  isAloneArrivalOpening,
  isAloneArrivalPick,
  pendingRequiredCovers,
  resolveOpeningHookPick,
  resolveOpeningMode,
  resolveOpeningPrompts,
  resolveOpeningRegistrar,
  seedCoverAnswers,
} from './openingEstablishment';
import { applyOpeningContract, ensureStarterLookCharacter, stitchOpeningScene } from './openingStitch';
import { seedOutdoorHubPlaces, parseTravelDestination, ensureTravelArrivalProse } from './outdoorHubs';
import {
  extractUpdates,
  parseActionTags,
  stripActionTags,
  stripChoiceList,
  eventsToQuestUpdates,
} from './parser';
import { scrubOfficialPlaceholder } from './narrativeScrub';
import { applySandboxXpAwards } from './sandboxXp';
import { applyCharacterXpGain } from './characterXp';
import {
  applyGovernanceCommit,
  applyGovernanceToProse,
  filterGovernanceChoices,
  processMetaInput,
} from './qualityGovernance';
import {
  runArcDirectorBeforeGm,
  formatArcDirectorMandateBlock,
  preserveArcQuestProgress,
} from './arcDirector';
import { playerInputGateBlock } from './choiceCompiler';
import { filterSystemLogForEngine, reconcileXpStatusLines } from './systemLog';
import { beatFingerprint, isSameBeat, isNearClone, buildBeatNoveltyRetryBlock, beatSimilarity } from './beatFingerprint';
import { enforcePerspective } from './perspectiveWarden';
import { buildPlayTranscript, buildStoryReviewExport, resolveOfferedChoices, withOfferedChoices } from './playTranscript';
import {
  applyProseWarden,
  calculateCrowdSize,
  collectSceneObjectNames,
} from './proseWarden';
import { syncQuestsFromPlay, questsLockedDuringOpening } from './questPlay';
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
  engineMode?: EngineMode;
  aiTier: HostedAiTier;
  mode: FateMode;
  aiAgentMode?: AiAgentMode;
  dryRun: boolean;
  matrix: boolean;
  /** John's 40 plan: 10 LitRPG + 10 tabletop + 10 RPG + 10 PYOA. */
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
  /** Regenerate mode Gemini packs from an existing batch (no re-run). */
  splitModesGemini?: boolean;
  /** Also write optional combined 12-run Gemini file (default off). */
  combinedGemini?: boolean;
  /** Resume an existing modes-agents batch folder (skip completed cells). */
  resumeDir?: string;
  /** Batch folder for --split-modes-gemini. */
  batchDir?: string;
  outRoot: string;
  characterName: string;
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
  loopFlags: { officialCount: number; atmosphereRepeat: boolean; strangerCount: number };
  error?: string;
  failKind?: string;
  transportRetries: number;
  repairNote?: string;
  dryRun?: boolean;
};

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

/** Launch matrix: mode × ready premade (skip blank) × Launch narrator (full cartesian). */
export function enumerateLaunchMatrix(baseSeed = 1): MatrixCombo[] {
  const combos: MatrixCombo[] = [];
  const modes: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];
  let i = 0;
  for (const engineMode of modes) {
    const bibles = getCampaignBiblesByEngineMode(engineMode).filter((b) => !isBlankCanvasBible(b.id));
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
 * John's 40 plan: 10 LitRPG + 10 tabletop + 10 RPG + 10 PYOA.
 * Every premade at least once when count ≤ 10; extras cycle narrator + seed.
 * RPG has 12 ready premades → first 10 included; 2 deferred (listed in notes).
 */
export function buildBalancedMatrix40(baseSeed = 1): {
  combos: MatrixCombo[];
  deferred: Array<{ engineMode: EngineMode; bibleId: string; bibleTitle: string }>;
  notes: string[];
} {
  const modes: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];
  const perMode = 10;
  const combos: MatrixCombo[] = [];
  const deferred: Array<{ engineMode: EngineMode; bibleId: string; bibleTitle: string }> = [];
  const notes: string[] = [];
  let slot = 0;

  for (const engineMode of modes) {
    const all = getCampaignBiblesByEngineMode(engineMode).filter((b) => !isBlankCanvasBible(b.id));
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
  const m40Min = Math.round((40 * turnsPerRun * 45) / 60);
  const m40Max = Math.round((40 * turnsPerRun * 75) / 60);
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
}): { state: GameState; bible: CampaignBible; personalityId: string } {
  const bible = getCampaignBibleById(opts.bibleId);
  if (!bible) throw new Error(`Unknown bible id: ${opts.bibleId}`);
  if (isBlankCanvasBible(bible.id)) {
    throw new Error(`Blank canvas ${bible.id} is skipped for autoplay — pick a ready premade.`);
  }
  const engineMode = opts.engineMode ?? bible.engineMode;
  const voices = resolvePersonalities(engineMode, opts.personality);
  const storyName = formatCampaignStoryName(bible.title);
  const base = createInitialState(storyName, engineMode, bible.archetype);
  // Force deterministic seed string for opening hook pick
  const seededBase: GameState = {
    ...base,
    seed: String(opts.seed),
    saveId: `fate-${opts.seed}-${bible.id}-${Date.now()}`,
  };
  const seeded = seedStateFromCampaignBible(seededBase, bible);
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
    places: seedOutdoorHubPlaces([], bible),
    sandboxAwardKeys: [],
    mapFocusPlace: null,
    pendingGeneratedOpening: false,
    storyStartTextTurnsRemaining: honeymoon,
    openingEstablishment: {
      pending: [],
      answers: coverAnswers,
      complete: true,
      registrar,
      sceneWritten: true,
      mode: openingMode,
      pickedHook: picked?.text,
      pickedHookFallback: picked?.fallback,
      aloneArrival,
    },
    gmPersonality: voices.gmPersonality,
    systemPersonality: voices.systemPersonality,
  };
  const sealed = ensureSealedOpeningBag(rawNewState, openingPromptsRaw);
  const state = withUpdatedHookArc(
    ensureCampaignContract(
      {
        ...sealed,
        quests: sealed.quests ?? [],
        recentBeatFingerprints: [],
        stateTxLog: [],
      },
      bible
    )
  );
  return { state, bible, personalityId: voices.personalityId };
}

function stampOpening(state: GameState): GameState {
  const text = stitchOpeningScene(state);
  const gmBase: LogEntry = {
    id: uid(),
    turn: 0,
    role: 'gm',
    content: text,
    timestamp: Date.now(),
    systemLog: [],
  };
  const withChoices = {
    ...state,
    turn: 0,
    log: [gmBase],
    choices: [],
  };
  const gm = withOfferedChoices(gmBase, withChoices);
  const next: GameState = {
    ...withChoices,
    log: [gm],
    choices: gm.offeredChoices ?? resolveOfferedChoices(withChoices),
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
  if (mode === 'default' || offered.length === 0) {
    return pickFateChoice(offered, rng);
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

async function callGmWithRetries(
  state: GameState,
  payload: string,
  settings: Settings
): Promise<{ text: string; systemLog: string[]; transportRetries: number; failKind?: string }> {
  let lastErr: unknown;
  let transportRetries = 0;
  const timeoutMs = gmProxyTimeoutMsForState(state, {
    writerTier: settings.subscriptionTier === 'mid' || settings.subscriptionTier === 'high'
      ? settings.subscriptionTier
      : 'free',
  });
  for (let attempt = 0; attempt <= TURN_TRANSPORT_MAX_AUTO_RETRIES; attempt++) {
    try {
      const result = await callGm(state, payload, settings, [], undefined, undefined, timeoutMs);
      return {
        text: result.text ?? '',
        systemLog: result.systemLog ?? [],
        transportRetries,
      };
    } catch (err) {
      lastErr = err;
      const kind = classifyTurnFailure(err);
      if (!shouldAutoRetryTurn(kind) || attempt >= TURN_TRANSPORT_MAX_AUTO_RETRIES) {
        return {
          text: '',
          systemLog: [],
          transportRetries,
          failKind: kind,
        };
      }
      transportRetries = attempt + 1;
      await new Promise((r) => setTimeout(r, transportRetryBackoffMs(attempt)));
    }
  }
  return {
    text: '',
    systemLog: [],
    transportRetries,
    failKind: classifyTurnFailure(lastErr),
  };
}

/**
 * One headless turn: Fate pick → callGm → runWarden → structural → choice pad → prose wardens.
 */
export async function headlessFateTurn(
  state: GameState,
  settings: Settings,
  rng: Rng,
  meta: { bibleId: string; personalityId: string; seed: number; mode: FateMode; aiAgentMode: AiAgentMode; dryRun: boolean }
): Promise<{ state: GameState; telemetry: TurnTelemetry }> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const offered = resolveOfferedChoices(state);
  const fatePick =
    meta.mode === 'first-pad'
      ? offered[0] ?? 'Look around'
      : pickGoalOrientedChoice(offered, state, meta.aiAgentMode, rng);

  let playerInput = fatePick;
  let repairNote: string | undefined;
  const mediated = mediatePlayerInput(playerInput);
  if (mediated.action === 'block') {
    playerInput = 'Look around';
    repairNote = 'input_blocked→Look around';
  } else {
    playerInput = mediated.text;
  }

  const lastGm = [...state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
  const hard = validateActionHard(playerInput, state, lastGm);
  if (!hard.valid) {
    playerInput = hard.rewritten || 'Look around';
    repairNote = (repairNote ? `${repairNote}; ` : '') + `hard_gate→${playerInput}`;
  } else if (hard.rewritten) {
    playerInput = hard.rewritten;
    repairNote = (repairNote ? `${repairNote}; ` : '') + 'hard_gate_rewrite';
  }

  const govInputState = processMetaInput(state, playerInput).state;

  let arcState = govInputState;
  const gate = playerInputGateBlock(arcState, playerInput);
  arcState = gate.state;
  let arcBlock = '';
  if (arcState.openingEstablishment?.complete) {
    const arc = runArcDirectorBeforeGm(arcState, playerInput);
    arcState = arc.state;
    arcBlock = formatArcDirectorMandateBlock(arc);
    if (arc.xpAwards.length) {
      let char = arcState.character;
      for (const award of arc.xpAwards) {
        const leveled = applyCharacterXpGain(char, award.amount);
        char = leveled.character;
      }
      arcState = { ...arcState, character: char };
    }
  }

  if (meta.dryRun) {
    const stubGm = `(dry-run) Fate picked: ${fatePick}. Offered: ${offered.join(' | ')}`;
    const playerEntry: LogEntry = {
      id: uid(),
      turn: state.turn,
      role: 'player',
      content: playerInput,
      timestamp: Date.now(),
    };
    const gmBase: LogEntry = {
      id: uid(),
      turn: state.turn + 1,
      role: 'gm',
      content: stubGm,
      timestamp: Date.now(),
      systemLog: ['Dry run — no GM call'],
    };
    const mid: GameState = {
      ...state,
      turn: state.turn + 1,
      log: [...state.log, playerEntry, gmBase],
      choices: offered.length ? offered : ['Look around', 'Wait', 'Check what you carry'],
    };
    const gm = withOfferedChoices(gmBase, mid);
    const next: GameState = {
      ...mid,
      log: [...state.log, playerEntry, gm],
      choices: gm.offeredChoices ?? mid.choices,
    };
    const ended = Date.now();
    return {
      state: next,
      telemetry: {
        turn: next.turn,
        startedAt,
        endedAt: new Date(ended).toISOString(),
        durationMs: ended - started,
        bibleId: meta.bibleId,
        engineMode: state.engineMode,
        personalityId: meta.personalityId,
        seed: meta.seed,
        fatePick,
        offeredChoices: offered,
        offeredChoiceIds: offered.map((_, i) => `choice-${next.turn}-${i}`),
        playerInput,
        gmText: stubGm,
        systemLog: gm.systemLog ?? [],
        questUnlocks: [],
        itemsEquipped: [],
        itemsUsed: [],
        loopFlags: { officialCount: 0, atmosphereRepeat: false, strangerCount: 0 },
        transportRetries: 0,
        repairNote,
        dryRun: true,
      },
    };
  }

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
  const payload = buildResolutionUserPayload({
    mandateBlock: turnMandate.block + arcBlock,
    playerAction: playerInput,
    deterministicBlock,
    retry: false,
    intent,
  });

  const gmResult = await callGmWithRetries(arcState, payload, settings);
  let error: string | undefined;
  let gmText = gmResult.text;
  let transportRetries = gmResult.transportRetries;
  if (!gmText.trim()) {
    error = gmResult.failKind
      ? `GM empty/fail (${gmResult.failKind})`
      : 'GM returned empty content';
    const loc = state.currentLocation?.trim() || 'this stretch of street';
    gmText =
      `(autoplay) The beat stalls at ${loc}. Something shifts — a footstep, a call, a door — ` +
      `forcing the moment forward. [${error}]`;
  }

  // Novelty retry on same-beat OR near-verbatim clone (merchant ×20 loops).
  const travelHubEarly = parseTravelDestination(playerInput, meta.bibleId);
  const fps = state.recentBeatFingerprints ?? [];
  if (
    !error
    && storyHasBody(gmText)
    && (isSameBeat(gmText, fps) || isNearClone(gmText, fps))
    && transportRetries === 0
  ) {
    const novelty = buildBeatNoveltyRetryBlock(fps);
    const retryPayload = buildResolutionUserPayload({
      mandateBlock: turnMandate.block,
      playerAction: playerInput,
      deterministicBlock: `${deterministicBlock}\n${novelty}${
        travelHubEarly
          ? `\nTRAVEL AUTHORITY: Player is traveling to ${travelHubEarly.name}. Narrate arrival THERE — do not keep them in the previous room.`
          : ''
      }`,
      retry: true,
      intent,
    });
    const retry = await callGmWithRetries(arcState, retryPayload, settings);
    transportRetries += retry.transportRetries + 1;
    if (retry.text.trim() && (!isSameBeat(retry.text, fps) || travelHubEarly)) {
      gmText = retry.text;
      if (!error) error = undefined;
    }
  }

  const rawEvents = parseActionTags(gmText);
  const warden = await runWarden(state, rawEvents, gmText, playerInput, intent, lastGm);
  const events = warden.events;
  const narrativeSource = warden.scrubbedNarrative ?? gmText;

  const structural = applyStructuralEvents(arcState, events, {
    strictEncumbrance: settings.strictEncumbrance === true,
  });
  let working = structural.state;

  let cleanText = stripResidualMechanicTags(stripChoiceList(stripActionTags(narrativeSource)));
  cleanText = postFilterGmOutput(cleanText, settings, {
    nsfw: isNsfwCampaign(getCampaignBibleById(meta.bibleId)),
  });
  cleanText = ensureTurnProse(cleanText, playerInput);
  cleanText = applyFactLocks(state, cleanText, playerInput);
  cleanText = enforcePerspective(cleanText, settings, state.character.name);
  cleanText = applyProseWarden(cleanText, {
    currentLocation: working.currentLocation ?? state.currentLocation,
    aloneArrival: isAloneArrivalOpening(working) || isAloneArrivalOpening(state),
    crowdSize: calculateCrowdSize(working),
    crowdPresent: working.sceneFacts?.crowd === 'present',
    inventory: working.inventory ?? state.inventory,
    sceneProps: collectSceneObjectNames(working),
    searchedEmpty: listEmptySearchTargets(working.sceneFacts ?? state.sceneFacts),
    playerInput,
    groundedWeapons: groundedWeaponNames(working),
    playerName: working.character?.name ?? state.character?.name,
    presentNames: [
      ...(working.sceneFacts?.present ?? []),
      ...(state.sceneFacts?.present ?? []),
      ...((working.npcMemories ?? state.npcMemories ?? []).map((n) => n.npcName)),
    ].filter(Boolean),
  });
  cleanText = scrubOfficialPlaceholder(cleanText, working);
  const leak = scanAndScrubLeaks(cleanText);
  if (leak.notes.length) cleanText = leak.clean;
  {
    const govProse = applyGovernanceToProse(working, cleanText);
    cleanText = govProse.prose;
    if (govProse.notes.length) warden.notes.push(...govProse.notes);
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
    working = { ...working, currentLocation: updates.currentLocation };
  }

  // Hard gate: Travel toward / Return to snaps location (was missing in headless → theater travel).
  const fromLoc = state.currentLocation;
  const travelHub = parseTravelDestination(playerInput, meta.bibleId);
  if (travelHub && !working.activeDungeon && !state.activeDungeon) {
    working = {
      ...working,
      currentLocation: travelHub.name,
      places: touchPlaceVisit(working.places ?? state.places ?? [], travelHub.name, state.turn + 1),
    };
    cleanText = ensureTravelArrivalProse(cleanText, travelHub.name, fromLoc);
  }

  const pipeline = await resolvePipelineChoices({
    gmText: narrativeSource,
    state: working,
    loreCards: [],
    settings,
    lastPlayerAction: playerInput,
  });
  const storyProse = normalizeStoryCorpus(cleanText);
  let finalChoices = padChoicesToCount(
    pipeline.choices.length ? pipeline.choices : [],
    working,
    storyProse,
    3,
    playerInput
  );
  {
    const govChoices = filterGovernanceChoices(working, finalChoices);
    finalChoices = govChoices.choices;
    if (govChoices.notes.length) warden.notes.push(...govChoices.notes);
  }

  const nextTurn = state.turn + 1;
  const questsBefore = [...(state.quests ?? [])];
  let updatedQuests = preserveArcQuestProgress(
    arcState.quests,
    syncQuestsFromPlay(
      eventsToQuestUpdates(events, working.quests ?? [], nextTurn),
      gmResult.systemLog,
      `${playerInput}\n${cleanText}`,
      { locked: questsLockedDuringOpening(state) }
    )
  );

  // Code-owned sandbox XP (hub discover / NPC meet / landmark / quest) — was missing in headless.
  const sandboxXp = applySandboxXpAwards(
    {
      ...working,
      sandboxAwardKeys: working.sandboxAwardKeys ?? state.sandboxAwardKeys,
    },
    {
      playerAction: playerInput,
      locationName: working.currentLocation,
      previousLocationName: state.currentLocation,
      questsBefore,
      questsAfter: updatedQuests,
      events,
      encounterCleared: !!(state.activeEncounter && !working.activeEncounter),
      enemyKilled: false,
      turn: nextTurn,
    }
  );
  let character = working.character;
  let levelNotes: string[] = [];
  if (sandboxXp.xp > 0) {
    const leveled = applyCharacterXpGain(character, sandboxXp.xp);
    character = leveled.character;
    levelNotes = leveled.notes;
  }
  working = {
    ...working,
    character,
    places: sandboxXp.places ?? working.places,
    sandboxAwardKeys: sandboxXp.awardKeys,
    quests: updatedQuests,
    activeEncounter: working.activeEncounter ?? arcState.activeEncounter ?? null,
    arcDirector: arcState.arcDirector,
    runManifest: arcState.runManifest,
  };

  // Track recent choices for live-style dedupe (agent + pipeline).
  const recentChoices = [
    ...(state.recentChoices ?? []),
    { turn: nextTurn, choices: finalChoices },
  ].slice(-10);

  let filteredSystemLog = filterSystemLogForEngine(
    [...(gmResult.systemLog ?? []), ...(warden.notes.length ? [`Warden: ${warden.notes.slice(0, 3).join('; ')}`] : [])],
    state.engineMode
  );
  filteredSystemLog = reconcileXpStatusLines(filteredSystemLog, [
    ...sandboxXp.notes,
    ...levelNotes,
  ]);

  const questUnlocks = updatedQuests
    .filter((q) => {
      const before = questsBefore.find((b) => b.id === q.id);
      return q.revealed === true && before?.revealed !== true;
    })
    .map((q) => q.name);

  const fp = beatFingerprint(cleanText);
  const playerEntry: LogEntry = {
    id: uid(),
    turn: state.turn,
    role: 'player',
    content: playerInput,
    timestamp: Date.now(),
  };
  const gmBase: LogEntry = {
    id: uid(),
    turn: nextTurn,
    role: 'gm',
    content: cleanText,
    timestamp: Date.now(),
    systemLog: filteredSystemLog,
  };
  const mid: GameState = {
    ...working,
    turn: nextTurn,
    quests: updatedQuests,
    choices: finalChoices,
    recentChoices,
    recentBeatFingerprints: [...(state.recentBeatFingerprints ?? []), fp].slice(-12),
    log: [...state.log, playerEntry, gmBase],
  };
  const gm = withOfferedChoices(gmBase, mid);
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
    if (govCommit.xpAward && govCommit.xpAward.amount > 0) {
      const leveled = applyCharacterXpGain(governed.character, govCommit.xpAward.amount);
      governed = { ...governed, character: leveled.character };
    }
  }

  const ended = Date.now();
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
      playerInput,
      gmText: cleanText,
      systemLog: filteredSystemLog,
      questUnlocks,
      itemsEquipped: extractEquippedItems(state, next),
      itemsUsed: extractUsedItems(state, next),
      xpGained: sandboxXp.xp + (governed.character?.xp ?? 0) - (state.character?.xp ?? 0),
      level: governed.character?.level,
      characterXp: governed.character?.xp,
      xpToNext: governed.character?.xpToNext,
      loopFlags: detectLoopFlags(cleanText, state),
      error,
      failKind: gmResult.failKind,
      transportRetries,
      repairNote,
    },
  };
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
}): Promise<RunSummary> {
  enableAutoplayTestLab(opts.aiTier);
  setActiveSubscriptionTier(opts.aiTier);

  const settings: Settings = {
    ...createDefaultSettings(),
    subscriptionTier: opts.aiTier,
    classicMemorableImages: false,
    visualMode: 'classic',
    gmVoiceProfileId: isGmVoiceProfileId(opts.personality) ? opts.personality : 'cold-system',
  };

  const { state: raw, bible, personalityId } = buildNewGameState({
    bibleId: opts.bibleId,
    characterName: opts.characterName,
    seed: opts.seed,
    personality: opts.personality,
    engineMode: opts.engineMode,
  });
  let state = stampOpening(raw);
  const rng = mulberry32(opts.seed);

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = `${bible.id}_${personalityId}_s${opts.seed}`;
  const outDir = join(opts.outRoot, `${runId}_${slug}`);
  mkdirSync(outDir, { recursive: true });

  const turns: TurnTelemetry[] = [];
  const startedAt = new Date().toISOString();
  let fatal: string | undefined;
  const turnsPath = join(outDir, 'turns.jsonl');
  const heartbeatPath = join(outDir, 'heartbeat.json');
  const crashPath = join(outDir, 'crash.log');
  // Truncate turns file once; append per turn so a mid-run kill keeps all completed turns.
  writeFileSync(turnsPath, '');

  try {
    for (let i = 0; i < opts.turns; i++) {
      const turnNo = i + 1;
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
        const result = await headlessFateTurn(state, settings, rng, {
          bibleId: bible.id,
          personalityId,
          seed: opts.seed,
          mode: opts.mode,
          aiAgentMode: opts.aiAgentMode ?? 'default',
          dryRun: opts.dryRun,
        });
        state = result.state;
        turns.push(result.telemetry);
        appendFileSync(turnsPath, JSON.stringify(result.telemetry) + '\n');
        if (result.telemetry.error && result.telemetry.failKind === 'auth') {
          fatal = result.telemetry.error;
          break;
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
        turns.push(failTel);
        appendFileSync(turnsPath, JSON.stringify(failTel) + '\n');
        // Keep going — one bad turn must not kill a multi-hour batch.
      }
    }
  } finally {
    // Keep Test Lab override for matrix multi-run; caller clears at process end.
  }

  const endedAt = new Date().toISOString();
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
  };

  writeFileSync(join(outDir, 'transcript.md'), buildPlayTranscript(state));
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
  writeFileSync(join(outDir, 'turns.jsonl'), turns.map((t) => JSON.stringify(t)).join('\n') + '\n');
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  writeFileSync(
    join(outDir, 'meta.json'),
    JSON.stringify(
      {
        ...summary,
        fatal,
        capacity: 'autoplay Test Lab override (unlimited text/memorable for this process only)',
        note: 'For review + optional StoryForge/SFT ingest. Not auto-trained into live GM.',
      },
      null,
      2
    ) + '\n'
  );

  return summary;
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
  };
  const out = { ...defaults };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? '';
    if (a === '--turns') out.turns = Math.max(1, Number(next()) || 20);
    else if (a === '--seed') out.seed = Number(next()) || 1;
    else if (a === '--bible') out.bibleId = next();
    else if (a === '--personality') out.personality = next();
    else if (a === '--engine' || a === '--mode-engine') out.engineMode = next() as EngineMode;
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
    } else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--matrix-40' || a === '--matrix40') out.matrix40 = true;
    else if (a === '--matrix') out.matrix = true;
    else if (a === '--matrix-limit') out.matrixLimit = Math.max(0, Number(next()) || 0);
    else if (a === '--night-storyforge' || a === '--night-sf') out.nightStoryforge = true;
    else if (a === '--modes-agents-300' || a === '--modes-agents') out.modesAgents300 = true;
    else if (a === '--split-modes-gemini') out.splitModesGemini = true;
    else if (a === '--combined-gemini') out.combinedGemini = true;
    else if (a === '--resume-dir') out.resumeDir = next();
    else if (a === '--batch-dir') out.batchDir = next();
    else if (a === '--out') out.outRoot = next();
    else if (a === '--name') out.characterName = next();
    else if (a === '--help' || a === '-h') {
      out.turns = -1;
    }
  }
  return out;
}

export { disableAutoplayTestLab, enableAutoplayTestLab };
