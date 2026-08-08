import { useCallbackRef } from './useCallbackRef';
import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import type { GameState, Settings, LogEntry, RollRecord, Item, GoogleUser, SaveSlotInfo, EngineMode, LoreCard, GmStrictness, ContentMode, ErrorKind, AiProvider, Location3D, MapTier, ArtStylePreset, ComicOverlayEdit } from './types';
import { createInitialState } from './defaults';
import type { CampaignArchetype } from './archetypes';
import { buildArchetypeIntro } from './archetypes';
import { loadGame, saveGame, loadSettings, saveSettings, exportSave, importSave } from './db';
import { callGm, callGmAutoFight } from './aiService';
import { simulateCombat, buildAutoFightPrompt } from './combat';
import type { EnemyStats } from './combat';
import { isAutoFightWarningDismissed } from '@/components/AutoFightWarningModal';
import { generateComicImage, generateVideo, VideoProviderNotConfiguredError } from '@/services/openRouterService';
import { generatePanelScript } from '@/services/llmDirectorService';
import {
  bindSessionImageCache,
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
import { sanitizeNarrativeMechanics } from './narrativeSanitize';
import { extractUpdates, extractNewItems, parseActionTags, stripActionTags, matchLoreCards, eventsToLoreCards, parseTurnFrame, eventsToQuestUpdates, eventsToEncounterUpdate, parsePanels, eventsToMilestone, eventsToLootVideo, eventsToVisualUpdate, stripChoiceList, extractChoiceLines } from './parser';
import { inferItemType } from './salvage';
import { initializeDungeon, moveToNode, exitDungeon as engineExitDungeon } from './mapEngine';
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
import { evaluateRoll, simulateMerchantTurn } from './gameEngine';

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
export function extractChoicesFromText(text: string, state?: GameState): string[] {
  if (!text) return ['🎲 Let Fate Decide'];

  const choices = extractChoiceLines(text);

  const learned = getLearnedChoices(text);
  for (const habitAction of learned) {
    if (!choices.some((c) => c.toLowerCase() === habitAction.toLowerCase())) {
      choices.push(`✨ ${habitAction}`);
    }
  }

  const validatedChoices = state
    ? choices.filter((choice) => isSuggestionValidForState(choice, state))
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
  const [syncPhase, setSyncPhase] = useState<SyncPhase>('idle');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cloudSlot, setCloudSlot] = useState<SaveSlotInfo | null>(null);
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

  const applySupabaseSession = useCallbackRef((session: Session | null) => {
    if (!session?.user) {
      setTelemetryContext({ playerId: 'guest' });
      if (googleUserRef.current && !googleUserRef.current.isGuest) {
        setGoogleUser(null);
      }
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
  });

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
    const dungeonState = initializeDungeon(blueprintId, dungeonName, isProcedural, tier, previous.currentCoordinates, nodeCount);
    if (settingsRef.current.fogRevealThreshold === 'full') {
      dungeonState.visitedNodeIds = dungeonState.nodes.map(n => n.id);
    }
    const updated = { ...previous, activeDungeon: dungeonState, lastUpdated: Date.now() };
    stateRef.current = updated;
    setState(updated);
    void persist(updated);
    addToast(`Entered: ${dungeonName}`, 'info');
  });

  const moveDungeonNode = useCallbackRef((targetNodeId: string) => {
    const previous = stateRef.current;
    if (!previous?.activeDungeon) return;
    const updatedDungeon = moveToNode(previous.activeDungeon, targetNodeId);
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
    const updated = { ...previous, activeDungeon: updatedDungeon, lastUpdated: Date.now() };
    stateRef.current = updated;
    setState(updated);
    void persist(updated);
  });

  const exitDungeon = useCallbackRef(() => {
    const previous = stateRef.current;
    if (!previous) return;
    const updatedDungeon = engineExitDungeon();
    const updated = { ...previous, activeDungeon: updatedDungeon, lastUpdated: Date.now() };
    stateRef.current = updated;
    setState(updated);
    void persist(updated);
    setShowMapModal(false);
    addToast('Exited active map zone', 'info');
  });

  const sendAction = useCallbackRef(async (input: string) => {
    if (!input.trim() || busy) return;
    const current = stateRef.current;
    if (!current) return;

    debugLogger.record('TURN_START', 'sendAction invoked', {
      input: input.slice(0, 100),
      currentTurn: current.turn,
      busy
    });

    const mode = settingsRef.current.contentMode === 'kid' ? 'kid' : 'adult';
    const sanitizedInput = sanitizeInput(input, mode);

    debugLogger.record('STATE_UPDATE', 'Input sanitized', {
      original: input.slice(0, 50),
      sanitized: sanitizedInput.slice(0, 50),
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

    const lastGmText = current.log.filter((l) => l.role === 'gm').pop()?.content ?? '';
    saveHabit(sanitizedInput, lastGmText);

    const loadingTimer = setTimeout(() => setShowLoadingOverlay(true), 2500);

    const playerEntry: LogEntry = {
      id: uid(),
      turn: current.turn,
      role: 'player',
      content: sanitizedInput,
      timestamp: Date.now(),
    };

    snapshotRef.current = current;
    setCanRewind(true);

    // Commit the optimistic player entry as a concrete snapshot. Do not derive later turn
    // work inside a React updater: updater execution may be deferred or repeated by React,
    // which previously left `stateRef` stale and made post-turn media jobs timing-dependent.
    const optimisticState: GameState = {
      ...current,
      log: [...current.log, playerEntry],
    };
    stateRef.current = optimisticState;
    setState(optimisticState);

    try {
      const liveCurrent = stateRef.current;
      if (!liveCurrent) return;

      const strengthVal = liveCurrent.character.strength ?? liveCurrent.character.attributes?.STR ?? 14;
      const strMod = Math.floor((strengthVal - 10) / 2);
      const d20Roll = Math.floor(Math.random() * 20) + 1;
      const difficultyClass = 12;
      const outcome = evaluateRoll(d20Roll, strMod, difficultyClass);

      const isDndEngine = liveCurrent.engineMode === 'dnd';
      const codeResolutionText = outcome.isSuccess
        ? `SUCCESS (Rolled d20: ${d20Roll} + Mod: ${strMod} = ${outcome.totalScore} vs DC ${difficultyClass})`
        : `FAILURE (Rolled d20: ${d20Roll} + Mod: ${strMod} = ${outcome.totalScore} vs DC ${difficultyClass})`;
      const narrativeOutcomeLabel = outcome.isSuccess ? 'SUCCESS' : 'FAILURE';

      logRollResults([
        {
          label: 'action_check',
          total: outcome.totalScore,
          detail: `d20=${d20Roll} mod=${strMod} dc=${difficultyClass} ${outcome.isSuccess ? 'SUCCESS' : 'FAILURE'}`,
        },
      ]);

      let engineHpDelta = outcome.isSuccess ? 0 : -2;

      let hiddenSimUpdate = '';
      if (liveCurrent.worldLedger) {
        const simResult = simulateMerchantTurn(liveCurrent.worldLedger.caravans);
        liveCurrent.worldLedger.caravans = simResult.updatedCaravans;
        for (const ev of simResult.newEvents) {
          liveCurrent.worldLedger.pendingHiddenEvents.push(ev);
        }
      }

      if (liveCurrent.worldLedger && liveCurrent.worldLedger.pendingHiddenEvents.length > 0) {
        const revealedEvent = liveCurrent.worldLedger.pendingHiddenEvents.shift();
        if (revealedEvent) {
          hiddenSimUpdate = `\n[DISCOVERED BACKGROUND EVENT]: ${revealedEvent}`;
        }
      }

      const unsupportedItems = findUnsupportedItemClaims(sanitizedInput, liveCurrent);
      const inventoryGate = unsupportedItems.length
        ? `\n[INVENTORY GATE — MANDATORY]: Player attempted to use item(s) NOT in inventory: ${unsupportedItems.join(', ')}. REJECT the use. Do not invent the item. Narrate the failed attempt, emit <system>Action failed: item not in inventory.</system>, and offer alternatives based on Equipped Gear / Inventory only.`
        : '';

      // LitRPG/RPG: keep dice math out of the model-facing story cue so it is less likely to echo into prose.
      const deterministicStateBlock = isDndEngine
        ? `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${liveCurrent.character.name} (Lvl ${liveCurrent.character.level})
HP: ${liveCurrent.character.hp}/${liveCurrent.character.maxHp}
Gold: ${liveCurrent.gold ?? 0}
CODE ENFORCED OUTCOME FOR THIS ACTION: ${codeResolutionText}${hiddenSimUpdate}${inventoryGate}
-------------------------------------------------
`
        : `
--- DETERMINISTIC GAME ENGINE STATE (MANDATORY) ---
Character: ${liveCurrent.character.name} (Lvl ${liveCurrent.character.level})
HP: ${liveCurrent.character.hp}/${liveCurrent.character.maxHp}
Gold: ${liveCurrent.gold ?? 0}
CODE ENFORCED OUTCOME FOR THIS ACTION: ${narrativeOutcomeLabel}
Do NOT print dice notation, d20 lines, modifiers, DCs, or "Strength Check:" text in the narrative or <narrative> panels. Put that math only inside <system-log>. Narrate the ${narrativeOutcomeLabel.toLowerCase()} as story consequences only.${hiddenSimUpdate}${inventoryGate}
-------------------------------------------------
`;

      const recentNarrative = liveCurrent.log.slice(-4).map((e) => e.content).join(' ');
      const activeLoreCards = matchLoreCards(input, recentNarrative, liveCurrent.lorebook ?? []);

      debugLogger.record('API_REQUEST', 'Calling callGm for narrative generation', {
        turn: liveCurrent.turn,
        inputLength: sanitizedInput.length,
        aiProvider: settingsRef.current.aiProvider,
        hasApiKey: !!(settingsRef.current.geminiApiKey || settingsRef.current.openrouterApiKey)
      });
      const gmStartTime = performance.now();
      const result = await callGm(liveCurrent, `${sanitizedInput}\n\n${deterministicStateBlock}`, settingsRef.current, activeLoreCards, (attempt, delayMs) => {
        debugLogger.record('WARN', `Rate limited — retry ${attempt}/4`, { delayMs });
        setRetryStatus(`Rate limited — retry ${attempt}/4 in ${Math.round(delayMs / 1000)}s…`);
      });
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

      const codeSystemLogLine = `Action Check: d20(${d20Roll}) + Mod(${strMod}) = ${outcome.totalScore} vs DC ${difficultyClass} — ${narrativeOutcomeLabel}`;
      const gmEntry: LogEntry = {
        id: uid(),
        turn: liveCurrent.turn + 1,
        role: 'gm',
        content: result.text,
        timestamp: Date.now(),
        systemLog: Array.from(new Set([...(result.systemLog ?? []), codeSystemLogLine])),
      };

      // `events`/derived requests must be parsed BEFORE anything below references them
      // (e.g. `lootVideoEntry`) — declaring them later caused a
      // "Cannot access before initialization" crash in the job runner.
      const events = parseActionTags(result.text);
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
      const newItems = extractNewItems(result.text);
      const cleanText = stripChoiceList(stripActionTags(result.text));
      const parsedPanels = parsePanels(result.text);
      const newLoreCards = eventsToLoreCards(events, liveCurrent.turn + 1);
      const turnFrame = parseTurnFrame(result.text);
      const suggestionState: GameState = newLoreCards.length > 0
        ? { ...liveCurrent, lorebook: [...(liveCurrent.lorebook ?? []), ...newLoreCards] }
        : liveCurrent;
      const parsedChoices = extractChoicesFromText(result.text, suggestionState);
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
      // waiting on this extra, optional pass.
      if (isComicView && panelBudget > 0) {
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

      const newInventoryItems: Item[] = newItems.map((ni) => ({
        id: uid(),
        name: ni.name,
        rarity: ni.rarity as Item['rarity'],
        quantity: 1,
        provenance: ni.provenance,
      }));

      let hpDelta = engineHpDelta;
      for (const e of events) {
        if (e.type === 'heal' && e.amount) hpDelta += e.amount;
        if (e.type === 'damage' && e.amount) hpDelta -= e.amount;
      }

      debugLogger.record('STATE_UPDATE', 'Merging GM response into game state', {
        turn: liveCurrent.turn,
        newTurn: liveCurrent.turn + 1,
        hpDelta,
        newItems: newInventoryItems.length,
        newLoreCards: newLoreCards.length,
        pendingImagePrompt: !!result.imagePrompt
      });
      // Build the complete next snapshot as a pure calculation. React updater functions must
      // stay side-effect-free and must not be used as a synchronization primitive for queues,
      // persistence, TTS, or any external service.
      const existingLoreIds = new Set((liveCurrent.lorebook ?? []).map((c) => c.id));
      const mergedLorebook = [
        ...(liveCurrent.lorebook ?? []),
        ...newLoreCards.filter((c) => !existingLoreIds.has(c.id)),
      ];
      const baseChar = { ...liveCurrent.character, ...(updates.character ?? {}) };
      if (hpDelta !== 0) {
        baseChar.hp = Math.max(0, Math.min(baseChar.maxHp, (baseChar.hp ?? 0) + hpDelta));
      }
      if (visualUpdate) {
        baseChar.appearance = visualUpdate.description;
      }

      const inventoryAfterFormChange = visualUpdate?.formChange
        ? liveCurrent.inventory.map((item) => {
            if (!item.equipped) return item;
            const type = inferItemType(item);
            return type === 'weapon' || type === 'armor' ? { ...item, equipped: false } : item;
          })
        : liveCurrent.inventory;

      const updatedQuests = eventsToQuestUpdates(events, liveCurrent.quests ?? []);
      const updatedEncounter = eventsToEncounterUpdate(events, liveCurrent.activeEncounter ?? null);
      const mergedState: GameState = {
        ...liveCurrent,
        ...updates,
        character: baseChar,
        quests: updatedQuests,
        activeEncounter: updatedEncounter,
        log: [
          ...liveCurrent.log,
          {
            ...gmEntry,
            content: cleanText,
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
        turn: liveCurrent.turn + 1,
        pendingImagePrompt: result.imagePrompt,
        choices: parsedChoices,
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

      // Commit first, then stage the side-effect descriptor. The useEffect consumer above
      // cannot run until React has committed this render, so persistence, TTS, and media
      // dispatch are guaranteed to observe the final merged snapshot.
      stateRef.current = mergedState;
      setState(mergedState);

      debugLogger.record('STATE_UPDATE', 'State updated — turn incremented', {
        turn: mergedState.turn,
        logEntries: mergedState.log.length,
        imagePromptAttached: !!mergedState.pendingImagePrompt
      });

      postCommitTurnEffectsRef.current.push({
        snapshot: mergedState,
        imageJobs: postCommitImageJobs,
        videoJob: postCommitVideoJob,
        speech: isComicView && comicPanelsForLog.length > 0
          ? { kind: 'sequence', texts: buildComicSpeechQueue(comicPanelsForLog) }
          : { kind: 'text', text: result.text },
      });
      setPostCommitTurnEpoch((epoch) => epoch + 1);
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
      clearTimeout(loadingTimer);
      setShowLoadingOverlay(false);
      setRetryStatus(null);
      setBusy(false);
    }
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
  ) => {
    if (
      selectedVisualMode ||
      selectedArtStyle ||
      typeof classicMemorableImages === 'boolean'
    ) {
      const updated = { ...settingsRef.current } as Settings;
      if (selectedVisualMode) updated.visualMode = selectedVisualMode;
      if (selectedArtStyle) updated.artStylePreset = selectedArtStyle;
      if (typeof classicMemorableImages === 'boolean') {
        updated.classicMemorableImages = classicMemorableImages;
      }
      setSettings(updated);
      settingsRef.current = updated;
      saveSettings(updated);
      setComicMode(updated.visualMode === 'comic');
      setNarrativeMode(false);
    }

    const base = createInitialState(storyName, engineMode, archetype);
    const introContent = buildArchetypeIntro(engineMode, archetype ?? 'ai_random', character.name ?? 'Survivor');
    const initialChoices = extractChoicesFromText(introContent, base);
    const cleanIntroContent = stripChoiceList(introContent);

    const newState: GameState = {
      ...base,
      gmStrictness,
      character: { ...base.character, ...character },
      currentCoordinates: { q: 0, r: 0, tier: 2, z: 0 },
      choices: initialChoices,
      log: [{ id: 'intro-1', turn: 0, role: 'gm', content: cleanIntroContent, timestamp: Date.now() }],
      worldLedger: { caravans: [], pendingHiddenEvents: [] },
    };
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

  return {
    state, settings, googleUser, bootPhase, busy, error, errorKind, showLoadingOverlay, retryStatus, currentImages, currentImage: currentImages[0] ?? null,
    imagesGenerating, videosGenerating,
    saveStatus, showSettings, setShowSettings, showApiSetup, setShowApiSetup, showNewGame, setShowNewGame,
    showRolls, setShowRolls, showMapModal, setShowMapModal, leftOpen, setLeftOpen, rightOpen, setRightOpen,
    showWelcome, setShowWelcome, showCharacterWindow, setShowCharacterWindow, showMerchantWindow, setShowMerchantWindow, syncPhase, toasts, dismissToast, addToast, cloudSlot, localSlot,
    sendAction,
    retryAction: () => { if (lastInput.trim()) sendAction(lastInput); },
    retryPanelImage,
    updatePanelOverlay,
    clearError: () => setError(null),
    autoFight, autoFightWarning, cancelAutoFightWarning: () => setAutoFightWarning(null),
    startNewGame, updateSettings: (s) => { setSettings(s); settingsRef.current = s; saveSettings(s); },
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
    canRewind, comicMode, setComicMode, narrativeMode, setNarrativeMode,
    updateLorebook: (cards) => setState((prev) => prev ? { ...prev, lorebook: cards, lastUpdated: Date.now() } : prev),
    updateGameState: (newState: GameState) => { setState(newState); stateRef.current = newState; persist(newState); },
    loadDungeon, moveDungeonNode, exitDungeon,
    handleGuestSignIn: async () => {
      setGoogleUser(GUEST_USER);
      setTelemetryContext({ playerId: 'guest' });
      setBootPhase('hub');
      isHydratedRef.current = true;
    },
    continueGame: async () => {
      debugLogger.record('SYSTEM', 'continueGame invoked — loading saved game from storage');
      const saved = await loadGame();
      if (saved) {
        // Image requests are intentionally not persisted/resumed. A saved `pending` status
        // therefore has no live promise behind it and must become a terminal fallback state.
        const recovered = settleOrphanedImageJobs(saved);
        debugLogger.record('STATE_UPDATE', 'Saved game loaded — hydrating state', {
          turn: recovered.turn,
          storyName: recovered.storyName,
          logEntries: recovered.log.length,
          engineMode: recovered.engineMode
        });
        setState(recovered);
        stateRef.current = recovered;
        bindSessionImageCache(recovered.saveId);
        setTelemetryContext({ saveId: recovered.saveId, engineMode: recovered.engineMode });
        isHydratedRef.current = true;
        if (recovered !== saved) await persist(recovered);
      } else {
        debugLogger.record('WARN', 'continueGame found no saved game — state unchanged');
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