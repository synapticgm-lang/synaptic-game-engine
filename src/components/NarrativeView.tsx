import { useState, useMemo } from 'react';
import type { LogEntry } from '@/types';
import type { EngineMode } from '@/game/types';
import { filterSystemLogForEngine } from '@/game/systemLog';
import { shouldShowTurnAsk, stripTurnCloser, TURN_ASK, hasRealGmStory, shouldSkipDuplicatePlayerBubble } from '@/game/turnAsk';
import {
  isTurnUiBlocked,
  resolveRevealContent,
  turnPhaseStatusMessage,
  type StreamingRevealState,
  type TurnPhase,
} from '@/game/streamReveal';
import { BeautyMomentOfferLink } from './BeautyMomentOffer';
import {
  ChevronRight, ChevronDown, Zap, Sword, Shield, Sparkles,
  TrendingUp, Skull, Heart, Dice5, Eye, EyeOff, Terminal,
} from 'lucide-react';

interface Props {
  log: LogEntry[];
  busy?: boolean;
  turnPhase?: TurnPhase;
  streamingReveal?: StreamingRevealState | null;
  engineMode?: EngineMode;
  contentMode?: string | null;
  onAcceptBeautyOffer?: (entryId: string) => void;
  onDismissBeautyOffer?: (entryId: string) => void;
}

type ActionKind = 'crit' | 'damage' | 'heal' | 'skill' | 'defeat' | 'miss';

interface ActionCard {
  id: string;
  kind: ActionKind;
  label: string;
  detail: string;
  turn: number;
}

const ACTION_META: Record<ActionKind, { color: string; bg: string; border: string; icon: typeof Zap; label: string }> = {
  crit:    { color: 'text-amber-300',   bg: 'bg-amber-950/40',   border: 'border-amber-500/40',   icon: Sparkles, label: 'CRITICAL' },
  damage:  { color: 'text-rose-300',    bg: 'bg-rose-950/40',    border: 'border-rose-500/40',    icon: Sword,    label: 'DAMAGE' },
  heal:     { color: 'text-emerald-300', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', icon: Heart,    label: 'HEAL' },
  skill:   { color: 'text-cyan-300',    bg: 'bg-cyan-950/40',    border: 'border-cyan-500/40',    icon: Zap,      label: 'SKILL' },
  defeat:  { color: 'text-violet-300',  bg: 'bg-violet-950/40',  border: 'border-violet-500/40',  icon: Skull,    label: 'DEFEAT' },
  miss:     { color: 'text-slate-400',   bg: 'bg-slate-900/40',   border: 'border-slate-700',      icon: Shield,   label: 'MISS' },
};

function extractActions(log: LogEntry[], engineMode: EngineMode = 'litrpg'): ActionCard[] {
  const cards: ActionCard[] = [];
  for (const entry of log) {
    const lines = filterSystemLogForEngine(entry.systemLog ?? [], engineMode);
    for (const line of lines) {
      const lower = line.toLowerCase();
      let kind: ActionKind | null = null;
      let detail = line;
      if (/crit(ical)?/.test(lower)) kind = 'crit';
      else if (/defeat|slain|killed|dead/.test(lower)) kind = 'defeat';
      else if (/heal|restor/.test(lower)) kind = 'heal';
      else if (/skill|ability|cast/.test(lower)) kind = 'skill';
      else if (/miss|dodge|block/.test(lower)) kind = 'miss';
      else if (/damage|hit|attack/.test(lower)) kind = 'damage';
      if (kind) {
        cards.push({
          id: `${entry.id}-${line.slice(0, 12)}`,
          kind,
          label: ACTION_META[kind].label,
          detail,
          turn: entry.turn,
        });
      }
    }
  }
  return cards.slice(-20).reverse();
}

export function NarrativeView({ log, busy, turnPhase = 'idle', streamingReveal = null, engineMode = 'litrpg', contentMode, onAcceptBeautyOffer, onDismissBeautyOffer }: Props) {
  const [streamOpen, setStreamOpen] = useState(true);
  const actionCards = useMemo(() => extractActions(log, engineMode), [log, engineMode]);
  const turnUiBlocked = isTurnUiBlocked(!!busy, turnPhase, streamingReveal);
  const turnStatusMessage = busy ? turnPhaseStatusMessage(turnPhase) : null;

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Main narrative column */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {log.map((entry, index) => (
            shouldSkipDuplicatePlayerBubble(log, index) ? null : (
              <NarrativeEntry
                key={entry.id}
                entry={entry}
                engineMode={engineMode}
                showTurnAsk={shouldShowTurnAsk(log, index, turnUiBlocked)}
                streamingReveal={streamingReveal}
                onAcceptBeautyOffer={onAcceptBeautyOffer}
                onDismissBeautyOffer={onDismissBeautyOffer}
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
        </div>
      </div>

      {/* Action Stream — collapsible right panel */}
      <ActionStream
        cards={actionCards}
        open={streamOpen}
        onToggle={() => setStreamOpen((v) => !v)}
      />
    </div>
  );
}

/* ============ NARRATIVE ENTRY DISPATCHER ============ */

function NarrativeEntry({ entry, engineMode, showTurnAsk, streamingReveal, onAcceptBeautyOffer, onDismissBeautyOffer, contentMode }: { entry: LogEntry; engineMode: EngineMode; showTurnAsk: boolean; streamingReveal?: StreamingRevealState | null; onAcceptBeautyOffer?: (entryId: string) => void; onDismissBeautyOffer?: (entryId: string) => void; contentMode?: string | null }) {
  if (entry.role === 'player') return <PlayerBubble entry={entry} />;
  if (entry.role === 'system') return <SystemMessage entry={entry} />;
  if (!hasRealGmStory(entry) && !showTurnAsk) {
    return null;
  }
  return (
    <DmNarration
      entry={entry}
      engineMode={engineMode}
      showTurnAsk={showTurnAsk}
      streamingReveal={streamingReveal}
      onAcceptBeautyOffer={onAcceptBeautyOffer}
      onDismissBeautyOffer={onDismissBeautyOffer}
      contentMode={contentMode}
    />
  );
}

/* ============ 1. AI DM NARRATION PANEL ============ */

function DmNarration({ entry, engineMode, showTurnAsk, streamingReveal, onAcceptBeautyOffer, onDismissBeautyOffer, contentMode }: { entry: LogEntry; engineMode: EngineMode; showTurnAsk: boolean; streamingReveal?: StreamingRevealState | null; onAcceptBeautyOffer?: (entryId: string) => void; onDismissBeautyOffer?: (entryId: string) => void; contentMode?: string | null }) {
  const { text: displayContent, isRevealing } = resolveRevealContent(entry.id, entry.content, streamingReveal);
  const segments = useMemo(() => parseSegments(stripTurnCloser(displayContent)), [displayContent]);
  const systemLines = useMemo(
    () => filterSystemLogForEngine(entry.systemLog ?? [], engineMode),
    [entry.systemLog, engineMode],
  );
  const hasSystemLog = systemLines.length > 0;

  return (
    <div className="space-y-3">
      <div className="sgm-turn-frame relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60 shadow-lg">
        {/* Decorative top accent bar */}
        <div className="sgm-turn-frame-bar h-1 w-full bg-gradient-to-r from-crimson-600 via-crimson-500 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/40 px-4 py-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-crimson-500/30 bg-crimson-500/10">
            <Sparkles size={12} className="text-crimson-400" />
          </div>
          <span className="font-serif text-xs font-bold uppercase tracking-wider text-crimson-300">
            Game Master
          </span>
          <span className="ml-auto font-mono text-[10px] text-slate-600">
            Turn {entry.turn}
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {segments.map((seg, i) => {
            if (seg.type === 'dialogue') return <NpcDialogue key={i} text={seg.text} />;
            if (seg.type === 'thought') return <ThoughtBlock key={i} text={seg.text} />;
            if (seg.type === 'system') return <InlineSystemTag key={i} text={seg.text} />;
            const isLast = i === segments.length - 1;
            return (
              <p key={i} className="mb-3 font-serif text-sm leading-relaxed text-slate-200 last:mb-0">
                {seg.text}
                {isRevealing && isLast && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-crimson-400/70 align-text-bottom" aria-hidden />
                )}
              </p>
            );
          })}
        </div>

        {hasSystemLog && hasRealGmStory(entry) && (
          <div className="border-t border-blue-500/40 bg-blue-950/40 px-4 py-2">
            <div className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-300">
              <Terminal size={10} />
              Status
              <span className="font-sans normal-case tracking-normal text-[9px] text-blue-300/70">Turn results</span>
            </div>
            <div className="space-y-0.5">
              {systemLines.map((line, i) => (
                <div key={i} className="font-mono text-[11px] text-blue-100/90">{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BeautyMomentOfferLink
        offer={entry.beautyOffer}
        contentMode={contentMode}
        onAccept={onAcceptBeautyOffer ? () => onAcceptBeautyOffer(entry.id) : undefined}
        onDismiss={onDismissBeautyOffer ? () => onDismissBeautyOffer(entry.id) : undefined}
      />
      {showTurnAsk && (
        <p className="px-1 text-sm font-medium text-slate-200">{TURN_ASK}</p>
      )}
    </div>
  );
}

/* ============ 2. DIALOGUE BUBBLES ============ */

function PlayerBubble({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[80%] items-start gap-2">
        <div className="relative">
          <div className="rounded-xl rounded-br-sm border border-crimson-500/30 bg-crimson-950/30 px-4 py-2.5 text-sm text-slate-100 shadow-md shadow-crimson-950/20">
            <div className="mb-1 flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-crimson-500/40 bg-crimson-500/10">
                <span className="text-[9px] font-bold text-crimson-300">YOU</span>
              </div>
              <span className="font-serif text-[10px] font-semibold uppercase tracking-wider text-crimson-400">Player</span>
            </div>
            <p className="leading-relaxed">{entry.content}</p>
          </div>
          {/* Tail pointing right */}
          <div className="absolute -bottom-1.5 right-3 h-3 w-3 rotate-45 border-b border-r border-crimson-500/30 bg-crimson-950/30" />
        </div>
      </div>
    </div>
  );
}

function NpcDialogue({ text }: { text: string }) {
  const speakerMatch = text.match(/^([^:]+):\s*(.*)/s);
  const speaker = speakerMatch ? speakerMatch[1].trim() : 'NPC';
  const dialogue = speakerMatch ? speakerMatch[2].trim() : text;
  const initials = speaker.slice(0, 2).toUpperCase();

  return (
    <div className="my-3 flex items-start gap-2.5">
      {/* Portrait placeholder */}
      <div className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/60 to-slate-900 shadow-md">
        <span className="font-serif text-sm font-bold text-emerald-300">{initials}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
      </div>

      {/* Speech bubble */}
      <div className="relative flex-1">
        <div className="rounded-xl rounded-tl-sm border border-emerald-600/30 bg-emerald-950/20 px-4 py-2.5 shadow-md shadow-emerald-950/10">
          <span className="mb-0.5 block font-serif text-[11px] font-bold uppercase tracking-wide text-emerald-400">
            {speaker}
          </span>
          <p className="text-sm leading-relaxed text-emerald-50">{dialogue}</p>
        </div>
        {/* Tail pointing left */}
        <div className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 border-b border-l border-emerald-600/30 bg-emerald-950/20" />
      </div>
    </div>
  );
}

function ThoughtBlock({ text }: { text: string }) {
  return (
    <div className="my-3 flex items-start gap-2.5">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
        <div className="flex h-2 w-2 rounded-full bg-slate-600" />
        <div className="absolute h-1 w-1 -translate-x-3 translate-y-2 rounded-full bg-slate-600" />
      </div>
      <p className="flex-1 text-sm italic leading-relaxed text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* ============ 3. [SYSTEM MESSAGE] TAGS ============ */

function SystemMessage({ entry }: { entry: LogEntry }) {
  const text = entry.content;
  const isLevelUp = /level\s*up|leveled?\s*up/i.test(text);
  const isStatChange = /stat|attribute|str|dex|con|int|wis|cha|hp|mp|sp/i.test(text);
  const isLoot = /loot|item|reward|gold|xp/i.test(text);

  const Icon = isLevelUp ? TrendingUp : isLoot ? Sparkles : isStatChange ? Zap : Dice5;
  const accent = isLevelUp ? 'border-amber-500/50 shadow-amber-900/30' : 'border-crimson-500/50 shadow-crimson-900/30';

  return (
    <div className="my-3 flex justify-center">
      <div className={`relative overflow-hidden rounded-lg border-2 ${accent} bg-slate-950/80 px-5 py-2.5 shadow-lg`}>
        {/* Glow pulse background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-crimson-500/5 via-transparent to-crimson-500/5" />

        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-crimson-400" />
        <div className="absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-crimson-400" />
        <div className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-crimson-400" />
        <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-crimson-400" />

        <div className="relative flex items-center gap-2.5">
          <Icon size={16} className="shrink-0 text-crimson-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}

function InlineSystemTag({ text }: { text: string }) {
  return (
    <div className="my-2 flex justify-center">
      <div className="max-w-lg rounded border border-sky-500/40 bg-sky-950/40 px-3 py-2">
        <div className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-sky-400/90">
          In-world System
        </div>
        <span className="font-mono text-[11px] font-semibold tracking-wide text-sky-100">
          {text}
        </span>
      </div>
    </div>
  );
}

/* ============ 4. ACTION STREAM (Collapsible right panel) ============ */

function ActionStream({ cards, open, onToggle }: { cards: ActionCard[]; open: boolean; onToggle: () => void }) {
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className={`fixed right-2 top-2 z-30 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md transition-all hover:border-crimson-500/40 hover:text-crimson-300 lg:hidden ${open ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <Eye size={12} />
        Stream
        {cards.length > 0 && (
          <span className="rounded-full bg-crimson-500/20 px-1.5 text-[9px] text-crimson-300">{cards.length}</span>
        )}
      </button>

      {/* Panel */}
      <div className={`flex flex-col overflow-hidden border-l border-slate-800 bg-slate-950/60 backdrop-blur-md transition-all duration-300 ${
        open ? 'w-64 opacity-100' : 'w-0 opacity-0 lg:w-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <span className="flex items-center gap-1.5 font-serif text-xs font-bold uppercase tracking-wider text-crimson-300">
            <Zap size={13} />
            Action Stream
          </span>
          <button onClick={onToggle} className="rounded p-1 text-slate-500 hover:text-slate-300">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto p-2">
          {cards.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <EyeOff size={20} className="mb-2 text-slate-700" />
              <p className="text-[11px] italic text-slate-600">No combat actions yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {cards.map((card) => {
                const meta = ACTION_META[card.kind];
                const Icon = meta.icon;
                return (
                  <div
                    key={card.id}
                    className={`rounded-lg border ${meta.border} ${meta.bg} px-2.5 py-2 transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={`shrink-0 ${meta.color}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="ml-auto font-mono text-[9px] text-slate-600">T{card.turn}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] leading-snug text-slate-300">
                      {card.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-3 py-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-600">
            {cards.length} action{cards.length !== 1 ? 's' : ''} tracked
          </span>
        </div>
      </div>

      {/* Mobile overlay close */}
      {open && (
        <button
          onClick={onToggle}
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          aria-label="Close action stream"
        />
      )}
    </>
  );
}

/* ============ SEGMENT PARSER ============ */

type Segment =
  | { type: 'scene'; text: string }
  | { type: 'dialogue'; text: string }
  | { type: 'thought'; text: string }
  | { type: 'system'; text: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const tagRegex = /<(dialogue|thought|system)>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: 'scene', text: before });
    }
    const tag = match[1].toLowerCase() as 'dialogue' | 'thought' | 'system';
    segments.push({ type: tag, text: match[2].trim() });
    lastIndex = tagRegex.lastIndex;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) segments.push(...splitRegistrarHeaders(remaining));

  return segments.flatMap((seg) =>
    seg.type === 'scene' ? splitRegistrarHeaders(seg.text) : [seg]
  );
}

const REGISTRAR_HEADER = /\[\s*(SYSTEM|THE AUDITOR|THE TALE|THE STORY)\s*\][ \t]*\n?/gi;

function splitRegistrarHeaders(text: string): Segment[] {
  const parts: Segment[] = [];
  const matches: Array<{ start: number; end: number }> = [];
  const re = new RegExp(REGISTRAR_HEADER.source, 'gi');
  let found: RegExpExecArray | null;
  while ((found = re.exec(text)) !== null) {
    matches.push({ start: found.index, end: found.index + found[0].length });
  }
  if (!matches.length) {
    return text.trim() ? [{ type: 'scene', text: text.trim() }] : [];
  }
  let last = 0;
  for (let i = 0; i < matches.length; i++) {
    const before = text.slice(last, matches[i].start).trim();
    if (before) parts.push({ type: 'scene', text: before });
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].start : text.length;
    const body = text.slice(matches[i].end, bodyEnd).trim();
    if (body) parts.push({ type: 'system', text: body });
    last = bodyEnd;
  }
  return parts;
}
