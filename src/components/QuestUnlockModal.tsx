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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-sky-500/50 bg-slate-950 shadow-2xl shadow-sky-950/50">
        <div className="border-b border-sky-500/30 bg-sky-950/50 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sky-400">System</p>
          <h2 className="mt-1 text-lg font-bold uppercase tracking-wide text-sky-100">
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
                <p className="mt-2 text-xs text-sky-300">
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
              className="flex-1 rounded-md border border-sky-600/50 bg-sky-900/40 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-800/50"
            >
              Open journal
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
