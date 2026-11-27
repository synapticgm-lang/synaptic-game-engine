/**
 * Inbox chrome outside the scene-choice pad budget — opens the System / notices panel.
 * Not an option button; lives with Hide options / Hide text chrome.
 */
import { Terminal } from 'lucide-react';
import type { EngineMode } from '@/game/types';
import { checkSystemChipLabel } from '@/game/systemNotice';

interface Props {
  engineMode?: EngineMode;
  unread: number;
  onOpen: () => void;
}

export function CheckSystemChip({ engineMode, unread, onOpen }: Props) {
  if (unread <= 0) return null;
  return (
    <button
      type="button"
      data-testid="check-system-chip"
      onClick={onOpen}
      title={checkSystemChipLabel(engineMode, unread)}
      aria-label={checkSystemChipLabel(engineMode, unread)}
      className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-sky-700/50 bg-sky-950/40 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 transition-colors hover:bg-sky-900/50 hover:text-sky-100"
    >
      <Terminal size={14} className="shrink-0 text-sky-300 opacity-70" />
      <span>{checkSystemChipLabel(engineMode, unread)}</span>
    </button>
  );
}
