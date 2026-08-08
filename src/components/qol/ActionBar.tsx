import { Sparkles, Dices } from 'lucide-react';
import type { EngineMode, GameState } from '@/game/types';
import { isSuggestionValidForState } from '@/game/suggestionValidation';

interface ActionBarProps {
  state: GameState;
  busy: boolean;
  onAction: (action: string) => void;
  engineMode?: EngineMode;
}

const COMBAT_ACTIONS = ['Assess the threat', 'Attack the nearest enemy', 'Take cover', 'Look for an escape route'];
const SOCIAL_ACTIONS = ['Ask for information', 'Listen carefully', 'Respond cautiously', 'Observe their reaction'];
const EXPLORE_ACTIONS = ['Search the area', 'Investigate nearby details', 'Move carefully forward', 'Listen for danger'];
const REST_ACTIONS = ['Check inventory', 'Examine surroundings', 'Rest briefly', 'Plan the next move'];

const FALLBACK_CHOICE = '🎲 Let Fate Decide';

function fallbackSuggestions(state: GameState): string[] {
  const lastEntry = state.log[state.log.length - 1];
  const text = (lastEntry?.content ?? '').toLowerCase();
  const location = (state.currentLocation ?? '').toLowerCase();
  const haystack = `${text} ${location}`;

  let pool: string[];
  if (
    state.activeEncounter ||
    haystack.includes('combat') ||
    haystack.includes('enemy') ||
    haystack.includes('attack') ||
    haystack.includes('fight') ||
    haystack.includes('initiative')
  ) {
    pool = COMBAT_ACTIONS;
  } else if (
    haystack.includes('guard') ||
    haystack.includes('merchant') ||
    haystack.includes('talk') ||
    haystack.includes('npc') ||
    haystack.includes('speak') ||
    haystack.includes('innkeeper')
  ) {
    pool = SOCIAL_ACTIONS;
  } else if (
    haystack.includes('room') ||
    haystack.includes('door') ||
    haystack.includes('corridor') ||
    haystack.includes('path') ||
    haystack.includes('explore') ||
    state.activeDungeon
  ) {
    pool = EXPLORE_ACTIONS;
  } else {
    pool = REST_ACTIONS;
  }

  // Drop companion talk when alone; drop spend/bribe-style leftovers via validator.
  return pool
    .filter((action) => {
      if (/companion/i.test(action) && (state.companions ?? []).length === 0) return false;
      return isSuggestionValidForState(action, state);
    })
    .slice(0, 4);
}

/**
 * Prefers the GM's own generated choices (parsed from the turn's numbered/bulleted
 * options list) so the action buttons reflect what the story actually offered. Falls
 * back to scene-aware suggestions only when the GM didn't produce real choices.
 */
function resolveActions(state: GameState): { actions: string[]; isGmGenerated: boolean } {
  const gmChoices = (state.choices ?? [])
    .filter((c) => c && c !== FALLBACK_CHOICE)
    .filter((c) => isSuggestionValidForState(c, state));
  if (gmChoices.length > 0) {
    return { actions: gmChoices, isGmGenerated: true };
  }
  return { actions: fallbackSuggestions(state), isGmGenerated: false };
}

export function ActionBar({ state, busy, onAction, engineMode }: ActionBarProps) {
  const { actions, isGmGenerated } = resolveActions(state);
  const isDnd = engineMode === 'dnd' || state.engineMode === 'dnd';

  const handleFatesPick = () => {
    const pick = actions[Math.floor(Math.random() * actions.length)];
    onAction(pick);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 sm:px-6">
      {actions.map((action, idx) => (
        <button
          key={idx}
          disabled={busy}
          onClick={() => onAction(action)}
          className="flex items-center gap-1 rounded-full border border-amber-500/50 bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:hover:text-slate-100"
        >
          {isGmGenerated && idx === 0 && <Sparkles size={11} className="text-amber-400" />}
          {action}
        </button>
      ))}
      <button
        disabled={busy || actions.length === 0}
        onClick={handleFatesPick}
        title="Fate's Pick — randomly selects one action and submits it"
        className="flex items-center gap-1 rounded-full border border-amber-500/50 bg-black/85 px-2.5 py-1 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/85 disabled:hover:text-slate-100"
      >
        {isDnd ? <Dices size={11} /> : <Sparkles size={11} />}
        Fate's Pick
      </button>
    </div>
  );
}
