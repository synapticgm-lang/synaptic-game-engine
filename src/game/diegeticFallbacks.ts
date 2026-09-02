/**
 * Batch Y Milestone 1 — Diegetic Fallbacks
 * 
 * Root cause fix: When commit gate fails, we inject meta strings like
 * "Nothing shifts until you leave" or "beat needs an exit" into the prompt.
 * Flash Lite mashes these into narration.
 * 
 * Solution: Pre-written diegetic template sentences for common fallback states.
 * Never inject recovery reason into LLM context window.
 */

import type { GameState, ActiveEncounter } from './types';

// ============================================================================
// DIEGETIC FALLBACK TEMPLATES
// ============================================================================

/**
 * Get a diegetic fallback sentence for a given game state and reason.
 * These are pre-written, scene-appropriate sentences that never expose
 * engine internals to the LLM.
 */
export function getDiegeticFallback(
  state: GameState,
  reason: string
): string {
  const lower = reason.toLowerCase();
  
  // Combat stuck (enemy won't die, combat loop)
  if (lower.includes('combat') || lower.includes('stuck') || lower.includes('loop')) {
    return getCombatStuckFallback(state);
  }
  
  // Travel blocked (caught, in combat, can't leave)
  if (lower.includes('travel') || lower.includes('blocked') || lower.includes('caught')) {
    return getTravelBlockedFallback(state);
  }
  
  // Inspect exhausted (nothing left to examine)
  if (lower.includes('inspect') || lower.includes('exhaust') || lower.includes('search')) {
    return getInspectExhaustedFallback(state);
  }
  
  // Beat has no delta (same-room essay, no progress)
  if (lower.includes('delta') || lower.includes('progress') || lower.includes('stall')) {
    return getNoProgressFallback(state);
  }
  
  // Opening establishment incomplete
  if (lower.includes('opening') || lower.includes('establish') || lower.includes('name')) {
    return getOpeningFallback(state);
  }
  
  // Generic fallback
  return getGenericFallback(state);
}

// ============================================================================
// COMBAT FALLBACKS
// ============================================================================

function getCombatStuckFallback(state: GameState): string {
  const enc = state.pendingEncounter ?? state.activeEncounter;
  if (!enc) {
    return 'The tension holds. Neither side yields.';
  }
  
  const templates = [
    'The clash continues, neither side yielding.',
    'You trade blows, locked in combat.',
    'The fight rages on. No opening yet.',
    'Steel meets steel. The stalemate holds.',
    'The struggle persists. No clear advantage.',
  ];
  
  return pickRandom(templates, state.turn);
}

// ============================================================================
// TRAVEL FALLBACKS
// ============================================================================

function getTravelBlockedFallback(state: GameState): string {
  const enc = state.pendingEncounter ?? state.activeEncounter;
  
  // Caught in combat
  if (enc?.caught) {
    const templates = [
      'They block your path. No escape.',
      'You cannot flee. They have you cornered.',
      'Your path forward remains blocked.',
      'Escape is impossible. They close in.',
      'There is no way out. Not yet.',
    ];
    return pickRandom(templates, state.turn);
  }
  
  // In combat (not caught)
  if (enc) {
    const templates = [
      'The fight demands your attention. No time to leave.',
      'You cannot walk away while they press the attack.',
      'Leaving now would expose your back.',
      'Combat pins you here.',
      'The threat holds you in place.',
    ];
    return pickRandom(templates, state.turn);
  }
  
  // Generic blocked
  const templates = [
    'Your path forward remains blocked.',
    'The way is not clear. Not yet.',
    'You cannot leave. Something holds you here.',
    'The exit is not open.',
    'Passage is denied.',
  ];
  return pickRandom(templates, state.turn);
}

// ============================================================================
// INSPECTION FALLBACKS
// ============================================================================

function getInspectExhaustedFallback(state: GameState): string {
  const isIndoors = state.sceneFacts?.indoor ?? false;
  
  if (isIndoors) {
    const templates = [
      'You have examined everything here.',
      'Nothing new catches your eye.',
      'The room holds no more secrets.',
      'You have searched every corner.',
      'There is nothing else to find.',
    ];
    return pickRandom(templates, state.turn);
  } else {
    const templates = [
      'You have examined the area thoroughly.',
      'Nothing new stands out.',
      'The space holds no more surprises.',
      'You have looked everywhere.',
      'There is nothing else to discover here.',
    ];
    return pickRandom(templates, state.turn);
  }
}

// ============================================================================
// NO PROGRESS FALLBACKS
// ============================================================================

function getNoProgressFallback(state: GameState): string {
  const templates = [
    'The moment holds. Nothing changes.',
    'Time passes. The scene does not shift.',
    'You wait. The world does not move forward.',
    'The beat lingers. No new development.',
    'Silence. The tension does not break.',
  ];
  return pickRandom(templates, state.turn);
}

// ============================================================================
// OPENING FALLBACKS
// ============================================================================

function getOpeningFallback(state: GameState): string {
  const hasName = !!state.name && state.name !== 'Adventurer';
  
  if (!hasName) {
    const templates = [
      'They wait for your name.',
      'The question hangs in the air. Who are you?',
      'They expect an answer. Your name.',
      'Silence. They want a name.',
      'The moment waits for your introduction.',
    ];
    return pickRandom(templates, state.turn);
  }
  
  const templates = [
    'The opening exchange continues.',
    'The introduction is not yet complete.',
    'They have more questions.',
    'The first meeting unfolds.',
    'The threshold is not yet crossed.',
  ];
  return pickRandom(templates, state.turn);
}

// ============================================================================
// GENERIC FALLBACK
// ============================================================================

function getGenericFallback(state: GameState): string {
  const templates = [
    'The moment holds.',
    'Time passes.',
    'The scene does not shift.',
    'You wait.',
    'The world pauses.',
  ];
  return pickRandom(templates, state.turn);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Pick a deterministic random template based on turn number.
 * Same turn always gets the same template for consistency.
 */
function pickRandom<T>(array: T[], seed: number): T {
  if (array.length === 0) return array[0]!;
  const index = seed % array.length;
  return array[index]!;
}

/**
 * Check if a reason string is a meta/recovery string that should never
 * appear in GM story or LLM context.
 */
export function isMetaRecoveryString(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Meta engine strings
  if (lower.includes('nothing shifts until')) return true;
  if (lower.includes('beat needs')) return true;
  if (lower.includes('already on you')) return true;
  if (lower.includes('moment has not moved on')) return true;
  if (lower.includes('figure n is still here')) return true;
  
  // Recovery chrome
  if (lower.includes('beat recovered')) return true;
  if (lower.includes('engine fallback')) return true;
  if (lower.includes('commit gate')) return true;
  if (lower.includes('ledger still counts')) return true;
  
  // HUD stubs
  if (lower.includes('something shifts')) return true;
  if (lower.includes('closes in')) return true;
  if (lower.includes('pc·hp·xp')) return true;
  
  return false;
}

/**
 * Scrub meta recovery strings from text.
 * Used in prose warden to ensure these never leak into GM story.
 */
export function scrubMetaRecoveryStrings(text: string): string {
  let cleaned = text;
  
  // Remove common meta patterns
  cleaned = cleaned.replace(/nothing shifts until you leave/gi, '');
  cleaned = cleaned.replace(/beat needs an? exit/gi, '');
  cleaned = cleaned.replace(/already on you/gi, '');
  cleaned = cleaned.replace(/moment has not moved on/gi, '');
  cleaned = cleaned.replace(/figure \d+ is still here/gi, '');
  cleaned = cleaned.replace(/beat recovered[^.;]*/gi, '');
  cleaned = cleaned.replace(/engine fallback ×\d+/gi, '');
  cleaned = cleaned.replace(/ledger still counts/gi, '');
  cleaned = cleaned.replace(/something shifts[^.;]*/gi, '');
  cleaned = cleaned.replace(/closes in[^.;]*ledger/gi, '');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  
  // If we scrubbed everything, return empty
  if (!cleaned || cleaned.length < 10) return '';
  
  return cleaned;
}
