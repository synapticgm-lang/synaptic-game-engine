import { useEffect, useRef, useState, useMemo } from 'react';
import { Send, Dice5, X, Mic, Square, Volume2, RefreshCw, Settings as SettingsIcon, AlertTriangle, FileDown, Backpack, LayoutGrid, MessageSquare, Terminal, Swords, BookOpen, EyeOff, Eye, List, Type } from 'lucide-react';
import { EnemyTargetFrame } from './EnemyTargetFrame';

import type { GameState, LogEntry, EngineMode, DiceAnimationMode, LoreCard, ArtStylePreset, StatVerbosity, ComicOverlayEdit, ComicLayoutMode, ComicReadingDirection } from '@/game/types';
import { filterSystemLogForEngine } from '@/game/systemLog';
import type { VoiceState } from '@/game/useVoice';
import { FormattedText } from './FormattedText';
import { logger } from '@/game/logger';
import { ComicGrid } from './comic/ComicGrid';
import { NarrativeView } from './NarrativeView';
import { ActionBar } from './qol/ActionBar';
import { LooseItemsBar } from './qol/LooseItemsBar';
import { RewindBar } from './qol/RewindBar';
import { TurnConfirmBar } from './qol/TurnConfirmBar';
import { shouldShowTurnAsk, TURN_ASK, hasRealGmStory, shouldSkipDuplicatePlayerBubble } from '@/game/turnAsk';
import {
  isTurnUiBlocked,
  resolveRevealContent,
  turnPhaseStatusMessage,
  type StreamingRevealState,
  type TurnPhase,
} from '@/game/streamReveal';
import { BeautyMomentOfferLink } from './BeautyMomentOffer';
import { splashPlateLabel, splashUnavailableLine } from '@/game/memorableMoments';
import { stripRepairMarkdown } from '@/game/repairEngine';
import type { PendingRepair } from '@/game/types';

const HIDE_OPTIONS_KEY = 'synapticgm-hide-options';
const HIDE_TEXT_KEY = 'synapticgm-hide-text';

function readBoolPref(key: string, fallback = false): boolean {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === '1';
  } catch {
    return fallback;
  }
}

function writeBoolPref(key: string, value: boolean): void {
  try {
    sessionStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

interface Props {
  state: GameState;
  busy: boolean;
  turnPhase?: TurnPhase;
  streamingReveal?: StreamingRevealState | null;
  error: string | null;
  errorKind: import('@/game/types').ErrorKind | null;
  currentImage: string | null;
  bgImage: string | null;
  bgOpacity: number;
  showRolls: boolean;
  engineMode: EngineMode;
  diceAnimation: DiceAnimationMode;
  statVerbosity: StatVerbosity;
  voice: VoiceState;
  comicMode: boolean;
  narrativeMode?: boolean;
  artStylePreset: ArtStylePreset;
  comicLayout?: ComicLayoutMode;
  comicReadingDirection?: ComicReadingDirection;
  imagesGenerating?: number;
  canRewind: boolean;
  onSend: (input: string) => void;
  onDismissPendingRepair?: () => void;
  onToggleRolls: () => void;
  onRetry: () => void;
  onOpenApiSettings: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onRewind: () => void;
  onAcceptPendingTurn?: () => void;
  onDiscardPendingTurn?: () => void;
  onRerollPendingTurn?: () => void;
  onEditPendingNarrative?: (text: string) => void;
  onToggleComicMode: () => void;
  /** When true, comic/narrative/classic view cycling is disabled for the active session. */
  sessionPresentationLocked?: boolean;
  onAutoFight: () => void;
  onOpenCharacter: () => void;
  onRetryPanelImage?: (entryId: string, panelIndex: number) => void;
  onRetryMemorableImage?: (entryId: string) => void;
  onUpdatePanelOverlay?: (entryId: string, panelIndex: number, edit: ComicOverlayEdit) => void;
  restoreDraft?: string | null;
  onRestoreDraftConsumed?: () => void;
  onAcceptBeautyOffer?: (entryId: string) => void;
  onDismissBeautyOffer?: (entryId: string) => void;
  contentMode?: string | null;
}

export function CenterPanel({ state, busy, turnPhase = 'idle', streamingReveal = null, error, errorKind, currentImage, bgImage, bgOpacity, showRolls, engineMode, diceAnimation, statVerbosity, voice, comicMode, narrativeMode, artStylePreset, comicLayout = 'paged', comicReadingDirection = 'ltr', imagesGenerating = 0, canRewind, onSend, onDismissPendingRepair, onToggleRolls, onStartListening, onStopListening, onStopSpeaking, onRetry, onOpenApiSettings, onRewind, onAcceptPendingTurn, onDiscardPendingTurn, onRerollPendingTurn, onEditPendingNarrative, onToggleComicMode, sessionPresentationLocked = false, onAutoFight, onOpenCharacter, onRetryPanelImage, onRetryMemorableImage, onUpdatePanelOverlay, restoreDraft, onRestoreDraftConsumed, onAcceptBeautyOffer, onDismissBeautyOffer, contentMode }: Props) {
  const [input, setInput] = useState('');
  const [diceRoll, setDiceRoll] = useState<string | null>(null);
  const [hideOptions, setHideOptions] = useState(() => readBoolPref(HIDE_OPTIONS_KEY));
  const [hideText, setHideText] = useState(() => readBoolPref(HIDE_TEXT_KEY));
  const logRef = useRef<HTMLDivElement>(null);
  const isDnd = engineMode === 'dnd';
  const showRollsPanel = isDnd && showRolls && state.rolls.length > 0;
  const showSystemLog = statVerbosity !== 'minimal';
  const bothChromeHidden = hideOptions && hideText;
  const turnUiBlocked = isTurnUiBlocked(busy, turnPhase, streamingReveal);
  const turnStatusMessage = busy ? turnPhaseStatusMessage(turnPhase) : null;

  const toggleHideOptions = () => {
    setHideOptions((prev) => {
      const next = !prev;
      writeBoolPref(HIDE_OPTIONS_KEY, next);
      return next;
    });
  };
  const toggleHideText = () => {
    setHideText((prev) => {
      const next = !prev;
      writeBoolPref(HIDE_TEXT_KEY, next);
      return next;
    });
  };

  // Opening covers need story + input — never leave Hide chrome stuck on from a prior session.
  useEffect(() => {
    if (!state.openingEstablishment || state.openingEstablishment.complete) return;
    if (hideText) {
      setHideText(false);
      writeBoolPref(HIDE_TEXT_KEY, false);
    }
    if (hideOptions) {
      setHideOptions(false);
      writeBoolPref(HIDE_OPTIONS_KEY, false);
    }
  }, [
    state.openingEstablishment?.complete,
    state.openingEstablishment?.pending?.length,
    hideText,
    hideOptions,
  ]);

  // If story exists but Hide text was left on from sessionStorage, restore the log on load.
  useEffect(() => {
    if (!hideText) return;
    const hasStory = state.log.some((e) => e.role === 'gm' && hasRealGmStory(e));
    if (!hasStory) return;
    setHideText(false);
    writeBoolPref(HIDE_TEXT_KEY, false);
  }, [state.log, hideText]);

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    if (!restoreDraft) return;
    setInput(restoreDraft);
    onRestoreDraftConsumed?.();
  }, [restoreDraft, onRestoreDraftConsumed]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.log, state.pendingTurn, busy]);

  useEffect(() => {
    const el = logRef.current;
    if (!el || hideText) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [state.log.length, hideText]);

  useEffect(() => {
    if (!isDnd || diceAnimation === 'static' || !busy) return;
    const rolls = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4'];
    const pick = rolls[Math.floor(Math.random() * rolls.length)];
    setDiceRoll(pick);
    const t = setTimeout(() => setDiceRoll(null), 900);
    return () => clearTimeout(t);
  }, [busy, isDnd, diceAnimation]);

  const handleSend = () => {
    if (!input.trim() || busy || !!state.pendingTurn) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="sgm-play-center relative flex min-h-0 flex-1 flex-col">
      {bgImage && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden
        >
          <img
            src={bgImage}
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ opacity: bgOpacity / 100 }}
          />
        </div>
      )}
      {comicMode ? (
        <div className={`relative z-10 min-h-0 flex-1 overflow-hidden ${hideText ? 'invisible' : ''}`}>
          <ComicGrid
            log={state.log}
            lorebook={state.lorebook}
            busy={busy}
            diceAnimating={!!diceRoll}
            currentImage={currentImage}
            bgImage={bgImage}
            artStylePreset={artStylePreset}
            comicLayout={comicLayout}
            comicReadingDirection={comicReadingDirection}
            imagesGenerating={imagesGenerating}
            onRetryPanelImage={onRetryPanelImage}
            onRetryMemorableImage={onRetryMemorableImage}
            onUpdatePanelOverlay={onUpdatePanelOverlay}
          />
        </div>
      ) : narrativeMode ? (
        <div className={`relative z-10 min-h-0 flex-1 overflow-hidden ${hideText ? 'invisible' : ''}`}>
          <NarrativeView
            log={state.log}
            busy={busy}
            turnPhase={turnPhase}
            streamingReveal={streamingReveal}
            engineMode={engineMode}
            onAcceptBeautyOffer={onAcceptBeautyOffer}
            onDismissBeautyOffer={onDismissBeautyOffer}
            contentMode={contentMode}
          />
        </div>
      ) : (
        <div
          ref={logRef}
          className={`sgm-play-story-panel relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 ${hideText ? 'invisible' : ''}`}
        >
          <div className="mx-auto max-w-2xl space-y-4">
            {state.log.map((entry, index) => (
              shouldSkipDuplicatePlayerBubble(state.log, index) ? null : (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  lorebook={state.lorebook}
                  showSystemLog={showSystemLog}
                  statVerbosity={statVerbosity}
                  engineMode={engineMode}
                  showTurnAsk={shouldShowTurnAsk(state.log, index, turnUiBlocked)}
                  streamingReveal={streamingReveal}
                  onAcceptBeautyOffer={onAcceptBeautyOffer}
                  onDismissBeautyOffer={onDismissBeautyOffer}
                  onRetryMemorableImage={onRetryMemorableImage}
                  contentMode={contentMode}
                />
              )
            ))}
            {turnStatusMessage && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-crimson-500" />
                {turnStatusMessage}
              </div>
            )}
            {busy && !turnStatusMessage && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-crimson-500" />
                The world responds...
              </div>
            )}
            {diceRoll && (
              <div className="flex items-center justify-center py-4">
                <div className="sgm-dice-outcome flex h-16 w-16 items-center justify-center rounded-lg border border-crimson-700/40 bg-crimson-950/30 shadow-[0_0_24px_rgba(220,38,38,0.2)]">
                  <Dice5 size={36} className="animate-spin text-crimson-400" style={{ animationDuration: '0.6s', color: 'var(--sgm-dice-accent, #f87171)' }} />
                </div>
              </div>
            )}
            {voice.speaking && (
              <div className="flex items-center gap-2 rounded-lg border border-crimson-800/40 bg-crimson-950/20 px-3 py-2 text-sm text-crimson-300">
                <span className="flex h-4 items-end gap-0.5">
                  <span className="h-1.5 w-0.5 animate-[bounce_0.4s_ease-in-out_infinite] rounded-full bg-crimson-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-3 w-0.5 animate-[bounce_0.5s_ease-in-out_infinite] rounded-full bg-crimson-400" style={{ animationDelay: '80ms' }} />
                  <span className="h-2 w-0.5 animate-[bounce_0.6s_ease-in-out_infinite] rounded-full bg-crimson-400" style={{ animationDelay: '160ms' }} />
                </span>
                <Volume2 size={14} />
                <span className="flex-1">GM is narrating...</span>
                <button onClick={onStopSpeaking} className="rounded-md p-1 text-crimson-400 hover:bg-crimson-900/40 transition-colors">
                  <Square size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentImage && !comicMode && (
        <div className="border-t border-slate-800 px-3 py-2 sm:px-6">
          <div className="relative mx-auto max-w-2xl">
            <img src={currentImage} alt="Cinematic scene" className="max-h-48 w-full rounded-lg object-cover" />
            <button onClick={() => {}} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-slate-300 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {showRollsPanel && (
        <div className="max-h-32 overflow-y-auto border-t border-slate-800 bg-slate-950/80 px-3 py-2 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Raw Roll History</div>
            {state.rolls.slice(-12).reverse().map(r => (
              <pre key={r.id} className="whitespace-pre-wrap font-mono text-[10px] text-slate-400">{r.raw}</pre>
            ))}
          </div>
        </div>
      )}

      {error && errorKind && (
        <div className="border-t border-amber-900/50 bg-amber-950/30 px-3 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-amber-400" />
            <span className="flex-1 text-xs text-amber-200/90">
              {errorKind === 'rate-limit'
                ? 'Rate limit reached after automatic retries. Wait a minute, then retry.'
                : errorKind === 'network'
                  ? 'Network error — check your connection and retry.'
                  : error}
            </span>
            <button
              onClick={onRetry}
              className="flex items-center gap-1 rounded-md border border-amber-700/50 bg-amber-900/30 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-800/40 transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
            <button
              onClick={onOpenApiSettings}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <SettingsIcon size={12} />
              Settings
            </button>
            <button
              onClick={() => logger.downloadLog()}
              title="Download debug log"
              className="flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-800/30 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800/50 transition-colors"
            >
              <FileDown size={12} />
              Log
            </button>
          </div>
        </div>
      )}

      <div className="sgm-play-input-footer relative z-50 shrink-0 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-3">
        <div className="mx-auto max-w-2xl">
          {state.pendingTurn && onAcceptPendingTurn && onDiscardPendingTurn && onRerollPendingTurn && onEditPendingNarrative && (
            <TurnConfirmBar
              pending={state.pendingTurn}
              busy={busy}
              onAccept={onAcceptPendingTurn}
              onDiscard={onDiscardPendingTurn}
              onReroll={onRerollPendingTurn}
              onEditNarrative={onEditPendingNarrative}
            />
          )}

          {state.pendingRepair && (
            <RepairBanner
              pending={state.pendingRepair}
              busy={busy}
              onPick={onSend}
              onDismiss={onDismissPendingRepair}
            />
          )}

          <div className="mb-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleHideOptions}
              aria-pressed={hideOptions}
              aria-label={hideOptions ? 'Show options' : 'Hide options'}
              title={hideOptions ? 'Show options' : 'Hide options'}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                hideOptions
                  ? 'border-crimson-700/50 bg-crimson-950/40 text-crimson-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {hideOptions ? <Eye size={14} /> : <EyeOff size={14} />}
              <List size={14} className="opacity-70" />
              <span>{hideOptions ? 'Show options' : 'Hide options'}</span>
            </button>
            <button
              type="button"
              onClick={toggleHideText}
              aria-pressed={hideText}
              aria-label={hideText ? 'Show text' : 'Hide text'}
              title={hideText ? 'Show text' : 'Hide text'}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                hideText
                  ? 'border-crimson-700/50 bg-crimson-950/40 text-crimson-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {hideText ? <Eye size={14} /> : <EyeOff size={14} />}
              <Type size={14} className="opacity-70" />
              <span>{hideText ? 'Show text' : 'Hide text'}</span>
            </button>
            {bothChromeHidden && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-600">
                More room for story
              </span>
            )}
          </div>

          <LooseItemsBar state={state} busy={busy || !!state.pendingTurn} onPickUp={onSend} />

          {state.playPhase !== 'ended' && state.playPhase !== 'down' && (
          <ActionBar
            state={state}
            busy={busy || !!state.pendingTurn}
            onAction={onSend}
            engineMode={engineMode}
            hidden={hideOptions}
          />
          )}
          {state.playPhase === 'down' && (
            <p className="mb-2 rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
              You are down. Rest, recover, or seek aid before acting again.
            </p>
          )}
          {!hideText && state.activeEncounter && (
            <div className="mb-2">
              <EnemyTargetFrame encounter={state.activeEncounter} />
            </div>
          )}
          <div className="mb-2 flex flex-wrap items-center gap-1 text-slate-500">
            <button onClick={onOpenCharacter} title="Inventory & character" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] transition-colors hover:bg-slate-800 hover:text-slate-300">
              <Backpack size={15} />
              <span className="hidden sm:inline">Inventory</span>
            </button>
            <button
              onClick={onToggleComicMode}
              disabled={sessionPresentationLocked}
              title={
                sessionPresentationLocked
                  ? 'Presentation locked for this session (chosen at New Game)'
                  : narrativeMode
                    ? 'Narrative view'
                    : comicMode
                      ? 'Comic grid view'
                      : 'Classic log view'
              }
              className={`rounded-md p-1.5 transition-colors ${
                sessionPresentationLocked
                  ? 'cursor-not-allowed opacity-40'
                  : comicMode || narrativeMode
                    ? 'bg-slate-800 text-crimson-400'
                    : 'hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {narrativeMode ? <BookOpen size={15} /> : comicMode ? <LayoutGrid size={15} /> : <MessageSquare size={15} />}
            </button>
            <RewindBar canRewind={canRewind} onRewind={onRewind} />
            {state.activeEncounter && (
              <button onClick={onAutoFight} disabled={busy} title="Auto-resolve combat" className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${busy ? 'bg-slate-800 text-slate-500' : 'border border-crimson-700/40 bg-crimson-950/30 text-crimson-400 hover:bg-crimson-900/40'}`}>
                <Swords size={13} />
                <span className="hidden xs:inline">Auto-Fight</span>
              </button>
            )}
            {isDnd && (
              <button onClick={onToggleRolls} title="Toggle roll history" className={`rounded-md p-1.5 transition-colors ${showRolls ? 'bg-slate-800 text-crimson-400' : 'hover:bg-slate-800 hover:text-slate-300'}`}>
                <Dice5 size={15} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {voice.sttSupported && (
              <button
                onClick={voice.listening ? onStopListening : onStartListening}
                disabled={turnUiBlocked}
                title={voice.listening ? 'Stop listening' : 'Speak your action'}
                className={`flex shrink-0 items-center justify-center rounded-lg border px-3 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  voice.listening
                    ? 'border-crimson-500 bg-crimson-950/50 text-crimson-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {voice.listening ? (
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 items-end gap-0.5">
                      <span className="h-1.5 w-0.5 animate-[bounce_0.4s_ease-in-out_infinite] rounded-full bg-crimson-400" style={{ animationDelay: '0ms' }} />
                      <span className="h-3 w-0.5 animate-[bounce_0.5s_ease-in-out_infinite] rounded-full bg-crimson-400" style={{ animationDelay: '80ms' }} />
                      <span className="h-2 w-0.5 animate-[bounce_0.6s_ease-in-out_infinite] rounded-full bg-crimson-400" style={{ animationDelay: '160ms' }} />
                    </span>
                    <Square size={14} />
                  </span>
                ) : (
                  <Mic size={18} />
                )}
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={turnUiBlocked}
              placeholder={voice.listening ? 'Listening...' : 'What do you do?'}
              rows={2}
              aria-label="Player action input"
              className="min-w-0 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={turnUiBlocked || !input.trim()}
              className="flex shrink-0 items-center justify-center rounded-lg bg-crimson-600 px-4 text-white transition-colors hover:bg-crimson-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogRow({ entry, lorebook, showSystemLog, statVerbosity, engineMode, showTurnAsk, streamingReveal, onAcceptBeautyOffer, onDismissBeautyOffer, onRetryMemorableImage, contentMode }: { entry: LogEntry; lorebook?: LoreCard[]; showSystemLog: boolean; statVerbosity: StatVerbosity; engineMode: EngineMode; showTurnAsk: boolean; streamingReveal?: StreamingRevealState | null; onAcceptBeautyOffer?: (entryId: string) => void; onDismissBeautyOffer?: (entryId: string) => void; onRetryMemorableImage?: (entryId: string) => void; contentMode?: string | null }) {
  const { text: displayContent, isRevealing } = resolveRevealContent(entry.id, entry.content, streamingReveal);
  // Classic memorable plate: a rare, GM-flagged full-page illustration — rendered large and
  // distinct from the routine text log, instead of only surfacing via the small image strip.
  if (entry.entryKind === 'milestone') {
    const image = entry.imageUrls?.[0];
    const plate = splashPlateLabel(entry);
    const failed = !image && (entry.imageStatus === 'error' || entry.imageStatus === 'failed');
    return (
      <div data-entry-id={entry.id} data-turn={entry.turn} data-panel-kind="memorable" className="space-y-2">
        <div className="flex justify-center">
          <span className="px-1 text-[11px] font-medium tracking-wide text-slate-400">
            {plate}
          </span>
        </div>
        {image ? (
          <div className="overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 shadow-2xl shadow-black/60">
            <img src={image} alt={plate} className="block max-h-[70vh] w-full object-contain" />
          </div>
        ) : failed ? (
          <div className="space-y-2 px-1 text-center">
            <p className="text-xs text-slate-500">{splashUnavailableLine(entry)}</p>
            {onRetryMemorableImage && entry.splashImagePrompt ? (
              <button
                type="button"
                onClick={() => onRetryMemorableImage(entry.id)}
                className="text-xs text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-slate-200"
              >
                Try picture again
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 text-xs text-slate-500 shadow-2xl shadow-black/60">
            Painting this moment…
          </div>
        )}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <FormattedText content={entry.content} lorebook={lorebook} />
        </div>
      </div>
    );
  }

  if (entry.mediaKind === 'video') {
    return (
      <div data-entry-id={entry.id} data-turn={entry.turn} data-panel-kind="loot-video" className="flex justify-center">
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-center">
            <span className="rounded-full border border-fuchsia-500/60 bg-fuchsia-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
              🎬 Legendary Drop{entry.lootItemName ? `: ${entry.lootItemName}` : ''}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border-2 border-fuchsia-600/50 bg-slate-950 shadow-xl shadow-black/50">
            {entry.videoUrl ? (
              <video src={entry.videoUrl} controls autoPlay loop muted className="block max-h-[50vh] w-full object-contain" />
            ) : (
              <div className="flex min-h-[160px] items-center justify-center text-xs text-slate-500">
                {entry.imageStatus === 'error' ? 'Loot video unavailable' : 'Rendering legendary loot video…'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (entry.role === 'player') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
          {entry.content}
        </div>
      </div>
    );
  }
  if (entry.role === 'system') {
    return (
      <div className="text-center text-xs text-slate-500">{entry.content}</div>
    );
  }
  if (!hasRealGmStory(entry) && !showTurnAsk) {
    return null;
  }
  return (
    <div className="space-y-1.5">
      {hasRealGmStory(entry) && (
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/92 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur-sm">
          <FormattedText content={displayContent} lorebook={lorebook} />
          {isRevealing && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-crimson-400/70 align-text-bottom" aria-hidden />
          )}
        </div>
      )}
      {hasRealGmStory(entry) && showSystemLog && entry.systemLog && entry.systemLog.length > 0 && (
        <SystemLogPanel
          lines={filterSystemLogForEngine(entry.systemLog, engineMode)}
          verbosity={statVerbosity}
        />
      )}
      <BeautyMomentOfferLink
        offer={entry.beautyOffer}
        contentMode={contentMode}
        onAccept={onAcceptBeautyOffer ? () => onAcceptBeautyOffer(entry.id) : undefined}
        onDismiss={onDismissBeautyOffer ? () => onDismissBeautyOffer(entry.id) : undefined}
      />
      {showTurnAsk && <TurnAskLine />}
    </div>
  );
}

function TurnAskLine() {
  return (
    <p className="px-1 pt-1 text-sm font-medium text-slate-200">{TURN_ASK}</p>
  );
}

function RepairBanner({
  pending,
  busy,
  onPick,
  onDismiss,
}: {
  pending: PendingRepair;
  busy: boolean;
  onPick: (input: string) => void;
  onDismiss?: () => void;
}) {
  const options = pending.options.slice(0, 2);
  return (
    <div
      className="mb-2 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2.5"
      role="region"
      aria-label="Clarify your action"
    >
      <p className="text-xs leading-relaxed text-amber-100/90">{stripRepairMarkdown(pending.message)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.length >= 2
          && options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={busy}
              onClick={() => onPick(opt)}
              className="rounded-md border border-amber-600/50 bg-amber-900/40 px-3 py-1.5 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-800/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {opt}
            </button>
          ))}
        {onDismiss && (
          <button
            type="button"
            disabled={busy}
            onClick={onDismiss}
            className="rounded-md border border-slate-600/60 bg-slate-900/50 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel clarification
          </button>
        )}
      </div>
    </div>
  );
}

function SystemLogPanel({ lines, verbosity }: { lines: string[]; verbosity: StatVerbosity }) {
  const filtered = useMemo(() => {
    if (verbosity === 'detailed') return lines;
    if (verbosity === 'core') {
      return lines.filter((l) => /success|fail|damage|heal|defeated|xp|loot|level|quest|dungeon|objective|registered|location/i.test(l));
    }
    return lines.slice(0, 2);
  }, [lines, verbosity]);

  if (filtered.length === 0) return null;

  return (
    <div className="ml-4 mt-2 max-w-lg rounded-lg border border-blue-500/50 border-l-4 border-l-sky-400 bg-blue-950/50 px-3 py-2 shadow-inner shadow-blue-900/40">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-300">
        <Terminal size={10} /> Status
        <span className="font-sans normal-case tracking-normal text-[9px] text-blue-300/70">Turn results</span>
      </div>
      <div className="space-y-0.5">
        {filtered.map((line, i) => (
          <div key={i} className="font-mono text-[11px] text-blue-100/90">{line}</div>
        ))}
      </div>
    </div>
  );
}
