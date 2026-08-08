import { Undo2 } from 'lucide-react';
import type { GameState } from '@/game/types';

interface RewindBarProps {
  canRewind: boolean;
  onRewind: () => void;
}

export function RewindBar({ canRewind, onRewind }: RewindBarProps) {
  if (!canRewind) return null;

  return (
    <button
      onClick={onRewind}
      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-400 transition-all hover:border-amber-500 hover:bg-amber-950/30 hover:text-amber-300"
      title="Rewind one turn — restores the previous game state and removes the last GM response"
    >
      <Undo2 size={13} />
      Rewind 1 Turn
    </button>
  );
}
