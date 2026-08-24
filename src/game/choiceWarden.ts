/**
 * PACK 12: SMART CHOICE FILTERING
 * 
 * Filters out choices that reference non-existent story context.
 * Prevents "respond to their offer" when no offer was made, etc.
 */

import type { GameState } from './types';

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
];

/**
 * Check if a choice references context that doesn't exist in the story.
 */
export function choiceInventsContext(
  choice: string,
  recentStory: string
): boolean {
  const choiceLower = choice.toLowerCase().trim();
  const storyLower = recentStory.toLowerCase();
  
  for (const rule of CONTEXT_REQUIREMENTS) {
    if (rule.pattern.test(choiceLower)) {
      // Choice references this context - check if story has it
      if (!rule.requires.test(storyLower)) {
        return true; // Context required but missing
      }
    }
  }
  
  return false;
}

/**
 * Filter out choices that invent non-existent context.
 */
export function filterInventedContextChoices(
  choices: string[],
  state: GameState
): string[] {
  // Get last 3 GM story entries for context
  const recentStory = state.log
    .slice(-6)
    .filter(e => e.role === 'gm')
    .map(e => e.content)
    .join(' ')
    .slice(-2000);
  
  if (!recentStory) return choices;
  
  return choices.filter(choice => {
    const invents = choiceInventsContext(choice, recentStory);
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
