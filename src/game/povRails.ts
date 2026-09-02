/**
 * povRails.ts
 * 
 * Point of View grammatical guardrails for perspective consistency.
 * Prevents mixing 2nd/3rd person or confusing possessive assignments.
 * 
 * Part of Flash Lite Input Sanitization Architecture (2026-09-02)
 * P2: POV Guardrails
 */

import type { GameState } from './types';

/**
 * Build POV rails based on game settings
 */
export function buildPovRails(state: GameState): string {
  const perspective = state.settings?.perspective ?? 'second';
  
  if (perspective === 'second') {
    return POV_SECOND_PERSON_RAILS;
  } else if (perspective === 'third') {
    return POV_THIRD_PERSON_RAILS;
  }
  
  return POV_SECOND_PERSON_RAILS;
}

/**
 * Second person POV rails (default)
 */
const POV_SECOND_PERSON_RAILS = `=== POINT OF VIEW RULES (STRICT GRAMMAR) ===

1. PLAYER CHARACTER (PC) - SECOND PERSON ONLY:
   - Use "you", "your", "yours" for the player character
   - Example: "You step forward, your hand reaching for the latch."
   - NEVER: "He steps forward" / "She considers her options" / "They move"

2. NON-PLAYER CHARACTERS (NPCs) - THIRD PERSON ONLY:
   - Use "he/him", "she/her", "they/them" for NPCs
   - Example: "Vessa shifts her weight, her eyes tracking your movement."
   - NEVER: "Your companion says" when naming the NPC

3. POSSESSIVE BODY PARTS - MUST MATCH SUBJECT:
   - PC body parts: "your hand", "your eyes", "your breath"
   - NPC body parts: "his face", "her stance", "their weapons"
   - CRITICAL: "your X" only when PC is the subject/actor
   - WRONG: "her eyes narrow, your pupils dilating" → Should be "her pupils"

4. MIXED SENTENCES:
   When PC and NPC both act in one sentence:
   - Keep subjects clear: "You step back as he lunges forward." ✓
   - NOT: "Your movement triggers his lunge." ✗ (confusing possession)

5. NO THIRD-PERSON CAMERA:
   Do NOT write: "The scene unfolds", "An observer would see", "He watches him"
   Only valid perspectives: YOU (PC) and named NPCs in third person

EXAMPLES OF CORRECT USAGE:
✓ "You raise your blade. Vessa watches, her hand drifting to her dagger."
✓ "The guard's eyes narrow as you pass, his grip tightening on his spear."
✓ "You steady your breath. Just grunts, his attention elsewhere."

EXAMPLES OF FORBIDDEN USAGE:
✗ "Your eyes narrow as his heart pounds" → Mixing PC/NPC possession
✗ "He steps forward, your guard raised" → Wrong subject for PC
✗ "Vessa's eyes widen on your face" → "Your face" should be "her face"
=================================================`;

/**
 * Third person POV rails (alternate perspective)
 */
const POV_THIRD_PERSON_RAILS = `=== POINT OF VIEW RULES (STRICT GRAMMAR) ===

Player character uses third person with their name:
- "{NAME} steps forward, his/her/their hand reaching for the latch."
- Pronouns: "he/him", "she/her", "they/them" based on character

NPCs also use third person:
- "Vessa shifts her weight, her eyes tracking {NAME}'s movement."

Maintain perspective consistency throughout each beat.
Avoid switching between character names and "the player" mid-scene.
=================================================`;

/**
 * Get POV violation patterns for warden checking
 */
export function getPovViolationPatterns(): RegExp[] {
  return [
    // Mixed PC/NPC possession in same clause
    /\byour\s+\w+\s+(?:as|while|and)\s+(?:his|her|their)\s+\w+\s+(?:pounds|races|beats)/gi,
    
    // Third-person camera angles
    /\b(?:the scene|an observer would|one would see|it appears)\b/gi,
    
    // Wrong possessive for NPC body parts
    /\b([A-Z][a-z'-]+)'s\s+(?:eyes?|face|hands?|gaze|expression)\s+[^.!?]*?\byour\s+\w+/gi,
    
    // PC referred to in third person (when should be "you")
    // This is harder to detect without knowing PC name, so we check for common patterns
    /\b(?:He|She|They)\s+(?:steps?|moves?|walks?|runs?)\s+forward/g,
  ];
}

/**
 * Check if text has potential POV violations
 */
export function hasPovViolations(text: string, pcName?: string): boolean {
  const patterns = getPovViolationPatterns();
  
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Check for PC name used in third person (if we know the name)
  if (pcName && pcName.length > 2) {
    const pcThirdPersonPattern = new RegExp(
      `\\b${pcName}\\s+(?:steps?|moves?|walks?|considers?|watches?)\\b`,
      'gi'
    );
    if (pcThirdPersonPattern.test(text)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Enhance body part possession scrubbing
 */
export function scrubBodyPartPossession(text: string, pcName: string): string {
  // Pattern: "Your X on [NPC name]'s Y"
  // Problem: "Your eyes narrow on Vessa's face" implies you're narrating Vessa's face
  // Fix: Should be "You meet Vessa's gaze" or "Vessa's eyes narrow as you watch"
  
  const npcBodyOnPcPossessive = new RegExp(
    `\\b([A-Z][a-z'-]+)'s\\s+(eyes?|face|hands?|gaze|expression)\\b.*?\\byour\\s+(\\w+)`,
    'gi'
  );
  
  return text.replace(npcBodyOnPcPossessive, (match, npcName, bodyPart, yourPart) => {
    // "Vessa's eyes narrow, your pupils dilating"
    // → "Vessa's eyes narrow, her gaze fixed on you"
    if (match.includes('your')) {
      return match.replace(/your\s+\w+/gi, 'you');
    }
    return match;
  });
}

/**
 * Format POV rails for inclusion in master prompt
 */
export function formatPovRailsForPrompt(state: GameState): string {
  return buildPovRails(state);
}
