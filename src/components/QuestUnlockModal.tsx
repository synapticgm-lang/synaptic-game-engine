import type { Quest } from '@/game/types';

interface Props {
  quests: Quest[];
  onClose: () => void;
  onOpenJournal?: () => void;
}

export function QuestUnlockModal({ quests, onClose, onOpenJournal }: Props) {
  if (quests.length === 0) return null;
  const multi = quests.length > 1;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-unlock-title"
      onClick={onClose}
    >
      <div
        className="sgm-modal-shell sgm-turn-frame sgm-info-panel w-full max-w-md overflow-hidden rounded-xl border border-amber-700/50 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sgm-turn-frame-bar h-1 w-full" />
        <div className="border-b border-slate-800 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400/90">System</p>
          <h2 id="quest-unlock-title" className="mt-1 text-lg font-bold uppercase tracking-wide text-amber-100">
            {multi ? 'Quests unlocked' : 'Quest unlocked'}
          </h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          {quests.map((q) => (
            <div key={q.id}>
              <p className="font-serif text-base font-semibold text-amber-200">{q.name}</p>
              {q.description && (
                <p className="mt-1 text-sm leading-relaxed text-slate-300 line-clamp-4">{q.description}</p>
              )}
              {q.objectives?.[0]?.description && (
                <p className="mt-2 text-xs text-amber-400/90">
                  First objective: {q.objectives[0].description}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-slate-800 px-5 py-3">
          {onOpenJournal && (
            <button
              type="button"
              onClick={onOpenJournal}
              className="flex-1 rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm font-medium text-amber-100"
            >
              Open journal
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
