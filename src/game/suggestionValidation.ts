import type { GameState } from './types';

const COMPANION_REFERENCE =
  /\b(?:my|our|the|your)?\s*(?:companion|party member|party members|party group|teammate|sidekick|familiar|mount)\b/i;
const COMPANION_ACQUISITION =
  /\b(?:find|seek|search for|look for|recruit|hire|summon|tame|befriend)\b/i;
const NAMED_INTERACTION =
  /\b(?:ask|tell|consult|command|order|heal|speak (?:to|with)|talk (?:to|with))\s+(?:the\s+)?([A-Z][\p{L}\p{N}'-]{1,40})\b/u;
const GENERIC_SCENE_ROLES = new Set([
  'around', 'locals', 'guard', 'guards', 'merchant', 'innkeeper', 'bartender', 'villager',
  'villagers', 'stranger', 'prisoner', 'enemy',
]);

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function knownEntityNames(state: GameState): Set<string> {
  const names = new Set<string>();
  const addName = (name: string) => {
    const normalized = normalize(name);
    names.add(normalized);
    const firstName = normalized.split(/\s+/)[0];
    if (firstName) names.add(firstName);
  };
  for (const companion of state.companions ?? []) addName(companion.name);
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc') addName(card.name);
  }
  if (state.activeEncounter?.name) addName(state.activeEncounter.name);
  return names;
}

/**
 * Suggestions are untrusted model output. Reject actions whose premise requires a companion
 * or named actor that is absent from structured state instead of turning that premise into a
 * clickable button.
 */
export function isSuggestionValidForState(suggestion: string, state: GameState): boolean {
  const companions = state.companions ?? [];
  const referencesCompanion = COMPANION_REFERENCE.test(suggestion);

  if (referencesCompanion && companions.length === 0 && !COMPANION_ACQUISITION.test(suggestion)) {
    return false;
  }

  // A named social command is allowed only for an entity tracked as a companion, NPC lore
  // card, or active encounter. This catches choices such as "Ask Elara for advice" when the
  // model invented Elara solely inside its option list.
  const namedTarget = suggestion.match(NAMED_INTERACTION)?.[1];
  if (
    namedTarget
    && !GENERIC_SCENE_ROLES.has(normalize(namedTarget))
    && !knownEntityNames(state).has(normalize(namedTarget))
  ) {
    return false;
  }

  return true;
}

export function fallbackSuggestionForState(state: GameState): string {
  if (state.activeEncounter) return 'Assess the enemy and surroundings';
  if (state.activeDungeon || state.currentLocation) return 'Inspect the immediate surroundings';
  return 'Observe the environment carefully';
}
