/**
 * Own chip outside the scene-choice pad budget — opens the System / notices panel.
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
    <div className="pb-1" data-testid="check-system-chip-row">
      <button
        type="button"
        data-testid="check-system-chip"
        onClick={onOpen}
        className="sgm-choice-btn inline-flex min-h-[40px] w-full items-center gap-1.5 rounded-lg border border-sky-500/60 bg-sky-950/50 px-3 py-2 text-left text-xs font-medium text-sky-100 transition-all hover:bg-sky-800 hover:text-white sm:min-h-[36px] sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5"
      >
        <Terminal size={12} className="shrink-0 text-sky-300" />
        {checkSystemChipLabel(engineMode, unread)}
      </button>
    </div>
  );
}
