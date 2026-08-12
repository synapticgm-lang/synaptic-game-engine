import { X, ScrollText, Landmark, Users } from 'lucide-react';
import type { GameState, EngineMode } from '@/game/types';

interface Props {
  state: GameState;
  open: boolean;
  onClose: () => void;
  engineMode: EngineMode;
}

export function LeftDrawer({ state, open, onClose }: Props) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 z-40 h-full w-72 transform overflow-y-auto border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:static lg:z-0 lg:w-72 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 lg:hidden">
          <span className="font-serif text-slate-200">Journal</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-4">
          <SquadSection state={state} />
          <QuestsSection state={state} />
          <ShrinesSection state={state} />
        </div>
      </aside>
    </>
  );
}

function SquadSection({ state }: { state: GameState }) {
  const party = state.companions.filter(c => c.type === 'party');
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-serif text-sm uppercase tracking-wider text-crimson-400">
        <Users size={14} /> Squad
      </h3>
      {party.length === 0 ? (
        <p className="text-xs text-slate-500">No party members yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {party.map(c => (
            <li key={c.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
              <div className="font-medium text-slate-200">{c.name}</div>
              <div className="text-slate-500">{c.role} · {c.hp}/{c.maxHp} HP</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuestsSection({ state }: { state: GameState }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-serif text-sm uppercase tracking-wider text-crimson-400">
        <ScrollText size={14} /> Quests
      </h3>
      {(() => {
        const visible = state.quests.filter(
          (q) =>
            (q.status === 'active' || q.status === 'completed')
            && q.revealed === true,
        );
        if (visible.length === 0) {
          return <p className="text-xs text-slate-500">No revealed quests yet.</p>;
        }
        return (
          <ul className="space-y-1.5">
            {visible.map((q) => (
              <li key={q.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
                <div className="font-medium text-slate-200">{q.name}</div>
                <div className={`capitalize ${q.status === 'active' ? 'text-amber-400' : q.status === 'completed' ? 'text-emerald-400' : 'text-rose-400'}`}>{q.status}</div>
              </li>
            ))}
          </ul>
        );
      })()}
    </section>
  );
}

function ShrinesSection({ state }: { state: GameState }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-serif text-sm uppercase tracking-wider text-crimson-400">
        <Landmark size={14} /> Shrines & Libraries
      </h3>
      {state.shrines.length === 0 ? (
        <p className="text-xs text-slate-500">No persistent locations found.</p>
      ) : (
        <ul className="space-y-1.5">
          {state.shrines.map(s => (
            <li key={s.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
              <div className="font-medium text-slate-200">{s.name}</div>
              <div className="text-slate-500">{s.type}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}