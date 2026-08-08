import { useMemo } from 'react';

interface NarrativeTextProps {
  text: string;
  className?: string;
}

export type NarrativeSegment =
  | { type: 'scene'; text: string }
  | { type: 'dialogue'; text: string; speaker?: string }
  | { type: 'thought'; text: string; speaker?: string }
  | { type: 'system'; text: string }
  | { type: 'effect'; text: string };

/**
 * Splits a "Speaker: text" style line (the format the GM is instructed to use inside
 * <dialogue>/<thought> tags) into its speaker and the remaining text. Falls back to no
 * speaker if the line doesn't match that shape.
 */
function splitSpeaker(raw: string): { speaker?: string; text: string } {
  const match = raw.match(/^([^:]{1,32}):\s*([\s\S]*)$/);
  if (!match) return { text: raw };
  const text = match[2].replace(/^["'\u201c]|["'\u201d]$/g, '').trim();
  return { speaker: match[1].trim(), text: text || raw };
}

export function parseNarrativeSegments(text: string): NarrativeSegment[] {
  const segments: NarrativeSegment[] = [];
  const tagRegex = /<(dialogue|thought|system|effect)>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: 'scene', text: before });
    }
    const tag = match[1].toLowerCase() as 'dialogue' | 'thought' | 'system' | 'effect';
    const raw = match[2].trim();
    if (tag === 'dialogue' || tag === 'thought') {
      const { speaker, text: spoken } = splitSpeaker(raw);
      segments.push({ type: tag, text: spoken, speaker });
    } else {
      segments.push({ type: tag, text: raw });
    }
    lastIndex = tagRegex.lastIndex;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) segments.push({ type: 'scene', text: remaining });

  return segments;
}

/**
 * Renders a single non-scene narrative segment (dialogue/thought/system/effect) with its
 * dedicated styling. Shared by `NarrativeText` and `FormattedText` so tagged content is
 * never left as raw `<dialogue>`-style markup in either the comic or classic text views.
 */
export function NarrativeSegmentBlock({ segment }: { segment: Exclude<NarrativeSegment, { type: 'scene' }> }) {
  if (segment.type === 'dialogue') {
    return (
      <div className="comic-overlay-scrollbar mb-4 h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words border-l-2 border-emerald-600 p-3 text-emerald-100 font-medium">
        {segment.speaker && <span className="mr-1.5 font-bold text-emerald-400">{segment.speaker}:</span>}
        {segment.text}
      </div>
    );
  }
  if (segment.type === 'thought') {
    return (
      <div className="comic-overlay-scrollbar mb-4 h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words rounded border border-slate-800 bg-slate-900/60 p-3 text-slate-400 italic">
        {segment.speaker && <span className="mr-1.5 font-semibold not-italic text-slate-500">{segment.speaker}:</span>}
        {segment.text}
      </div>
    );
  }
  if (segment.type === 'system') {
    return (
      <div className="comic-overlay-scrollbar mb-4 h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words rounded border border-blue-500/50 bg-blue-950/50 p-3 font-mono text-sm text-blue-200 shadow-inner shadow-blue-900/50">
        {segment.text}
      </div>
    );
  }
  return (
    <div className="comic-overlay-scrollbar mb-4 h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto rotate-[-4deg] whitespace-pre-wrap break-words rounded border-2 border-amber-500 bg-amber-400 p-3 text-sm font-black uppercase tracking-wider text-amber-950 shadow-lg">
      {segment.text}
    </div>
  );
}

export function NarrativeText({ text, className }: NarrativeTextProps) {
  const segments = useMemo(() => parseNarrativeSegments(text), [text]);

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'scene') {
          return (
            <p key={i} className="mb-4 text-base leading-relaxed text-slate-200">
              {seg.text}
            </p>
          );
        }
        return <NarrativeSegmentBlock key={i} segment={seg} />;
      })}
    </div>
  );
}
