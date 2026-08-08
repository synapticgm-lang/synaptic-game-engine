import { Sparkles, Dices, Compass } from 'lucide-react';
import type { GameState } from '@/game/types';

interface ActionBarProps {
  state: GameState;
  busy: boolean;
  onAction: (action: string) => void;
}

const COMBAT_ACTIONS = ['Draw weapon', 'Attack the nearest enemy', 'Cast a spell', 'Take cover'];
const SOCIAL_ACTIONS = ['Bribe the guard', 'Intimidate', 'Persuade with charm', 'Ask for information'];
const EXPLORE_ACTIONS = ['Search the room', 'Investigate the area', 'Move carefully forward', 'Listen at the door'];
const REST_ACTIONS = ['Check inventory', 'Rest briefly', 'Examine surroundings', 'Talk to companion'];

const FALLBACK_CHOICE = '🎲 Let Fate Decide';

function fallbackSuggestions(state: GameState): string[] {
  const lastEntry = state.log[state.log.length - 1];
  const text = (lastEntry?.content ?? '').toLowerCase();

  if (text.includes('combat') || text.includes('enemy') || text.includes('attack') || text.includes('fight') || text.includes('initiative')) {
    return COMBAT_ACTIONS;
  }
  if (text.includes('guard') || text.includes('merchant') || text.includes('talk') || text.includes('npc') || text.includes('speak')) {
    return SOCIAL_ACTIONS;
  }
  if (text.includes('room') || text.includes('door') || text.includes('corridor') || text.includes('path') || text.includes('explore')) {
    return EXPLORE_ACTIONS;
  }
  return REST_ACTIONS;
}

/**
 * Prefers the GM's own generated choices (parsed from the turn's numbered/bulleted
 * options list) so the action buttons reflect what the story actually offered. Falls
 * back to generic keyword-based suggestions only when the GM didn't produce real choices.
 */
function resolveActions(state: GameState): { actions: string[]; isGmGenerated: boolean } {
  const gmChoices = (state.choices ?? []).filter((c) => c && c !== FALLBACK_CHOICE);
  if (gmChoices.length > 0) {
    return { actions: gmChoices, isGmGenerated: true };
  }
  return { actions: fallbackSuggestions(state), isGmGenerated: false };
}

export function ActionBar({ state, busy, onAction }: ActionBarProps) {
  const { actions, isGmGenerated } = resolveActions(state);

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
        disabled={busy}
        onClick={handleFatesPick}
        title="Fate's Pick — randomly selects one action and submits it"
        className="flex items-center gap-1 rounded-full border border-amber-500/50 bg-black/85 px-2.5 py-1 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/85 disabled:hover:text-slate-100"
      >
        <Dices size={11} />
        Fate's Pick
      </button>
    </div>
  );
}
