import { useCallbackRef } from './useCallbackRef';
import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import type { GameState, Settings, LogEntry, RollRecord, Item, GoogleUser, SaveSlotInfo, EngineMode, LoreCard, GmStrictness, ContentMode, ErrorKind, AiProvider, Location3D, MapTier, ArtStylePreset, ComicOverlayEdit, Quest } from './types';
import { createInitialState } from './defaults';
import type { CampaignArchetype } from './archetypes';
import { buildArchetypeIntro } from './archetypes';
import { loadGame, saveGame, deleteGame, loadSettings, saveSettings, exportSave, importSave } from './db';
import {
  syncGameToCloud,
  fetchLatestCloudSave,
  fetchAllCloudSaveSlots,
  deleteCloudSave,
  deleteCloudSavesExcept,
  gameStateToLocalSlot,
} from './cloudSync';
import { filterSystemLogForEngine } from './systemLog';
import { callGm, callGmAutoFight } from './aiService';
import { simulateCombat, buildAutoFightPrompt } from './combat';
import type { EnemyStats } from './combat';
import { isAutoFightWarningDismissed } from '@/components/AutoFightWarningModal';
import { generateComicImage, generateVideo, VideoProviderNotConfiguredError } from '@/services/openRouterService';
import { enforcePerspective } from './perspectiveWarden';
import { applyProseWarden } from './proseWarden';
import { applyLocalityWarden } from './locality';
import {
  bindSessionImageCache,
  clearSessionImageCache,
  getSessionCachedImage,
  hashImageCacheParts,
  putSessionCachedImage,
} from '@/services/sessionImageCache';
import { comicPanelScriptToPanel, buildComicSpeechQueue } from './comicScriptAdapter';
import { ImageModerationError, softenPrompt } from './imageGen';
import {
  buildImagePromptForKind,
  shouldUseComicGrid,
  allowsImageGeneration,
  type ImagePromptKind,
  type ImagePromptContext,
} from './comicImagePrompt';
import { resolvePanelBudget } from './panelBudget';
import { buildVisualConsistencyBlock } from './visualConsistency';
import { playerFacingImageFailLine, prepareKidSafeImagePrompt } from './visualCanon';
import { fallbackSuggestionForState, findUnsupportedItemClaims, isSuggestionValidForState } from './suggestionValidation';
import { isChoiceGroundedInTurn, normalizeStoryCorpus, padChoicesToCount, resolvePipelineChoices, sceneSafeFallbacks } from './choicePipeline';
import { sanitizeNarrativeMechanics, ensureTurnProse, ensureDamageNarration, ensureEncounterNarration, ensureXpNarration, stripUnearnedXpProse, stripResidualMechanicTags } from './narrativeSanitize';
import { runWarden, sanitizeExtractedCharacterUpdates } from './warden';
import { applyStructuralEvents } from './structuralEvents';
import { collectTurnTimelineFacts, mergeTimeline } from './timeline';
import { applyCampaignCharacter, reconcileCampaignLoadout, resolveActiveCampaignBible, seedStateFromArchetype, seedStateFromCampaignBible } from './campaignSeed';
import type { CampaignBible } from '@/data/campaigns/types';
import {
  applyHarvestedOpeningCovers,
  applyOpeningAnswer,
  applySystemRename,
  ensureSystemReceipt,
  establishmentChoices,
  litrpgOpeningSystemPing,
  sanitizeOpeningNarration,
  buildOpeningSceneMandate,
  isOpeningEstablishmentPending,
  isOpeningSetupChipLabel,
  pendingRequiredCovers,
  resolveOpeningMode,
  resolveOpeningPrompts,
  resolveOpeningRegistrar,
  resolveOpeningHook,
  seedCoverAnswers,
  synthesizeOpeningScene,
} from './openingEstablishment';
import { applyCommittedNarrative, extractSceneFacts, seedOpeningSceneFacts, rewriteContinuityBreak, detectSceneContradiction } from './sceneFacts';
import { applyFactLocks, detectFactLockViolations } from './factLocks';
import { dropInsultGear } from './wornGear';
import { equippedItemsNeedingIcons, itemIconPrompt, needsPortraitRefresh, paperDollPrompt, portraitCacheKey } from './inventoryArt';
import { formatCampaignStoryName, getCampaignBibleById, isNsfwCampaign } from '@/data/campaigns';
import { applyAccusationFromInput } from './mysteryCulprit';
import { parsePlayerIntent, groundPlayerAction, isSpeechOrProtest } from './intentParser';
import {
  checkObligationCoverage,
  buildObligationRetryBlock,
} from './intentContract';
import { interpretPlayerUtterance, isJunkSetupValue } from './playerUtterance';
import { runPlayerCheck } from './checkMath';
import { buildOutcomeToken, formatOutcomeTokenForPrompt } from './outcomeToken';
import { maybeEnterInteriorDungeon } from './enterInterior';
import {
  equippedWeaponName,
  remainingDungeonMobs,
  resolveLedgerCombat,
  spawnRoomEncounter,
  type LedgerCombatRound,
} from './ledgerCombat';
import { mediatePlayerInput } from './inputMediation';
import { maybeRatingRewrite } from './maturity';
import { postFilterGmOutput } from './contentPostFilter';
import { filterKidModeText } from './kidModeSafety';
import {
  advanceTutorialBeats,
  ensureTutorialQuest,
  emptyTutorialProgress,
} from './tutorialBeats';
import {
  advanceCampaignMemory,
  upsertNpcRelationshipSummary,
} from './campaignMemory';
import { canSpend, spendCapacity, refundCapacity, capacityStatusMessage, storyStartTextTurnsForTier } from './capacityLedger';
import { setActiveSubscriptionTier } from './subscriptionTiers';
import { effectiveWriterTier, isTestLabEnabled } from './testLab';
import { canOfferRewardedMemorable } from './rewardedAds';
import { clipCustomTabletopRules } from './customTabletopRules';
import { touchPlaceVisit, upsertPlaceFromSheet } from './places';
import { isExplorableDungeon, normalizeSheetAuthority } from './placeAuthority';
import {
  seedDungeonState,
  mergeSheetWithNode,
  currentDungeonNode,
} from './dungeonSeed';
import { advanceLocationMemory } from './locationMemory';
import {
  buildTurnMandate,
  detectSceneHijack,
  filterHijackChoices,
  maybeRevealQuestsFromPlayerAction,
  stripHijackSentences,
} from './sceneFocus';
import {
  buildResolutionUserPayload,
  isGenericBridgeNarrative,
  isUnresolvedActionNarrative,
} from './actionResolution';
import { mergeNpcMemoriesFromTurn, recordNpcTreatmentFromAction } from './npcMemory';
import { resolveTabletopGmPersonality, type GmPersonalityId } from './gmVoiceProfile';
import {
  buildClarifiedInput,
  detectRepairSituation,
  extractRepairOptions,
  matchRepairOption,
  pickRepairCopy,
  resolveRepairVoiceId,
} from './repairEngine';
import {
  applyAcceptedBeautyOffer,
  applyDismissedBeautyOffer,
  decideClassicMemorable,
  isClassicMemorableEnabled,
  isSittingHardBlocked,
  memorableBypassesWeeklyCap,
  memorableLogFields,
  openingSplashStillDue,
  splashPlateLabel,
} from './memorableMoments';
import { buildPendingProposal, getProposedState, withEditedNarrative, touchLocationSheet, ensureLocationSheet } from './pendingTurn';
import {
  acceptProposedState,
  appendSpeculativeTake,
  currentLedgerRevision,
  nextLedgerRevision,
} from './ledgerRevision';
import { imagesKilled, signupsPaused } from './opsKillSwitches';
import { appendStateTxDiff } from './stateTx';
import {
  buildRevealVisibleText,
  revealDelayMs,
  splitIntoRevealChunks,
  type StreamingRevealState,
  type TurnPhase,
} from './streamReveal';
import { ensureCampaignContract, mergeCampaignDivergences } from './campaignContract';
import { canSoftOffer, withUpdatedHookArc } from './hookArc';
import {
  beatFingerprint,
  isSameBeat,
  buildBeatNoveltyRetryBlock,
} from './beatFingerprint';
import { formatCombatReceipt } from './combatReceipt';
import { scanAndScrubLeaks } from './leakScanner';
import { enrichQuests } from './questJournalEnrich';
import { extractUpdates, extractNewItems, parseActionTags, stripActionTags, matchLoreCards, eventsToLoreCards, parseTurnFrame, eventsToQuestUpdates, eventsToEncounterUpdate, parsePanels, eventsToMilestone, eventsToLootVideo, eventsToVisualUpdate, stripChoiceList, extractChoiceLines, stripTurnCloser, storyHasBody, looksLikeChoiceOffer } from './parser';
import { hasRealGmStory } from './turnAsk';
import { encounterOriginPlace } from './locationName';
import { clampLeakedOpeningQuests, extractNamedPlaces, harvestPlayText, isGenericMapPlace, mapAnchorName, newlyRevealedQuests, questsLockedDuringOpening, revealLocalStarterQuest, syncQuestsFromPlay } from './questPlay';
import { inferItemType } from './salvage';
import { initializeDungeon, moveToNode, exitDungeon as engineExitDungeon, resolvePlayAreaMap } from './mapEngine';
import type { Toast } from '@/components/ToastStack';
import {
  syncToDrive,
  fetchCloudSave,
  cloudSaveToLocal,
  setAccessToken,
  tryRestoreToken,
  hasAccessToken,
  fetchCloudTimestamp,
  fetchCloudSaveSlot,
  fetchUserBirthDate,
  calculateAge,
} from './drive';
import { useVoice } from './useVoice';
import { logger } from './logger';
import { debugLogger } from './debugLogger';
import { supabase, signInWithGoogleOAuth, signOutSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncEntitlementsFromServer } from './entitlementSync';
import { ingestCampaignPlates, pullPlayerProfileFromCloud, recordStoryStarted } from './playerProfile';
import {
  installTelemetryDebugBridge,
  setTelemetryContext,
  logPlayerAction,
  logRollResults,
  logApiLatency,
  logErrorStack,
} from '@/services/telemetryService';
import type { Session } from '@supabase/supabase-js';
import { simulateMerchantTurn } from './gameEngine';
import {
  applyWorldEvents,
  daysForPlayerAction,
  formatTickForGm,
  normalizeWorldLedger,
  reportsForVisit,
  tickWorld,
  emptyWorldLedger,
} from './worldSim';

export const SETTINGS_EVENT_NAME = 'tactical-litrpg-settings-update';
const HABIT_STORAGE_KEY = 'tactical-litrpg-player-habits';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

interface ActionHabit {
  action: string;
  count: number;
  lastUsed: number;
  triggerContexts: string[];
}

function loadHabits(): Record<string, ActionHabit> {
  try {
    const raw = localStorage.getItem(HABIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHabit(actionText: string, gmResponseText: string) {
  const habits = loadHabits();
  const cleanAction = actionText.trim();
  if (cleanAction.length < 3 || cleanAction.length > 120) return;

  const key = cleanAction.toLowerCase();
  const existing = habits[key] || {
    action: cleanAction,
    count: 0,
    lastUsed: Date.now(),
    triggerContexts: [],
  };

  existing.count += 1;
  existing.lastUsed = Date.now();

  const lowerGm = gmResponseText.toLowerCase();
  if (lowerGm.includes('slain') || lowerGm.includes('defeat') || lowerGm.includes('dead') || lowerGm.includes('victory') || lowerGm.includes('collapsed')) {
    if (!existing.triggerContexts.includes('combat_end')) existing.triggerContexts.push('combat_end');
  }
  if (lowerGm.includes('enter') || lowerGm.includes('step into') || lowerGm.includes('door opens')) {
    if (!existing.triggerContexts.includes('room_entry')) existing.triggerContexts.push('room_entry');
  }

  habits[key] = existing;
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
}

function getContentMode(settings: Settings): 'kid' | 'adult' {
  return settings.contentMode === 'kid' ? 'kid' : 'adult';
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

type ImageGenJob =
  | { kind: 'panels'; entryId: string; prompts: string[]; promptKind: ImagePromptKind; visualContext: string; playerActionContext?: string }
  | { kind: 'panel-retry'; entryId: string; panelIndex: number; prompt: string; promptKind: ImagePromptKind; visualContext: string; playerActionContext?: string }
  | { kind: 'turn'; entryId: string; prompts: string[]; promptKind: ImagePromptKind; visualContext: string; isMilestone?: boolean; heroImage?: boolean; bypassCapacity?: boolean; skipUnlockToast?: boolean }
  | { kind: 'intro'; prompt: string; promptKind: ImagePromptKind; visualContext: string };

interface VideoGenJob {
  entryId: string;
  prompt: string;
  visualContext: string;
}

type PostCommitSpeech =
  | { kind: 'sequence'; texts: string[] }
  | { kind: 'text'; text: string };

interface PostCommitTurnEffects {
  snapshot: GameState;
  imageJobs: ImageGenJob[];
  videoJob: VideoGenJob | null;
  speech: PostCommitSpeech;
}

function settleOrphanedImageJobs(state: GameState): GameState {
  let changed = false;
  const log = state.log.map((entry) => {
    if (entry.panels?.length) {
      const panels = entry.panels.map((panel) => {
        if (panel.imageStatus !== 'pending') return panel;
        changed = true;
        return { ...panel, imageUrl: null, imageStatus: 'failed' as const };
      });
      const hadPendingEntry = entry.imageStatus === 'pending';
      if (hadPendingEntry) changed = true;
      return {
        ...entry,
        panels,
        imageStatus: hadPendingEntry
          ? (panels.some((panel) => panel.imageUrl) ? ('ready' as const) : ('error' as const))
          : entry.imageStatus,
      };
    }
    if (entry.imageStatus === 'pending') {
      changed = true;
      return { ...entry, imageStatus: 'error' as const };
    }
    return entry;
  });
  return changed ? { ...state, log, lastUpdated: Date.now() } : state;
}

function getLearnedChoices(gmText: string): string[] {
  const habits = loadHabits();
  const lowerGm = gmText.toLowerCase();
  const learned: string[] = [];

  const isCombatEnd = lowerGm.includes('slain') || lowerGm.includes('defeat') || lowerGm.includes('dead') || lowerGm.includes('victory') || lowerGm.includes('collapsed');
  const isRoomEntry = lowerGm.includes('enter') || lowerGm.includes('chamber') || lowerGm.includes('hallway') || lowerGm.includes('room');

  const sortedHabits = Object.values(habits).sort((a, b) => b.count - a.count);

  for (const habit of sortedHabits) {
    if (habit.count >= 2) {
      if (isCombatEnd && habit.triggerContexts.includes('combat_end')) {
        learned.push(habit.action);
      } else if (isRoomEntry && habit.triggerContexts.includes('room_entry')) {
        learned.push(habit.action);
      }
    }
    if (learned.length >= 2) break;
  }
  return learned;
}

/**
 * Habit-augmented wrapper around the narrative parser's pure `extractChoiceLines` — blends
 * in the player's own learned habitual actions (tracked locally) as bonus suggestions. The
 * actual numbered/bulleted-list interception and stripping lives in `parser.ts` since that's
 * genuinely parsing the GM's narrative text, not a UI/habit concern.
 */
export function extractChoicesFromText(text: string, state?: GameState, storyProse = ''): string[] {
  if (!text) return ['🎲 Let Fate Decide'];

  const choices = extractChoiceLines(text);

  const learned = getLearnedChoices(text);
  for (const habitAction of learned) {
    if (!choices.some((c) => c.toLowerCase() === habitAction.toLowerCase())) {
      choices.push(`✨ ${habitAction}`);
    }
  }

  const validatedChoices = state
    ? choices.filter((choice) => isSuggestionValidForState(choice, state, storyProse))
    : choices;

  if (validatedChoices.length === 0) {
    if (state && choices.length > 0) return [fallbackSuggestionForState(state)];
    return ['🎲 Let Fate Decide'];
  }
  return validatedChoices;
}

const GOOGLE_USER_KEY = 'tactical-litrpg-google-user';
const LOCAL_UPDATED_KEY = 'tactical-litrpg-local-updated';
const GUEST_USER_KEY = 'tactical-litrpg-guest';

const GUEST_USER: GoogleUser = {
  credential: 'guest',
  name: 'Guest Adventurer',
  isGuest: true,
};

export type SyncPhase = 'idle' | 'syncing';
export type BootPhase = 'welcome' | 'auth' | 'setup' | 'hub' | 'syncing' | 'ready';

export function useGame() {
  debugLogger.record('SYSTEM', 'useGame hook initialized — loading settings from storage');
  installTelemetryDebugBridge();
  const loadedSettings = loadSettings();
  if (!loadedSettings.visualMode) {
    loadedSettings.visualMode = 'classic';
  }
  if (!loadedSettings.comicLayout) {
    loadedSettings.comicLayout = 'paged';
  }
  if (!loadedSettings.comicReadingDirection) {
    loadedSettings.comicReadingDirection = 'ltr';
  }
  debugLogger.record('SYSTEM', 'Settings loaded', {
    aiProvider: loadedSettings.aiProvider,
    visualMode: loadedSettings.visualMode,
    artStylePreset: loadedSettings.artStylePreset,
    contentMode: loadedSettings.contentMode,
    hasGeminiKey: !!loadedSettings.geminiApiKey,
    hasOpenRouterKey: !!loadedSettings.openrouterApiKey
  });
  setTelemetryContext({ aiProvider: loadedSettings.aiProvider });

  const [state, setState] = useState<GameState | null>(null);
  const [settings, setSettings] = useState<Settings>(loadedSettings);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [bootPhase, setBootPhase] = useState<BootPhase>('welcome');
  const [busy, setBusy] = useState(false);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('idle');
  const [streamingReveal, setStreamingReveal] = useState<StreamingRevealState | null>(null);
  const turnInFlightRef = useRef(false);
  const turnAbortRef = useRef<AbortController | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealRunRef = useRef(0);
  const phaseTimersRef = useRef<{ reading?: ReturnType<typeof setTimeout>; resolving?: ReturnType<typeof setTimeout> }>({});
  const [lastSavedTurn, setLastSavedTurn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState('');
  const lastInputRef = useRef('');
  const [restoreDraft, setRestoreDraft] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showNewGame, setShowNewGame] = useState(false);
  const [showRolls, setShowRolls] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCharacterWindow, setShowCharacterWindow] = useState(false);
  const [showMerchantWindow, setShowMerchantWindow] = useState(false);
  const [unlockedQuests, setUnlockedQuests] = useState<Quest[]>([]);
  const [syncPhase, setSyncPhase] = useState<SyncPhase>('idle');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [outOfTurnsAdOffer, setOutOfTurnsAdOffer] = useState(false);
  const [outOfMemorableAdOffer, setOutOfMemorableAdOffer] = useState(false);
  const [cloudSlot, setCloudSlot] = useState<SaveSlotInfo | null>(null);
  const [cloudSlots, setCloudSlots] = useState<SaveSlotInfo[]>([]);
  const [localSlot, setLocalSlot] = useState<SaveSlotInfo | null>(null);
  const [comicMode, setComicMode] = useState(settings.visualMode === 'comic');
  const [narrativeMode, setNarrativeMode] = useState(false);
  const [canRewind, setCanRewind] = useState(false);
  const [imagesGenerating, setImagesGenerating] = useState(0);
  const [autoFightWarning, setAutoFightWarning] = useState<{ enemy: EnemyStats; resolve: (proceed: boolean) => void } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageGenJobsRef = useRef<ImageGenJob[]>([]);
  const [imageGenEpoch, setImageGenEpoch] = useState(0);
  const imageGenRunningRef = useRef(false);
  const lastImageFailToastAtRef = useRef(0);

  // Loot-video jobs run on a fully separate queue/effect so a slow (30s-2min+) video
  // request can never block the image panel queue for subsequent turns.
  const videoGenJobsRef = useRef<VideoGenJob[]>([]);
  const [videoGenEpoch, setVideoGenEpoch] = useState(0);
  const videoGenRunningRef = useRef(false);
  const [videosGenerating, setVideosGenerating] = useState(0);

  // Turn side effects are staged here and consumed by an effect only after React has
  // committed the merged GameState. This keeps persistence, TTS, and media queue dispatch
  // out of state calculation and removes any dependency on updater execution timing.
  const postCommitTurnEffectsRef = useRef<PostCommitTurnEffects[]>([]);
  const pendingEffectsRef = useRef<PostCommitTurnEffects | null>(null);
  const [postCommitTurnEpoch, setPostCommitTurnEpoch] = useState(0);
  const postCommitTurnRunningRef = useRef(false);

  const voice = useVoice(settings.ttsEnabled, settings.voicePackId);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const clearPhaseTimers = useCallback(() => {
    if (phaseTimersRef.current.reading) clearTimeout(phaseTimersRef.current.reading);
    if (phaseTimersRef.current.resolving) clearTimeout(phaseTimersRef.current.resolving);
    phaseTimersRef.current = {};
  }, []);

  const resetTurnUi = useCallback(() => {
    revealRunRef.current += 1;
    clearRevealTimer();
    clearPhaseTimers();
    setTurnPhase('idle');
    setStreamingReveal(null);
  }, [clearPhaseTimers, clearRevealTimer]);

  const startStreamingReveal = useCallbackRef((entryId: string, fullText: string) => {
    const runId = ++revealRunRef.current;
    clearRevealTimer();
    clearPhaseTimers();

    const chunks = splitIntoRevealChunks(fullText);
    if (chunks.length <= 1) {
      setStreamingReveal({ entryId, fullText, visibleText: fullText, done: true });
      setTurnPhase('idle');
      return;
    }

    setTurnPhase('revealing');
    setStreamingReveal({ entryId, fullText, visibleText: chunks[0], done: false });

    let index = 0;
    const tick = () => {
      if (revealRunRef.current !== runId) return;
      index += 1;
      if (index >= chunks.length) {
        setStreamingReveal({ entryId, fullText, visibleText: fullText, done: true });
        setTurnPhase('idle');
        revealTimerRef.current = null;
        return;
      }
      setStreamingReveal({
        entryId,
        fullText,
        visibleText: buildRevealVisibleText(chunks, index),
        done: false,
      });
      revealTimerRef.current = setTimeout(tick, revealDelayMs(index, chunks[index]));
    };
    revealTimerRef.current = setTimeout(tick, revealDelayMs(0, chunks[0]));
  });

  useEffect(() => () => {
    clearRevealTimer();
    clearPhaseTimers();
  }, [clearPhaseTimers, clearRevealTimer]);

  const snapshotRef = useRef<GameState | null>(null);
  const isHydratedRef = useRef(false);

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;
  const settingsRef = useRef<Settings>(settings);
  settingsRef.current = settings;
  const googleUserRef = useRef<GoogleUser | null>(googleUser);
  googleUserRef.current = googleUser;
  const comicModeRef = useRef(comicMode);
  comicModeRef.current = comicMode;
  const narrativeModeRef = useRef(narrativeMode);
  narrativeModeRef.current = narrativeMode;
  const lastAutoResolvedEncounterRef = useRef<string | null>(null);

  useEffect(() => {
    window.history.pushState({ page: 'game' }, '');

    const handlePopState = () => {
      window.history.pushState({ page: 'game' }, '');

      if (showSettings) { setShowSettings(false); return; }
      if (showMapModal) { setShowMapModal(false); return; }
      if (showRolls) { setShowRolls(false); return; }
      if (showNewGame) { setShowNewGame(false); return; }
      if (showApiSetup) { setShowApiSetup(false); return; }
      if (showCharacterWindow) { setShowCharacterWindow(false); return; }
      if (showMerchantWindow) { setShowMerchantWindow(false); return; }
      if (leftOpen || rightOpen) { setLeftOpen(false); setRightOpen(false); return; }

      if (stateRef.current) {
        setState(null);
        stateRef.current = null;
        setBootPhase('hub');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showSettings, showMapModal, showRolls, showNewGame, showApiSetup, showCharacterWindow, showMerchantWindow, leftOpen, rightOpen]);

  const refreshSaveSlots = useCallbackRef(async () => {
    try {
      const local = await loadGame();
      setLocalSlot(gameStateToLocalSlot(local));
      if (local) ingestCampaignPlates(local);
      const allCloud = await fetchAllCloudSaveSlots();
      setCloudSlots(allCloud);
      setCloudSlot(allCloud[0] ?? null);
      debugLogger.record('SYSTEM', 'Save slots refreshed', {
        hasLocal: !!local,
        hasCloud: allCloud.length > 0,
        cloudCount: allCloud.length,
        localTurn: local?.turn,
        cloudTurn: allCloud[0]?.turn,
      });
    } catch (err) {
      debugLogger.record('ERROR', 'Failed to refresh save slots', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  const applySupabaseSession = useCallbackRef((session: Session | null) => {
    if (!session?.user) {
      setTelemetryContext({ playerId: 'guest' });
      if (googleUserRef.current && !googleUserRef.current.isGuest) {
        setGoogleUser(null);
      }
      setCloudSlot(null);
      setCloudSlots([]);
      void refreshSaveSlots();
      return;
    }

    const meta = session.user.user_metadata ?? {};
    const nextUser: GoogleUser = {
      id: session.user.id,
      credential: session.access_token,
      name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined),
      email: session.user.email ?? undefined,
      picture: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined),
      isGuest: false,
    };
    setGoogleUser(nextUser);
    googleUserRef.current = nextUser;
    setTelemetryContext({ playerId: session.user.id });
    debugLogger.record('SYSTEM', 'Supabase Google session active', {
      userId: session.user.id,
      email: session.user.email,
    });

    // OAuth redirect returns here — skip welcome/auth gates when a session exists.
    setBootPhase((phase) => (phase === 'welcome' || phase === 'auth' ? 'hub' : phase));
    isHydratedRef.current = true;
    void refreshSaveSlots();
    void syncEntitlementsFromServer().then((result) => {
      if (!result.ok || result.skipped) return;
      const next = loadSettings();
      setSettings(next);
      settingsRef.current = next;
      debugLogger.record('SYSTEM', 'Entitlements synced from server', {
        planId: result.planId,
        textPackBalance: result.textPackBalance,
        cosmeticsGranted: result.cosmeticsGranted,
        error: result.error,
      });
    });
    void pullPlayerProfileFromCloud();
  });

  useEffect(() => {
    // Always surface the IndexedDB save on the hub; cloud slot fills in after auth.
    void refreshSaveSlots();
  }, [refreshSaveSlots]);

  useEffect(() => {
    if (!supabase) {
      debugLogger.record('WARN', 'Supabase not configured — Google OAuth + Ops telemetry disabled', {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      });
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) applySupabaseSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySupabaseSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySupabaseSession]);

  useEffect(() => {
    setTelemetryContext({
      aiProvider: settings.aiProvider,
      engineMode: state?.engineMode ?? null,
      saveId: state?.saveId ?? null,
    });
  }, [settings.aiProvider, state?.engineMode, state?.saveId]);

  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Settings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        settingsRef.current = customEvent.detail;
        setComicMode(customEvent.detail.visualMode === 'comic');
        setNarrativeMode(customEvent.detail.visualMode === 'narrative');
      }
    };
    window.addEventListener(SETTINGS_EVENT_NAME, handleSettingsUpdate);
    return () => window.removeEventListener(SETTINGS_EVENT_NAME, handleSettingsUpdate);
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const offerMemorableAdIfCapHit = useCallback((skippedForCapacity?: boolean) => {
    if (
      skippedForCapacity
      && canOfferRewardedMemorable(settingsRef.current.contentMode)
      && canSoftOffer(stateRef.current, { contentMode: settingsRef.current.contentMode })
    ) {
      setOutOfMemorableAdOffer(true);
    }
  }, []);

  const notifyImageFailure = useCallback((error: unknown) => {
    const now = Date.now();
    if (now - lastImageFailToastAtRef.current < 8000) return;
    lastImageFailToastAtRef.current = now;
    addToast(playerFacingImageFailLine(error), 'info');
  }, [addToast]);

  const sceneImageContext = useCallback((
    visualConsistency?: string,
    playerActionContext?: string
  ): ImagePromptContext => {
    const s = stateRef.current;
    return {
      visualConsistency,
      playerActionContext,
      engineMode: s?.engineMode,
      currentLocation: s?.locationSheet?.name || s?.currentLocation,
      campaignPremise: s?.campaignPremise ?? undefined,
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const persist = useCallbackRef(async (s: GameState) => {
    if (!isHydratedRef.current) return;
    debugLogger.record('STATE_UPDATE', 'Persisting game state to storage', {
      turn: s.turn,
      logEntries: s.log.length,
      storyName: s.storyName
    });
    setSaveStatus('saving');
    await saveGame(s);
    ingestCampaignPlates(s);
    setLastSavedTurn(s.turn);
    localStorage.setItem(LOCAL_UPDATED_KEY, String(Date.now()));
    // Best-effort cloud SSOT for signed-in players (IndexedDB stays primary offline cache).
    void syncGameToCloud(s, settingsRef.current).then((result) => {
      if (!result.ok && result.error && result.error !== 'Not signed in' && result.error !== 'Supabase not configured') {
        debugLogger.record('ERROR', 'Cloud save sync failed', { error: result.error });
      }
    });
    setSaveStatus('saved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { setSaveStatus('idle'); }, 2500);
  });

  const keepSentLineOnFail = useCallbackRef((line: string) => {
    const sent = line.trim();
    const live = stateRef.current;
    const snap = snapshotRef.current;
    if (live?.log.some((e) => e.role === 'player' && e.content === sent)) {
      const kept = { ...live, pendingTurn: null };
      stateRef.current = kept;
      setState(kept);
      void persist(kept);
    } else if (snap && sent) {
      const playerEntry: LogEntry = {
        id: uid(),
        turn: snap.turn,
        role: 'player',
        content: sent,
        timestamp: Date.now(),
      };
      const kept = { ...snap, log: [...snap.log, playerEntry], pendingTurn: null };
      stateRef.current = kept;
      setState(kept);
      void persist(kept);
    }
    if (sent) setRestoreDraft(sent);
  });

  const fetchPanelImage = useCallbackRef(async (
    prompt: string,
    settings: Settings,
    promptKind: ImagePromptKind,
    context?: ImagePromptContext,
    hero?: boolean,
    bypassCapacity?: boolean
  ): Promise<string | null> => {
    if (imagesKilled()) {
      debugLogger.record('SYSTEM', 'Ops kill switch: images off');
      if (promptKind === 'milestone-illustration') {
        throw new Error('Hosted image service is unavailable.');
      }
      return null;
    }
    // Classic text: skip routine art; optional memorable-moment splashes still allowed.
    if (!allowsImageGeneration(settings, promptKind)) {
      debugLogger.record('SYSTEM', 'Skipping image generation for classic text mode', { promptKind });
      return null;
    }

    const mode = getContentMode(settings);
    let scenePrompt = prompt;
    if (mode === 'kid') {
      const prepared = prepareKidSafeImagePrompt(prompt, { skipIfUnsalvageable: true });
      if (prepared.skip) {
        debugLogger.record('SYSTEM', 'Skipping kid-unsafe image before API call', {
          promptKind,
        });
        return null;
      }
      scenePrompt = prepared.prompt;
    }
    const builtPrompt = buildImagePromptForKind(scenePrompt, settings, mode, promptKind, context);
    const saveId = stateRef.current?.saveId?.trim() ?? '';
    const promptHash = saveId
      ? hashImageCacheParts([
          saveId,
          promptKind,
          builtPrompt,
          settings.artStylePreset,
          settings.colorVariant,
          settings.imageModel,
          mode,
        ])
      : null;

    if (saveId && promptHash) {
      bindSessionImageCache(saveId);
      try {
        const cached = await getSessionCachedImage(saveId, promptHash);
        if (cached) {
          debugLogger.record('STATE_UPDATE', 'Session image cache hit', {
            saveId,
            promptKind,
            promptHash,
          });
          return cached;
        }
      } catch (cacheError) {
        debugLogger.record('WARN', 'Session image cache read failed — generating fresh', {
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
      }
    }

    const requestImage = (finalPrompt: string) =>
      generateComicImage(finalPrompt, mode, settings, {
        useRawPrompt: true,
        hero: hero === true,
        memorableMoment: promptKind === 'milestone-illustration',
        bypassCapacity: bypassCapacity === true,
        inventoryArt: promptKind === 'item-icon' || promptKind === 'character-portrait',
      });

    const storeIfPossible = async (imageUrl: string | null) => {
      if (!imageUrl || !saveId || !promptHash) return imageUrl;
      try {
        await putSessionCachedImage({
          saveId,
          promptHash,
          imageUrl,
          promptKind,
        });
      } catch {
        // Cache write failures must not fail the turn.
      }
      return imageUrl;
    };

    try {
      const imageUrl = await requestImage(builtPrompt);
      if (!imageUrl) {
        if (promptKind === 'milestone-illustration') {
          throw new Error('Hosted image service is unavailable.');
        }
        return null;
      }
      return await storeIfPossible(imageUrl);
    } catch (e) {
      if (e instanceof ImageModerationError) {
        if (mode === 'kid') {
          notifyImageFailure(e);
          throw e;
        }
        try {
          const softened = buildImagePromptForKind(softenPrompt(scenePrompt), settings, mode, promptKind, context);
          const imageUrl = await requestImage(softened);
          if (!imageUrl) return null;
          return await storeIfPossible(imageUrl);
        } catch (retryErr) {
          notifyImageFailure(retryErr ?? e);
          throw retryErr ?? e;
        }
      }
      debugLogger.record('ERROR', 'Panel image generation failed', {
        error: e instanceof Error ? e.message : String(e),
        prompt: prompt.slice(0, 100),
        promptKind,
        timedOut: e instanceof Error && e.message.includes('timed out'),
      });
      if (promptKind === 'item-icon' || promptKind === 'character-portrait') {
        return null;
      }
      notifyImageFailure(e);
      throw e;
    }
  });

  /** Legendary Loot Video generation — pluggable backend, gracefully returns null until a provider is configured. */
  const fetchLootVideo = useCallbackRef(async (
    prompt: string,
    settings: Settings,
    context?: ImagePromptContext
  ): Promise<string | null> => {
    const mode = getContentMode(settings);
    let scenePrompt = prompt;
    if (mode === 'kid') {
      const prepared = prepareKidSafeImagePrompt(prompt, { skipIfUnsalvageable: true });
      if (prepared.skip) {
        debugLogger.record('SYSTEM', 'Skipping kid-unsafe loot video before API call');
        return null;
      }
      scenePrompt = prepared.prompt;
    }
    const builtPrompt = buildImagePromptForKind(scenePrompt, settings, mode, 'milestone-illustration', context);
    try {
      const videoUrl = await generateVideo(builtPrompt, settings);
      return videoUrl || null;
    } catch (e) {
      debugLogger.record(e instanceof VideoProviderNotConfiguredError ? 'WARN' : 'ERROR', 'Loot video generation failed', {
        error: e instanceof Error ? e.message : String(e),
        prompt: prompt.slice(0, 100),
      });
      return null;
    }
  });

  const schedulePersist = useCallbackRef((snapshot: GameState) => {
    if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    persistDebounceRef.current = setTimeout(() => {
      persist(snapshot);
    }, 800);
  });

  const commitImageState = useCallbackRef((updater: (prev: GameState) => GameState) => {
    const previous = stateRef.current;
    if (!previous) return;
    const updated = updater(previous);
    stateRef.current = updated;
    startTransition(() => {
      setState(updated);
    });
    queueMicrotask(() => {
      schedulePersist(updated);
    });
  });

  /** Immediate state commit when a panel image URL arrives — avoids placeholder lag. */
  const commitPanelImageReady = useCallbackRef((updater: (prev: GameState) => GameState) => {
    const previous = stateRef.current;
    if (!previous) return;
    const updated = updater(previous);
    stateRef.current = updated;
    setState(updated);
    queueMicrotask(() => {
      schedulePersist(updated);
    });
  });

  const enqueueImageGen = useCallbackRef((job: ImageGenJob) => {
    const settings = settingsRef.current;
    if (!allowsImageGeneration(settings, job.promptKind)) {
      debugLogger.record('SYSTEM', 'Skipping image job enqueue for classic text mode', {
        kind: job.kind,
        promptKind: job.promptKind,
      });
      return;
    }
    if (job.kind === 'turn' && job.isMilestone && !job.skipUnlockToast) {
      const entry = stateRef.current?.log.find((e) => e.id === job.entryId);
      addToast(entry?.splashToast?.trim() || `Achievement unlocked — ${splashPlateLabel(entry ?? { turn: 0 })}`, 'success');
    }
    imageGenJobsRef.current.push(job);
    setImageGenEpoch((epoch) => epoch + 1);
  });

  const enqueueVideoGen = useCallbackRef((job: VideoGenJob) => {
    videoGenJobsRef.current.push(job);
    setVideoGenEpoch((epoch) => epoch + 1);
  });

  /** Commits a loot-video URL/status onto its dedicated LogEntry. */
  const commitVideoReady = useCallbackRef((updater: (prev: GameState) => GameState) => {
    const previous = stateRef.current;
    if (!previous) return;
    const updated = updater(previous);
    stateRef.current = updated;
    setState(updated);
    queueMicrotask(() => {
      schedulePersist(updated);
    });
  });

  useEffect(() => {
    if (imageGenRunningRef.current || imageGenJobsRef.current.length === 0) return;

    const jobs = imageGenJobsRef.current.splice(0);
    if (jobs.length === 0) return;

    imageGenRunningRef.current = true;

    const runJobs = async () => {
      try {
        for (const job of jobs) {
          if (job.kind === 'panels') {
            setImagesGenerating(job.prompts.length);
            // Deliberately sequential: starting multiple provider requests at once caused
            // rate-limit failures and stranded panel records in `pending`. Panel N+1 does not
            // begin until panel N has either resolved successfully or been marked `failed`.
            for (const [panelIndex, prompt] of job.prompts.entries()) {

              const commitPanelResult = (imageUrl: string | null, imageStatus: 'ready' | 'failed') => {
                commitPanelImageReady((prev) => {
                  const log = prev.log.map((entry) => {
                    if (entry.id !== job.entryId || !entry.panels?.[panelIndex]) return entry;
                    const panels = entry.panels.map((panel, idx) =>
                      idx === panelIndex
                        ? { ...panel, imageUrl, imageStatus }
                        : panel
                    );
                    const allSettled = panels.every(
                      (panel) =>
                        panel.imageStatus === 'ready'
                        || panel.imageStatus === 'error'
                        || panel.imageStatus === 'failed'
                    );
                    return {
                      ...entry,
                      panels,
                      imageStatus: allSettled
                        ? (panels.some((panel) => panel.imageUrl) ? ('ready' as const) : ('error' as const))
                        : ('pending' as const),
                    };
                  });
                  return { ...prev, log, lastUpdated: Date.now() };
                });
              };

              try {
                debugLogger.record('API_REQUEST', `Generating panel image ${panelIndex + 1}/${job.prompts.length}`, {
                  entryId: job.entryId,
                  prompt: prompt.slice(0, 100),
                  promptKind: job.promptKind,
                });

                const imageUrl = await fetchPanelImage(prompt, settingsRef.current, job.promptKind, sceneImageContext(
                  job.visualContext,
                  panelIndex === 0 ? job.playerActionContext : undefined
                ));
                if (!imageUrl) throw new Error('Image provider returned an empty image URL.');
                commitPanelResult(imageUrl, 'ready');
              } catch (err) {
                debugLogger.record('ERROR', 'Unexpected panel image job failure', {
                  entryId: job.entryId,
                  panelIndex,
                  error: err instanceof Error ? err.message : String(err),
                });
                // Explicit terminal state for this exact panel. The next panel still runs.
                commitPanelResult(null, 'failed');
              } finally {
                setImagesGenerating((count) => Math.max(0, count - 1));
              }
              await yieldToMainThread();
            }
            continue;
          }

          if (job.kind === 'panel-retry') {
            setImagesGenerating((count) => count + 1);
            const panelIndex = job.panelIndex;
            const commitPanelResult = (imageUrl: string | null, imageStatus: 'ready' | 'failed') => {
              commitPanelImageReady((prev) => {
                const log = prev.log.map((entry) => {
                  if (entry.id !== job.entryId || !entry.panels?.[panelIndex]) return entry;
                  const panels = entry.panels.map((panel, idx) =>
                    idx === panelIndex
                      ? { ...panel, imageUrl, imageStatus }
                      : panel
                  );
                  const allSettled = panels.every(
                    (panel) =>
                      panel.imageStatus === 'ready'
                      || panel.imageStatus === 'error'
                      || panel.imageStatus === 'failed'
                  );
                  return {
                    ...entry,
                    panels,
                    imageStatus: allSettled
                      ? (panels.some((panel) => panel.imageUrl) ? ('ready' as const) : ('error' as const))
                      : ('pending' as const),
                  };
                });
                return { ...prev, log, lastUpdated: Date.now() };
              });
            };

            try {
              debugLogger.record('API_REQUEST', 'Retrying failed panel image', {
                entryId: job.entryId,
                panelIndex,
                prompt: job.prompt.slice(0, 100),
              });
              const imageUrl = await fetchPanelImage(job.prompt, settingsRef.current, job.promptKind, sceneImageContext(
                job.visualContext,
                job.playerActionContext
              ));
              if (!imageUrl) throw new Error('Image provider returned an empty image URL.');
              commitPanelResult(imageUrl, 'ready');
            } catch (err) {
              debugLogger.record('ERROR', 'Panel image retry failed', {
                entryId: job.entryId,
                panelIndex,
                error: err instanceof Error ? err.message : String(err),
              });
              commitPanelResult(null, 'failed');
            } finally {
              setImagesGenerating((count) => Math.max(0, count - 1));
            }
            await yieldToMainThread();
            continue;
          }

          if (job.kind === 'turn') {
            setImagesGenerating(job.prompts.length);
            const urls: string[] = [];
            let failMessage: string | undefined;
            for (const prompt of job.prompts) {
              try {
                const imageUrl = await fetchPanelImage(
                  prompt,
                  settingsRef.current,
                  job.promptKind,
                  sceneImageContext(job.visualContext),
                  job.heroImage === true,
                  job.bypassCapacity === true
                );
                if (imageUrl) urls.push(imageUrl);
                else failMessage = failMessage ?? 'Hosted image service is unavailable.';
              } catch (err) {
                failMessage = playerFacingImageFailLine(err);
                debugLogger.record('ERROR', 'Unexpected turn image job failure', {
                  entryId: job.entryId,
                  error: err instanceof Error ? err.message : String(err),
                });
              }
              setImagesGenerating((count) => Math.max(0, count - 1));
              await yieldToMainThread();
            }

            commitImageState((prev) => {
              const log = prev.log.map((entry) => {
                if (entry.id !== job.entryId) return entry;
                if (urls.length > 0) {
                  return {
                    ...entry,
                    imageUrls: urls,
                    imageStatus: 'ready' as const,
                    imageFailMessage: undefined,
                  };
                }
                return {
                  ...entry,
                  entryKind: job.isMilestone ? ('milestone' as const) : entry.entryKind,
                  imageUrls: [],
                  imageStatus: 'error' as const,
                  imageFailMessage: failMessage || 'Hosted image service is unavailable.',
                };
              });
              return { ...prev, log, lastUpdated: Date.now() };
            });

            if (urls.length > 0 && !job.isMilestone) {
              startTransition(() => setCurrentImages(urls));
            }
            continue;
          }

          if (job.kind === 'intro') {
            setImagesGenerating(1);
            try {
              const imageUrl = await fetchPanelImage(job.prompt, settingsRef.current, job.promptKind, sceneImageContext(job.visualContext));
              if (imageUrl) {
                startTransition(() => setCurrentImages([imageUrl]));
              }
            } catch (err) {
              debugLogger.record('ERROR', 'Unexpected intro image job failure', {
                error: err instanceof Error ? err.message : String(err),
              });
            }
            setImagesGenerating(0);
          }
        }
      } catch (err) {
        // Belt-and-suspenders: every job type already isolates its own errors above via its
        // own try/catch, but if something still escapes (for example a state commit bug or
        // abort), any panel/entry that never got a definitive ready/failed status would
        // otherwise stay "pending" forever and the UI spinner would spin indefinitely. Sweep
        // every job from this batch and force-resolve anything still pending to "failed" so
        // the fallback placeholder always renders instead.
        debugLogger.record('ERROR', 'Image generation queue failed unexpectedly — force-resolving stuck panels to error', {
          error: err instanceof Error ? err.message : String(err),
        });
        const stuckEntryIds = new Set(
          jobs
            .filter((j) => j.kind === 'panels' || j.kind === 'panel-retry' || j.kind === 'turn')
            .map((j) => j.entryId)
        );
        if (stuckEntryIds.size > 0) {
          commitPanelImageReady((prev) => {
            const log = prev.log.map((entry) => {
              if (!stuckEntryIds.has(entry.id)) return entry;
              if (entry.panels && entry.panels.length > 0) {
                const panels = entry.panels.map((p) =>
                  p.imageStatus === 'pending' ? { ...p, imageStatus: 'failed' as const } : p
                );
                return {
                  ...entry,
                  panels,
                  imageStatus: entry.imageStatus === 'pending' ? ('error' as const) : entry.imageStatus,
                };
              }
              return entry.imageStatus === 'pending' ? { ...entry, imageStatus: 'error' as const } : entry;
            });
            return { ...prev, log, lastUpdated: Date.now() };
          });
        }
      } finally {
        imageGenRunningRef.current = false;
        setImagesGenerating(0);
        if (imageGenJobsRef.current.length > 0) {
          setImageGenEpoch((epoch) => epoch + 1);
        }
      }
    };

    void runJobs();
  }, [imageGenEpoch, commitImageState, commitPanelImageReady, fetchPanelImage]);

  // Separate queue for Legendary Loot Videos — deliberately isolated from the image queue
  // above so a slow/hanging video request can never delay panel images on later turns.
  useEffect(() => {
    if (videoGenRunningRef.current || videoGenJobsRef.current.length === 0) return;

    const jobs = videoGenJobsRef.current.splice(0);
    if (jobs.length === 0) return;

    let cancelled = false;
    videoGenRunningRef.current = true;

    const runVideoJobs = async () => {
      try {
        for (const job of jobs) {
          if (cancelled) return;
          setVideosGenerating((count) => count + 1);

          let videoUrl: string | null = null;
          try {
            debugLogger.record('API_REQUEST', 'Generating loot video', {
              entryId: job.entryId,
              prompt: job.prompt.slice(0, 100),
            });
            videoUrl = await fetchLootVideo(job.prompt, settingsRef.current, sceneImageContext(job.visualContext));
          } catch (err) {
            debugLogger.record('ERROR', 'Unexpected loot video job failure', {
              entryId: job.entryId,
              error: err instanceof Error ? err.message : String(err),
            });
          }

          if (!cancelled) {
            commitVideoReady((prev) => {
              const log = prev.log.map((entry) =>
                entry.id === job.entryId
                  ? { ...entry, videoUrl: videoUrl ?? null, imageStatus: videoUrl ? ('ready' as const) : ('error' as const) }
                  : entry
              );
              return { ...prev, log, lastUpdated: Date.now() };
            });
          }
          setVideosGenerating((count) => Math.max(0, count - 1));
        }
      } catch (err) {
        debugLogger.record('ERROR', 'Loot video queue failed unexpectedly', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        videoGenRunningRef.current = false;
        setVideosGenerating(0);
        if (!cancelled && videoGenJobsRef.current.length > 0) {
          setVideoGenEpoch((epoch) => epoch + 1);
        }
      }
    };

    void runVideoJobs();

    return () => {
      cancelled = true;
    };
  }, [videoGenEpoch, commitVideoReady, fetchLootVideo]);

  useEffect(() => {
    if (postCommitTurnRunningRef.current || postCommitTurnEffectsRef.current.length === 0) return;

    const batches = postCommitTurnEffectsRef.current.splice(0);
    postCommitTurnRunningRef.current = true;

    const runPostCommitEffects = async () => {
      try {
        for (const batch of batches) {
          try {
            await persist(batch.snapshot);
          } catch (persistError) {
            debugLogger.record('ERROR', 'Turn state persistence failed after commit', {
              error: persistError instanceof Error ? persistError.message : String(persistError),
            });
          }

          if (batch.speech.kind === 'sequence') {
            voice.speakSequence(batch.speech.texts);
          } else {
            voice.speak(batch.speech.text);
          }

          for (const imageJob of batch.imageJobs) {
            enqueueImageGen(imageJob);
          }
          if (batch.videoJob) {
            enqueueVideoGen(batch.videoJob);
          }
        }
      } finally {
        postCommitTurnRunningRef.current = false;
        if (postCommitTurnEffectsRef.current.length > 0) {
          setPostCommitTurnEpoch((epoch) => epoch + 1);
        }
      }
    };

    void runPostCommitEffects();
  }, [postCommitTurnEpoch, enqueueImageGen, enqueueVideoGen, persist, voice]);

  // Explicitly defined loadDungeon function to resolve the ReferenceError
  const loadDungeon = useCallbackRef((blueprintId: string, dungeonName: string, isProcedural: boolean = false, tier: MapTier = 4, nodeCount?: number) => {
    const previous = stateRef.current;
    if (!previous) return;
    let dungeonState = initializeDungeon(blueprintId, dungeonName, isProcedural, tier, previous.currentCoordinates, nodeCount);
    dungeonState = seedDungeonState(dungeonState, previous.seed || 'seed');
    if (settingsRef.current.fogRevealThreshold === 'full') {
      dungeonState.visitedNodeIds = dungeonState.nodes.map(n => n.id);
    }
    const locMem = advanceLocationMemory(previous, dungeonName);
    const sheet = mergeSheetWithNode(
      locMem.locationSheet ?? ensureLocationSheet({ ...previous, ...locMem }),
      currentDungeonNode(dungeonState)
    );
    const updated: GameState = {
      ...previous,
      ...locMem,
      locationSheet: sheet,
      activeDungeon: dungeonState,
      currentLocation: dungeonName,
      timeline: mergeTimeline(previous.timeline, [
        {
          id: uid(),
          turn: previous.turn,
          kind: 'dungeon',
          text: `Entered dungeon: ${dungeonName}`,
          at: Date.now(),
        },
      ]),
      lastUpdated: Date.now(),
    };
    stateRef.current = updated;
    setState(updated);
    void persist(updated);
    addToast(`Entered: ${dungeonName}`, 'info');
  });

  const hydratePlayFromLog = useCallbackRef((opts?: { persist?: boolean }) => {
    const previous = stateRef.current;
    if (!previous) return;
    const blob = harvestPlayText(previous.log, [
      previous.currentLocation ?? '',
      previous.locationSheet?.name ?? '',
    ]);
    const clamped = clampLeakedOpeningQuests(previous);
    const quests = clamped.quests ?? [];
    const landmarks = extractNamedPlaces(blob);
    const place = mapAnchorName(
      previous.currentLocation || previous.locationSheet?.name,
      landmarks
    );
    let areaMap = previous.activeDungeon ?? null;
    if (!isExplorableDungeon(areaMap)) {
      areaMap = resolvePlayAreaMap(areaMap, place, landmarks, previous.currentCoordinates);
    }
    const nextLocation =
      isGenericMapPlace(previous.currentLocation) && place ? place : previous.currentLocation;
    const questsChanged = JSON.stringify(quests) !== JSON.stringify(previous.quests ?? []);
    const mapChanged = areaMap !== previous.activeDungeon;
    const locationChanged = nextLocation !== previous.currentLocation;
    if (!questsChanged && !mapChanged && !locationChanged) return;
    const sheet = previous.locationSheet
      ? normalizeSheetAuthority(previous.locationSheet, areaMap)
      : previous.locationSheet;
    const updated: GameState = {
      ...previous,
      quests,
      activeDungeon: areaMap,
      currentLocation: nextLocation,
      locationSheet: sheet ?? previous.locationSheet,
      lastUpdated: Date.now(),
    };
    stateRef.current = updated;
    setState(updated);
    if (opts?.persist !== false) void persist(updated);
  });

  const ensureLocalMap = useCallbackRef(() => {
    hydratePlayFromLog();
  });

  const moveDungeonNode = useCallbackRef((targetNodeId: string) => {
    const previous = stateRef.current;
    if (!previous?.activeDungeon) return;
    let updatedDungeon = moveToNode(previous.activeDungeon, targetNodeId);
    updatedDungeon = seedDungeonState(updatedDungeon, previous.seed || 'seed');
    const threshold = settingsRef.current.fogRevealThreshold ?? 'adjacent';
    if (threshold === 'full') {
      updatedDungeon.visitedNodeIds = updatedDungeon.nodes.map(n => n.id);
    } else if (threshold === 'adjacent') {
      const currentNode = updatedDungeon.nodes.find(n => n.id === targetNodeId);
      if (currentNode) {
        const visited = new Set([...updatedDungeon.visitedNodeIds, ...currentNode.connections]);
        updatedDungeon.visitedNodeIds = Array.from(visited);
      }
    }
    const node = currentDungeonNode(updatedDungeon);
    const placeName = node
      ? `${updatedDungeon.dungeonName} — ${node.name}`
      : previous.currentLocation;
    const locMem = advanceLocationMemory(previous, placeName);
    const sheet = mergeSheetWithNode(
      locMem.locationSheet ?? ensureLocationSheet({ ...previous, ...locMem }),
      node
    );
    const updated = {
      ...previous,
      ...locMem,
      locationSheet: sheet,
      activeDungeon: updatedDungeon,
      lastUpdated: Date.now(),
    };
    stateRef.current = updated;
    setState(updated);
    void persist(updated);
  });

  const exitDungeon = useCallbackRef(() => {
    const previous = stateRef.current;
    if (!previous) return;
    const backName = previous.previousLocationSheet?.name || previous.currentLocation || 'Outside';
    const locMem = advanceLocationMemory(previous, backName);
    const updated = {
      ...previous,
      ...locMem,
      activeDungeon: engineExitDungeon(),
      lastUpdated: Date.now(),
    };
    stateRef.current = updated;
    setState(updated);
    void persist(updated);
    setShowMapModal(false);
    addToast('Exited active map zone', 'info');
  });

  const sendAction = useCallbackRef(async (input: string) => {
    if (!input.trim() || busy || turnInFlightRef.current) return;
    if (
      turnPhase === 'reading'
      || turnPhase === 'resolving'
      || (turnPhase === 'revealing' && streamingReveal && !streamingReveal.done)
    ) {
      return;
    }
    let current = stateRef.current;
    if (!current) return;
    if (current.pendingTurn) {
      addToast('Accept, edit, or discard the pending turn first.', 'info');
      return;
    }

    let skipRepairDetection = false;
    if (current.pendingRepair) {
      const picked = matchRepairOption(input, current.pendingRepair);
      if (!picked) {
        addToast('Pick one of the repair options or tap a button below.', 'info');
        setRestoreDraft(input);
        return;
      }
      input = buildClarifiedInput(current.pendingRepair.playerInput, picked);
      const cleared = { ...current, pendingRepair: null };
      stateRef.current = cleared;
      setState(cleared);
      current = cleared;
      skipRepairDetection = true;
    }
    const lastVisible = [...current.log].reverse().find((e) => {
      if (e.role === 'player') return !!e.content?.trim();
      if (e.role === 'gm') return hasRealGmStory(e);
      return false;
    });
    const sameAsLastPlayer =
      lastVisible?.role === 'player'
      && lastVisible.content.replace(/\s+/g, ' ').trim().toLowerCase()
        === input.replace(/\s+/g, ' ').trim().toLowerCase();
    const unansweredRetry = sameAsLastPlayer;
    turnInFlightRef.current = true;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    let sanitizedInput = '';
    let textTurnSpent = false;
    let honeymoonSpent = false;
    const refundSpentTextTurn = () => {
      if (textTurnSpent) {
        textTurnSpent = false;
        refundCapacity('text');
      }
      if (honeymoonSpent) {
        honeymoonSpent = false;
        const s = stateRef.current;
        if (s) {
          const restored = {
            ...s,
            storyStartTextTurnsRemaining: (s.storyStartTextTurnsRemaining ?? 0) + 1,
          };
          stateRef.current = restored;
          setState(restored);
        }
      }
    };
    try {
    debugLogger.record('TURN_START', 'sendAction invoked', {
      input: input.slice(0, 100),
      currentTurn: current.turn,
      busy
    });

    const mode = settingsRef.current.contentMode === 'kid' ? 'kid' : 'adult';
    const mediated = mediatePlayerInput(input);
    if (mediated.action === 'block') {
      addToast(mediated.playerMessage ?? "That action isn't available.", 'info');
      setRestoreDraft(input);
      turnInFlightRef.current = false;
      return;
    }

    // Opening covers + establishment generation are free (hook the player before the meter bites).
    const freeOpeningTurn =
      isOpeningEstablishmentPending(current) || !!current.pendingGeneratedOpening;

    // Local repair — clarify before GM spend (conservative detectors; false negatives OK).
    if (
      !skipRepairDetection
      && !current.pendingRepair
      && !freeOpeningTurn
      && !isOpeningEstablishmentPending(current)
    ) {
      const repairSituation = detectRepairSituation(mediated.text, current);
      if (repairSituation) {
        const voiceId = resolveRepairVoiceId(current, settingsRef.current.gmVoiceProfileId);
        const copy = pickRepairCopy({
          situation: repairSituation,
          engineMode: current.engineMode,
          voiceId,
          kidMode: mode === 'kid',
        });
        const repairOptions = copy.options ?? extractRepairOptions(copy.message);
        const repairPlayerEntry: LogEntry = {
          id: uid(),
          turn: current.turn,
          role: 'player',
          content: mediated.text,
          timestamp: Date.now(),
        };
        setState((s) =>
          s
            ? {
                ...s,
                pendingRepair: {
                  id: crypto.randomUUID(),
                  situation: repairSituation,
                  playerInput: mediated.text,
                  message: copy.message,
                  options: repairOptions,
                  createdAt: Date.now(),
                },
                log: [...s.log, repairPlayerEntry],
              }
            : s
        );
        setRestoreDraft(mediated.text);
        turnInFlightRef.current = false;
        return;
      }
    }

    const honeymoonLeft = Math.max(0, current.storyStartTextTurnsRemaining ?? 0);

    // Sync tier + spend a text turn from story-start bonus, then capacity ledger.
    // Test Lab: route writer/image catalog via Free/Mid/High preview without burning caps.
    setActiveSubscriptionTier(
      isTestLabEnabled()
        ? effectiveWriterTier(settingsRef.current.subscriptionTier)
        : (settingsRef.current.subscriptionTier ?? 'free')
    );
    if (!freeOpeningTurn) {
      if (honeymoonLeft > 0) {
        honeymoonSpent = true;
      } else if (!canSpend('text')) {
        addToast(capacityStatusMessage('text'), 'info');
        if (canSoftOffer(current, { contentMode: settingsRef.current.contentMode })) {
          setOutOfTurnsAdOffer(true);
        }
        setRestoreDraft(input);
        turnInFlightRef.current = false;
        return;
      } else {
        spendCapacity('text');
        textTurnSpent = true;
      }
    }

    // Diegetic content rewrite confirm (Pack 7)
    const pendingRewrite = current.pendingContentRewrite;
    let rewriteSource = mediated.text;
    if (pendingRewrite) {
      const proceed = /^(proceed|yes|y|ok|okay|confirm|continue)\b/i.test(mediated.text.trim())
        || mediated.text.trim().toLowerCase() === pendingRewrite.rewritten.toLowerCase();
      if (proceed) {
        rewriteSource = pendingRewrite.rewritten;
        setState((s) => (s ? { ...s, pendingContentRewrite: null } : s));
      } else if (/^(cancel|no|nope|nevermind|try\s+else)\b/i.test(mediated.text.trim())) {
        setState((s) => (s ? { ...s, pendingContentRewrite: null } : s));
        addToast('System clears the interpretation. Try another action.', 'info');
        refundSpentTextTurn();
        setRestoreDraft(input);
        turnInFlightRef.current = false;
        return;
      } else {
        // New free-text cancels pending rewrite and continues with new text
        setState((s) => (s ? { ...s, pendingContentRewrite: null } : s));
      }
    } else {
      const nsfwTurn = isNsfwCampaign(getCampaignBibleById(stateRef.current?.campaignBibleId ?? ''));
      const soft = maybeRatingRewrite(mediated.text, settingsRef.current, { nsfw: nsfwTurn });
      if (soft) {
        if (settingsRef.current.confirmContentRewrites !== false) {
          setState((s) =>
            s
              ? {
                  ...s,
                  pendingContentRewrite: {
                    rewritten: soft.rewritten,
                    message: soft.diegeticMessage,
                    original: mediated.text,
                  },
                  choices: ['Proceed with System interpretation', 'Try something else'],
                  log: [
                    ...s.log,
                    {
                      id: crypto.randomUUID(),
                      turn: s.turn,
                      role: 'system',
                      content: soft.diegeticMessage,
                      timestamp: Date.now(),
                      systemLog: [soft.diegeticMessage],
                    },
                  ],
                }
              : s
          );
          addToast(soft.diegeticMessage, 'info');
          refundSpentTextTurn();
          turnInFlightRef.current = false;
          return;
        }
        rewriteSource = soft.rewritten;
        addToast(soft.diegeticMessage, 'info');
      }
    }

    const contentSanitized = mode === 'kid' ? filterKidModeText(rewriteSource) : rewriteSource;
    const lastGmForGround = current.log.filter((l) => l.role === 'gm').pop()?.content ?? '';
    const storyProseForGround = normalizeStoryCorpus(lastGmForGround);
    const openingPending = isOpeningEstablishmentPending(current);
    const grounded = openingPending
      ? { text: contentSanitized, intent: parsePlayerIntent(contentSanitized, current), rewritten: false, notes: [] as string[] }
      : groundPlayerAction(contentSanitized, current, storyProseForGround);
    sanitizedInput = grounded.text;
    if (grounded.rewritten) {
      addToast(`Action grounded: ${grounded.notes[0] ?? 'adjusted to match scene/inventory'}`, 'info');
    }

    debugLogger.record('STATE_UPDATE', 'Input sanitized', {
      original: input.slice(0, 50),
      sanitized: sanitizedInput.slice(0, 50),
      grounded: grounded.rewritten,
      mode
    });
    logPlayerAction(sanitizedInput, {
      turn: current.turn,
      engineMode: current.engineMode,
      saveId: current.saveId,
    });

    setBusy(true);
    setError(null);
    setErrorKind(null);
    resetTurnUi();
    phaseTimersRef.current.reading = setTimeout(() => {
      if (turnInFlightRef.current) setTurnPhase('reading');
    }, 300);
    phaseTimersRef.current.resolving = setTimeout(() => {
      if (turnInFlightRef.current) setTurnPhase('resolving');
    }, 900);
    lastInputRef.current = input;
    setLastInput(input);

    const lastGmText = lastGmForGround;
    saveHabit(sanitizedInput, lastGmText);

    loadingTimer = setTimeout(() => setShowLoadingOverlay(true), 2500);

    const hideChipSpeech =
      isOpeningEstablishmentPending(current) && isOpeningSetupChipLabel(contentSanitized);

    const playerEntry: LogEntry = {
      id: uid(),
      turn: current.turn,
      role: 'player',
      content: contentSanitized,
      timestamp: Date.now(),
    };

    snapshotRef.current = current;
    setCanRewind(true);
    turnAbortRef.current?.abort();
    const turnAbort = new AbortController();
    turnAbortRef.current = turnAbort;
    try {
      await persist(current);
    } catch (persistError) {
      debugLogger.record('ERROR', 'Pre-overlay persist failed', {
        error: persistError instanceof Error ? persistError.message : String(persistError),
      });
    }

    // Commit the optimistic player entry as a concrete snapshot. Do not derive later turn
    // work inside a React updater: updater execution may be deferred or repeated by React,
    // which previously left `stateRef` stale and made post-turn media jobs timing-dependent.
    // Strip the previous GM closer so "What do you do?" cannot sit under this new command.
    const priorLog = current.log.map((entry, i, arr) => {
      const laterGm = arr.slice(i + 1).some((e) => e.role === 'gm');
      if (entry.role !== 'gm' || laterGm) return entry;
      const stripped = stripChoiceList(entry.content);
      return stripped === entry.content ? entry : { ...entry, content: stripped };
    });
    const nextStoryStart = Math.max(
      0,
      (current.storyStartTextTurnsRemaining ?? 0) - (honeymoonSpent ? 1 : 0)
    );
    const optimisticState: GameState = unansweredRetry
      ? { ...current, pendingTurn: null, storyStartTextTurnsRemaining: nextStoryStart }
      : {
          ...current,
          storyStartTextTurnsRemaining: nextStoryStart,
          log: hideChipSpeech ? priorLog : [...priorLog, playerEntry],
        };
    stateRef.current = optimisticState;
    setState(optimisticState);
    void persist(optimisticState);
    hydratePlayFromLog({ persist: false });

      let liveCurrent = stateRef.current;
      if (!liveCurrent) return;
      const questsAtTurnStart = liveCurrent.quests ?? [];
      liveCurrent = applySystemRename(
        {
          ...liveCurrent,
          inventory: dropInsultGear(liveCurrent.inventory),
          character: isJunkSetupValue(liveCurrent.character.appearance)
            ? { ...liveCurrent.character, appearance: 'everyday street clothes' }
            : liveCurrent.character,
        },
        contentSanitized
      );

      if (isOpeningEstablishmentPending(current) || liveCurrent.pendingGeneratedOpening) {
        const stepped = isOpeningEstablishmentPending(current)
          ? await applyOpeningAnswer(liveCurrent, contentSanitized, settingsRef.current)
          : { state: { ...liveCurrent, pendingGeneratedOpening: false }, generateOpening: true };

        if (!stepped.generateOpening) {
          refundSpentTextTurn();
          stateRef.current = stepped.state;
          setState(stepped.state);
          void persist(stepped.state);
          return;
        }

        const openingState = { ...stepped.state, pendingGeneratedOpening: false };
        let openingText = '';
        let openingRaw = '';
        try {
          const openingResult = await callGm(
            openingState,
            `${buildOpeningSceneMandate(openingState, stepped.openingNotes)}\n\n${
              openingState.openingEstablishment?.sceneWritten
                ? 'Continue the opening scene now — do not restart.'
                : 'Write the opening scene now.'
            }`,
            settingsRef.current,
            [],
            (attempt, delayMs) => {
              setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
            },
            turnAbort.signal,
          );
          openingRaw = openingResult.text;
          openingText = stripChoiceList(stripActionTags(openingResult.text));
        } catch {
          openingText = '';
        }
        if (!openingText || openingText.length < 60 || isGenericBridgeNarrative(openingText)) {
          openingText = synthesizeOpeningScene(openingState);
        }
        openingText = ensureSystemReceipt(openingState, sanitizeOpeningNarration(openingText));
        openingText = applyProseWarden(
          enforcePerspective(openingText, settingsRef.current, openingState.character.name),
          { currentLocation: openingState.currentLocation },
        );
        if (settingsRef.current.contentMode === 'kid') {
          openingText = filterKidModeText(openingText);
        }
        const openingChoices = extractChoicesFromText(openingText, openingState);
        const cleanOpening = stripChoiceList(openingText);
        const openingBible = getCampaignBibleById(openingState.campaignBibleId ?? '');
        const journalReady = !questsLockedDuringOpening(openingState);
        const questsAfterScene = journalReady
          ? revealLocalStarterQuest(
              openingState.quests ?? [],
              openingBible?.starterQuests ?? []
            )
          : openingState.quests ?? [];
        const openingUnlocks = journalReady
          ? newlyRevealedQuests(questsAtTurnStart, questsAfterScene)
          : [];
        const openingTurn = openingState.turn + 1;
        const openingEvents = parseActionTags(openingRaw || openingText);
        const openingMemorable = decideClassicMemorable(
          {
            settings: settingsRef.current,
            state: openingState,
            turn: openingTurn,
            storyText: cleanOpening,
            writerTag: eventsToMilestone(openingEvents),
            events: openingEvents,
            lootVideo: eventsToLootVideo(openingEvents),
            isOpeningSceneTurn:
              !openingState.openingEstablishment?.sceneWritten
              || openingSplashStillDue(openingState),
            characterHp: openingState.character.hp,
            characterConditions: openingState.character.conditions ?? [],
            gainedItems: [],
          },
          canSpend('memorable')
        );
        offerMemorableAdIfCapHit(openingMemorable.skippedForCapacity);
        const harvestedOpening = openingState.openingEstablishment
          ? applyHarvestedOpeningCovers(openingState.openingEstablishment, cleanOpening)
          : openingState.openingEstablishment;
        const openingGm: LogEntry = {
          id: uid(),
          turn: openingState.turn,
          role: 'gm',
          content: cleanOpening,
          timestamp: Date.now(),
          systemLog: [
            ...litrpgOpeningSystemPing(openingState),
            ...openingUnlocks.map((q) => `Quest Unlocked: ${q.name}`),
          ],
          ...memorableLogFields(openingMemorable),
        };
        const seeded = seedOpeningSceneFacts({ ...openingState, turn: openingTurn });
        const sceneFacts = applyCommittedNarrative(
          { ...openingState, sceneFacts: seeded, turn: openingTurn },
          cleanOpening,
          openingTurn
        );
        const committed: GameState = {
          ...openingState,
          turn: openingTurn,
          sceneFacts,
          quests: questsAfterScene,
          log: [...openingState.log, openingGm],
          choices: harvestedOpening?.pending?.length
            ? establishmentChoices(harvestedOpening.pending)
            : openingChoices.length
              ? openingChoices
              : undefined,
          openingEstablishment: harvestedOpening
            ? { ...harvestedOpening, sceneWritten: true }
            : harvestedOpening,
          memorableMoments: openingMemorable.nextState,
          lastUpdated: Date.now(),
        };
        stateRef.current = committed;
        setState(committed);
        void persist(committed);
        if (openingUnlocks.length) setUnlockedQuests(openingUnlocks);
        if (
          openingMemorable.request
          && allowsImageGeneration(settingsRef.current, 'milestone-illustration')
        ) {
          enqueueImageGen({
            kind: 'turn',
            entryId: openingGm.id,
            prompts: [openingMemorable.request.imagePrompt],
            promptKind: 'milestone-illustration',
            visualContext: buildVisualConsistencyBlock(committed, []),
            isMilestone: true,
            heroImage: false,
            bypassCapacity: memorableBypassesWeeklyCap(openingMemorable.beat),
          });
        }
        return;
      }

      if (!liveCurrent.sceneFacts) {
        const lastGm = [...liveCurrent.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
        liveCurrent = {
          ...liveCurrent,
          sceneFacts: lastGm
            ? extractSceneFacts(lastGm, undefined, liveCurrent.turn)
            : seedOpeningSceneFacts(liveCurrent),
        };
      }

      const typedAction = contentSanitized;
      const interpreted = await interpretPlayerUtterance({
        raw: typedAction,
        mode: 'play',
        lastScene: storyProseForGround,
        settings: settingsRef.current,
        // Local parse already has the act — skip the extra small-model round trip.
        skipModel: grounded.intent.kind !== 'other' || grounded.rewritten,
      });
      if (!grounded.rewritten && interpreted.messy && interpreted.meaning) {
        sanitizedInput = interpreted.meaning;
      }

      const intentForMandate =
        interpreted.intent.kind !== 'other'
          ? interpreted.intent
          : grounded.intent.kind !== 'other'
            ? grounded.intent
            : parsePlayerIntent(sanitizedInput, liveCurrent);

      const accuseBible = getCampaignBibleById(liveCurrent.campaignBibleId ?? '');
      const accusedState = applyAccusationFromInput(liveCurrent, sanitizedInput, accuseBible);
      if (accusedState !== liveCurrent) {
        liveCurrent = accusedState;
        stateRef.current = accusedState;
      }

      const check = runPlayerCheck(liveCurrent, intentForMandate, sanitizedInput);
      const d20Roll = check.d20;
      const strMod = check.modifier;
      const difficultyClass = check.dc;
      const outcome = check;
      liveCurrent = maybeEnterInteriorDungeon(liveCurrent, sanitizedInput);
      if (
        intentForMandate.kind === 'attack'
        || intentForMandate.kind === 'move'
        || /\b(enter|scout|forward|sneak|aisle|inside)\b/i.test(sanitizedInput)
      ) {
        liveCurrent = spawnRoomEncounter(liveCurrent);
      }
      let ledgerRound: LedgerCombatRound | null = null;
      if (intentForMandate.kind === 'attack') {
        liveCurrent = spawnRoomEncounter(liveCurrent);
        const resolved = resolveLedgerCombat(liveCurrent, check);
        if (resolved) {
          liveCurrent = resolved.state;
          ledgerRound = resolved.round;
        }
      }
      const outcomeToken = buildOutcomeToken(check, intentForMandate, {
        kitWeapon: equippedWeaponName(liveCurrent),
        combat: ledgerRound ?? undefined,
        dungeonRemaining: remainingDungeonMobs(liveCurrent),
      });

      const isDndEngine = liveCurrent.engineMode === 'dnd';
      const codeResolutionText = check.codeResolutionText;
      const narrativeOutcomeLabel = check.narrativeOutcomeLabel;
      const refuseGate =
        intentForMandate.kind === 'refuse' || intentForMandate.kind === 'talk' || isSpeechOrProtest(typedAction)
          ? `\n[SPEECH / PROTEST GATE]: The player spoke or protested. Honor their typed line as dialogue. Someone in the scene answers THAT line. Do not replace it with a pocket-search, kit recap, or physical follow-through. Do not skip their words. If they asked a clarifying question, answer with concrete terms — never stall with "awaits your response" or soft-reset the ask. If they are refusing / did not agree, narrate the System's cold acknowledgment in-fiction. Do not say "choose an action to continue." Never call anyone "someone nearby" as a name.`
          : '';

      logRollResults([
        {
          label: 'action_check',
          total: outcome.totalScore,
          detail: check.skippedRoll
            ? `Dialogue — no contested check`
            : `d20=${d20Roll} mod=${strMod} dc=${difficultyClass} ${check.label} ${outcome.isSuccess ? 'SUCCESS' : 'FAILURE'}`,
        },
      ]);

      // Never silently apply HP for failed skill checks — damage must come from explicit
      // <damage> tags (and be narrated). Silent -2 on every fail made HP drop "for no reason".
      // Crit-fail trap risk is hinted to the GM via code outcome; sticky HP still needs <damage>.
      let engineHpDelta = 0;

      let worldLedger = normalizeWorldLedger(liveCurrent.worldLedger);
      const preTick = tickWorld(
        worldLedger,
        daysForPlayerAction(sanitizedInput, intentForMandate),
        liveCurrent.seed,
        liveCurrent.character.level,
      );
      worldLedger = preTick.ledger;
      const caravanSim = simulateMerchantTurn(worldLedger.caravans);
      worldLedger = {
        ...worldLedger,
        caravans: caravanSim.updatedCaravans,
        pendingHiddenEvents: [...worldLedger.pendingHiddenEvents, ...caravanSim.newEvents],
      };
      const visitReports = reportsForVisit(
        worldLedger,
        sanitizedInput,
        liveCurrent.currentLocation,
      );
      let hiddenSimUpdate = formatTickForGm(preTick, visitReports);
      if (worldLedger.pendingHiddenEvents.length > 0) {
        const [revealedEvent, ...restEvents] = worldLedger.pendingHiddenEvents;
        worldLedger = { ...worldLedger, pendingHiddenEvents: restEvents };
        hiddenSimUpdate = `${hiddenSimUpdate}\n[DISCOVERED BACKGROUND EVENT]: ${revealedEvent}`;
      }
      liveCurrent.worldLedger = worldLedger;
      if (preTick.goldPaid > 0) {
        liveCurrent.gold = Math.max(0, (liveCurrent.gold ?? 0) + preTick.goldPaid);
      }
      let extraWeekGold = 0;
      const worldNotes: string[] = [];
      if (preTick.weeksResolved > 0 && preTick.goldPaid > 0) {
        worldNotes.push(`Weekly cut: +${preTick.goldPaid}g`);
      }

      const unsupportedItems = findUnsupportedItemClaims(sanitizedInput, liveCurrent);
      const inventoryGate = unsupportedItems.length
        ? `\n[INVENTORY GATE — MANDATORY]: Player attempted to use item(s) NOT in inventory: ${unsupportedItems.join(', ')}. REJECT the use. Do not invent the item. Narrate the failed attempt, emit <system>Action failed: item not in inventory.</system>, and offer alternatives based on Equipped Gear / Inventory only.`
        : '';
      const groundingGate = grounded.notes.length
        ? `\n[SCENE GROUNDING GATE]: Player input was soft-corrected for: ${grounded.notes.join('; ')}. Stay inside Situation Packet + Inventory + Timeline. Do not invent the rejected premise.`
        : '';
      const actionGates = `${inventoryGate}${groundingGate}${refuseGate}`;
      const outcomeBlock = formatOutcomeTokenForPrompt(outcomeToken, !isDndEngine);

      // LitRPG/RPG: keep dice math out of the model-facing story cue so it is less likely to echo into prose.
      const outcomeCue = check.skippedRoll
        ? `DIALOGUE TURN (no contested check): Answer the player's spoken line / question directly. Do not invent a Social failure, soft-reset the ask, stall with "awaits your response", or paste a prior paragraph.`
        : `OUTCOME FOR THIS ACTION: ${isDndEngine ? codeResolutionText : narrativeOutcomeLabel}`;
      const deterministicStateBlock = isDndEngine
        ? `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${liveCurrent.character.name} (Lvl ${liveCurrent.character.level})
HP: ${liveCurrent.character.hp}/${liveCurrent.character.maxHp}
Gold: ${liveCurrent.gold ?? 0}
${outcomeCue}
${outcomeBlock}${hiddenSimUpdate}${actionGates}
-------------------------------------------------
`
        : `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${liveCurrent.character.name} (Lvl ${liveCurrent.character.level})
HP: ${liveCurrent.character.hp}/${liveCurrent.character.maxHp}
Gold: ${liveCurrent.gold ?? 0}
${outcomeCue}
${outcomeBlock}
${check.skippedRoll ? '' : `HIDDEN LEDGER OUTCOME: ${narrativeOutcomeLabel}. Narrate story consequences only.`}
Do NOT print dice notation, d20 lines, modifiers, DCs, "Strength Check:", "Action Check", "Action Resolved", or "CODE ENFORCED" anywhere — not in narrative, not in <narrative> panels, and not in <system-log>.
In <system-log>, only emit LitRPG/RPG progression lines when something actually changed (XP gain, loot, HP change). Never emit XP Gained: 0 or bare XP:0/300 / HP dumps. Story beat first, then System chrome — never System-only.${hiddenSimUpdate}${actionGates}
-------------------------------------------------
`;

      const recentNarrative = liveCurrent.log.slice(-4).map((e) => e.content).join(' ');
      const activeLoreCards = matchLoreCards(input, recentNarrative, liveCurrent.lorebook ?? []);

      // Cross-mode scene focus: reveal quests only when asked; bind the turn to the player's action.
      const revealedQuests = maybeRevealQuestsFromPlayerAction(liveCurrent, sanitizedInput);
      if (revealedQuests !== liveCurrent.quests) {
        liveCurrent.quests = revealedQuests;
        stateRef.current = { ...liveCurrent };
      }
      const turnMandate = buildTurnMandate(sanitizedInput, intentForMandate, liveCurrent, typedAction);
      const gmPlayerPayload = buildResolutionUserPayload({
        mandateBlock: turnMandate.block,
        playerAction: sanitizedInput,
        deterministicBlock: deterministicStateBlock,
        retry: false,
        intent: intentForMandate,
      });

      debugLogger.record('API_REQUEST', 'Calling callGm for narrative generation', {
        turn: liveCurrent.turn,
        inputLength: sanitizedInput.length,
        aiProvider: settingsRef.current.aiProvider,
        hasApiKey: !!(settingsRef.current.geminiApiKey || settingsRef.current.openrouterApiKey)
      });
      const gmStartTime = performance.now();
      let result = await callGm(liveCurrent, gmPlayerPayload, settingsRef.current, activeLoreCards, (attempt, delayMs) => {
        debugLogger.record('WARN', `Rate limited — retry ${attempt}/4`, { delayMs });
        setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
      }, turnAbort.signal);

      // System-wide: if the model returned bridge-only / empty / no findings, regenerate.
      // Never swap a real GM beat for a local story template.
      {
        const probeOf = (text: string) =>
          ensureTurnProse(
            stripResidualMechanicTags(stripChoiceList(stripActionTags(text))),
            sanitizedInput,
          );
        let probeText = probeOf(result.text);
        const probeLocks = detectFactLockViolations(liveCurrent, probeText, sanitizedInput);
        const previousGm =
          [...liveCurrent.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
        const obligationCoverage = checkObligationCoverage(turnMandate.intentContract, probeText);
        const sameBeat = isSameBeat(probeText, liveCurrent.recentBeatFingerprints ?? []);
        const needsStoryRetry =
          !storyHasBody(probeText)
          || isUnresolvedActionNarrative(sanitizedInput, probeText, intentForMandate, previousGm)
          || !obligationCoverage.ok
          || sameBeat
          || probeLocks.some((l) => l.kind === 'weapon' || l.kind === 'cleared');
        // Fact-lock slips are cut locally after this. Only burn extra GM calls when
        // the turn did not resolve the player's action at all, or returned no story.
        if (needsStoryRetry) {
          debugLogger.record('WARN', 'Unresolved or empty action narrative — resolution retry', {
            turn: liveCurrent.turn,
            intent: intentForMandate.kind,
            empty: !storyHasBody(probeText),
            factLocks: probeLocks.map((v) => v.kind),
            obligationMissing: obligationCoverage.missing.map((o) => o.kind),
            sameBeat,
          });
          const firstResult = result;
          const firstProbe = probeText;
          const firstUnresolved = isUnresolvedActionNarrative(
            sanitizedInput,
            firstProbe,
            intentForMandate,
            previousGm
          );
          const firstObligations = checkObligationCoverage(turnMandate.intentContract, firstProbe);
          const firstSameBeat = isSameBeat(firstProbe, liveCurrent.recentBeatFingerprints ?? []);
          const extraBlocks = [
            !firstObligations.ok
              ? buildObligationRetryBlock(turnMandate.intentContract, firstObligations)
              : '',
            firstSameBeat
              ? buildBeatNoveltyRetryBlock(liveCurrent.recentBeatFingerprints ?? [])
              : '',
          ]
            .filter(Boolean)
            .join('\n\n');
          setRetryStatus('Refining story resolution…');
          result = await callGm(
            liveCurrent,
            buildResolutionUserPayload({
              mandateBlock: turnMandate.block,
              playerAction: sanitizedInput,
              deterministicBlock: deterministicStateBlock,
              retry: true,
              intent: intentForMandate,
              factLocks: probeLocks,
              extraRetryBlock: extraBlocks || undefined,
            }),
            settingsRef.current,
            activeLoreCards,
            (attempt, delayMs) => {
              debugLogger.record('WARN', `Rate limited — retry ${attempt}/4`, { delayMs });
              setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
            },
            turnAbort.signal,
          );
          probeText = probeOf(result.text);
          const retryUnresolved = isUnresolvedActionNarrative(
            sanitizedInput,
            probeText,
            intentForMandate,
            previousGm
          );
          const retryObligations = checkObligationCoverage(turnMandate.intentContract, probeText);
          const retrySameBeat = isSameBeat(probeText, liveCurrent.recentBeatFingerprints ?? []);
          const firstOk =
            storyHasBody(firstProbe) && !firstUnresolved && firstObligations.ok && !firstSameBeat;
          const retryOk =
            storyHasBody(probeText) && !retryUnresolved && retryObligations.ok && !retrySameBeat;
          // Prefer a real first beat over a thinner / recycled retry.
          let discardedNarrative: string | null = null;
          if (
            (firstOk && !retryOk)
            || (!retryOk && storyHasBody(firstProbe) && !storyHasBody(probeText))
            || (!firstOk && !retryOk && storyHasBody(firstProbe) && firstProbe.length >= (probeText?.length ?? 0))
          ) {
            discardedNarrative = probeOf(result.text);
            result = firstResult;
            probeText = firstProbe;
          } else if (storyHasBody(firstProbe) && result !== firstResult) {
            discardedNarrative = firstProbe;
          }
          if (discardedNarrative) {
            liveCurrent = appendSpeculativeTake(liveCurrent, {
              turnPlanned: liveCurrent.turn + 1,
              expectedRevision: currentLedgerRevision(liveCurrent),
              playerAction: sanitizedInput,
              narrative: discardedNarrative.slice(0, 4000),
              reason: !firstObligations.ok || !retryObligations.ok
                ? 'obligation-retry-discarded'
                : 'resolution-retry-discarded',
            });
            stateRef.current = liveCurrent;
          }
        } else if (probeLocks.length) {
          debugLogger.record('STATE_UPDATE', 'Fact-lock slips will be cut locally — skipping GM retry', {
            turn: liveCurrent.turn,
            factLocks: probeLocks.map((v) => v.kind),
          });
        }
      }

      const gmLatency = Math.round(performance.now() - gmStartTime);
      setRetryStatus(null);

      debugLogger.record('API_RESPONSE', `callGm succeeded in ${gmLatency}ms`, {
        latency: gmLatency,
        responseLength: result.text?.length ?? 0,
        imagePrompt: result.imagePrompt?.slice(0, 100) ?? '',
        rollsCount: result.rolls?.length ?? 0
      });
      logApiLatency({
        label: 'callGm',
        latencyMs: gmLatency,
        provider: settingsRef.current.aiProvider,
        engineMode: liveCurrent.engineMode,
        playerInput: sanitizedInput,
        aiResponse: result.text,
      });
      if (result.rolls?.length) {
        logRollResults(
          result.rolls.map((raw) => ({ label: 'gm_roll', detail: raw })),
          gmLatency
        );
      }

      // Dice math belongs in the player-facing system log only for tabletop fantasy.
      const codeSystemLogLine =
        isDndEngine && !check.skippedRoll
          ? `Action Check: d20(${d20Roll}) + Mod(${strMod}) = ${outcome.totalScore} vs DC ${difficultyClass} — ${narrativeOutcomeLabel}`
          : null;
      const rawSystemLog = [
        ...(result.systemLog ?? []),
        ...(codeSystemLogLine ? [codeSystemLogLine] : []),
      ];
      const filteredSystemLog = filterSystemLogForEngine(rawSystemLog, liveCurrent.engineMode);
      const gmEntry: LogEntry = {
        id: uid(),
        turn: liveCurrent.turn + 1,
        role: 'gm',
        content: result.text,
        timestamp: Date.now(),
        systemLog: Array.from(new Set(filteredSystemLog)),
      };

      // `events`/derived requests must be parsed BEFORE anything below references them
      // (e.g. `lootVideoEntry`) — declaring them later caused a
      // "Cannot access before initialization" crash in the job runner.
      const rawEvents = parseActionTags(result.text);
      const intent = intentForMandate;
      const establishedProseForScrub =
        [...liveCurrent.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
      const warden = runWarden(
        liveCurrent,
        rawEvents,
        result.text,
        sanitizedInput,
        intent,
        establishedProseForScrub
      );
      const events = warden.events;
      // Prefer claim-ground scrubbed prose for player-facing story (tags still from raw).
      const narrativeSource = warden.scrubbedNarrative ?? result.text;
      const appliedWorld = applyWorldEvents(worldLedger, events, worldLedger.clock.week);
      worldLedger = appliedWorld.ledger;
      worldNotes.push(...appliedWorld.notes);
      if (appliedWorld.extraDays > 0) {
        const postTick = tickWorld(
          worldLedger,
          appliedWorld.extraDays,
          liveCurrent.seed,
          liveCurrent.character.level,
        );
        worldLedger = postTick.ledger;
        extraWeekGold += postTick.goldPaid;
        if (postTick.goldPaid > 0) {
          worldNotes.push(`Time-pass cut: +${postTick.goldPaid}g`);
        }
        worldNotes.push(...postTick.weekSummaries.slice(0, 6));
      }
      const writerMilestone = eventsToMilestone(events);
      const lootVideoReq = eventsToLootVideo(events);
      const visualUpdate = eventsToVisualUpdate(events);

      // Legendary Loot Video gets its own dedicated log entry (separate media pipeline/queue
      // from images) so it renders as a distinct cinematic callout regardless of visual mode.
      const lootVideoEntry: LogEntry | null = lootVideoReq
        ? {
            id: uid(),
            turn: liveCurrent.turn + 1,
            role: 'system',
            content: `🎬 Legendary Drop: ${lootVideoReq.itemName}`,
            timestamp: Date.now(),
            entryKind: 'loot-video',
            mediaKind: 'video',
            videoUrl: null,
            imageStatus: 'pending',
            lootItemName: lootVideoReq.itemName,
            lootItemRarity: (lootVideoReq.itemRarity as Item['rarity']) ?? 'Legendary',
          }
        : null;

      const newRolls: RollRecord[] = [
        { id: uid(), turn: liveCurrent.turn + 1, raw: `[Code RNG] ${codeResolutionText}` },
        ...result.rolls.map((r) => ({ id: uid(), turn: liveCurrent.turn + 1, raw: r }))
      ];

      const updates = extractUpdates(liveCurrent, result.text);
      if (updates.character) {
        updates.character = {
          ...liveCurrent.character,
          ...sanitizeExtractedCharacterUpdates(updates.character, intent),
        };
        // If sanitize stripped everything meaningful beyond identity fields already on character,
        // keep XP progression lines only when present in the sanitized partial.
      }
      const regexLoot = extractNewItems(result.text);
      let cleanText = stripResidualMechanicTags(stripChoiceList(stripActionTags(narrativeSource)));
      cleanText = postFilterGmOutput(cleanText, settingsRef.current, {
        nsfw: isNsfwCampaign(getCampaignBibleById(stateRef.current?.campaignBibleId ?? '')),
      });
      cleanText = ensureTurnProse(cleanText, sanitizedInput);
      const storyBeforeCuts = cleanText;

      // Apply previously-unwired structural tags (items, dungeon, hex) after Warden filter.
      const structural = applyStructuralEvents(liveCurrent, events, {
        strictEncumbrance: settingsRef.current.strictEncumbrance === true,
      });
      let workingState = structural.state;
      const parsedPanels = parsePanels(result.text);
      const newLoreCards = eventsToLoreCards(events, liveCurrent.turn + 1);
      const turnFrame = parseTurnFrame(result.text);
      const suggestionState: GameState = {
        ...workingState,
        lorebook:
          newLoreCards.length > 0
            ? [...(workingState.lorebook ?? []), ...newLoreCards]
            : workingState.lorebook,
      };
      // Choice tier (4-tier pipeline): ground options in this turn's story prose + active info cards.
      // Rejects unprompted environmental events / plot jumps and regenerates when needed.
      const pipelineChoices = await resolvePipelineChoices({
        gmText: narrativeSource,
        state: suggestionState,
        loreCards: activeLoreCards,
        settings: settingsRef.current,
        lastPlayerAction: sanitizedInput,
      });
      const habitAugmented = extractChoicesFromText(
        pipelineChoices.choices.map((c, i) => `${i + 1}. ${c}`).join('\n'),
        suggestionState,
        normalizeStoryCorpus(narrativeSource)
      );
      const storyProseForChoices = normalizeStoryCorpus(narrativeSource);
      const inventedEntityNames = warden.notes
        .map((n) => n.match(/(?:unestablished entity|Claim-ground scrub):\s*(.+)$/i)?.[1]?.trim().toLowerCase())
        .filter((n): n is string => !!n);
      const hijack = detectSceneHijack(sanitizedInput, narrativeSource, suggestionState);
      if (hijack.hijacked) {
        warden.notes.push(...hijack.notes);
        cleanText = stripHijackSentences(cleanText, hijack.keywordsHit);
        cleanText = ensureTurnProse(cleanText, sanitizedInput);
      }
      const parsedChoices = (habitAugmented.length > 0 ? habitAugmented : pipelineChoices.choices)
        .filter((choice) => isChoiceGroundedInTurn(choice, storyProseForChoices, suggestionState, activeLoreCards))
        .filter((choice) => {
          const lower = choice.toLowerCase();
          return !inventedEntityNames.some((name) => name.length >= 3 && lower.includes(name));
        });
      const focusFiltered = hijack.hijacked || !turnMandate.playerEngagedQuestFocus
        ? filterHijackChoices(parsedChoices, turnMandate.focusKeywords)
        : parsedChoices;
      // Keep the GM's story. Do not replace it with a local template.
      cleanText = applyFactLocks(liveCurrent, cleanText, sanitizedInput);
      const groundedAfterResolve = focusFiltered.filter((choice) =>
        isChoiceGroundedInTurn(choice, normalizeStoryCorpus(cleanText), suggestionState, activeLoreCards)
      );
      const harvestedOffers = extractChoiceLines(narrativeSource).filter((c) => looksLikeChoiceOffer(c));
      const withInProseOffers = [...groundedAfterResolve];
      for (const offer of harvestedOffers) {
        if (!withInProseOffers.some((c) => c.toLowerCase() === offer.toLowerCase())) {
          withInProseOffers.unshift(offer);
        }
      }
      const finalChoices = padChoicesToCount(
        withInProseOffers.length > 0
          ? withInProseOffers
          : sceneSafeFallbacks(suggestionState, normalizeStoryCorpus(cleanText), sanitizedInput),
        suggestionState,
        normalizeStoryCorpus(cleanText),
        3,
        sanitizedInput
      );
      if (pipelineChoices.regenerated || pipelineChoices.rejectedCount > 0) {
        debugLogger.record('STATE_UPDATE', 'Choice pipeline enforced turn grounding', {
          regenerated: pipelineChoices.regenerated,
          rejectedCount: pipelineChoices.rejectedCount,
          finalCount: finalChoices.length,
        });
      }
      const isComicView = shouldUseComicGrid(
        settingsRef.current,
        comicModeRef.current,
        narrativeModeRef.current
      );

      // STRICT PANEL BUDGET: code-enforced ceiling, independent of whether the model honors
      // the prompt instruction. This is the actual cost-safety guarantee, not a request.
      const panelBudget = resolvePanelBudget(settingsRef.current);
      const budgetedPanels = parsedPanels.slice(0, panelBudget);
      // Defensive: the GM sometimes runs the trailing choice list directly into the last
      // panel's <narrative> block instead of the top-level response text. Strip it there
      // too so numbered options never render as raw scene text inside a panel overlay.
      const sanitizedPanels = budgetedPanels.map((panel, idx) => {
        let narrative = panel.narrative;
        if (idx === budgetedPanels.length - 1) narrative = stripChoiceList(narrative);
        narrative = stripTurnCloser(narrative);
        narrative = sanitizeNarrativeMechanics(narrative, liveCurrent.engineMode).text;
        return { ...panel, narrative };
      });
      let comicPanelsForLog = isComicView ? sanitizedPanels : [];

      // Visual Consistency Manager: deterministic block built from canonical state
      // (character.appearance, equipped gear, active lore-card visual anchors), injected
      // into every image prompt in code — never left to the model to remember. Applying
      // `visualUpdate` here (BEFORE building this turn's image prompts, not after — state
      // won't actually commit the new appearance until the setState below) ensures a
      // same-turn transformation is reflected in that turn's own panels instead of lagging
      // one turn behind. When it's a radical form change, gear is also masked out so the
      // model doesn't keep drawing human clothes/weapons on a non-human body.
      const visualContext = buildVisualConsistencyBlock(liveCurrent, activeLoreCards, {
        appearanceOverride: visualUpdate?.description,
        formChange: visualUpdate?.formChange,
      });

      // Phase 2 — LLM Scripting Engine (Graphic Novel Director). In Comic Mode, ask a
      // dedicated Director pass to re-pace this turn's player action + deterministic math
      // outcome into a tighter, format-native panel script (explicit camera angles, and
      // caption/dialogue/sfx split into their own fields instead of inline tags). This is
      // strictly ADDITIVE on top of `callGm` above, never a replacement for it: `callGm`
      // remains the sole source of truth for every game-mechanics side effect (inventory,
      // quests, HP, encounters, choices, system-log) via `events`/`updates` computed from
      // `result.text` — the Director only ever replaces `comicPanelsForLog`, i.e. which panels
      // get rendered/imaged in `ComicGrid`. Text Mode and tabletop fantasy never reach this branch
      // (`isComicView` is false for both), so their pipelines are completely untouched. If the
      // Director call fails, times out, or returns something unusable, we silently keep the
      // GM's own `<panel>`-tag panels computed above — Comic Mode never blocks or breaks
      // waiting on this extra, optional pass. Skip it when the GM already wrote usable
      // panels — that extra call was holding the input box for up to 20s every turn.
      const gmPanelsUsable = sanitizedPanels.some((panel) => (panel.narrative ?? '').trim().length > 40);
      if (false && isComicView && panelBudget > 0 && !gmPanelsUsable) {
        try {
          const infoCards = [
            ...activeLoreCards.map((c) => `${c.name}: ${c.summary}`),
            visualContext,
          ].filter((s): s is string => !!s?.trim());
          const mathOutcome = {
            success: outcome.isSuccess,
            critical: outcome.isCriticalSuccess || outcome.isCriticalFailure,
            d20Roll,
            modifier: strMod,
            dc: difficultyClass,
            totalScore: outcome.totalScore,
            summary: codeResolutionText,
            systemLog: result.systemLog ?? [],
          };
          const script = await generatePanelScript(sanitizedInput, mathOutcome, infoCards, mode, {
            apiKey: settingsRef.current.openrouterApiKey || settingsRef.current.geminiApiKey || undefined,
          });
          const scriptedPanels = script.panels.slice(0, panelBudget).map(comicPanelScriptToPanel);
          if (scriptedPanels.length > 0) {
            comicPanelsForLog = scriptedPanels;
            debugLogger.record('API_RESPONSE', 'LLM Director panel script applied', {
              panelCount: scriptedPanels.length,
            });
          }
        } catch (err) {
          debugLogger.record('WARN', 'LLM Director panel script failed — falling back to GM <panel> tags', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const tagGainedNames = new Set(
        structural.gainedItems.map((i) => i.name.toLowerCase())
      );
      // Regex [Rarity] Name loot is untrusted without structured tags or a search/combat pay-off.
      const allowRegexLoot =
        intent.kind === 'search' ||
        intent.kind === 'attack' ||
        events.some(
          (e) =>
            e.type === 'item-gain' ||
            e.type === 'loot-video' ||
            e.type === 'encounter-end'
        );
      const regexOnlyLoot = allowRegexLoot
        ? regexLoot.filter((ni) => !tagGainedNames.has(ni.name.toLowerCase()))
        : [];
      if (!allowRegexLoot && regexLoot.length > 0) {
        warden.notes.push(
          `Dropped untagged regex loot (${regexLoot.map((r) => r.name).join(', ')}) — require <item-gain>`
        );
      }
      const newInventoryItems: Item[] = regexOnlyLoot.map((ni) => ({
        id: uid(),
        name: ni.name,
        rarity: ni.rarity as Item['rarity'],
        quantity: 1,
        provenance: ni.provenance,
      }));

      let hpDelta = engineHpDelta;
      let playerDamageTaken = 0;
      if (ledgerRound) {
        playerDamageTaken = ledgerRound.received;
        hpDelta = 0;
        for (const e of events) {
          if (e.type === 'heal' && e.amount) hpDelta += e.amount;
        }
      } else {
        for (const e of events) {
          if (e.type === 'heal' && e.amount) hpDelta += e.amount;
          if (e.type === 'damage' && e.amount) {
            hpDelta -= e.amount;
            playerDamageTaken += e.amount;
          }
        }
      }

      if (playerDamageTaken > 0) {
        const appear = events.find((e) => e.type === 'enemy-appear');
        cleanText = ensureDamageNarration(
          cleanText,
          playerDamageTaken,
          appear?.enemyName ?? liveCurrent.activeEncounter?.name
        );
      }
      const appearEvent = events.find((e) => e.type === 'enemy-appear' && e.enemyName);
      if (appearEvent?.enemyName && !ledgerRound) {
        cleanText = ensureEncounterNarration(
          cleanText,
          appearEvent.enemyName,
          encounterOriginPlace(liveCurrent, `${cleanText}\n${lastGmText}`)
        );
      }
      let mergedSystemLog = filterSystemLogForEngine(
        Array.from(
          new Set([
            ...(gmEntry.systemLog ?? []),
            ...warden.systemLogExtra,
            ...structural.notes.filter((n) => /blocked|failed|full|Pity|Boss first|Run floor|Loot granted/i.test(n)),
            ...worldNotes,
            ...(ledgerRound
              ? [
                  formatCombatReceipt({ combat: ledgerRound }) ||
                    `Damage Dealt: ${ledgerRound.dealt} (${ledgerRound.enemyName} HP ${ledgerRound.enemyHpBefore} -> ${ledgerRound.enemyHpAfter})`,
                  ...(ledgerRound.received ? [`Damage Received: ${ledgerRound.received}`] : []),
                  ...(ledgerRound.xp ? [`XP Gained: ${ledgerRound.xp}`] : []),
                ]
              : []),
          ])
        ),
        liveCurrent.engineMode
      );
      cleanText = ensureXpNarration(cleanText, mergedSystemLog);
      cleanText = applyFactLocks(liveCurrent, cleanText, sanitizedInput);
      if (warden.continuityBreak || detectSceneContradiction(liveCurrent.sceneFacts, cleanText)) {
        cleanText = rewriteContinuityBreak(liveCurrent, sanitizedInput, cleanText);
        warden.notes.push('Continuity break rewritten locally (crowd/noise kept).');
      }
      cleanText = stripUnearnedXpProse(cleanText);
      if (!storyHasBody(cleanText) && storyHasBody(storyBeforeCuts)) {
        cleanText = storyBeforeCuts;
      }
      if (!storyHasBody(cleanText) && storyHasBody(stripChoiceList(stripActionTags(result.text)))) {
        cleanText = stripTurnCloser(
          stripResidualMechanicTags(stripChoiceList(stripActionTags(result.text)))
        );
      }
      if (!storyHasBody(cleanText)) {
        debugLogger.record('WARN', 'Refusing System-only turn — no story body', {
          turn: liveCurrent.turn,
        });
        refundSpentTextTurn();
        keepSentLineOnFail(sanitizedInput || lastInputRef.current);
        setError('The story did not come through. Try that action again — this attempt was not charged.');
        return;
      }

      debugLogger.record('STATE_UPDATE', 'Merging GM response into game state', {
        turn: liveCurrent.turn,
        newTurn: liveCurrent.turn + 1,
        hpDelta,
        newItems: newInventoryItems.length + structural.gainedItems.length,
        newLoreCards: newLoreCards.length,
        wardenNotes: warden.notes.length,
        pendingImagePrompt: !!result.imagePrompt
      });
      // Build the complete next snapshot as a pure calculation. React updater functions must
      // stay side-effect-free and must not be used as a synchronization primitive for queues,
      // persistence, TTS, or any external service.
      const existingLoreIds = new Set((workingState.lorebook ?? []).map((c) => c.id));
      const mergedLorebook = [
        ...(workingState.lorebook ?? []),
        ...newLoreCards.filter((c) => !existingLoreIds.has(c.id)),
      ];
      const baseChar = { ...workingState.character, ...(updates.character ?? {}) };
      if (ledgerRound) {
        baseChar.hp = ledgerRound.playerHpAfter;
        if (ledgerRound.xp > 0) {
          baseChar.xp = (baseChar.xp ?? 0) + ledgerRound.xp;
        }
      } else if (hpDelta !== 0) {
        baseChar.hp = Math.max(0, Math.min(baseChar.maxHp, (baseChar.hp ?? 0) + hpDelta));
      }
      if (visualUpdate) {
        baseChar.appearance = visualUpdate.description;
      }
      const hasFirearm = (workingState.inventory ?? []).some((i) =>
        /\b(pistol|handgun|revolver|rifle|shotgun|firearm|gun)\b/i.test(i.name)
      );
      cleanText = applyLocalityWarden(cleanText, workingState.currentLocation ?? liveCurrent.currentLocation, hasFirearm);
      cleanText = enforcePerspective(cleanText, settingsRef.current, liveCurrent.character.name);
      cleanText = applyProseWarden(cleanText, {
        currentLocation: workingState.currentLocation ?? liveCurrent.currentLocation,
      });
      {
        const leak = scanAndScrubLeaks(cleanText);
        if (leak.notes.length) {
          debugLogger.record('WARN', 'Leak scanner scrubbed engine notes', { notes: leak.notes.slice(0, 4) });
          cleanText = leak.clean;
        }
      }

      if (mode === 'kid') {
        const kidTalk = (s: string) => filterKidModeText(s);
        cleanText = kidTalk(cleanText);
        comicPanelsForLog = comicPanelsForLog.map((panel) => ({
          ...panel,
          narrative: kidTalk(panel.narrative),
          imagePrompt: kidTalk(panel.imagePrompt),
        }));
        for (const item of newInventoryItems) {
          item.name = kidTalk(item.name);
          if (item.description) item.description = kidTalk(item.description);
        }
        if (baseChar.appearance) baseChar.appearance = kidTalk(baseChar.appearance);
        mergedSystemLog = mergedSystemLog.map(kidTalk);
        for (const card of newLoreCards) {
          if (card.name) card.name = kidTalk(card.name);
          if (card.summary) card.summary = kidTalk(card.summary);
        }
        if (result.imagePrompt?.length) {
          result.imagePrompt = result.imagePrompt.map(kidTalk);
        }
      }

      const inventoryAfterFormChange = visualUpdate?.formChange
        ? workingState.inventory.map((item) => {
            if (!item.equipped) return item;
            const type = inferItemType(item);
            return type === 'weapon' || type === 'armor' ? { ...item, equipped: false } : item;
          })
        : workingState.inventory;

      const nextTurn = liveCurrent.turn + 1;
      let updatedQuests = syncQuestsFromPlay(
        eventsToQuestUpdates(events, workingState.quests ?? [], nextTurn),
        mergedSystemLog,
        `${sanitizedInput}\n${cleanText}\n${mergedSystemLog.join('\n')}`,
        { locked: questsLockedDuringOpening(liveCurrent) }
      );
      updatedQuests = ensureTutorialQuest(
        { ...workingState, quests: updatedQuests },
        nextTurn
      );
      if (mode === 'kid') {
        updatedQuests = updatedQuests.map((q) => ({
          ...q,
          name: filterKidModeText(q.name),
          description: filterKidModeText(q.description),
          objectives: q.objectives?.map((o) => ({
            ...o,
            description: filterKidModeText(o.description),
          })),
        }));
      }
      const turnUnlocks = newlyRevealedQuests(questsAtTurnStart, updatedQuests);
      if (turnUnlocks.length) {
        mergedSystemLog.push(...turnUnlocks.map((q) => `Quest Unlocked: ${q.name}`));
        setUnlockedQuests(turnUnlocks);
      }

      const leveledUp = (baseChar.level ?? 1) > (liveCurrent.character.level ?? 1);
      const bossCleared =
        events.some((e) => e.type === 'encounter-end') &&
        isExplorableDungeon(workingState.activeDungeon);
      const tutorialAdv = advanceTutorialBeats(
        { ...workingState, tutorialProgress: workingState.tutorialProgress ?? emptyTutorialProgress() },
        {
          turn: nextTurn,
          playerAction: sanitizedInput,
          narrative: cleanText,
          systemLog: mergedSystemLog,
          checkFailed: !outcome.isSuccess,
          ledgerChanged:
            (baseChar.hp ?? 0) !== (liveCurrent.character.hp ?? 0)
            || (baseChar.conditions?.length ?? 0) !== (liveCurrent.character.conditions?.length ?? 0)
            || (baseChar.conditions ?? []).some((c, i) => c !== liveCurrent.character.conditions?.[i]),
          critFail: outcome.d20 === 1,
          gainedLoot: structural.gainedItems.length > 0,
          quests: updatedQuests,
          bossCleared,
          rested: /\b(rest|camp|sleep|recover)\b/i.test(sanitizedInput),
          leveled: leveledUp,
        }
      );
      if (tutorialAdv.systemNotes.length) {
        mergedSystemLog.push(...tutorialAdv.systemNotes);
      }

      let updatedEncounter = eventsToEncounterUpdate(events, workingState.activeEncounter ?? null);
      if (ledgerRound) {
        updatedEncounter = ledgerRound.enemyDead ? null : (liveCurrent.activeEncounter ?? null);
      }
      const turnFacts = collectTurnTimelineFacts({
        turn: nextTurn,
        playerAction: sanitizedInput,
        stateBefore: liveCurrent,
        stateAfter: {
          currentLocation: workingState.currentLocation ?? updates.currentLocation,
          activeEncounter: updatedEncounter,
          activeDungeon: workingState.activeDungeon,
          character: baseChar,
          quests: updatedQuests,
        },
        events,
        systemLog: mergedSystemLog,
        newItemNames: [
          ...structural.gainedItems.map((i) => i.name),
          ...newInventoryItems.map((i) => i.name),
        ],
        wardenNotes: warden.notes,
        sceneBeat: applyCommittedNarrative(liveCurrent, cleanText, nextTurn).lastBeat,
      });
      const mergedTimeline = mergeTimeline(workingState.timeline, turnFacts);
      const npcMemories = recordNpcTreatmentFromAction(
        mergeNpcMemoriesFromTurn(
          workingState,
          events,
          turnFacts,
          nextTurn
        ),
        sanitizedInput,
        nextTurn,
        [
          ...(workingState.companions ?? []).map((c) => c.name).filter((n): n is string => Boolean(n)),
          ...(workingState.sceneFacts?.present ?? []).filter(
            (n) => n.trim().length > 1 && !/^(bystanders|blue panel|cracked street)$/i.test(n)
          ),
        ]
      );
      const resolvedLocation =
        workingState.currentLocation ??
        updates.currentLocation ??
        liveCurrent.currentLocation;

      const usedItemNames = events
        .filter((e) => e.type === 'item-use' && e.name)
        .map((e) => e.name!);
      const questChangeNotes: string[] = [];
      for (const e of events) {
        if (e.type === 'quest-add' && e.name) questChangeNotes.push(`Quest add: ${e.name}`);
        if (e.type === 'quest-complete') questChangeNotes.push(`Quest complete: ${e.id}`);
      }

      const landmarks = extractNamedPlaces(
        `${sanitizedInput}\n${cleanText}\n${mergedSystemLog.join('\n')}\n${resolvedLocation ?? ''}`
      );
      const mapName = mapAnchorName(resolvedLocation, landmarks);
      const finalLocationName =
        isGenericMapPlace(resolvedLocation) && mapName ? mapName : resolvedLocation;

      if (isExplorableDungeon(workingState.activeDungeon)) {
        workingState = {
          ...workingState,
          activeDungeon: seedDungeonState(
            workingState.activeDungeon!,
            workingState.seed || liveCurrent.seed || 'seed'
          ),
        };
      }

      const locMem = advanceLocationMemory(
        {
          ...workingState,
          locationSheet: workingState.locationSheet ?? liveCurrent.locationSheet,
          previousLocationSheet:
            workingState.previousLocationSheet ?? liveCurrent.previousLocationSheet,
        },
        finalLocationName
      );
      let locationSheet = locMem.locationSheet ?? touchLocationSheet(workingState, finalLocationName);
      if (isExplorableDungeon(workingState.activeDungeon)) {
        locationSheet = mergeSheetWithNode(
          locationSheet,
          currentDungeonNode(workingState.activeDungeon)
        );
      }
      let areaMap = workingState.activeDungeon ?? liveCurrent.activeDungeon ?? null;
      if (!isExplorableDungeon(areaMap)) {
        areaMap = resolvePlayAreaMap(areaMap, mapName, landmarks, liveCurrent.currentCoordinates);
      }
      locationSheet = normalizeSheetAuthority(locationSheet, areaMap);

      let places = upsertPlaceFromSheet(
        touchPlaceVisit(workingState.places ?? liveCurrent.places ?? [], finalLocationName, nextTurn),
        locationSheet,
        {
          dungeonRef:
            isExplorableDungeon(areaMap) ? areaMap?.blueprintId : undefined,
        }
      );

      const topLoot = structural.gainedItems[0];
      const campaignMemory = advanceCampaignMemory(
        {
          ...workingState,
          currentLocation: finalLocationName,
          character: baseChar,
          quests: updatedQuests,
        },
        nextTurn,
        {
          playerAction: sanitizedInput,
          narrative: cleanText,
          gainedLootRarity: topLoot?.rarity ?? null,
          questNote: questChangeNotes[0] ?? null,
          significantChoice: intentForMandate.kind === 'refuse' || /choose|accept|refuse/i.test(sanitizedInput),
          locationChanged:
            !!finalLocationName &&
            !!liveCurrent.currentLocation &&
            finalLocationName !== liveCurrent.currentLocation,
        }
      );

      const npcMemoriesWithRel = upsertNpcRelationshipSummary(npcMemories, nextTurn);
      const statusReveal = tutorialAdv.progress.fullStatusUnlocked
        ? 'full'
        : nextTurn >= 5
          ? 'core'
          : 'minimal';

      const deadEncounter = workingState.activeEncounter ?? liveCurrent.activeEncounter;
      const memorableDecision = decideClassicMemorable(
        {
          settings: settingsRef.current,
          state: {
            ...liveCurrent,
            activeDungeon: areaMap ?? workingState.activeDungeon ?? liveCurrent.activeDungeon,
          },
          turn: nextTurn,
          storyText: cleanText,
          writerTag: writerMilestone,
          events,
          lootVideo: lootVideoReq,
          characterHp: baseChar.hp ?? liveCurrent.character.hp,
          characterConditions: baseChar.conditions ?? liveCurrent.character.conditions ?? [],
          gainedItems: [
            ...structural.gainedItems,
            ...newInventoryItems,
            ...events
              .filter((e) => e.type === 'item-gain' && e.name)
              .map((e) => ({ name: e.name!, rarity: e.rarity })),
          ],
          defeatedEnemyName: ledgerRound?.enemyDead
            ? ledgerRound.enemyName
            : deadEncounter && deadEncounter.hp <= 0
              ? deadEncounter.name
              : null,
        },
        canSpend('memorable')
      );
      offerMemorableAdIfCapHit(memorableDecision.skippedForCapacity);
      const milestoneReq = memorableDecision.request;

      const mergedStateDraft: GameState = {
        ...workingState,
        ...updates,
        character: baseChar,
        quests: enrichQuests(updatedQuests),
        activeEncounter: updatedEncounter,
        currentLocation: finalLocationName,
        activeDungeon: areaMap,
        currentCoordinates: workingState.currentCoordinates ?? liveCurrent.currentCoordinates,
        timeline: mergedTimeline,
        npcMemories: npcMemoriesWithRel,
        locationSheet,
        previousLocationSheet: locMem.previousLocationSheet,
        tutorialProgress: tutorialAdv.progress,
        places,
        campaignMemory,
        statusReveal,
        pendingContentRewrite: null,
        sceneFacts: applyCommittedNarrative(liveCurrent, cleanText, nextTurn),
        campaignPremise: workingState.campaignPremise ?? liveCurrent.campaignPremise,
        campaignBibleId: workingState.campaignBibleId ?? liveCurrent.campaignBibleId,
        pendingTurn: null,
        ledgerRevision: nextLedgerRevision(liveCurrent),
        speculativeTakes: liveCurrent.speculativeTakes,
        memorableMoments: memorableDecision.nextState,
        log: [
          ...liveCurrent.log,
          {
            ...gmEntry,
            content: cleanText,
            systemLog: mergedSystemLog,
            ...(comicPanelsForLog.length > 0
              ? {
                  panels: comicPanelsForLog.map((panel) => ({
                    ...panel,
                    imageUrl: null,
                    imageStatus: 'pending' as const,
                  })),
                  imageStatus: 'pending' as const,
                }
              : result.imagePrompt?.length
                ? { imageStatus: 'pending' as const }
                : {}),
            ...memorableLogFields(memorableDecision),
          },
          ...(lootVideoEntry ? [lootVideoEntry] : []),
        ],
        rolls: [...liveCurrent.rolls, ...newRolls],
        inventory: [...inventoryAfterFormChange, ...newInventoryItems],
        lorebook: mergedLorebook,
        turn: nextTurn,
        pendingImagePrompt: result.imagePrompt,
        choices: mode === 'kid' ? finalChoices.map((c) => filterKidModeText(c)) : finalChoices,
        gold: Math.max(0, (workingState.gold ?? liveCurrent.gold ?? 0) + extraWeekGold),
        worldLedger,
        ...(turnFrame ? { turnFrameTheme: turnFrame } : {}),
      };

      const combatSummary = ledgerRound
        ? formatCombatReceipt({ combat: ledgerRound }) ?? undefined
        : undefined;
      let mergedState: GameState = appendStateTxDiff(liveCurrent, mergedStateDraft, {
        combatSummary,
        why: `Player: ${sanitizedInput.slice(0, 120)}`,
      });
      // Material state receipts — player-visible ledger lines for this turn (vibe P0).
      {
        const turnReceipts = (mergedState.stateTxLog ?? [])
          .filter((t) => t.turn === nextTurn)
          .map((t) => `Ledger: ${t.summary}`);
        if (turnReceipts.length) {
          mergedState = {
            ...mergedState,
            log: mergedState.log.map((entry) =>
              entry.id === gmEntry.id
                ? {
                    ...entry,
                    systemLog: Array.from(
                      new Set([...(entry.systemLog ?? []), ...turnReceipts])
                    ),
                  }
                : entry
            ),
          };
        }
      }
      mergedState = withUpdatedHookArc(mergedState);
      mergedState = mergeCampaignDivergences(mergedState);
      const fp = beatFingerprint(cleanText);
      mergedState = {
        ...mergedState,
        recentBeatFingerprints: [...(liveCurrent.recentBeatFingerprints ?? []), fp].slice(-12),
      };
      const postCommitImageJobs: ImageGenJob[] = [];
      const allowSceneArt = storyHasBody(cleanText) && !imagesKilled();
      if (imagesKilled()) {
        debugLogger.record('SYSTEM', 'Ops kill switch: images off — skipping scene art');
      } else if (!allowSceneArt) {
        debugLogger.record('SYSTEM', 'Skipping scene images — no story body this turn');
      } else if (isComicView && comicPanelsForLog.length > 0) {
        postCommitImageJobs.push({
          kind: 'panels',
          entryId: gmEntry.id,
          prompts: comicPanelsForLog.map((panel) => panel.imagePrompt),
          promptKind: 'comic-panel',
          visualContext,
          playerActionContext: sanitizedInput,
        });
      } else if (isComicView && result.imagePrompt?.length) {
        postCommitImageJobs.push({
          kind: 'turn',
          entryId: gmEntry.id,
          prompts: result.imagePrompt,
          promptKind: 'comic-panel',
          visualContext,
        });
      } else if (
        !isComicView &&
        allowsImageGeneration(settingsRef.current, 'classic-illustration') &&
        result.imagePrompt?.length
      ) {
        postCommitImageJobs.push({
          kind: 'turn',
          entryId: gmEntry.id,
          prompts: [result.imagePrompt[0]],
          promptKind: 'classic-illustration',
          visualContext,
        });
      }
      if (allowSceneArt && milestoneReq && allowsImageGeneration(settingsRef.current, 'milestone-illustration')) {
        postCommitImageJobs.push({
          kind: 'turn',
          entryId: gmEntry.id,
          prompts: [milestoneReq.imagePrompt],
          promptKind: 'milestone-illustration',
          visualContext,
          isMilestone: true,
          heroImage: false,
          bypassCapacity: memorableBypassesWeeklyCap(memorableDecision.beat),
        });
      }
      const postCommitVideoJob: VideoGenJob | null = lootVideoReq && lootVideoEntry
        ? {
            entryId: lootVideoEntry.id,
            prompt: lootVideoReq.imagePrompt,
            visualContext,
          }
        : null;

      const effectsPayload = {
        snapshot: mergedState,
        imageJobs: postCommitImageJobs,
        videoJob: postCommitVideoJob,
        speech: isComicView && comicPanelsForLog.length > 0
          ? { kind: 'sequence' as const, texts: buildComicSpeechQueue(comicPanelsForLog) }
          : { kind: 'text' as const, text: cleanText },
      };

      // Pending-turn confirm is off for normal play — send action, get story back immediately.
      // (Setting retained for possible future opt-in; not exposed in UI.)
      const requireConfirm = false;

      if (requireConfirm) {
        const proposal = buildPendingProposal({
          playerAction: sanitizedInput,
          playerEntryId: playerEntry.id,
          intent,
          narrative: cleanText,
          systemLog: mergedSystemLog,
          choices: mode === 'kid' ? finalChoices.map((c) => filterKidModeText(c)) : finalChoices,
          wardenNotes: warden.notes,
          proposedState: mergedState,
          hpDelta,
          gainedItemNames: [
            ...structural.gainedItems.map((i) => i.name),
            ...newInventoryItems.map((i) => i.name),
          ],
          usedItemNames,
          questChangeNotes,
          comicPanels: comicPanelsForLog,
          imagePrompt: result.imagePrompt,
          turnFrame,
        });
        // Hold ledger commit: keep player entry + pending proposal only.
        const holdingState: GameState = {
          ...liveCurrent,
          pendingTurn: proposal,
          // Freeze choices until accept
          choices: [],
        };
        pendingEffectsRef.current = effectsPayload;
        stateRef.current = holdingState;
        setState(holdingState);
        void persist(holdingState);
        debugLogger.record('STATE_UPDATE', 'Turn proposed — awaiting player confirm', {
          turn: liveCurrent.turn,
          deltas: proposal.deltaSummary,
          wardenNotes: warden.notes.length,
        });
        addToast('Review the turn — Accept, Edit, Reroll, or Discard', 'info');
      } else {
        stateRef.current = mergedState;
        setState(mergedState);
        try {
          await persist(mergedState);
        } catch (persistError) {
          debugLogger.record('ERROR', 'Immediate turn persist failed', {
            error: persistError instanceof Error ? persistError.message : String(persistError),
          });
        }

        debugLogger.record('STATE_UPDATE', 'State updated — turn incremented', {
          turn: mergedState.turn,
          logEntries: mergedState.log.length,
          imagePromptAttached: !!mergedState.pendingImagePrompt
        });

        postCommitTurnEffectsRef.current.push(effectsPayload);
        setPostCommitTurnEpoch((epoch) => epoch + 1);

        if (!settingsRef.current.preferFullResponse && storyHasBody(cleanText)) {
          startStreamingReveal(gmEntry.id, cleanText);
        } else {
          clearPhaseTimers();
          setTurnPhase('idle');
          setStreamingReveal(null);
        }
      }
      textTurnSpent = false;
      honeymoonSpent = false;
    } catch (e) {
      if (turnAbortRef.current?.signal.aborted) {
        debugLogger.record('WARN', 'sendAction aborted — player line kept');
        resetTurnUi();
        refundSpentTextTurn();
        keepSentLineOnFail(sanitizedInput || lastInputRef.current || input);
        return;
      }
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      const stack = e instanceof Error ? e.stack : undefined;
      debugLogger.record('ERROR', 'sendAction failed', {
        error: errMsg,
        stack,
      });
      logErrorStack(`sendAction failed: ${errMsg}`, stack, {
        turn: current.turn,
        saveId: current.saveId,
      });
      logApiLatency({
        label: 'callGm',
        latencyMs: 0,
        provider: settingsRef.current.aiProvider,
        engineMode: current.engineMode,
        playerInput: sanitizedInput,
        failed: true,
        stack,
      });
      refundSpentTextTurn();
      keepSentLineOnFail(sanitizedInput || lastInputRef.current || input);
      resetTurnUi();
      setError(errMsg);
    } finally {
      if (loadingTimer !== undefined) clearTimeout(loadingTimer);
      setShowLoadingOverlay(false);
      setRetryStatus(null);
      turnInFlightRef.current = false;
      setBusy(false);
      clearPhaseTimers();
    }
  });

  const acceptPendingTurn = useCallbackRef(() => {
    const previous = stateRef.current;
    if (!previous?.pendingTurn) return;
    const proposed = getProposedState(previous.pendingTurn);
    if (!proposed) {
      addToast('Pending turn data missing — discard and retry', 'error');
      return;
    }
    const accepted = acceptProposedState(
      previous,
      proposed,
      previous.pendingTurn.expectedRevision
    );
    if (!accepted.ok) {
      addToast(accepted.reason, 'error');
      return;
    }
    const committed = accepted.committed;
    stateRef.current = committed;
    setState(committed);
    void persist(committed);
    const effects = pendingEffectsRef.current;
    pendingEffectsRef.current = null;
    if (effects) {
      postCommitTurnEffectsRef.current.push({ ...effects, snapshot: committed });
      setPostCommitTurnEpoch((epoch) => epoch + 1);
    }
    addToast('Turn committed to World State Ledger', 'info');
  });

  const discardPendingTurn = useCallbackRef(() => {
    const snapshot = snapshotRef.current;
    pendingEffectsRef.current = null;
    if (snapshot) {
      stateRef.current = { ...snapshot, pendingTurn: null };
      setState({ ...snapshot, pendingTurn: null });
      void persist({ ...snapshot, pendingTurn: null });
      snapshotRef.current = null;
      setCanRewind(false);
    } else {
      const previous = stateRef.current;
      if (!previous) return;
      const cleared = {
        ...previous,
        pendingTurn: null,
        log: previous.log.filter((e) => e.id !== previous.pendingTurn?.playerEntryId),
      };
      stateRef.current = cleared;
      setState(cleared);
      void persist(cleared);
    }
    addToast('Pending turn discarded', 'info');
  });

  const editPendingNarrative = useCallbackRef((narrative: string) => {
    const previous = stateRef.current;
    if (!previous?.pendingTurn) return;
    const updated = withEditedNarrative(previous.pendingTurn, narrative);
    const next = { ...previous, pendingTurn: updated };
    stateRef.current = next;
    setState(next);
  });

  const rerollPendingTurn = useCallbackRef(async () => {
    const previous = stateRef.current;
    const action = previous?.pendingTurn?.playerAction;
    if (!previous || !action) return;
    // Roll back to pre-action snapshot, then resubmit the same action.
    const snapshot = snapshotRef.current;
    pendingEffectsRef.current = null;
    if (snapshot) {
      stateRef.current = { ...snapshot, pendingTurn: null };
      setState({ ...snapshot, pendingTurn: null });
    } else {
      stateRef.current = { ...previous, pendingTurn: null };
      setState({ ...previous, pendingTurn: null });
    }
    await sendAction(action);
  });

  const startNewGame = useCallbackRef(async (
    character: Partial<GameState['character']>,
    storyName?: string,
    engineMode: EngineMode = 'litrpg',
    gmStrictness: GmStrictness = 'standard',
    archetype?: CampaignArchetype,
    selectedVisualMode?: 'comic' | 'classic',
    selectedArtStyle?: ArtStylePreset,
    classicMemorableImages?: boolean,
    comicLayout?: Settings['comicLayout'],
    comicReadingDirection?: Settings['comicReadingDirection'],
    bibleId?: string,
    customTabletopRules?: string,
    playerBible?: CampaignBible,
    gmPersonality?: GmPersonalityId,
  ) => {
    if (
      selectedVisualMode ||
      selectedArtStyle ||
      typeof classicMemorableImages === 'boolean' ||
      comicLayout ||
      comicReadingDirection
    ) {
      const updated = { ...settingsRef.current } as Settings;
      if (selectedVisualMode) updated.visualMode = selectedVisualMode;
      if (selectedArtStyle) updated.artStylePreset = selectedArtStyle;
      if (typeof classicMemorableImages === 'boolean') {
        updated.classicMemorableImages = classicMemorableImages;
      }
      if (comicLayout) updated.comicLayout = comicLayout;
      if (comicReadingDirection) updated.comicReadingDirection = comicReadingDirection;
      setSettings(updated);
      settingsRef.current = updated;
      saveSettings(updated);
      setComicMode(updated.visualMode === 'comic');
      setNarrativeMode(false);
    }

    const bible = playerBible ?? (bibleId ? getCampaignBibleById(bibleId) : undefined);
    if (bible && isNsfwCampaign(bible) && settingsRef.current.contentMode === 'kid') {
      addToast('This adventure is NSFW. Exit Kid Mode (PIN) to play it.', 'error');
      return;
    }
    const resolvedArchetype = bible?.archetype ?? archetype;
    const resolvedName =
      storyName?.trim()
      || (bible ? formatCampaignStoryName(bible.title) : undefined);
    const base = createInitialState(resolvedName, engineMode, resolvedArchetype);
    const seeded = bible
      ? seedStateFromCampaignBible(base, bible)
      : seedStateFromArchetype(base, engineMode, resolvedArchetype ?? base.campaignArchetype);
    const namedSeeded = bible
      ? { ...seeded, storyName: resolvedName || formatCampaignStoryName(bible.title) }
      : seeded;
    const introContent = buildArchetypeIntro(
      engineMode,
      resolvedArchetype ?? 'ai_random',
      character.name ?? 'Survivor',
    );
    const mergedCharacter = bible
      ? applyCampaignCharacter({ ...namedSeeded.character, ...character }, bible)
      : { ...namedSeeded.character, ...character };
    const openingMode = resolveOpeningMode(bible, engineMode);
    const openingPrompts = resolveOpeningPrompts(
      bible,
      engineMode,
      resolvedArchetype ?? namedSeeded.campaignArchetype
    );
    const registrar = resolveOpeningRegistrar(
      bible,
      engineMode,
      resolvedArchetype ?? namedSeeded.campaignArchetype
    );
    const coverAnswers = seedCoverAnswers(bible, mergedCharacter);
    const pendingCovers = pendingRequiredCovers(openingPrompts, mergedCharacter, openingMode);
    const seededWhere = coverAnswers.where || bible?.startingLocation || namedSeeded.currentLocation;
    const pickedHook = resolveOpeningHook(bible, namedSeeded.seed);
    const honeymoon = storyStartTextTurnsForTier(settingsRef.current.subscriptionTier ?? 'free');
    const rawNewState: GameState = clampLeakedOpeningQuests({
      ...namedSeeded,
      gmStrictness,
      character: mergedCharacter,
      currentLocation: seededWhere || namedSeeded.currentLocation,
      currentCoordinates: { q: 0, r: 0, tier: 2, z: 0 },
      choices: pendingCovers.length ? establishmentChoices(pendingCovers) : [],
      log: [],
      worldLedger: emptyWorldLedger(),
      pendingGeneratedOpening: true,
      storyStartTextTurnsRemaining: honeymoon,
      openingEstablishment: {
        pending: pendingCovers,
        answers: coverAnswers,
        complete: pendingCovers.length === 0,
        registrar,
        sceneWritten: false,
        mode: openingMode,
        pickedHook,
      },
      customTabletopRules:
        engineMode === 'dnd' ? clipCustomTabletopRules(customTabletopRules).text || undefined : undefined,
      gmPersonality:
        engineMode === 'dnd' ? resolveTabletopGmPersonality(gmPersonality) : undefined,
    });
    const newState = withUpdatedHookArc(
      ensureCampaignContract(
        {
          ...rawNewState,
          quests: enrichQuests(rawNewState.quests ?? []),
          recentBeatFingerprints: [],
          stateTxLog: [],
        },
        bible
      )
    );
    setState(newState);
    stateRef.current = newState;
    bindSessionImageCache(newState.saveId);
    isHydratedRef.current = true;
    debugLogger.record('STATE_UPDATE', 'New game state created and hydrated', {
      turn: newState.turn,
      storyName: newState.storyName,
      engineMode: newState.engineMode,
      logEntries: newState.log.length
    });
    persist(newState);
    recordStoryStarted();
    setShowNewGame(false);

    setBusy(true);
    setError(null);
    const openingAbort = new AbortController();
    turnAbortRef.current = openingAbort;
    const openingTimer = setTimeout(() => setShowLoadingOverlay(true), 800);
    try {
      let openingText = '';
      let openingRaw = '';
      try {
        const openingResult = await callGm(
          newState,
          `${buildOpeningSceneMandate(newState)}\n\nWrite the opening scene now.`,
          settingsRef.current,
          [],
          (attempt, delayMs) => {
            setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
          },
          openingAbort.signal,
        );
        openingRaw = openingResult.text;
        openingText = stripChoiceList(stripActionTags(openingResult.text));
      } catch {
        openingText = '';
      }
      if (!openingText || openingText.length < 60 || isGenericBridgeNarrative(openingText)) {
        openingText = synthesizeOpeningScene(newState);
      }
      openingText = ensureSystemReceipt(newState, sanitizeOpeningNarration(openingText));
      openingText = applyProseWarden(
        enforcePerspective(openingText, settingsRef.current, newState.character.name),
        { currentLocation: newState.currentLocation },
      );
      if (settingsRef.current.contentMode === 'kid') {
        openingText = filterKidModeText(openingText);
      }
      const openingChoices = extractChoicesFromText(openingText, newState);
      const cleanOpening = stripChoiceList(openingText);
      const openingBible = resolveActiveCampaignBible(newState) ?? getCampaignBibleById(newState.campaignBibleId ?? '');
      const journalReady = !questsLockedDuringOpening(newState);
      const questsAfterScene = journalReady
        ? revealLocalStarterQuest(
            newState.quests ?? [],
            openingBible?.starterQuests ?? []
          )
        : newState.quests ?? [];
      const openingUnlocks = journalReady
        ? newlyRevealedQuests(newState.quests ?? [], questsAfterScene)
        : [];
      const openingTurn = newState.turn + 1;
      const openingEvents = parseActionTags(openingRaw || openingText);
      const openingMemorable = decideClassicMemorable(
        {
          settings: settingsRef.current,
          state: newState,
          turn: openingTurn,
          storyText: cleanOpening,
          writerTag: eventsToMilestone(openingEvents),
          events: openingEvents,
          lootVideo: eventsToLootVideo(openingEvents),
          isOpeningSceneTurn: true,
          characterHp: newState.character.hp,
          characterConditions: newState.character.conditions ?? [],
          gainedItems: [],
        },
        canSpend('memorable')
      );
      offerMemorableAdIfCapHit(openingMemorable.skippedForCapacity);
      const harvestedOpening = newState.openingEstablishment
        ? applyHarvestedOpeningCovers(newState.openingEstablishment, cleanOpening)
        : newState.openingEstablishment;
      const openingGm: LogEntry = {
        id: uid(),
        turn: newState.turn,
        role: 'gm',
        content: cleanOpening,
        timestamp: Date.now(),
        systemLog: [
          ...litrpgOpeningSystemPing(newState),
          ...openingUnlocks.map((q) => `Quest Unlocked: ${q.name}`),
        ],
        ...memorableLogFields(openingMemorable),
      };
      const seeded = seedOpeningSceneFacts({ ...newState, turn: openingTurn });
      const sceneFacts = applyCommittedNarrative(
        { ...newState, sceneFacts: seeded, turn: openingTurn },
        cleanOpening,
        openingTurn
      );
      const committed: GameState = {
        ...newState,
        turn: openingTurn,
        sceneFacts,
        quests: questsAfterScene,
        log: [openingGm],
        choices: harvestedOpening?.pending?.length
          ? establishmentChoices(harvestedOpening.pending)
          : openingChoices.length
            ? openingChoices
            : undefined,
        pendingGeneratedOpening: false,
        openingEstablishment: harvestedOpening
          ? { ...harvestedOpening, sceneWritten: true }
          : harvestedOpening,
        memorableMoments: openingMemorable.nextState,
        lastUpdated: Date.now(),
      };
      stateRef.current = committed;
      setState(committed);
      void persist(committed);
      if (openingUnlocks.length) setUnlockedQuests(openingUnlocks);
      if (
        openingMemorable.request
        && allowsImageGeneration(settingsRef.current, 'milestone-illustration')
      ) {
        enqueueImageGen({
          kind: 'turn',
          entryId: openingGm.id,
          prompts: [openingMemorable.request.imagePrompt],
          promptKind: 'milestone-illustration',
          visualContext: buildVisualConsistencyBlock(committed, []),
          isMilestone: true,
          heroImage: false,
          bypassCapacity: memorableBypassesWeeklyCap(openingMemorable.beat),
        });
      }
    } finally {
      clearTimeout(openingTimer);
      setBusy(false);
      setShowLoadingOverlay(false);
      setRetryStatus(null);
    }

    const introIsComic = shouldUseComicGrid(
      settingsRef.current,
      comicModeRef.current,
      narrativeModeRef.current
    );
    if (introIsComic) {
      enqueueImageGen({
        kind: 'intro',
        prompt: introContent.slice(0, 200),
        promptKind: 'comic-panel',
        visualContext: buildVisualConsistencyBlock(stateRef.current ?? newState, []),
      });
    }
  });

  const autoFight = useCallbackRef(async () => {
    const liveCurrent = stateRef.current;
    if (!liveCurrent || !liveCurrent.activeEncounter) return;

    const enemy: EnemyStats = {
      name: liveCurrent.activeEncounter.name,
      level: liveCurrent.activeEncounter.level,
      hp: liveCurrent.activeEncounter.hp,
      maxHp: liveCurrent.activeEncounter.maxHp,
      attack: Math.max(1, Math.floor(liveCurrent.activeEncounter.strength / 2)),
      defense: Math.max(0, Math.floor(liveCurrent.activeEncounter.constitution / 4)),
      armorClass: liveCurrent.activeEncounter.armorClass,
      xpReward: liveCurrent.activeEncounter.xpReward,
      goldReward: liveCurrent.activeEncounter.goldReward,
    };

    const needsWarning = enemy.level > liveCurrent.character.level;

    if (needsWarning) {
      const dismissed = isAutoFightWarningDismissed();
      if (!dismissed) {
        const proceed = await new Promise<boolean>((resolve) => {
          setAutoFightWarning({
            enemy,
            resolve: (ok: boolean) => {
              setAutoFightWarning(null);
              resolve(ok);
            },
          });
        });
        if (!proceed) return;
      }
    }

    await runAutoFight(enemy, liveCurrent);
  });

  const runAutoFight = useCallbackRef(async (enemy: EnemyStats, liveCurrent: GameState) => {
    setBusy(true);
    setError(null);
    try {
      const result = simulateCombat(liveCurrent, enemy);
      const prompt = buildAutoFightPrompt(liveCurrent, enemy, result);

      let narrativeText: string;
      try {
        narrativeText = await callGmAutoFight(liveCurrent, prompt, settingsRef.current, (attempt, delayMs) => {
          debugLogger.record('API_RETRY', `callGmAutoFight retry ${attempt}`, { delayMs });
        });
      } catch {
        narrativeText = result.summary;
      }

      narrativeText = postFilterGmOutput(narrativeText, settingsRef.current);
      if (settingsRef.current.contentMode === 'kid') {
        narrativeText = filterKidModeText(narrativeText);
      }

      const newTurn = liveCurrent.turn + 1;
      const autoEvents = parseActionTags(narrativeText);
      const autoMemorable = decideClassicMemorable(
        {
          settings: settingsRef.current,
          state: liveCurrent,
          turn: newTurn,
          storyText: narrativeText,
          writerTag: eventsToMilestone(autoEvents),
          events: autoEvents,
          lootVideo: eventsToLootVideo(autoEvents),
          characterHp: result.finalPlayerHp,
          characterConditions: liveCurrent.character.conditions ?? [],
          gainedItems: result.loot.map((item) => ({ name: item.name, rarity: item.rarity })),
          defeatedEnemyName: result.victory ? enemy.name : null,
        },
        canSpend('memorable')
      );
      offerMemorableAdIfCapHit(autoMemorable.skippedForCapacity);
      const playerEntry: LogEntry = {
        id: uid(),
        turn: newTurn,
        role: 'player',
        content: `[Auto-Fight] Engaging ${enemy.name}...`,
        timestamp: Date.now(),
      };
      const gmEntry: LogEntry = {
        id: uid(),
        turn: newTurn,
        role: 'gm',
        content: narrativeText,
        timestamp: Date.now(),
        systemLog: [
          `Auto-Resolve Combat: ${result.victory ? 'VICTORY' : 'DEFEAT'}`,
          `Rounds: ${result.rounds}`,
          `Damage Dealt: ${result.damageDealt}`,
          `Damage Received: ${result.damageReceived}`,
          `Player HP: ${liveCurrent.character.hp} -> ${result.finalPlayerHp}`,
          `XP Gained: ${result.xpGained}`,
          `Gold Gained: ${result.goldGained}`,
          ...(result.loot.length > 0 ? [`Loot: ${result.loot.map(l => `[${l.rarity}] ${l.name}`).join(', ')}`] : []),
        ],
        ...memorableLogFields(autoMemorable),
      };

      const updatedCharacter = { ...liveCurrent.character, hp: result.finalPlayerHp, mp: result.finalPlayerMp };
      let updatedXp = updatedCharacter.xp + result.xpGained;
      let updatedLevel = updatedCharacter.level;
      let updatedXpToNext = updatedCharacter.xpToNext;
      while (updatedXp >= updatedXpToNext) {
        updatedXp -= updatedXpToNext;
        updatedLevel++;
        updatedXpToNext = Math.floor(updatedXpToNext * 1.5);
        updatedCharacter.maxHp = Math.floor(updatedCharacter.maxHp * 1.1);
        updatedCharacter.hp = updatedCharacter.maxHp;
      }
      updatedCharacter.xp = updatedXp;
      updatedCharacter.level = updatedLevel;
      updatedCharacter.xpToNext = updatedXpToNext;

      const updatedInventory = [...liveCurrent.inventory, ...result.loot];

      const updated: GameState = {
        ...liveCurrent,
        character: updatedCharacter,
        inventory: updatedInventory,
        gold: liveCurrent.gold + result.goldGained,
        activeEncounter: null,
        turn: newTurn,
        memorableMoments: autoMemorable.nextState,
        log: [...liveCurrent.log, playerEntry, gmEntry],
        lastUpdated: Date.now(),
      };

      snapshotRef.current = liveCurrent;
      setCanRewind(true);
      setState(updated);
      stateRef.current = updated;
      await persist(updated);
      if (
        autoMemorable.request
        && storyHasBody(narrativeText)
        && allowsImageGeneration(settingsRef.current, 'milestone-illustration')
      ) {
        enqueueImageGen({
          kind: 'turn',
          entryId: gmEntry.id,
          prompts: [autoMemorable.request.imagePrompt],
          promptKind: 'milestone-illustration',
          visualContext: buildVisualConsistencyBlock(updated, []),
          isMilestone: true,
          bypassCapacity: memorableBypassesWeeklyCap(autoMemorable.beat),
        });
      }
    } catch (err: any) {
      setError(err?.message ?? 'Auto-fight failed.');
    } finally {
      setBusy(false);
    }
  });

  // Preferred Auto Fight mode: resolve new encounters without round-by-round turns.
  useEffect(() => {
    const encounter = state?.activeEncounter;
    if (!encounter) {
      lastAutoResolvedEncounterRef.current = null;
      return;
    }
    if (settings.combatResolveMode !== 'auto' || busy) return;
    const key = `${encounter.name}:${encounter.maxHp}:${encounter.level}`;
    if (lastAutoResolvedEncounterRef.current === key) return;
    lastAutoResolvedEncounterRef.current = key;
    void autoFight();
  }, [state?.activeEncounter?.name, state?.activeEncounter?.maxHp, state?.activeEncounter?.level, settings.combatResolveMode, busy, autoFight]);

  const inventoryArtJobs = useRef(new Map<string, Promise<string | null>>());
  const generateInventoryArt = useCallbackRef(async (
    prompt: string,
    kind: Extract<ImagePromptKind, 'item-icon' | 'character-portrait'>
  ): Promise<string | null> => {
    const current = stateRef.current;
    if (!current) return null;
    const jobKey = `${kind}:${prompt}`;
    const existing = inventoryArtJobs.current.get(jobKey);
    if (existing) return existing;
    const job = (async () => {
      try {
        return await fetchPanelImage(
          prompt,
          settingsRef.current,
          kind,
          sceneImageContext(kind === 'character-portrait' ? buildVisualConsistencyBlock(current, []) : undefined)
        );
      } catch {
        return null;
      } finally {
        inventoryArtJobs.current.delete(jobKey);
      }
    })();
    inventoryArtJobs.current.set(jobKey, job);
    return job;
  });

  const commitInventoryArt = useCallbackRef((patch: {
    itemIcons?: Record<string, string>;
    itemIconFails?: Record<string, true>;
    portraitUrl?: string;
    portraitKey?: string;
    portraitFailed?: boolean;
  }) => {
    const current = stateRef.current;
    if (!current) return;
    const inventory = (patch.itemIcons || patch.itemIconFails)
      ? current.inventory.map((item) => {
          if (patch.itemIcons?.[item.id]) return { ...item, iconUrl: patch.itemIcons[item.id], iconFailed: false };
          if (patch.itemIconFails?.[item.id]) return { ...item, iconFailed: true };
          return item;
        })
      : current.inventory;
    let character = current.character;
    if (patch.portraitUrl) {
      character = {
        ...character,
        portraitUrl: patch.portraitUrl,
        portraitKey: patch.portraitKey,
        portraitFailed: false,
      };
    } else if (patch.portraitFailed) {
      character = { ...character, portraitKey: patch.portraitKey, portraitFailed: true };
    }
    const next = { ...current, inventory, character, lastUpdated: Date.now() };
    stateRef.current = next;
    setState(next);
    void persist(next);
  });

  const portraitLock = useRef(false);
  useEffect(() => {
    const current = state;
    if (!current || busy || showCharacterWindow || portraitLock.current) return;
    if (equippedItemsNeedingIcons(current).length === 0 && !needsPortraitRefresh(current)) return;
    portraitLock.current = true;
    void (async () => {
      try {
        while (stateRef.current) {
          const live = stateRef.current;
          const nextIcon = equippedItemsNeedingIcons(live)[0];
          if (nextIcon) {
            const url = await generateInventoryArt(itemIconPrompt(nextIcon), 'item-icon');
            if (url) commitInventoryArt({ itemIcons: { [nextIcon.id]: url } });
            else commitInventoryArt({ itemIconFails: { [nextIcon.id]: true } });
            continue;
          }
          if (needsPortraitRefresh(live)) {
            const url = await generateInventoryArt(paperDollPrompt(live), 'character-portrait');
            const key = portraitCacheKey(stateRef.current ?? live);
            if (url) commitInventoryArt({ portraitUrl: url, portraitKey: key, portraitFailed: false });
            else commitInventoryArt({ portraitFailed: true, portraitKey: key });
          }
          break;
        }
      } finally {
        portraitLock.current = false;
      }
    })();
  }, [
    busy,
    showCharacterWindow,
    state?.character.appearance,
    state?.character.portraitKey,
    state?.character.portraitUrl,
    state?.character.portraitFailed,
    state?.inventory,
    generateInventoryArt,
    commitInventoryArt,
  ]);

  const acceptBeautyOffer = useCallbackRef((entryId: string) => {
    const current = stateRef.current;
    if (!current) return;
    if (!isClassicMemorableEnabled(settingsRef.current)) return;
    if (!canSoftOffer(current, { contentMode: settingsRef.current.contentMode, midCombat: !!current.activeEncounter })) {
      addToast('Splash offers unlock after your first identity, choice, and consequence.', 'info');
      return;
    }
    if (!canSpend('memorable')) {
      if (
        canOfferRewardedMemorable(settingsRef.current.contentMode)
        && canSoftOffer(current, { contentMode: settingsRef.current.contentMode })
      ) {
        setOutOfMemorableAdOffer(true);
      } else {
        addToast(capacityStatusMessage('memorable'), 'info');
      }
      return;
    }
    if (isSittingHardBlocked(current.memorableMoments ?? {}, current.turn)) {
      addToast('This sitting’s splash limit is used. Death can still illustrate; other moments wait.', 'info');
      return;
    }
    let offerPrompt = current.log.find((item) => item.id === entryId)?.beautyOffer?.imagePrompt ?? '';
    if (settingsRef.current.contentMode === 'kid' && offerPrompt) {
      const prepared = prepareKidSafeImagePrompt(offerPrompt, { skipIfUnsalvageable: true });
      if (prepared.skip) {
        addToast('That picture would not be kid-safe. The story continues without it.', 'info');
        const dismissed = applyDismissedBeautyOffer(current, entryId);
        if (dismissed) {
          stateRef.current = dismissed;
          setState(dismissed);
          void persist(dismissed);
        }
        return;
      }
      offerPrompt = prepared.prompt;
    }
    const applied = applyAcceptedBeautyOffer(current, entryId);
    if (!applied) return;
    stateRef.current = applied.next;
    setState(applied.next);
    void persist(applied.next);
    if (allowsImageGeneration(settingsRef.current, 'milestone-illustration')) {
      enqueueImageGen({
        kind: 'turn',
        entryId,
        prompts: [offerPrompt || applied.prompt],
        promptKind: 'milestone-illustration',
        visualContext: buildVisualConsistencyBlock(applied.next, []),
        isMilestone: true,
      });
    }
  });

  const dismissBeautyOffer = useCallbackRef((entryId: string) => {
    const current = stateRef.current;
    if (!current) return;
    const next = applyDismissedBeautyOffer(current, entryId);
    if (!next) return;
    stateRef.current = next;
    setState(next);
    void persist(next);
  });

  const retryMemorableImage = useCallbackRef((entryId: string) => {
    const current = stateRef.current;
    if (!current) return;
    const entry = current.log.find((item) => item.id === entryId);
    const prompt = entry?.splashImagePrompt?.trim();
    if (!prompt) {
      debugLogger.record('WARN', 'retryMemorableImage ignored — missing splash prompt', { entryId });
      return;
    }
    if (!allowsImageGeneration(settingsRef.current, 'milestone-illustration')) return;

    commitImageState((prev) => {
      const log = prev.log.map((logEntry) =>
        logEntry.id === entryId
          ? {
              ...logEntry,
              entryKind: 'milestone' as const,
              imageStatus: 'pending' as const,
              imageUrls: undefined,
              imageFailMessage: undefined,
            }
          : logEntry
      );
      return { ...prev, log, lastUpdated: Date.now() };
    });

    enqueueImageGen({
      kind: 'turn',
      entryId,
      prompts: [prompt],
      promptKind: 'milestone-illustration',
      visualContext: buildVisualConsistencyBlock(current, []),
      isMilestone: true,
      heroImage: false,
      bypassCapacity: true,
      skipUnlockToast: true,
    });
  });

  const retryPanelImage = useCallbackRef((entryId: string, panelIndex: number) => {
    const current = stateRef.current;
    if (!current) return;
    const entry = current.log.find((item) => item.id === entryId);
    const panel = entry?.panels?.[panelIndex];
    if (!panel?.imagePrompt?.trim()) {
      debugLogger.record('WARN', 'retryPanelImage ignored — missing panel prompt', { entryId, panelIndex });
      return;
    }

    // Flip only this panel back to pending so the spinner returns without mutating other
    // panels or interrupting the turn loop / GM busy flag.
    commitPanelImageReady((prev) => {
      const log = prev.log.map((logEntry) => {
        if (logEntry.id !== entryId || !logEntry.panels?.[panelIndex]) return logEntry;
        const panels = logEntry.panels.map((item, idx) =>
          idx === panelIndex
            ? { ...item, imageUrl: null, imageStatus: 'pending' as const }
            : item
        );
        return { ...logEntry, panels, imageStatus: 'pending' as const };
      });
      return { ...prev, log, lastUpdated: Date.now() };
    });

    const visualContext = buildVisualConsistencyBlock(current, []);
    enqueueImageGen({
      kind: 'panel-retry',
      entryId,
      panelIndex,
      prompt: panel.imagePrompt,
      promptKind: 'comic-panel',
      visualContext,
      playerActionContext: panelIndex === 0
        ? current.log.filter((item) => item.role === 'player').pop()?.content
        : undefined,
    });
  });

  /** Section 8 — persist pre-export Editor Mode bubble drag/text overrides onto a panel. */
  const updatePanelOverlay = useCallbackRef((
    entryId: string,
    panelIndex: number,
    edit: ComicOverlayEdit
  ) => {
    const current = stateRef.current;
    if (!current) return;
    const entry = current.log.find((item) => item.id === entryId);
    if (!entry?.panels?.[panelIndex]) {
      debugLogger.record('WARN', 'updatePanelOverlay ignored — panel not found', { entryId, panelIndex });
      return;
    }

    const updated: GameState = {
      ...current,
      lastUpdated: Date.now(),
      log: current.log.map((logEntry) => {
        if (logEntry.id !== entryId || !logEntry.panels?.[panelIndex]) return logEntry;
        const panels = logEntry.panels.map((panel, idx) => {
          if (idx !== panelIndex) return panel;
          const prior = panel.overlayEdits ?? [];
          const existing = prior.find((item) => item.segmentIndex === edit.segmentIndex);
          const merged = { ...existing, ...edit, segmentIndex: edit.segmentIndex };
          return {
            ...panel,
            overlayEdits: [
              ...prior.filter((item) => item.segmentIndex !== edit.segmentIndex),
              merged,
            ],
          };
        });
        return { ...logEntry, panels };
      }),
    };
    setState(updated);
    stateRef.current = updated;
    void persist(updated);
  });

  const abortPendingPersists = () => {
    if (persistDebounceRef.current) {
      clearTimeout(persistDebounceRef.current);
      persistDebounceRef.current = null;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  const unloadActiveCampaign = (saveId?: string) => {
    abortPendingPersists();
    const activeId = stateRef.current?.saveId;
    if (saveId && activeId && activeId !== saveId) return;
    if (!stateRef.current && !saveId) return;
    isHydratedRef.current = false;
    setState(null);
    stateRef.current = null;
    setBootPhase('hub');
    setShowSettings(false);
    isHydratedRef.current = true;
  };

  const handleExport = useCallbackRef(() => {
    const current = stateRef.current;
    if (current) {
      exportSave(current);
      return;
    }
    void loadGame().then((local) => {
      if (local) exportSave(local);
      else addToast('No save to export.', 'error');
    });
  });

  const handleImport = useCallbackRef(async (file: File) => {
    try {
      const imported = await importSave(file);
      const recovered = clampLeakedOpeningQuests(
        reconcileCampaignLoadout(settleOrphanedImageJobs(imported))
      );
      setState(recovered);
      stateRef.current = recovered;
      bindSessionImageCache(recovered.saveId);
      setTelemetryContext({ saveId: recovered.saveId, engineMode: recovered.engineMode });
      isHydratedRef.current = true;
      await persist(recovered);
      await refreshSaveSlots();
      addToast('Save imported.', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to import save.', 'error');
    }
  });

  const deleteSavedGame = useCallbackRef(async (saveId: string) => {
    const trimmed = saveId.trim();
    if (!trimmed) return;
    abortPendingPersists();
    const local = await loadGame();
    const isLocal = local?.saveId === trimmed;
    const isActive = stateRef.current?.saveId === trimmed;

    if (isActive) unloadActiveCampaign(trimmed);

    if (isLocal || isActive) {
      await deleteGame();
      localStorage.removeItem(LOCAL_UPDATED_KEY);
    }

    const cloudResult = await deleteCloudSave(trimmed);
    if (!cloudResult.ok && cloudResult.error && cloudResult.error !== 'Not signed in' && cloudResult.error !== 'Supabase not configured') {
      addToast(`Cloud delete failed: ${cloudResult.error}`, 'error');
    }

    await clearSessionImageCache(trimmed);
    await refreshSaveSlots();
    addToast('Save deleted.', 'success');
  });

  const deleteExtraSaves = useCallbackRef(async () => {
    abortPendingPersists();
    const keepSaveId =
      stateRef.current?.saveId
      ?? localSlot?.saveId
      ?? cloudSlots[0]?.saveId
      ?? null;

    const extras = cloudSlots.filter((slot) => slot.saveId !== keepSaveId);
    const result = await deleteCloudSavesExcept(keepSaveId);
    if (!result.ok && result.error && result.error !== 'Not signed in' && result.error !== 'Supabase not configured') {
      addToast(`Could not clear extra saves: ${result.error}`, 'error');
      return;
    }

    for (const slot of extras) {
      void clearSessionImageCache(slot.saveId);
    }

    await refreshSaveSlots();
    const cleared = result.deleted || extras.length;
    addToast(cleared ? `Cleared ${cleared} leftover save${cleared === 1 ? '' : 's'}.` : 'No extra cloud saves to clear.', 'success');
  });

  const deleteAllSaves = useCallbackRef(async () => {
    abortPendingPersists();
    const ids = new Set<string>();
    if (stateRef.current?.saveId) ids.add(stateRef.current.saveId);
    if (localSlot?.saveId) ids.add(localSlot.saveId);
    for (const slot of cloudSlots) ids.add(slot.saveId);

    unloadActiveCampaign();
    await deleteGame();
    localStorage.removeItem(LOCAL_UPDATED_KEY);

    const result = await deleteCloudSavesExcept(null);
    if (!result.ok && result.error && result.error !== 'Not signed in' && result.error !== 'Supabase not configured') {
      addToast(`Cloud delete failed: ${result.error}`, 'error');
    }

    for (const id of ids) {
      void clearSessionImageCache(id);
    }

    await refreshSaveSlots();
    addToast('All saved games deleted.', 'success');
  });

  return {
    state, settings, googleUser, bootPhase, busy, turnPhase, streamingReveal, error, errorKind, showLoadingOverlay, retryStatus, currentImages, currentImage: currentImages[0] ?? null,
    imagesGenerating, videosGenerating,
    saveStatus, showSettings, setShowSettings, showApiSetup, setShowApiSetup, showNewGame, setShowNewGame,
    showRolls, setShowRolls, showMapModal, setShowMapModal, leftOpen, setLeftOpen, rightOpen, setRightOpen,
    showWelcome, setShowWelcome, showCharacterWindow, setShowCharacterWindow, showMerchantWindow, setShowMerchantWindow, unlockedQuests, dismissUnlockedQuests: () => setUnlockedQuests([]), syncPhase, toasts, dismissToast, addToast, cloudSlot, cloudSlots, localSlot,
    outOfTurnsAdOffer,
    dismissOutOfTurnsAdOffer: () => setOutOfTurnsAdOffer(false),
    outOfMemorableAdOffer,
    dismissOutOfMemorableAdOffer: () => setOutOfMemorableAdOffer(false),
    sendAction,
    cancelTurn: () => {
      turnAbortRef.current?.abort();
      resetTurnUi();
      const line =
        lastInputRef.current.trim()
        || [...(stateRef.current?.log ?? [])].reverse().find((e) => e.role === 'player')?.content
        || '';
      keepSentLineOnFail(line);
      setShowLoadingOverlay(false);
      setRetryStatus(null);
      turnInFlightRef.current = false;
      setBusy(false);
      addToast('Turn cancelled. Your line is still here.', 'info');
    },
    restoreDraft,
    clearRestoreDraft: () => setRestoreDraft(null),
    lastSavedTurn,
    retryAction: () => { if (lastInput.trim()) sendAction(lastInput); },
    retryPanelImage,
    retryMemorableImage,
    acceptBeautyOffer,
    dismissBeautyOffer,
    generateInventoryArt,
    commitInventoryArt,
    updatePanelOverlay,
    clearError: () => setError(null),
    autoFight, autoFightWarning, cancelAutoFightWarning: () => setAutoFightWarning(null),
    startNewGame, updateSettings: (s: Settings) => { setSettings(s); settingsRef.current = s; saveSettings(s); },
    updateCustomTabletopRules: async (text: string) => {
      const s = stateRef.current;
      if (!s) return;
      const clipped = clipCustomTabletopRules(text).text;
      const updated = {
        ...s,
        customTabletopRules: clipped || undefined,
        lastUpdated: Date.now(),
      };
      setState(updated);
      stateRef.current = updated;
      await persist(updated);
    },
    handleExport, handleImport, deleteSavedGame, deleteExtraSaves, deleteAllSaves,
    updateStoryName: async (name) => {
      const s = stateRef.current;
      if (!s) return;
      const updated = { ...s, storyName: name, lastUpdated: Date.now() };
      setState(updated);
      stateRef.current = updated;
      await persist(updated);
    },
    setContentMode: (mode, pin) => {
      setSettings((prev) => {
        if (prev.kidModeLocked && mode === 'adult') return prev;
        const updated = { ...prev, contentMode: mode, contentPin: mode === 'kid' && pin ? pin : prev.contentPin };
        saveSettings(updated);
        return updated;
      });
      if (mode === 'adult') {
        try {
          sessionStorage.removeItem('synapticgm-parent-purchase-ok-until');
        } catch {
          /* ignore */
        }
      }
    },
    verifyContentPin: (pin) => settingsRef.current.contentPin === pin,
    rewindOneTurn: () => {
      const snapshot = snapshotRef.current;
      if (!snapshot) return;
      setState(snapshot);
      stateRef.current = snapshot;
      snapshotRef.current = null;
      setCanRewind(false);
      persist(snapshot);
    },
    acceptPendingTurn,
    discardPendingTurn,
    editPendingNarrative,
    rerollPendingTurn,
    canRewind, comicMode, setComicMode, narrativeMode, setNarrativeMode,
    updateLorebook: (cards) => setState((prev) => prev ? { ...prev, lorebook: cards, lastUpdated: Date.now() } : prev),
    updateGameState: (newState: GameState) => { setState(newState); stateRef.current = newState; persist(newState); },
    applyCampaignBible: (bibleId: string) => {
      const previous = stateRef.current;
      if (!previous) return;
      const bible = getCampaignBibleById(bibleId);
      if (!bible) {
        addToast('Campaign bible not found', 'error');
        return;
      }
      if (isNsfwCampaign(bible) && settingsRef.current.contentMode === 'kid') {
        addToast('This adventure is NSFW. Exit Kid Mode (PIN) to play it.', 'error');
        return;
      }
      const seeded = seedStateFromCampaignBible(previous, bible);
      const named = {
        ...seeded,
        storyName: formatCampaignStoryName(bible.title),
        lastUpdated: Date.now(),
      };
      stateRef.current = named;
      setState(named);
      void persist(named);
      addToast(`Loaded campaign rails: ${bible.title}`, 'info');
    },
    loadDungeon, ensureLocalMap, hydratePlayFromLog, moveDungeonNode, exitDungeon,
    handleGuestSignIn: async () => {
      setGoogleUser(GUEST_USER);
      setTelemetryContext({ playerId: 'guest' });
      setBootPhase('hub');
      isHydratedRef.current = true;
      setCloudSlot(null);
      setCloudSlots([]);
      void refreshSaveSlots();
    },
    continueGame: async () => {
      debugLogger.record('SYSTEM', 'continueGame invoked — resolving local + Supabase cloud save');
      setSyncPhase('syncing');
      try {
        const local = await loadGame();
        const cloud = await fetchLatestCloudSave();

        const localTs = local?.lastUpdated ?? 0;
        const cloudTs = cloud?.updatedAtMs ?? 0;
        const localTurn = local?.turn ?? -1;
        const cloudTurn = cloud?.state?.turn ?? -1;
        const useCloud =
          !!cloud &&
          (!local || cloudTurn > localTurn || (cloudTurn === localTurn && cloudTs > localTs));
        const saved = useCloud ? cloud!.state : local;

        if (!saved) {
          debugLogger.record('WARN', 'continueGame found no local or cloud save');
          addToast('No save found on this device or in the cloud.', 'error');
          return;
        }

        // Image requests are intentionally not persisted/resumed. A saved `pending` status
        // therefore has no live promise behind it and must become a terminal fallback state.
        const recovered = clampLeakedOpeningQuests(
          reconcileCampaignLoadout(settleOrphanedImageJobs(saved))
        );

        if (useCloud && cloud) {
          // Restore locked presentation settings from the cloud row when present.
          const nextSettings: Settings = {
            ...settingsRef.current,
            ...(cloud.visualMode ? { visualMode: cloud.visualMode } : {}),
            ...(cloud.artStylePreset ? { artStylePreset: cloud.artStylePreset } : {}),
          };
          setSettings(nextSettings);
          settingsRef.current = nextSettings;
          saveSettings(nextSettings);
          setComicMode(nextSettings.visualMode === 'comic');
          setNarrativeMode(false);
          window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: nextSettings }));
          addToast('Restored save from cloud (Supabase).', 'success');
        }

        debugLogger.record('STATE_UPDATE', 'Saved game loaded — hydrating state', {
          source: useCloud ? 'supabase' : 'local',
          turn: recovered.turn,
          storyName: recovered.storyName,
          logEntries: recovered.log.length,
          engineMode: recovered.engineMode,
        });
        setState(recovered);
        stateRef.current = recovered;
        bindSessionImageCache(recovered.saveId);
        setTelemetryContext({ saveId: recovered.saveId, engineMode: recovered.engineMode });
        isHydratedRef.current = true;
        // Always write the chosen save into IndexedDB so offline continue works.
        await saveGame(recovered);
        const slot = gameStateToLocalSlot(recovered);
        setLocalSlot(slot);
        if (useCloud && slot) setCloudSlot({ ...slot, source: 'cloud' });
        if (recovered !== saved || useCloud) {
          await persist(recovered);
        }
      } finally {
        setSyncPhase('idle');
      }
    },
    handleSetupComplete: async (contentMode, _apiKey, _provider, _model, _baseUrl) => {
      const newSettings = { ...settingsRef.current, contentMode, aiProvider: 'openrouter' as const } as Settings;
      setSettings(newSettings);
      saveSettings(newSettings);
      setTelemetryContext({ aiProvider: 'openrouter' });
      isHydratedRef.current = true;
      setBootPhase('hub');
    },
    handleGuestSignOut: () => {
      setGoogleUser(null);
      setTelemetryContext({ playerId: 'guest' });
      setBootPhase('auth');
    },
    handleBootSignIn: async () => {
      if (signupsPaused()) {
        addToast('New sign-ins are temporarily paused. Try again later.', 'error');
        return;
      }
      if (!isSupabaseConfigured) {
        addToast('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'error');
        return;
      }
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        addToast(error.message, 'error');
        debugLogger.record('ERROR', 'Google OAuth sign-in failed', { error: error.message });
      }
    },
    handleWelcomeTap: () => setBootPhase('auth'),
    handleGoogleSignIn: async () => {
      if (signupsPaused()) {
        addToast('New sign-ins are temporarily paused. Try again later.', 'error');
        return;
      }
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        addToast(error.message, 'error');
        debugLogger.record('ERROR', 'Google OAuth sign-in failed', { error: error.message });
      }
    },
    handleGoogleSignOut: async () => {
      await signOutSupabase();
      setGoogleUser(null);
      setTelemetryContext({ playerId: 'guest' });
      setBootPhase('auth');
    },
    handleCloudSync: async () => {},
    voice,
  };
}