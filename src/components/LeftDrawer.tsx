import { X, ScrollText, Landmark, Users, Globe2 } from 'lucide-react';
import type { GameState, EngineMode } from '@/game/types';
import { visibleJournalQuests, activeDrawerQuests } from '@/game/questPlay';
import { clockLabel, normalizeWorldLedger } from '@/game/worldSim';

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
      <aside className={`sgm-info-panel fixed left-0 top-0 z-40 h-full w-72 transform overflow-y-auto border-r transition-transform duration-300 lg:static lg:z-0 lg:w-72 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[color:color-mix(in_srgb,var(--sgm-accent,#64748b)_28%,#44403c)] px-4 py-3 lg:hidden">
          <span className="sgm-info-heading">Journal</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-4">
          <WorldSection state={state} />
          <SquadSection state={state} />
          <QuestsSection state={state} />
          <ShrinesSection state={state} />
        </div>
      </aside>
    </>
  );
}

function WorldSection({ state }: { state: GameState }) {
  const ledger = normalizeWorldLedger(state.worldLedger);
  const deals = ledger.deals.filter((d) => d.active);
  const factions = ledger.factionStandings ?? [];
  const hasWork =
    deals.length > 0 || ledger.holdings.length > 0 || ledger.hostiles.length > 0 || factions.length > 0;

  const standingClass = (standing: string) => {
    if (standing === 'friendly' || standing === 'allied') return 'bg-emerald-900/60 text-emerald-300';
    if (standing === 'hostile' || standing === 'unfriendly') return 'bg-rose-900/60 text-rose-300';
    return 'bg-zinc-800 text-zinc-300';
  };

  return (
    <section>
      <h3 className="sgm-info-heading mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
        <Globe2 size={14} /> World
      </h3>
      <p className="mb-2 text-xs text-slate-400">{clockLabel(ledger.clock)}</p>
      {!hasWork ? (
        <p className="text-xs text-slate-500">No off-screen deals or holdings yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {factions.map((f) => (
            <li key={f.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-200">{f.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${standingClass(f.standing)}`}>
                  {f.standing}
                </span>
              </div>
              {f.notes?.trim() ? (
                <div className="mt-0.5 text-slate-500">{f.notes.trim()}</div>
              ) : null}
            </li>
          ))}
          {deals.map((d) => (
            <li key={d.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
              <div className="font-medium text-slate-200">{d.name}</div>
              <div className="text-slate-500">
                {Math.round(d.playerShare * 100)}% cut · {d.risk} · {d.goldPaid}g paid
              </div>
            </li>
          ))}
          {ledger.holdings.map((h) => (
            <li key={h.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
              <div className="font-medium text-slate-200">{h.name}</div>
              <div className="text-slate-500">
                {h.kind} · {h.order} · rank {h.level} · {h.treasury}g
              </div>
            </li>
          ))}
          {ledger.hostiles.map((h) => (
            <li key={h.id} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs">
              <div className="font-medium text-slate-200">{h.name}</div>
              <div className="text-slate-500">pressure {h.progress}/100 · rank {h.level}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SquadSection({ state }: { state: GameState }) {
  const party = state.companions.filter(c => c.type === 'party');
  return (
    <section>
      <h3 className="sgm-info-heading mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
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
      <h3 className="sgm-info-heading mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
        <ScrollText size={14} /> Quests
      </h3>
      {(() => {
        const visible = activeDrawerQuests(state);
        if (visible.length === 0) {
          return <p className="text-xs text-slate-500">No active quests.</p>;
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
      <h3 className="sgm-info-heading mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
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