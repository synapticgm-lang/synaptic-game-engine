import type { GameState } from '@/game/types';
import { currentDungeonNode } from '@/game/dungeonSeed';
import { isExplorableDungeon } from '@/game/placeAuthority';

interface Props {
  state: GameState;
  busy: boolean;
  onPickUp: (label: string) => void;
}

export function LooseItemsBar({ state, busy, onPickUp }: Props) {
  if (!isExplorableDungeon(state.activeDungeon)) return null;
  const node = currentDungeonNode(state.activeDungeon);
  const loose = node?.hidden?.looseItems ?? [];
  if (!loose.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
      <span className="w-full text-[10px] font-mono uppercase tracking-wider text-slate-500">
        On the floor
      </span>
      {loose.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={busy}
          onClick={() => onPickUp(item.label)}
          className="rounded-md border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/40 disabled:opacity-40"
        >
          Pick Up {item.label}
        </button>
      ))}
    </div>
  );
}
