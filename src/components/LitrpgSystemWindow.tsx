import { Terminal } from 'lucide-react';
import type { LitrpgSystemWindow } from '@/game/litrpgSystemWindow';

/** In-story System panel — shown when the beat actually brings the window up. Colours follow the equipped theme. */
export function LitrpgSystemWindowPanel({ window }: { window?: LitrpgSystemWindow | null }) {
  if (!window?.lines?.length) return null;
  return (
    <div
      className="sgm-system-window relative my-3 overflow-hidden rounded-md px-4 py-3"
      data-sgm-system-window="true"
    >
      <div className="sgm-system-window-glow pointer-events-none absolute inset-0" />
      <div className="sgm-system-window-corner absolute left-1 top-1 h-2 w-2 border-l-2 border-t-2" />
      <div className="sgm-system-window-corner absolute right-1 top-1 h-2 w-2 border-r-2 border-t-2" />
      <div className="sgm-system-window-corner absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2" />
      <div className="sgm-system-window-corner absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2" />
      <div className="sgm-system-window-type sgm-system-window-head relative mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">
        <Terminal size={11} />
        {window.heading}
      </div>
      <div className="relative space-y-0.5">
        {window.lines.map((line, i) => (
          <div key={`${i}-${line}`} className="sgm-system-window-type sgm-system-window-line text-[12px] leading-relaxed">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
