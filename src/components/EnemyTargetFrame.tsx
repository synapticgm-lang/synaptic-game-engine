import { Skull } from 'lucide-react';
import type { ActiveEncounter } from '@/game/types';

interface Props {
  encounter: ActiveEncounter;
}

export function EnemyTargetFrame({ encounter }: Props) {
  const hpPct = Math.max(0, Math.min(100, (encounter.hp / encounter.maxHp) * 100));
  const isLow = hpPct <= 25;

  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-lg border border-red-900/40 bg-slate-950/80 px-3 py-2 backdrop-blur-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-800/50 bg-red-950/40">
        <Skull size={16} className={isLow ? 'text-red-400' : 'text-red-500/80'} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-red-200">{encounter.name}</span>
          <span className="shrink-0 text-xs text-slate-500">Lv {encounter.level}</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-red-600/80'}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
        <div className="mt-0.5 flex justify-between text-[10px] text-slate-500">
          <span>HP {encounter.hp}/{encounter.maxHp}</span>
          <span>AC {encounter.armorClass}</span>
        </div>
      </div>
    </div>
  );
}
