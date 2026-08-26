/**
 * PACK 12: SMART CHOICE FILTERING
 *
 * Filters out choices that reference non-existent story context.
 * Prevents "respond to their offer" when no offer was made, invented props, etc.
 */

import type { GameState } from './types';
import { choiceNamesUnnarratedObject } from './choicePipeline';

/**
 * References that require story context to exist.
 * Format: choice pattern -> required story keywords
 */
const CONTEXT_REQUIREMENTS: Array<{
  pattern: RegExp;
  requires: RegExp;
  description: string;
}> = [
  {
    pattern: /\b(?:their|the|an?)\s+offer\b/i,
    requires: /\b(?:offer|propose|deal|bargain|terms|price|trade|exchange)\b/i,
    description: 'offer/deal',
  },
  {
    pattern: /\b(?:their|the)\s+(?:question|query)\b/i,
    requires: /\b(?:\?|ask|question|query|wonder)\b/i,
    description: 'question',
  },
  {
    pattern: /\b(?:their|the)\s+(?:demand|request)\b/i,
    requires: /\b(?:demand|request|want|need|require|insist)\b/i,
    description: 'demand/request',
  },
  {
    pattern: /\b(?:their|the)\s+(?:threat|warning)\b/i,
    requires: /\b(?:threat|warn|threaten|dangerous|risk)\b/i,
    description: 'threat/warning',
  },
  {
    pattern: /\backnowledge\s+(?:their|the)\s+/i,
    requires: /\b(?:say|speak|tell|mention|state|declare)\b/i,
    description: 'statement to acknowledge',
  },
  {
    pattern: /\b(?:respond|reply|answer)\s+to\b/i,
    requires: /\b(?:\?|ask|say|speak|tell|question|demand)\b/i,
    description: 'something to respond to',
  },
  {
    pattern: /\b(?:barrels?|casks?|crates?)\b/i,
    requires: /\b(?:barrels?|casks?|crates?)\b/i,
    description: 'barrels/casks/crates',
  },
  {
    pattern: /\b(?:help|haul|carry|load|move)\b.+\b(?:barrels?|casks?|crates?|linens?|cargo)\b|\b(?:barrels?|casks?)\b.+\b(?:help|haul|carry|load)\b/i,
    requires: /\b(?:barrels?|casks?|crates?|linens?|cargo|handlers?)\b/i,
    description: 'unpaid chore props',
  },
];

/** Choice that is only the PC's name (not a real action). */
export function isBarePcNameChoice(choice: string, characterName?: string): boolean {
  const name = (characterName ?? '').trim();
  if (!name || name.length < 2) return false;
  const cleaned = choice.replace(/^[\s✨🎲⭐️•\-–—]+/u, '').trim();
  return cleaned.toLowerCase() === name.toLowerCase();
}

function lastGmStory(state: GameState): string {
  for (let i = (state.log ?? []).length - 1; i >= 0; i--) {
    const entry = state.log[i];
    if (entry?.role === 'gm' && entry.content) return entry.content;
  }
  return '';
}

/**
 * Check if a choice references context that doesn't exist in the story.
 */
export function choiceInventsContext(
  choice: string,
  recentStory: string,
  scenePropsCorpus = '',
  state?: GameState
): boolean {
  const choiceLower = choice.toLowerCase().trim();
  const grounded = `${recentStory}\n${scenePropsCorpus}`.toLowerCase();

  for (const rule of CONTEXT_REQUIREMENTS) {
    if (rule.pattern.test(choiceLower)) {
      // Choice references this context - check if story/props have it
      if (!rule.requires.test(grounded)) {
        return true; // Context required but missing
      }
    }
  }

  // Concrete props (article or bare after inspect verbs) must appear in last story / props / kit / location.
  if (state && choiceNamesUnnarratedObject(choice, recentStory, state)) {
    return true;
  }

  return false;
}

/**
 * Filter out choices that invent non-existent context.
 * Grounds against the last GM story + sceneFacts.props (not older log turns).
 */
export function filterInventedContextChoices(
  choices: string[],
  state: GameState
): string[] {
  const recentStory = lastGmStory(state);

  const scenePropsCorpus = [
    ...(state.sceneFacts?.props ?? []),
    ...(state.locationSheet?.interactables ?? []).map((i) => i.name),
  ]
    .filter(Boolean)
    .join(' ');

  const pcName = state.character?.name;

  return choices.filter((choice) => {
    if (isBarePcNameChoice(choice, pcName)) {
      console.log(`[Choice Filter] Removed bare PC-name choice: "${choice}"`);
      return false;
    }
    const emptyKeys = [
      ...(state.sceneFacts?.searchedEmpty ?? []),
      ...(state.sceneFacts?.emptyContainers ?? []),
    ];
    if (
      emptyKeys.length > 0
      && /\b(hidden compartment|search(?:ing)? (?:again|the ruin|carefully)|anything missed|for anything)\b/i.test(choice)
      && !/\b(bag|backpack|light|torch|basement|different room|break|pry)\b/i.test(choice)
    ) {
      console.log(`[Choice Filter] Removed empty-research loot invite: "${choice}"`);
      return false;
    }
    if (!recentStory && !scenePropsCorpus) return true;
    const invents = choiceInventsContext(choice, recentStory, scenePropsCorpus, state);
    if (invents) {
      console.log(`[Choice Filter] Removed invented-context choice: "${choice}"`);
    }
    return !invents;
  });
}

/**
 * Get explanation for why a choice was filtered.
 */
export function explainFilteredChoice(
  choice: string,
  recentStory: string
): string | null {
  for (const rule of CONTEXT_REQUIREMENTS) {
    if (rule.pattern.test(choice.toLowerCase())) {
      if (!rule.requires.test(recentStory.toLowerCase())) {
        return `References ${rule.description} not mentioned in story`;
      }
    }
  }
  return null;
}
