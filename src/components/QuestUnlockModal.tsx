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
      <div className="sgm-turn-frame sgm-info-panel w-full max-w-md overflow-hidden rounded-xl border shadow-2xl">
        <div className="sgm-turn-frame-bar h-1 w-full" />
        <div className="border-b border-slate-800/80 bg-black/20 px-5 py-3">
          <p className="sgm-info-accent font-mono text-[10px] uppercase tracking-[0.25em]">System</p>
          <h2 className="sgm-info-heading mt-1 text-lg font-bold uppercase tracking-wide">
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
                <p className="mt-2 text-xs sgm-info-accent">
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
              className="sgm-info-tab-on flex-1 rounded-md border px-3 py-2 text-sm font-medium"
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
