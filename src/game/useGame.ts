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
import { generatePanelScript } from '@/services/llmDirectorService';
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
import { fallbackSuggestionForState, findUnsupportedItemClaims, isSuggestionValidForState } from './suggestionValidation';
import { isChoiceGroundedInTurn, normalizeStoryCorpus, padChoicesToCount, resolvePipelineChoices, sceneSafeFallbacks } from './choicePipeline';
import { sanitizeNarrativeMechanics, ensureTurnProse, ensureDamageNarration, ensureEncounterNarration, ensureXpNarration, stripUnearnedXpProse, stripResidualMechanicTags } from './narrativeSanitize';
import { runWarden, sanitizeExtractedCharacterUpdates } from './warden';
import { applyStructuralEvents } from './structuralEvents';
import { collectTurnTimelineFacts, mergeTimeline } from './timeline';
import { applyCampaignCharacter, reconcileCampaignLoadout, seedStateFromArchetype, seedStateFromCampaignBible } from './campaignSeed';
import {
  applyOpeningAnswer,
  applySystemRename,
  ensureSystemReceipt,
  establishmentChoices,
  sanitizeOpeningNarration,
  buildEstablishmentIntro,
  buildOpeningSceneMandate,
  filterOpeningPrompts,
  isOpeningEstablishmentPending,
  resolveOpeningPrompts,
  resolveOpeningRegistrar,
  synthesizeOpeningScene,
} from './openingEstablishment';
import { applyCommittedNarrative, extractSceneFacts, seedOpeningSceneFacts } from './sceneFacts';
import { applyFactLocks, detectFactLockViolations } from './factLocks';
import { dropInsultGear } from './wornGear';
import { needsPortraitRefresh, paperDollPrompt, portraitCacheKey } from './inventoryArt';
import { formatCampaignStoryName, getCampaignBibleById } from '@/data/campaigns';
import { parsePlayerIntent, groundPlayerAction } from './intentParser';
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
import {
  advanceTutorialBeats,
  ensureTutorialQuest,
  emptyTutorialProgress,
} from './tutorialBeats';
import {
  advanceCampaignMemory,
  upsertNpcRelationshipSummary,
} from './campaignMemory';
import { touchPlaceVisit, upsertPlaceFromSheet } from './places';
import { normalizeSheetAuthority } from './placeAuthority';
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
import { mergeNpcMemoriesFromTurn } from './npcMemory';
import { buildPendingProposal, getProposedState, withEditedNarrative, touchLocationSheet, ensureLocationSheet } from './pendingTurn';
import { extractUpdates, extractNewItems, parseActionTags, stripActionTags, matchLoreCards, eventsToLoreCards, parseTurnFrame, eventsToQuestUpdates, eventsToEncounterUpdate, parsePanels, eventsToMilestone, eventsToLootVideo, eventsToVisualUpdate, stripChoiceList, extractChoiceLines, stripTurnCloser, storyHasBody } from './parser';
import { hasRealGmStory } from './turnAsk';
import { encounterOriginPlace } from './locationName';
import { clampLeakedOpeningQuests, extractNamedPlaces, harvestPlayText, isGenericMapPlace, mapAnchorName, newlyRevealedQuests, questsLockedDuringOpening, syncQuestsFromPlay } from './questPlay';
import { inferItemType } from './salvage';
import { initializeDungeon, moveToNode, exitDungeon as engineExitDungeon, buildLocalAreaMap, addLandmarkToLocalMap } from './mapEngine';
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
import { sanitizeInput } from '@/utils/filterLogic';
import { logger } from './logger';
import { debugLogger } from './debugLogger';
import { supabase, signInWithGoogleOAuth, signOutSupabase, isSupabaseConfigured } from '@/lib/supabase';
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
  | { kind: 'turn'; entryId: string; prompts: string[]; promptKind: ImagePromptKind; visualContext: string; isMilestone?: boolean }
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
  const turnInFlightRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState('');
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

  const voice = useVoice(settings.ttsEnabled);

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

  const fetchPanelImage = useCallbackRef(async (
    prompt: string,
    settings: Settings,
    promptKind: ImagePromptKind,
    context?: ImagePromptContext
  ): Promise<string | null> => {
    // Classic text: skip routine art; optional memorable-moment splashes still allowed.
    if (!allowsImageGeneration(settings, promptKind)) {
      debugLogger.record('SYSTEM', 'Skipping image generation for classic text mode', { promptKind });
      return null;
    }

    const mode = getContentMode(settings);
    const builtPrompt = buildImagePromptForKind(prompt, settings, mode, promptKind, context);
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
        hero: promptKind === 'milestone-illustration',
        memorableMoment: promptKind === 'milestone-illustration',
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
      return await storeIfPossible(imageUrl || null);
    } catch (e) {
      if (e instanceof ImageModerationError) {
        try {
          const softened = buildImagePromptForKind(softenPrompt(prompt), settings, mode, promptKind, context);
          const imageUrl = await requestImage(softened);
          return await storeIfPossible(imageUrl || null);
        } catch {
          return null;
        }
      }
      debugLogger.record('ERROR', 'Panel image generation failed', {
        error: e instanceof Error ? e.message : String(e),
        prompt: prompt.slice(0, 100),
        promptKind,
        timedOut: e instanceof Error && e.message.includes('timed out'),
      });
      return null;
    }
  });

  /** Legendary Loot Video generation — pluggable backend, gracefully returns null until a provider is configured. */
  const fetchLootVideo = useCallbackRef(async (
    prompt: string,
    settings: Settings,
    context?: ImagePromptContext
  ): Promise<string | null> => {
    const mode = getContentMode(settings);
    const builtPrompt = buildImagePromptForKind(prompt, settings, mode, 'milestone-illustration', context);
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

                const imageUrl = await fetchPanelImage(prompt, settingsRef.current, job.promptKind, {
                  visualConsistency: job.visualContext,
                  // Player-action-first guarantee: only the FIRST panel of the turn gets the raw action context.
                  playerActionContext: panelIndex === 0 ? job.playerActionContext : undefined,
                });
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
              const imageUrl = await fetchPanelImage(job.prompt, settingsRef.current, job.promptKind, {
                visualConsistency: job.visualContext,
                playerActionContext: job.playerActionContext,
              });
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
            for (const prompt of job.prompts) {
              try {
                const imageUrl = await fetchPanelImage(prompt, settingsRef.current, job.promptKind, {
                  visualConsistency: job.visualContext,
                });
                if (imageUrl) urls.push(imageUrl);
              } catch (err) {
                debugLogger.record('ERROR', 'Unexpected turn image job failure', {
                  entryId: job.entryId,
                  error: err instanceof Error ? err.message : String(err),
                });
              }
              setImagesGenerating((count) => Math.max(0, count - 1));
              await yieldToMainThread();
            }

            commitImageState((prev) => {
              const log = prev.log.map((entry) =>
                entry.id === job.entryId
                  ? {
                      ...entry,
                      imageUrls: urls,
                      imageStatus: urls.length > 0 ? ('ready' as const) : ('error' as const),
                    }
                  : entry
              );
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
              const imageUrl = await fetchPanelImage(job.prompt, settingsRef.current, job.promptKind, {
                visualConsistency: job.visualContext,
              });
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
            videoUrl = await fetchLootVideo(job.prompt, settingsRef.current, { visualConsistency: job.visualContext });
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
    if (!areaMap && place) {
      areaMap = buildLocalAreaMap(place, landmarks, previous.currentCoordinates);
    } else if (areaMap?.blueprintId === 'local-area') {
      if (place && !isGenericMapPlace(place) && isGenericMapPlace(areaMap.dungeonName)) {
        areaMap = buildLocalAreaMap(place, landmarks, previous.currentCoordinates);
      } else {
        for (const named of landmarks) areaMap = addLandmarkToLocalMap(areaMap, named);
      }
    }
    const nextLocation =
      isGenericMapPlace(previous.currentLocation) && place ? place : previous.currentLocation;
    const questsChanged = JSON.stringify(quests) !== JSON.stringify(previous.quests ?? []);
    const mapChanged = areaMap !== previous.activeDungeon;
    const locationChanged = nextLocation !== previous.currentLocation;
    if (!questsChanged && !mapChanged && !locationChanged) return;
    const updated: GameState = {
      ...previous,
      quests,
      activeDungeon: areaMap,
      currentLocation: nextLocation,
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
    const current = stateRef.current;
    if (!current) return;
    if (current.pendingTurn) {
      addToast('Accept, edit, or discard the pending turn first.', 'info');
      return;
    }
    const lastVisible = [...current.log].reverse().find((e) => {
      if (e.role === 'player') return !!e.content?.trim();
      if (e.role === 'gm') return hasRealGmStory(e);
      return false;
    });
    if (
      !error
      && lastVisible?.role === 'player'
      && lastVisible.content.replace(/\s+/g, ' ').trim().toLowerCase()
        === input.replace(/\s+/g, ' ').trim().toLowerCase()
    ) {
      return;
    }
    turnInFlightRef.current = true;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    let sanitizedInput = '';
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
      turnInFlightRef.current = false;
      return;
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
        turnInFlightRef.current = false;
        return;
      } else {
        // New free-text cancels pending rewrite and continues with new text
        setState((s) => (s ? { ...s, pendingContentRewrite: null } : s));
      }
    } else {
      const soft = maybeRatingRewrite(mediated.text, settingsRef.current);
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
          turnInFlightRef.current = false;
          return;
        }
        rewriteSource = soft.rewritten;
        addToast(soft.diegeticMessage, 'info');
      }
    }

    const contentSanitized = sanitizeInput(rewriteSource, mode);
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
    setLastInput(input);

    const lastGmText = lastGmForGround;
    saveHabit(sanitizedInput, lastGmText);

    loadingTimer = setTimeout(() => setShowLoadingOverlay(true), 2500);

    const playerEntry: LogEntry = {
      id: uid(),
      turn: current.turn,
      role: 'player',
      content: contentSanitized,
      timestamp: Date.now(),
    };

    snapshotRef.current = current;
    setCanRewind(true);

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
    const optimisticState: GameState = {
      ...current,
      log: [...priorLog, playerEntry],
    };
    stateRef.current = optimisticState;
    setState(optimisticState);
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
          stateRef.current = stepped.state;
          setState(stepped.state);
          void persist(stepped.state);
          return;
        }

        const openingState = { ...stepped.state, pendingGeneratedOpening: false };
        let openingText = '';
        try {
          const openingResult = await callGm(
            openingState,
            `${buildOpeningSceneMandate(openingState, stepped.openingNotes)}\n\nWrite the System receipt, then begin the opening scene.`,
            settingsRef.current,
            [],
            (attempt, delayMs) => {
              setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
            },
          );
          openingText = stripChoiceList(stripActionTags(openingResult.text));
        } catch {
          openingText = '';
        }
        if (!openingText || openingText.length < 60 || isGenericBridgeNarrative(openingText)) {
          openingText = synthesizeOpeningScene(openingState);
        }
        openingText = ensureSystemReceipt(openingState, sanitizeOpeningNarration(openingText));
        const openingChoices = extractChoicesFromText(openingText, openingState);
        const cleanOpening = stripChoiceList(openingText);
        const openingUnlocks = newlyRevealedQuests(questsAtTurnStart, openingState.quests);
        const openingGm: LogEntry = {
          id: uid(),
          turn: openingState.turn,
          role: 'gm',
          content: cleanOpening,
          timestamp: Date.now(),
          systemLog: openingUnlocks.map((q) => `Quest Unlocked: ${q.name}`),
        };
        const openingTurn = openingState.turn + 1;
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
          log: [...openingState.log, openingGm],
          choices: openingChoices.length ? openingChoices : undefined,
          lastUpdated: Date.now(),
        };
        stateRef.current = committed;
        setState(committed);
        void persist(committed);
        if (openingUnlocks.length) setUnlockedQuests(openingUnlocks);
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
        intentForMandate.kind === 'refuse'
          ? `\n[REFUSE / PROTEST GATE]: Player is refusing / did not agree. Narrate the System's cold acknowledgment in-fiction. Do not break character. Do not say "choose an action to continue." If in combat, the enemy may press the advantage (outcome token still applies).`
          : '';

      logRollResults([
        {
          label: 'action_check',
          total: outcome.totalScore,
          detail: `d20=${d20Roll} mod=${strMod} dc=${difficultyClass} ${check.label} ${outcome.isSuccess ? 'SUCCESS' : 'FAILURE'}`,
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
      const deterministicStateBlock = isDndEngine
        ? `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${liveCurrent.character.name} (Lvl ${liveCurrent.character.level})
HP: ${liveCurrent.character.hp}/${liveCurrent.character.maxHp}
Gold: ${liveCurrent.gold ?? 0}
CODE ENFORCED OUTCOME FOR THIS ACTION: ${codeResolutionText}
${outcomeBlock}${hiddenSimUpdate}${actionGates}
-------------------------------------------------
`
        : `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${liveCurrent.character.name} (Lvl ${liveCurrent.character.level})
HP: ${liveCurrent.character.hp}/${liveCurrent.character.maxHp}
Gold: ${liveCurrent.gold ?? 0}
CODE ENFORCED OUTCOME FOR THIS ACTION: ${narrativeOutcomeLabel}
${outcomeBlock}
CODE OUTCOME (HIDDEN): ${narrativeOutcomeLabel}. Narrate story consequences only.
Do NOT print dice notation, d20 lines, modifiers, DCs, "Strength Check:", or Action Check math anywhere — not in narrative, not in <narrative> panels, and not in <system-log>.
In <system-log>, only emit LitRPG/RPG progression lines (XP, loot, HP change as story system text) with zero dice formulas. Never emit XP Gained: 0. Story beat first, then System chrome — never System-only.${hiddenSimUpdate}${actionGates}
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
      });

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
        const needsStoryRetry =
          !storyHasBody(probeText)
          || isUnresolvedActionNarrative(sanitizedInput, probeText, intentForMandate, previousGm)
          || probeLocks.some((l) => l.kind === 'weapon' || l.kind === 'cleared');
        // Fact-lock slips are cut locally after this. Only burn extra GM calls when
        // the turn did not resolve the player's action at all, or returned no story.
        if (needsStoryRetry) {
          debugLogger.record('WARN', 'Unresolved or empty action narrative — resolution retry', {
            turn: liveCurrent.turn,
            intent: intentForMandate.kind,
            empty: !storyHasBody(probeText),
            factLocks: probeLocks.map((v) => v.kind),
          });
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
            }),
            settingsRef.current,
            activeLoreCards,
            (attempt, delayMs) => {
              debugLogger.record('WARN', `Rate limited — retry ${attempt}/4`, { delayMs });
              setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
            },
          );
          probeText = probeOf(result.text);
          if (!storyHasBody(probeText)) {
            debugLogger.record('WARN', 'Empty GM story after retry — second resolution retry', {
              turn: liveCurrent.turn,
            });
            setRetryStatus('Writing the scene…');
            result = await callGm(
              liveCurrent,
              buildResolutionUserPayload({
                mandateBlock: turnMandate.block,
                playerAction: sanitizedInput,
                deterministicBlock: deterministicStateBlock,
                retry: true,
                intent: intentForMandate,
                factLocks: detectFactLockViolations(liveCurrent, probeText, sanitizedInput),
              }),
              settingsRef.current,
              activeLoreCards,
              (attempt, delayMs) => {
                debugLogger.record('WARN', `Rate limited — retry ${attempt}/4`, { delayMs });
                setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
              },
            );
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

      // Dice math belongs in the player-facing system log only for D&D / 5e.
      const codeSystemLogLine = isDndEngine
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
      const warden = runWarden(liveCurrent, rawEvents, result.text, sanitizedInput, intent);
      const events = warden.events;
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
      const milestoneReq = eventsToMilestone(events);
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
      let cleanText = stripResidualMechanicTags(stripChoiceList(stripActionTags(result.text)));
      cleanText = postFilterGmOutput(cleanText, settingsRef.current);
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
        gmText: result.text,
        state: suggestionState,
        loreCards: activeLoreCards,
        settings: settingsRef.current,
      });
      const habitAugmented = extractChoicesFromText(
        pipelineChoices.choices.map((c, i) => `${i + 1}. ${c}`).join('\n'),
        suggestionState,
        normalizeStoryCorpus(result.text)
      );
      const storyProseForChoices = normalizeStoryCorpus(result.text);
      const inventedEntityNames = warden.notes
        .map((n) => n.match(/unestablished entity:\s*(.+)$/i)?.[1]?.trim().toLowerCase())
        .filter((n): n is string => !!n);
      const hijack = detectSceneHijack(sanitizedInput, result.text, suggestionState);
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
      const finalChoices = padChoicesToCount(
        groundedAfterResolve.length > 0
          ? groundedAfterResolve
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
      // get rendered/imaged in `ComicGrid`. Text Mode and D&D Mode never reach this branch
      // (`isComicView` is false for both), so their pipelines are completely untouched. If the
      // Director call fails, times out, or returns something unusable, we silently keep the
      // GM's own `<panel>`-tag panels computed above — Comic Mode never blocks or breaks
      // waiting on this extra, optional pass. Skip it when the GM already wrote usable
      // panels — that extra call was holding the input box for up to 20s every turn.
      const gmPanelsUsable = sanitizedPanels.some((panel) => (panel.narrative ?? '').trim().length > 40);
      if (isComicView && panelBudget > 0 && !gmPanelsUsable) {
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
        const snap = snapshotRef.current;
        if (snap) {
          stateRef.current = snap;
          setState(snap);
        }
        setError('The story did not come through. Try that action again.');
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
      if (mode === 'kid') {
        const kidTalk = (s: string) => sanitizeInput(s, 'kid');
        cleanText = kidTalk(cleanText);
        comicPanelsForLog = comicPanelsForLog.map((panel) => ({
          ...panel,
          narrative: kidTalk(panel.narrative),
          imagePrompt: kidTalk(panel.imagePrompt),
        }));
        for (const item of newInventoryItems) item.name = kidTalk(item.name);
        if (baseChar.appearance) baseChar.appearance = kidTalk(baseChar.appearance);
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
      const turnUnlocks = newlyRevealedQuests(questsAtTurnStart, updatedQuests);
      if (turnUnlocks.length) {
        mergedSystemLog.push(...turnUnlocks.map((q) => `Quest Unlocked: ${q.name}`));
        setUnlockedQuests(turnUnlocks);
      }

      const leveledUp = (baseChar.level ?? 1) > (liveCurrent.character.level ?? 1);
      const bossCleared =
        events.some((e) => e.type === 'encounter-end') &&
        !!(workingState.activeDungeon && workingState.activeDungeon.blueprintId !== 'local-area');
      const tutorialAdv = advanceTutorialBeats(
        { ...workingState, tutorialProgress: workingState.tutorialProgress ?? emptyTutorialProgress() },
        {
          turn: nextTurn,
          playerAction: sanitizedInput,
          narrative: cleanText,
          systemLog: mergedSystemLog,
          checkFailed: !outcome.isSuccess,
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
      const npcMemories = mergeNpcMemoriesFromTurn(
        workingState,
        events,
        turnFacts,
        nextTurn
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

      if (workingState.activeDungeon && workingState.activeDungeon.blueprintId !== 'local-area') {
        workingState = {
          ...workingState,
          activeDungeon: seedDungeonState(
            workingState.activeDungeon,
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
      if (workingState.activeDungeon?.blueprintId !== 'local-area') {
        locationSheet = mergeSheetWithNode(
          locationSheet,
          currentDungeonNode(workingState.activeDungeon)
        );
      }
      let areaMap = workingState.activeDungeon ?? liveCurrent.activeDungeon ?? null;
      if (!areaMap && mapName) {
        areaMap = buildLocalAreaMap(mapName, landmarks, liveCurrent.currentCoordinates);
      } else if (areaMap?.blueprintId === 'local-area') {
        for (const named of landmarks) areaMap = addLandmarkToLocalMap(areaMap, named);
      }
      locationSheet = normalizeSheetAuthority(locationSheet, areaMap);

      let places = upsertPlaceFromSheet(
        touchPlaceVisit(workingState.places ?? liveCurrent.places ?? [], finalLocationName, nextTurn),
        locationSheet,
        {
          dungeonRef:
            areaMap && areaMap.blueprintId !== 'local-area' ? areaMap.blueprintId : undefined,
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
        }
      );

      const npcMemoriesWithRel = upsertNpcRelationshipSummary(npcMemories, nextTurn);
      const statusReveal = tutorialAdv.progress.fullStatusUnlocked
        ? 'full'
        : nextTurn >= 5
          ? 'core'
          : 'minimal';

      const mergedState: GameState = {
        ...workingState,
        ...updates,
        character: baseChar,
        quests: updatedQuests,
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
            ...(milestoneReq ? { entryKind: 'milestone' as const, imageStatus: 'pending' as const } : {}),
          },
          ...(lootVideoEntry ? [lootVideoEntry] : []),
        ],
        rolls: [...liveCurrent.rolls, ...newRolls],
        inventory: [...inventoryAfterFormChange, ...newInventoryItems],
        lorebook: mergedLorebook,
        turn: nextTurn,
        pendingImagePrompt: result.imagePrompt,
        choices: mode === 'kid' ? finalChoices.map((c) => sanitizeInput(c, 'kid')) : finalChoices,
        gold: Math.max(0, (workingState.gold ?? liveCurrent.gold ?? 0) + extraWeekGold),
        worldLedger,
        ...(turnFrame ? { turnFrameTheme: turnFrame } : {}),
      };

      // Prepare work descriptors before committing, but do not dispatch anything yet.
      const postCommitImageJobs: ImageGenJob[] = [];
      if (isComicView && comicPanelsForLog.length > 0) {
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
      if (milestoneReq && allowsImageGeneration(settingsRef.current, 'milestone-illustration')) {
        postCommitImageJobs.push({
          kind: 'turn',
          entryId: gmEntry.id,
          prompts: [milestoneReq.imagePrompt],
          promptKind: 'milestone-illustration',
          visualContext,
          isMilestone: true,
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
          choices: mode === 'kid' ? finalChoices.map((c) => sanitizeInput(c, 'kid')) : finalChoices,
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

        debugLogger.record('STATE_UPDATE', 'State updated — turn incremented', {
          turn: mergedState.turn,
          logEntries: mergedState.log.length,
          imagePromptAttached: !!mergedState.pendingImagePrompt
        });

        postCommitTurnEffectsRef.current.push(effectsPayload);
        setPostCommitTurnEpoch((epoch) => epoch + 1);
      }
    } catch (e) {
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
      setError(errMsg);
    } finally {
      if (loadingTimer !== undefined) clearTimeout(loadingTimer);
      setShowLoadingOverlay(false);
      setRetryStatus(null);
      turnInFlightRef.current = false;
      setBusy(false);
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
    const committed: GameState = { ...proposed, pendingTurn: null };
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

    const bible = bibleId ? getCampaignBibleById(bibleId) : undefined;
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
    const openingPrompts = filterOpeningPrompts(
      resolveOpeningPrompts(bible, engineMode, resolvedArchetype ?? namedSeeded.campaignArchetype),
      mergedCharacter
    );
    const registrar = resolveOpeningRegistrar(
      bible,
      engineMode,
      resolvedArchetype ?? namedSeeded.campaignArchetype
    );
    const establishedIntro = buildEstablishmentIntro(
      introContent,
      openingPrompts,
      bible,
      registrar,
      mergedCharacter.name
    );
    const initialChoices = establishedIntro.choices.length
      ? establishedIntro.choices
      : establishmentChoices(openingPrompts);
    const cleanIntroContent = stripChoiceList(establishedIntro.text);
    const newState: GameState = clampLeakedOpeningQuests({
      ...namedSeeded,
      gmStrictness,
      character: mergedCharacter,
      currentCoordinates: { q: 0, r: 0, tier: 2, z: 0 },
      choices: initialChoices,
      log: [{ id: 'intro-1', turn: 0, role: 'gm', content: cleanIntroContent, timestamp: Date.now() }],
      worldLedger: emptyWorldLedger(),
      openingEstablishment: openingPrompts.length
        ? { pending: openingPrompts, answers: {}, complete: false, registrar }
        : { pending: [], answers: {}, complete: true, registrar },
    });
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
    setShowNewGame(false);

    const introIsComic = shouldUseComicGrid(
      settingsRef.current,
      comicModeRef.current,
      narrativeModeRef.current
    );
    enqueueImageGen({
      kind: 'intro',
      prompt: introContent.slice(0, 200),
      promptKind: introIsComic ? 'comic-panel' : 'classic-illustration',
      visualContext: buildVisualConsistencyBlock(newState, []),
    });
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
        return new Promise<void>((resolve) => {
          setAutoFightWarning({
            enemy,
            resolve: (proceed: boolean) => {
              setAutoFightWarning(null);
              if (!proceed) { resolve(); return; }
              resolve();
            },
          });
        }).then(() => runAutoFight(enemy, liveCurrent));
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

      const newTurn = liveCurrent.turn + 1;
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
        log: [...liveCurrent.log, playerEntry, gmEntry],
        lastUpdated: Date.now(),
      };

      snapshotRef.current = liveCurrent;
      setCanRewind(true);
      setState(updated);
      stateRef.current = updated;
      await persist(updated);
    } catch (err: any) {
      setError(err?.message ?? 'Auto-fight failed.');
    } finally {
      setBusy(false);
    }
  });

  const generateInventoryArt = useCallbackRef(async (
    prompt: string,
    kind: Extract<ImagePromptKind, 'item-icon' | 'character-portrait'>
  ): Promise<string | null> => {
    const current = stateRef.current;
    if (!current) return null;
    return fetchPanelImage(prompt, settingsRef.current, kind, {
      visualConsistency: kind === 'character-portrait' ? buildVisualConsistencyBlock(current, []) : undefined,
    });
  });

  const commitInventoryArt = useCallbackRef((patch: {
    itemIcons?: Record<string, string>;
    portraitUrl?: string;
    portraitKey?: string;
  }) => {
    const current = stateRef.current;
    if (!current) return;
    const inventory = patch.itemIcons
      ? current.inventory.map((item) => (patch.itemIcons?.[item.id] ? { ...item, iconUrl: patch.itemIcons[item.id] } : item))
      : current.inventory;
    const character = patch.portraitUrl
      ? { ...current.character, portraitUrl: patch.portraitUrl, portraitKey: patch.portraitKey }
      : current.character;
    const next = { ...current, inventory, character, lastUpdated: Date.now() };
    stateRef.current = next;
    setState(next);
    void persist(next);
  });

  const portraitLock = useRef(false);
  useEffect(() => {
    const current = state;
    if (!current || busy || showCharacterWindow || portraitLock.current) return;
    if (!needsPortraitRefresh(current)) return;
    let cancelled = false;
    portraitLock.current = true;
    void (async () => {
      try {
        const live = stateRef.current ?? current;
        const url = await generateInventoryArt(paperDollPrompt(live), 'character-portrait');
        if (url && !cancelled) {
          commitInventoryArt({
            portraitUrl: url,
            portraitKey: portraitCacheKey(stateRef.current ?? live),
          });
        }
      } finally {
        portraitLock.current = false;
      }
    })();
    return () => {
      cancelled = true;
      portraitLock.current = false;
    };
  }, [
    busy,
    showCharacterWindow,
    state?.character.appearance,
    state?.character.portraitKey,
    state?.character.portraitUrl,
    state?.inventory,
    generateInventoryArt,
    commitInventoryArt,
  ]);

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
    state, settings, googleUser, bootPhase, busy, error, errorKind, showLoadingOverlay, retryStatus, currentImages, currentImage: currentImages[0] ?? null,
    imagesGenerating, videosGenerating,
    saveStatus, showSettings, setShowSettings, showApiSetup, setShowApiSetup, showNewGame, setShowNewGame,
    showRolls, setShowRolls, showMapModal, setShowMapModal, leftOpen, setLeftOpen, rightOpen, setRightOpen,
    showWelcome, setShowWelcome, showCharacterWindow, setShowCharacterWindow, showMerchantWindow, setShowMerchantWindow, unlockedQuests, dismissUnlockedQuests: () => setUnlockedQuests([]), syncPhase, toasts, dismissToast, addToast, cloudSlot, cloudSlots, localSlot,
    sendAction,
    retryAction: () => { if (lastInput.trim()) sendAction(lastInput); },
    retryPanelImage,
    generateInventoryArt,
    commitInventoryArt,
    updatePanelOverlay,
    clearError: () => setError(null),
    autoFight, autoFightWarning, cancelAutoFightWarning: () => setAutoFightWarning(null),
    startNewGame, updateSettings: (s) => { setSettings(s); settingsRef.current = s; saveSettings(s); },
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
        const useCloud = !!cloud && (!local || cloudTs > localTs);
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
    handleSetupComplete: async (contentMode, apiKey, provider, model, baseUrl) => {
      const newSettings = { ...settingsRef.current, contentMode, geminiApiKey: apiKey, aiProvider: provider, customModelId: model, baseUrl } as Settings;
      setSettings(newSettings);
      saveSettings(newSettings);
      setTelemetryContext({ aiProvider: provider });
      isHydratedRef.current = true;
      setBootPhase('hub');
    },
    handleGuestSignOut: () => {
      setGoogleUser(null);
      setTelemetryContext({ playerId: 'guest' });
      setBootPhase('auth');
    },
    handleBootSignIn: async () => {
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