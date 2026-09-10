import { Terminal } from 'lucide-react';
import type { LitrpgSystemWindow } from '@/game/litrpgSystemWindow';

/** In-story blue System panel — shown when the beat actually brings the window up. */
export function LitrpgSystemWindowPanel({ window }: { window?: LitrpgSystemWindow | null }) {
  if (!window?.lines?.length) return null;
  return (
    <div
      className="relative my-3 overflow-hidden rounded-md border-2 border-sky-400/70 bg-sky-950/70 px-4 py-3 shadow-[0_0_24px_rgba(56,189,248,0.18)]"
      data-sgm-system-window="true"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-sky-950/40" />
      <div className="absolute left-1 top-1 h-2 w-2 border-l-2 border-t-2 border-sky-300" />
      <div className="absolute right-1 top-1 h-2 w-2 border-r-2 border-t-2 border-sky-300" />
      <div className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-sky-300" />
      <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-sky-300" />
      <div className="relative mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300">
        <Terminal size={11} />
        {window.heading}
      </div>
      <div className="relative space-y-0.5">
        {window.lines.map((line, i) => (
          <div key={`${i}-${line}`} className="font-mono text-[12px] leading-relaxed text-sky-50">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
