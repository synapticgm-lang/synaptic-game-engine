import { Sparkles, Dices } from 'lucide-react';
import type { EngineMode, GameState } from '@/game/types';
import { isOpeningEstablishmentPending } from '@/game/openingEstablishment';
import { resolveOfferedChoices } from '@/game/playTranscript';
import { pickFateChoice } from '@/game/fatePick';
import { classOfferPad } from '@/game/rules/characterClass';

interface ActionBarProps {
  state: GameState;
  busy: boolean;
  onAction: (action: string) => void;
  engineMode?: EngineMode;
  /** When true, choice buttons are collapsed (mobile screen space). */
  hidden?: boolean;
}

export function ActionBar({ state, busy, onAction, engineMode, hidden = false }: ActionBarProps) {
  const actions = resolveOfferedChoices(state);
  const classPrompt = classOfferPad(state);
  const isDnd = engineMode === 'dnd' || state.engineMode === 'dnd';
  const openingCover = isOpeningEstablishmentPending(state);

  const handleFatesPick = () => {
    onAction(pickFateChoice(actions));
  };

  if (hidden || (actions.length === 0 && !classPrompt)) return null;

  return (
    <div className="flex flex-col gap-1.5 pb-2">
      {classPrompt && (
        <div className="sgm-info-panel rounded-lg border border-sky-500/50 bg-slate-950/90 px-3 py-2" data-testid="class-offer">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300">System — choose a class</div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
            {classPrompt.map((label) => (
              <button
                key={label}
                disabled={busy}
                onClick={() => onAction(label)}
                className="sgm-choice-btn flex min-h-[40px] w-full items-center rounded-lg border border-sky-500/50 bg-slate-900/90 px-3 py-1.5 text-left text-xs font-medium text-sky-100 transition-all hover:bg-sky-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[32px] sm:w-auto sm:rounded-full sm:px-2.5"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {actions.length > 0 && (
      <div className="flex flex-col gap-1.5 sm:flex-wrap sm:flex-row sm:items-stretch">
      {actions.map((action, idx) => (
        <button
          key={idx}
          disabled={busy}
          onClick={() => onAction(action)}
          className="sgm-choice-btn flex min-h-[44px] w-full items-center gap-1 rounded-lg border border-amber-500/50 bg-slate-900/90 px-3 py-2 text-left text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:hover:text-slate-100 sm:min-h-[36px] sm:w-auto sm:rounded-full sm:px-2.5 sm:py-1.5"
        >
          {action}
        </button>
      ))}
      {openingCover ? null : (
      <button
        disabled={busy || actions.length === 0}
        onClick={handleFatesPick}
        title="Fate's Pick — randomly selects one of the listed actions"
        className="sgm-choice-btn flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg border border-amber-500/50 bg-black/85 px-2.5 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/85 disabled:hover:text-slate-100 sm:w-auto sm:rounded-full"
      >
        {isDnd ? <Dices size={11} /> : <Sparkles size={11} className="text-amber-400" />}
        Fate's Pick
      </button>
      )}
      </div>
      )}
    </div>
  );
}
