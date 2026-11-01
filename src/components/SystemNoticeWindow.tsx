/**
 * UI-only System / notices panel for LitRPG + story RPG.
 * Lists pending notification lines; Character sheet opens the existing CharacterWindow sheet tab.
 */
import { Terminal, X, ScrollText } from 'lucide-react';
import type { EngineMode } from '@/game/types';

interface Props {
  open: boolean;
  lines: string[];
  engineMode?: EngineMode;
  onClose: () => void;
  onOpenCharacterSheet: () => void;
}

export function SystemNoticeWindow({ open, lines, engineMode, onClose, onOpenCharacterSheet }: Props) {
  if (!open) return null;
  const heading = engineMode === 'rpg' ? 'Notices' : 'System window';
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      data-testid="system-notice-window"
    >
      <div className="sgm-system-window relative w-full max-w-md overflow-hidden rounded-lg border border-sky-500/40 bg-slate-950 px-4 py-3 shadow-2xl">
        <div className="sgm-system-window-glow pointer-events-none absolute inset-0" />
        <div className="relative mb-3 flex items-center justify-between gap-2">
          <div className="sgm-system-window-type sgm-system-window-head flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Terminal size={12} />
            {heading}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="relative mb-4 max-h-[50vh] space-y-1 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="sgm-system-window-type text-[12px] text-slate-400">No notifications yet.</p>
          ) : (
            lines.map((line, i) => (
              <div
                key={`${i}-${line}`}
                className="sgm-system-window-type sgm-system-window-line text-[12px] leading-relaxed text-sky-50"
                data-testid="system-notice-line"
              >
                {line}
              </div>
            ))
          )}
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="system-notice-character-sheet"
            onClick={() => {
              onOpenCharacterSheet();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/50 bg-sky-950/50 px-3 py-1.5 text-[11px] font-medium text-sky-100 hover:bg-sky-900/60"
          >
            <ScrollText size={12} />
            Character sheet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
