import { Sparkles, Dices } from 'lucide-react';
import type { EngineMode, GameState } from '@/game/types';
import { padChoicesToCount } from '@/game/choicePipeline';
import { establishmentChoices, isOpeningEstablishmentPending } from '@/game/openingEstablishment';

interface ActionBarProps {
  state: GameState;
  busy: boolean;
  onAction: (action: string) => void;
  engineMode?: EngineMode;
  /** When true, choice buttons are collapsed (mobile screen space). */
  hidden?: boolean;
}

const FALLBACK_CHOICE = '🎲 Let Fate Decide';

/**
 * Trust pipeline-grounded state.choices. Do not re-filter here — that dropped
 * valid options so the numbered list and the buttons disagreed.
 */
function resolveActions(state: GameState): string[] {
  if (isOpeningEstablishmentPending(state)) {
    return establishmentChoices(state.openingEstablishment?.pending ?? []).slice(0, 4);
  }
  const gmChoices = (state.choices ?? []).filter((c) => c && c !== FALLBACK_CHOICE);
  if (gmChoices.length >= 3) return gmChoices.slice(0, 4);
  return padChoicesToCount(gmChoices, state, '', 3);
}

export function ActionBar({ state, busy, onAction, engineMode, hidden = false }: ActionBarProps) {
  const actions = resolveActions(state);
  const isDnd = engineMode === 'dnd' || state.engineMode === 'dnd';
  const openingCover = isOpeningEstablishmentPending(state);

  const handleFatesPick = () => {
    const pick = actions[Math.floor(Math.random() * actions.length)];
    onAction(pick);
  };

  if (hidden) return null;

  return (
    <div className="flex flex-col gap-1.5 pb-2 sm:flex-wrap sm:flex-row sm:items-stretch">
      {actions.map((action, idx) => (
        <button
          key={idx}
          disabled={busy}
          onClick={() => onAction(action)}
          className="flex min-h-[44px] w-full items-center gap-1 rounded-lg border border-amber-500/50 bg-slate-900/90 px-3 py-2 text-left text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:hover:text-slate-100 sm:min-h-[36px] sm:w-auto sm:rounded-full sm:px-2.5 sm:py-1.5"
        >
          {action}
        </button>
      ))}
      {openingCover ? null : (
      <button
        disabled={busy || actions.length === 0}
        onClick={handleFatesPick}
        title="Fate's Pick — randomly selects one of the listed actions"
        className="flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg border border-amber-500/50 bg-black/85 px-2.5 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/85 disabled:hover:text-slate-100 sm:w-auto sm:rounded-full"
      >
        {isDnd ? <Dices size={11} /> : <Sparkles size={11} className="text-amber-400" />}
        Fate's Pick
      </button>
      )}
    </div>
  );
}
