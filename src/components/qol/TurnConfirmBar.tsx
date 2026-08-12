import { useState } from 'react';
import { Check, Pencil, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import type { PendingTurnProposal } from '@/game/types';

interface Props {
  pending: PendingTurnProposal;
  busy?: boolean;
  onAccept: () => void;
  onDiscard: () => void;
  onReroll: () => void;
  onEditNarrative: (text: string) => void;
}

/**
 * Propose → confirm → commit UI for World State Ledger turns.
 */
export function TurnConfirmBar({
  pending,
  busy,
  onAccept,
  onDiscard,
  onReroll,
  onEditNarrative,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pending.narrative);

  return (
    <div className="mx-3 mb-2 rounded-xl border border-amber-500/40 bg-slate-950/95 p-3 shadow-lg shadow-amber-950/20 sm:mx-6">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
        <ShieldAlert size={12} />
        Pending turn — confirm before ledger commit
        <span className="ml-auto font-mono font-normal normal-case text-slate-500">
          {pending.intentLabel}
        </span>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        />
      ) : (
        <div className="mb-2 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm leading-relaxed text-slate-200">
          {pending.narrative}
        </div>
      )}

      {pending.deltaSummary.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {pending.deltaSummary.map((d, i) => (
            <span
              key={i}
              className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {import.meta.env.DEV && pending.wardenNotes.length > 0 && (
        <div className="mb-2 text-[11px] text-rose-300/90">
          Warden: {pending.wardenNotes.slice(0, 3).join(' · ')}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          disabled={busy}
          onClick={() => {
            if (editing) {
              onEditNarrative(draft);
              setEditing(false);
            }
            onAccept();
          }}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-700 disabled:opacity-40"
        >
          <Check size={12} />
          Accept
        </button>
        <button
          disabled={busy}
          onClick={() => {
            if (editing) {
              onEditNarrative(draft);
              setEditing(false);
            } else {
              setDraft(pending.narrative);
              setEditing(true);
            }
          }}
          className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
        >
          <Pencil size={12} />
          {editing ? 'Save edit' : 'Edit'}
        </button>
        <button
          disabled={busy}
          onClick={onReroll}
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-800/40 disabled:opacity-40"
        >
          <RefreshCw size={12} />
          Reroll
        </button>
        <button
          disabled={busy}
          onClick={onDiscard}
          className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-900/40 disabled:opacity-40"
        >
          <Trash2 size={12} />
          Discard
        </button>
      </div>
    </div>
  );
}
