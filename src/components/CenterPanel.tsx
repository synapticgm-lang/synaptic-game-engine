import { useEffect, useRef, useState, useMemo } from 'react';
import { Send, Dice5, Download, Upload, X, Mic, Square, Volume2, RefreshCw, Settings as SettingsIcon, AlertTriangle, FileDown, LayoutGrid, MessageSquare, Terminal, Swords, User, BookOpen } from 'lucide-react';
import { EnemyTargetFrame } from './EnemyTargetFrame';

import type { GameState, LogEntry, EngineMode, DiceAnimationMode, LoreCard, ArtStylePreset, StatVerbosity, ComicOverlayEdit } from '@/game/types';
import type { VoiceState } from '@/game/useVoice';
import { FormattedText } from './FormattedText';
import { logger } from '@/game/logger';
import { ComicGrid } from './comic/ComicGrid';
import { NarrativeView } from './NarrativeView';
import { ActionBar } from './qol/ActionBar';
import { RewindBar } from './qol/RewindBar';

interface Props {
  state: GameState;
  busy: boolean;
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
  imagesGenerating?: number;
  canRewind: boolean;
  onSend: (input: string) => void;
  onToggleRolls: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onRetry: () => void;
  onOpenApiSettings: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onRewind: () => void;
  onToggleComicMode: () => void;
  onAutoFight: () => void;
  onOpenCharacter: () => void;
  onOpenMerchant: () => void;
  onRetryPanelImage?: (entryId: string, panelIndex: number) => void;
  onUpdatePanelOverlay?: (entryId: string, panelIndex: number, edit: ComicOverlayEdit) => void;
}

export function CenterPanel({ state, busy, error, errorKind, currentImage, bgImage, bgOpacity, showRolls, engineMode, diceAnimation, statVerbosity, voice, comicMode, narrativeMode, artStylePreset, imagesGenerating = 0, canRewind, onSend, onToggleRolls, onExport, onImport, onStartListening, onStopListening, onStopSpeaking, onRetry, onOpenApiSettings, onRewind, onToggleComicMode, onAutoFight, onOpenCharacter, onOpenMerchant, onRetryPanelImage, onUpdatePanelOverlay }: Props) {
  const [input, setInput] = useState('');
  const [diceRoll, setDiceRoll] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isDnd = engineMode === 'dnd';
  const showRollsPanel = isDnd && showRolls && state.rolls.length > 0;
  const showSystemLog = statVerbosity !== 'minimal';

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.log, busy]);

  useEffect(() => {
    if (!isDnd || diceAnimation !== 'visual' || !busy) return;
    const rolls = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4'];
    const pick = rolls[Math.floor(Math.random() * rolls.length)];
    setDiceRoll(pick);
    const t = setTimeout(() => setDiceRoll(null), 900);
    return () => clearTimeout(t);
  }, [busy, isDnd, diceAnimation]);

  const handleSend = () => {
    if (!input.trim() || busy) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="relative flex h-full flex-col">
      {bgImage && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ width: '100vw', height: '100dvh', minHeight: '100dvh', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -10 }}
        >
          <img src={bgImage} alt="" className="h-full w-full object-cover object-center" style={{ opacity: bgOpacity / 100 }} />
        </div>
      )}
      {comicMode ? (
        <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
          <ComicGrid
            log={state.log}
            lorebook={state.lorebook}
            busy={busy}
            diceAnimating={!!diceRoll}
            currentImage={currentImage}
            bgImage={bgImage}
            artStylePreset={artStylePreset}
            imagesGenerating={imagesGenerating}
            onRetryPanelImage={onRetryPanelImage}
            onUpdatePanelOverlay={onUpdatePanelOverlay}
          />
        </div>
      ) : narrativeMode ? (
        <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
          <NarrativeView log={state.log} busy={busy} />
        </div>
      ) : (
        <div ref={logRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {state.log.map((entry) => (
              <LogRow key={entry.id} entry={entry} lorebook={state.lorebook} showSystemLog={showSystemLog} statVerbosity={statVerbosity} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-crimson-500" />
                The world responds...
              </div>
            )}
            {diceRoll && (
              <div className="flex items-center justify-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-crimson-700/40 bg-crimson-950/30 shadow-[0_0_24px_rgba(220,38,38,0.2)]">
                  <Dice5 size={36} className="animate-spin text-crimson-400" style={{ animationDuration: '0.6s' }} />
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

      <div className="relative z-50 shrink-0 border-t border-slate-800 bg-slate-950 px-3 py-3 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <ActionBar state={state} busy={busy} onAction={onSend} engineMode={engineMode} />
          {state.activeEncounter && (
            <div className="mb-2">
              <EnemyTargetFrame encounter={state.activeEncounter} />
            </div>
          )}
          <div className="mb-2 flex items-center gap-1 text-slate-500">
            <button onClick={onOpenCharacter} title="Character Sheet" className="rounded-md p-1.5 transition-colors hover:bg-slate-800 hover:text-slate-300">
              <User size={15} />
            </button>
            <button onClick={onOpenMerchant} title="Inventory / Merchant" className="rounded-md p-1.5 transition-colors hover:bg-slate-800 hover:text-slate-300">
              <LayoutGrid size={15} />
            </button>
            <button onClick={onToggleComicMode} title={narrativeMode ? 'Narrative view' : comicMode ? 'Comic grid view' : 'Classic log view'} className={`rounded-md p-1.5 transition-colors ${comicMode || narrativeMode ? 'bg-slate-800 text-crimson-400' : 'hover:bg-slate-800 hover:text-slate-300'}`}>
              {narrativeMode ? <BookOpen size={15} /> : comicMode ? <LayoutGrid size={15} /> : <MessageSquare size={15} />}
            </button>
            <RewindBar canRewind={canRewind} onRewind={onRewind} />
            <button onClick={onAutoFight} disabled={busy || !state.activeEncounter} title={state.activeEncounter ? 'Auto-resolve combat' : 'No active encounter'} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${busy || !state.activeEncounter ? 'bg-slate-800 text-slate-500' : 'border border-crimson-700/40 bg-crimson-950/30 text-crimson-400 hover:bg-crimson-900/40'}`}>
              <Swords size={13} />
              <span className="hidden xs:inline">Auto-Fight</span>
            </button>
            {isDnd && (
              <button onClick={onToggleRolls} title="Toggle roll history" className={`rounded-md p-1.5 transition-colors ${showRolls ? 'bg-slate-800 text-crimson-400' : 'hover:bg-slate-800 hover:text-slate-300'}`}>
                <Dice5 size={15} />
              </button>
            )}
            <button onClick={onExport} title="Export save" className="rounded-md p-1.5 hover:bg-slate-800 hover:text-slate-300 transition-colors">
              <Download size={15} />
            </button>
            <button onClick={() => fileRef.current?.click()} title="Import save" className="rounded-md p-1.5 hover:bg-slate-800 hover:text-slate-300 transition-colors">
              <Upload size={15} />
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          </div>
          <div className="flex gap-2">
            {voice.sttSupported && (
              <button
                onClick={voice.listening ? onStopListening : onStartListening}
                disabled={busy}
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
              disabled={busy}
              placeholder={voice.listening ? 'Listening...' : 'What do you do?'}
              rows={2}
              aria-label="Player action input"
              className="min-w-0 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
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

function LogRow({ entry, lorebook, showSystemLog, statVerbosity }: { entry: LogEntry; lorebook?: LoreCard[]; showSystemLog: boolean; statVerbosity: StatVerbosity }) {
  // Text/Milestone Mode: a rare, GM-flagged full-page illustration — rendered large and
  // distinct from the routine text log, instead of only surfacing via the small image strip.
  if (entry.entryKind === 'milestone') {
    const image = entry.imageUrls?.[0];
    return (
      <div data-entry-id={entry.id} data-turn={entry.turn} data-panel-kind="milestone" className="space-y-2">
        <div className="flex justify-center">
          <span className="rounded-full border border-amber-500/60 bg-amber-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
            ✦ Milestone ✦
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border-2 border-amber-600/50 bg-slate-950 shadow-2xl shadow-black/60">
          {image ? (
            <img src={image} alt="Milestone illustration" className="block max-h-[70vh] w-full object-contain" />
          ) : (
            <div className="flex min-h-[240px] items-center justify-center text-xs text-slate-500">
              {entry.imageStatus === 'error' ? 'Milestone image unavailable' : 'Rendering milestone illustration…'}
            </div>
          )}
        </div>
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
  return (
    <div className="space-y-1.5">
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
        <FormattedText content={entry.content} lorebook={lorebook} />
      </div>
      {showSystemLog && entry.systemLog && entry.systemLog.length > 0 && (
        <SystemLogPanel lines={entry.systemLog} verbosity={statVerbosity} />
      )}
    </div>
  );
}

function SystemLogPanel({ lines, verbosity }: { lines: string[]; verbosity: StatVerbosity }) {
  const filtered = useMemo(() => {
    if (verbosity === 'detailed') return lines;
    if (verbosity === 'core') {
      return lines.filter((l) => /success|fail|damage|heal|defeated|xp|loot|level/i.test(l));
    }
    return lines.slice(0, 2);
  }, [lines, verbosity]);

  if (filtered.length === 0) return null;

  return (
    <div className="ml-4 rounded-md border-l-2 border-crimson-700/50 bg-slate-950/60 px-3 py-2">
      <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-crimson-500/70">
        <Terminal size={10} /> System Log
      </div>
      <div className="space-y-0.5">
        {filtered.map((line, i) => (
          <div key={i} className="font-mono text-[11px] text-slate-400">{line}</div>
        ))}
      </div>
    </div>
  );
}
