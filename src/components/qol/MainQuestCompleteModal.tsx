import type { MainQuestEndPrompt } from '@/game/mainQuestEnd';
import { FINISH_AND_NEW_GAME, MAIN_QUEST_DONE_TITLE, ONE_MORE_TURN } from '@/game/mainQuestEnd';

interface Props {
  prompt: MainQuestEndPrompt;
  litrpg: boolean;
  busy: boolean;
  onContinue: () => void;
  onFinish: () => void;
}

/** Epilogue, then the Civ-style choice: carry on in the open world, or finish and start a new game. */
export function MainQuestCompleteModal({ prompt, litrpg, busy, onContinue, onFinish }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" data-testid="main-quest-complete">
      <div className="sgm-info-panel w-full max-w-md rounded-xl border border-amber-500/50 bg-slate-950/95 p-5 shadow-2xl">
        <p className="mb-1 text-[11px] uppercase tracking-widest text-amber-300">{prompt.questName}</p>
        <div className={`mb-4 space-y-1.5 text-sm text-slate-200 ${litrpg ? 'font-mono text-sky-200' : 'sgm-prose-face'}`}>
          {prompt.epilogue.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <h2 className="mb-4 text-center text-lg font-semibold text-amber-100">{MAIN_QUEST_DONE_TITLE}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={busy}
            onClick={onContinue}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40"
          >
            {ONE_MORE_TURN}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onFinish}
            className="rounded-md border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            {FINISH_AND_NEW_GAME}
          </button>
        </div>
      </div>
    </div>
  );
}
