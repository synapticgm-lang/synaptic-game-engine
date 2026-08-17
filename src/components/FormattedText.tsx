import { useState, useRef } from 'react';
import { RARITY_COLORS } from '@/game/types';
import type { Rarity, LoreCard } from '@/game/types';
import { parseNarrativeSegments, NarrativeSegmentBlock } from './comic/NarrativeText';
import { isTurnCloserLine, stripTurnCloser } from '@/game/turnAsk';

interface Props {
  content: string;
  lorebook?: LoreCard[];
}

export function FormattedText({ content, lorebook = [] }: Props) {
  const blocks = parseBlocks(content);
  return (
    <div className="text-sm leading-relaxed text-slate-300">
      {blocks.map((b, i) => {
        if (b.type === 'code') return <CodeBlock key={i} content={b.text} lorebook={lorebook} />;
        if (b.type === 'roll') return <RollBlock key={i} content={b.text} />;
        if (b.type === 'prompt') return <PromptBlock key={i} content={b.text} />;
        return <ProseBlock key={i} text={b.text} lorebook={lorebook} />;
      })}
    </div>
  );
}

type Block = { type: 'prose' | 'code' | 'roll' | 'prompt'; text: string };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = stripTurnCloser(text).split('\n');
  let buffer: string[] = [];
  let inCode = false;

  const flush = () => {
    if (buffer.length === 0) return;
    const chunk = buffer.join('\n');
    buffer = [];

    const rollMatch = chunk.match(/\[ ?SYSTEM ROLL:[\s\S]*?Outcome: ?[^\]]+\]/i);
    if (rollMatch) {
      // Dice/check chrome must not appear in player-facing story — strip, keep surrounding prose.
      const idx = chunk.indexOf(rollMatch[0]);
      const without =
        (idx > 0 ? chunk.slice(0, idx) : '') +
        (idx + rollMatch[0].length < chunk.length ? chunk.slice(idx + rollMatch[0].length) : '');
      const cleaned = without.replace(/\s{2,}/g, ' ').trim();
      if (cleaned) blocks.push({ type: 'prose', text: cleaned });
      return;
    }

    const promptMatch = chunk.match(/\[ ?CINEMATIC SCENE PROMPT ?\][\s\S]*/i);
    if (promptMatch) {
      const idx = chunk.indexOf(promptMatch[0]);
      if (idx > 0) blocks.push({ type: 'prose', text: chunk.slice(0, idx) });
      blocks.push({ type: 'prompt', text: promptMatch[0] });
      return;
    }

    blocks.push({ type: 'prose', text: chunk });
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: buffer.join('\n') });
        buffer = [];
        inCode = false;
      } else {
        flush();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      buffer.push(line);
    } else if (isTurnCloserLine(line)) {
      flush();
    } else {
      buffer.push(line);
      if (line.trim() === '') {
        flush();
      }
    }
  }
  if (inCode) blocks.push({ type: 'code', text: buffer.join('\n') });
  else flush();
  return blocks;
}

function renderRarityTags(text: string, lorebook: LoreCard[]): React.ReactNode {
  const parts = text.split(/(\[(?:Common|Uncommon|Rare|Epic|Legendary)\][^\]]*?)(?=\s|$|\n)/g);
  return parts.map((part, i) => {
    const rarityMatch = part.match(/^\[(Common|Uncommon|Rare|Epic|Legendary)\](.*)$/);
    if (rarityMatch) {
      const color = RARITY_COLORS[rarityMatch[1] as Rarity];
      return <span key={i} className="font-medium" style={{ color }}>{part}</span>;
    }
    return <InlineTextWithBadges key={i} text={part} lorebook={lorebook} />;
  });
}

function InlineTextWithBadges({ text, lorebook }: { text: string; lorebook: LoreCard[] }) {
  const visible = lorebook.filter((c) => c.revealed === true || (c.lastSeenTurn ?? 0) > 0);
  if (visible.length === 0) return <span>{text}</span>;

  const sortedByLength = [...visible].sort((a, b) => b.name.length - a.name.length);
  type Segment = { text: string; card?: LoreCard };
  let segments: Segment[] = [{ text }];

  for (const card of sortedByLength) {
    const next: Segment[] = [];
    for (const seg of segments) {
      if (seg.card) { next.push(seg); continue; }
      const re = new RegExp(`\\b(${escapeRegex(card.name)})\\b`, 'gi');
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(seg.text)) !== null) {
        if (m.index > last) next.push({ text: seg.text.slice(last, m.index) });
        next.push({ text: m[0], card });
        last = re.lastIndex;
      }
      if (last < seg.text.length) next.push({ text: seg.text.slice(last) });
    }
    segments = next;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.card ? (
          <LoreBadge key={i} text={seg.text} card={seg.card} />
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

function LoreBadge({ text, card }: { text: string; card: LoreCard }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const TYPE_COLORS: Record<string, string> = {
    npc: 'text-amber-400 border-amber-700/50 bg-amber-950/30',
    location: 'text-emerald-400 border-emerald-700/50 bg-emerald-950/30',
    item: 'text-sky-400 border-sky-700/50 bg-sky-950/30',
    quest: 'text-rose-400 border-rose-700/50 bg-rose-950/30',
    faction: 'text-violet-400 border-violet-700/50 bg-violet-950/30',
  };
  const colorClass = TYPE_COLORS[card.type] ?? 'text-slate-300 border-slate-700 bg-slate-800';

  return (
    <span className="relative inline">
      <button
        ref={ref}
        onClick={() => setOpen(o => !o)}
        className={`inline rounded border px-0.5 text-[0.85em] font-medium transition-opacity hover:opacity-80 ${colorClass}`}
      >
        {text}
      </button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <span className="absolute bottom-full left-0 z-50 mb-1 w-48 rounded-lg border border-slate-700 bg-slate-900 p-2.5 shadow-xl text-left">
            <span className="block text-xs font-semibold text-slate-100">{card.name}</span>
            <span className="block text-[10px] uppercase text-slate-500 mb-1">{card.type}</span>
            <span className="block text-[11px] text-slate-400">{card.summary}</span>
          </span>
        </>
      )}
    </span>
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ProseBlock({ text, lorebook }: { text: string; lorebook: LoreCard[] }) {
  const segments = parseNarrativeSegments(text);

  // Fast path: no <dialogue>/<thought>/<system>/<effect> tags found, render as before.
  if (segments.length === 0 || (segments.length === 1 && segments[0].type === 'scene')) {
    return <p className="mb-2 whitespace-pre-wrap">{renderRarityTags(text, lorebook)}</p>;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'scene' ? (
          <p key={i} className="mb-2 whitespace-pre-wrap">{renderRarityTags(seg.text, lorebook)}</p>
        ) : (
          <NarrativeSegmentBlock key={i} segment={seg} />
        )
      )}
    </>
  );
}

function CodeBlock({ content, lorebook }: { content: string; lorebook: LoreCard[] }) {
  return (
    <pre className="my-2 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-300">
      {renderRarityTags(content, lorebook)}
    </pre>
  );
}

function RollBlock({ content }: { content: string }) {
  const isFail = /FAILURE/i.test(content);
  const isCrit = /CRITICAL/i.test(content);
  const color = isCrit ? (isFail ? '#f43f5e' : '#f59e0b') : isFail ? '#f43f5e' : '#22c55e';
  return (
    <div className="my-2 rounded-lg border-l-2 bg-slate-950/60 p-2.5 font-mono text-xs" style={{ borderColor: color }}>
      <pre className="whitespace-pre-wrap" style={{ color }}>{content}</pre>
    </div>
  );
}

function PromptBlock({ content }: { content: string }) {
  return (
    <div className="my-2 rounded-lg border border-dashed border-amber-700/50 bg-amber-950/20 p-2.5 text-xs text-amber-300/80">
      <div className="mb-1 font-serif uppercase tracking-wider text-amber-500/80">Cinematic Scene Prompt</div>
      <pre className="whitespace-pre-wrap font-sans">{content.replace(/\[ ?CINEMATIC SCENE PROMPT ?\]/i, '').replace(/Description:/i, '').trim()}</pre>
    </div>
  );
}
