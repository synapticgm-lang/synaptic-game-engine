import { Sparkles, Dices } from 'lucide-react';
import type { EngineMode, GameState } from '@/game/types';
import {
  isChoiceGroundedInTurn,
  normalizeStoryCorpus,
  sceneSafeFallbacks,
} from '@/game/choicePipeline';

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
 * Prefers the GM's own generated choices (already pipeline-grounded in useGame).
 * Falls back to scene-safe options — never invents combat/hide without an encounter.
 */
function resolveActions(state: GameState): { actions: string[]; isGmGenerated: boolean } {
  const lastGm = [...state.log].reverse().find((e) => e.role === 'gm');
  const storyProse = normalizeStoryCorpus(lastGm?.content ?? '');

  const gmChoices = (state.choices ?? [])
    .filter((c) => c && c !== FALLBACK_CHOICE)
    .filter((c) => isChoiceGroundedInTurn(c, storyProse, state, state.lorebook ?? []));

  if (gmChoices.length > 0) {
    return { actions: gmChoices, isGmGenerated: true };
  }

  // Scene-safe list from established state only (no invented same-turn nouns).
  return {
    actions: sceneSafeFallbacks(state, ''),
    isGmGenerated: false,
  };
}

export function ActionBar({ state, busy, onAction, engineMode, hidden = false }: ActionBarProps) {
  const { actions, isGmGenerated } = resolveActions(state);
  const isDnd = engineMode === 'dnd' || state.engineMode === 'dnd';

  const handleFatesPick = () => {
    const pick = actions[Math.floor(Math.random() * actions.length)];
    onAction(pick);
  };

  if (hidden) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-2">
      {actions.map((action, idx) => (
        <button
          key={idx}
          disabled={busy}
          onClick={() => onAction(action)}
          className="flex min-h-[36px] items-center gap-1 rounded-full border border-amber-500/50 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:hover:text-slate-100"
        >
          {isGmGenerated && idx === 0 && <Sparkles size={11} className="text-amber-400" />}
          {action}
        </button>
      ))}
      <button
        disabled={busy || actions.length === 0}
        onClick={handleFatesPick}
        title="Fate's Pick — randomly selects one action and submits it"
        className="flex min-h-[36px] items-center gap-1 rounded-full border border-amber-500/50 bg-black/85 px-2.5 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/85 disabled:hover:text-slate-100"
      >
        {isDnd ? <Dices size={11} /> : <Sparkles size={11} />}
        Fate's Pick
      </button>
    </div>
  );
}
