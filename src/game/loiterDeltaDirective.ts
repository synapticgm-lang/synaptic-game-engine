/**
 * loiterDeltaDirective.ts
 * 
 * Injects explicit time-jump directives when player loiters (Wait/Inspect x3+).
 * Forces LLM to generate novel content instead of recycling the same beat.
 * 
 * Part of Flash Lite Input Sanitization Architecture (2026-09-02)
 * P2: State-Forced Delta Prompts
 */

import type { GameState } from './types';
import type { IntentStreak } from './beatFingerprint';

/**
 * Inject loiter delta directive into SNAPSHOT when streak detected
 */
export function injectLoiterDelta(
  snapshot: string,
  streak: IntentStreak,
  state: GameState
): string {
  // Only inject on streak ≥3
  if (streak.count < 3) return snapshot;
  
  // Only for loiter-family intents
  if (!isLoiterFamily(streak.key)) return snapshot;
  
  const timeJump = calculateTimeJump(streak.count);
  const deltaDirective = generateDeltaDirective(streak, state);
  
  // Inject after Location line
  const lines = snapshot.split('\n');
  const locationIndex = lines.findIndex(l => 
    l.startsWith('- Location:') || l.startsWith('Location:')
  );
  
  if (locationIndex >= 0) {
    // Insert time jump and delta directive
    lines.splice(
      locationIndex + 1,
      0,
      `- TIME JUMP: ${timeJump} have passed since the player began ${streak.key}.`,
      `- MANDATORY DELTA: ${deltaDirective}`
    );
  } else {
    // No location line found - prepend to snapshot
    lines.unshift(
      `TIME JUMP: ${timeJump} have passed since the player began ${streak.key}.`,
      `MANDATORY DELTA: ${deltaDirective}`,
      ''
    );
  }
  
  // Add binding at end
  lines.push('');
  lines.push('BINDING: Do NOT reprint the prior beat\'s description. Generate concrete change.');
  
  return lines.join('\n');
}

/**
 * Check if intent is in loiter family
 */
function isLoiterFamily(key: string): boolean {
  const loiterIntents = [
    'wait',
    'loiter',
    'inspect',
    'look around',
    'scout',
    'listen',
    'observe',
    'watch',
    'examine',
  ];
  
  const lower = key.toLowerCase();
  return loiterIntents.some(intent => lower.includes(intent));
}

/**
 * Calculate time jump based on streak count
 */
function calculateTimeJump(streakCount: number): string {
  if (streakCount >= 5) return '20-30 minutes';
  if (streakCount >= 4) return '15-20 minutes';
  if (streakCount >= 3) return '10-15 minutes';
  return '5-10 minutes';
}

/**
 * Generate mandatory delta directive with examples
 */
function generateDeltaDirective(
  streak: IntentStreak,
  state: GameState
): string {
  const examples: string[] = [];
  
  // NPC activity changes
  if (state.sceneFacts?.present && state.sceneFacts.present.length > 0) {
    examples.push(
      'NPCs finished their prior activity (conversation ended, someone moved or left)'
    );
  }
  
  // Guard patrols
  if (state.sceneFacts?.tension && state.sceneFacts.tension !== 'low') {
    examples.push(
      'Guard patrols shifted (new positions, shift change, someone left post)'
    );
  }
  
  // Environmental changes (always available)
  examples.push(
    'Environmental change (weather, lighting, sounds, temperature)'
  );
  
  // Opportunity windows
  if (state.activeEncounter || state.sceneFacts?.tension === 'high') {
    examples.push(
      'Opportunity window (door left unguarded, distraction occurred)'
    );
  } else {
    examples.push(
      'New arrival (someone entered the scene)'
    );
  }
  
  return `Something MUST have changed during this time. Examples:\n  * ${examples.join('\n  * ')}`;
}

/**
 * Build loiter delta directive for standalone use
 */
export function buildLoiterDeltaDirective(loiterCount: number, state?: GameState): string | null {
  if (loiterCount < 3) return null;
  
  const timeJump = calculateTimeJump(loiterCount);
  const examples: string[] = [
    'Weather shifted (wind picked up, clouds parted, etc.)',
    'NPC repositioned (guard moved, someone lit a cigarette, etc.)',
    'Ambient detail (new sound, different light, etc.)',
  ];
  
  if (state?.activeEncounter || state?.sceneFacts?.tension === 'high') {
    examples.push('Opportunity window (door left unguarded, distraction occurred)');
  }
  
  return `TIME JUMP: ${timeJump} have passed.
MANDATORY DELTA: Something MUST have changed. Choose ONE:
${examples.map(ex => `- ${ex}`).join('\n')}`;
}

/**
 * Check if state needs loiter delta (for use in situation packet)
 */
export function needsLoiterDelta(state: GameState): boolean {
  // Count recent loiter actions
  const recentActions = state.log?.slice(-5) ?? [];
  let loiterCount = 0;
  
  for (const entry of recentActions) {
    if (entry.role === 'player') {
      const text = entry.content?.toLowerCase() ?? '';
      if (isLoiterFamily(text)) {
        loiterCount++;
      } else {
        // Reset on non-loiter action
        loiterCount = 0;
      }
    }
  }
  
  return loiterCount >= 3;
}
