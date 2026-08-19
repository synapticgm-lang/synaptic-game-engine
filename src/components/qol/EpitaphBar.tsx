interface Props {
  storyName: string;
  onNewGame: () => void;
  onExport: () => void;
  onMainMenu: () => void;
}

/** Read-only archive chrome when playPhase === 'ended'. */
export function EpitaphBar({ storyName, onNewGame, onExport, onMainMenu }: Props) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur-sm">
      <p className="mb-2 text-center text-xs uppercase tracking-widest text-slate-500">
        Run ended — {storyName}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onNewGame}
          className="rounded-md bg-crimson-700 px-4 py-2 text-sm font-medium text-white hover:bg-crimson-600"
        >
          New Game
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-md border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Export story
        </button>
        <button
          type="button"
          onClick={onMainMenu}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          Main menu
        </button>
      </div>
    </div>
  );
}
