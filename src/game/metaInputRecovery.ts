/**
 * P1.5 - Meta-Input Recovery + Narrative Novelty Budget
 * 
 * On complaints like "none of these are valid," re-ground scene, acknowledge mismatch,
 * regenerate from authoritative state. Track recent sentence/beat fingerprints to ban
 * repeated exposition.
 * 
 * Not: Just ignore meta complaints.
 * 
 * Target:
 * - Meta complaint clears bad pad once
 * - Paragraph clones (≥0.85 similarity) do not appear within 20 turns
 */

import type { GameState } from './types';
import { beatFingerprint, beatSimilarity } from './beatFingerprint';

export type MetaComplaintType =
  | 'invalid_options'      // "None of these options make sense"
  | 'stuck'                // "I'm stuck" / "What do I do?"
  | 'confused'             // "I don't understand" / "This doesn't make sense"
  | 'broken_context'       // "That wasn't there" / "You forgot X"
  | 'repeated_content'     // "You already said that"
  | 'out_of_character'     // "My character wouldn't do that"
  | 'rules_question';      // "How does X work?" / "Can I do Y?"

export interface MetaComplaint {
  type: MetaComplaintType;
  playerInput: string;
  turn: number;
  /** What the player is complaining about */
  target?: string;
}

export interface RecoveryAction {
  /** What to do */
  action: 'regenerate_options' | 'clarify_scene' | 'acknowledge_error' | 'explain_rules' | 'reset_scene';
  /** Prompt addition for recovery */
  recoveryPrompt: string;
  /** Should we restore from authoritative state? */
  restoreState: boolean;
}

export interface NarrativeNoveltyBudget {
  /** Recent sentence fingerprints (last 20 turns) */
  recentSentences: Map<string, number>; // fingerprint -> turn
  /** Recent paragraph fingerprints (last 20 turns) */
  recentParagraphs: Map<string, number>; // fingerprint -> turn
  /** Banned exposition topics (already explained) */
  bannedTopics: Set<string>;
}

/**
 * Detect meta-complaint in player input.
 */
export function detectMetaComplaint(input: string): MetaComplaint | null {
  const lower = input.toLowerCase().trim();
  const turn = 0; // Will be filled by caller
  
  // Invalid options complaints
  if (/\b(none of (?:these|those)|all (?:these|those)|(?:these|those) (?:options|choices)).+(?:don'?t|do not|can'?t|cannot|won'?t|will not|not).+(?:make sense|work|valid|possible|right)\b/i.test(lower) ||
      /\b(?:can'?t|cannot|unable to).+(?:any|either|none).+(?:option|choice)\b/i.test(lower) ||
      /\bthis makes no sense\b/i.test(lower) ||
      /\bnone.+valid\b/i.test(lower)) {
    return {
      type: 'invalid_options',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  // Stuck complaints
  if (/\b(?:i'?m|i am).+stuck\b/i.test(lower) ||
      /\bwhat do i do\b/i.test(lower) ||
      /\bwhat am i supposed to do\b/i.test(lower) ||
      /\bhow do i proceed\b/i.test(lower)) {
    return {
      type: 'stuck',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  // Confusion complaints
  if (/\bi don'?t understand\b/i.test(lower) ||
      /\bthis doesn'?t make sense\b/i.test(lower) ||
      /\bconfused\b/i.test(lower) ||
      /\bwhat'?s (?:going on|happening)\b/i.test(lower)) {
    return {
      type: 'confused',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  // Broken context complaints
  if (/\bthat (?:wasn'?t|was not).+(?:there|mentioned|said)\b/i.test(lower) ||
      /\byou (?:forgot|never|didn'?t).+(?:said|mentioned|told)\b/i.test(lower) ||
      /\bi (?:never|didn'?t).+(?:say|do|agree|accept)\b/i.test(lower) ||
      /\bwhere (?:did|is).+(?:come from|appear)\b/i.test(lower)) {
    return {
      type: 'broken_context',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  // Repeated content complaints
  if (/\byou (?:already|just) said that\b/i.test(lower) ||
      /\brepeat(?:ing|ed)\b/i.test(lower) ||
      /\bsame (?:thing|text)\b/i.test(lower)) {
    return {
      type: 'repeated_content',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  // Out of character complaints
  if (/\b(?:my character|i) (?:would|wouldn'?t).+(?:do|say|never)\b/i.test(lower) ||
      /\bthat'?s not what i (?:meant|said|wanted)\b/i.test(lower)) {
    return {
      type: 'out_of_character',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  // Rules questions
  if (/\bhow (?:do|does|can).+work\b/i.test(lower) ||
      /\bcan i (?:do|use|try)\b/i.test(lower) ||
      /\bwhat (?:can|could) i\b/i.test(lower) ||
      /\brules?\b/i.test(lower)) {
    return {
      type: 'rules_question',
      playerInput: input.slice(0, 200),
      turn,
    };
  }
  
  return null;
}

/**
 * Build recovery action for a meta-complaint.
 */
export function buildRecoveryAction(
  complaint: MetaComplaint,
  state: GameState
): RecoveryAction {
  const location = state.currentLocation || 'this location';
  const present = (state.sceneFacts?.present ?? []).slice(0, 5).join(', ') || 'no established NPCs';
  const props = (state.sceneFacts?.props ?? []).slice(0, 5).join(', ') || 'no established props';
  
  switch (complaint.type) {
    case 'invalid_options':
      return {
        action: 'regenerate_options',
        recoveryPrompt: `=== PLAYER COMPLAINT RECOVERY (BINDING) ===
The player stated: "${complaint.playerInput.slice(0, 150)}"

This is a META COMPLAINT about invalid options. Acknowledge the mismatch and regenerate.

CURRENT AUTHORITATIVE STATE:
- Location: ${location}
- Present: ${present}
- Props/Interactables: ${props}
- Inventory: ${(state.inventory ?? []).map(i => i.name).slice(0, 5).join(', ') || 'none'}

REQUIREMENTS:
1. Briefly acknowledge in-fiction ("Hmm, let's reconsider" / "Perhaps clearer options")
2. Re-ground the scene with SNAPSHOT facts
3. Offer NEW options grounded in authoritative state ONLY
4. Do not invent props, NPCs, or locations not in SNAPSHOT
5. Include at least one option that addresses the player's last intent

Do not meta-defend the prior options. Just move forward with better ones.
================================================`,
        restoreState: true,
      };
      
    case 'stuck':
      return {
        action: 'clarify_scene',
        recoveryPrompt: `=== PLAYER STUCK RECOVERY (BINDING) ===
The player stated: "${complaint.playerInput.slice(0, 150)}"

Player is stuck and unsure how to proceed. Clarify the scene and suggest concrete options.

CURRENT SITUATION:
- Location: ${location}
- Present: ${present}
- Active quests: ${(state.quests ?? []).filter(q => q.status === 'active' && q.revealed).map(q => q.name).join(', ') || 'none'}
- Last action: ${state.log?.filter(e => e?.role === 'player').slice(-1)[0]?.content || 'unknown'}

REQUIREMENTS:
1. Briefly re-establish where they are and what's happening
2. Remind of active objective (if any)
3. Offer 3-4 concrete, actionable options
4. At least one option should advance active quest (if any)

Keep it brief and actionable. They need direction, not exposition.
================================================`,
        restoreState: false,
      };
      
    case 'confused':
      return {
        action: 'clarify_scene',
        recoveryPrompt: `=== PLAYER CONFUSION RECOVERY (BINDING) ===
The player stated: "${complaint.playerInput.slice(0, 150)}"

Player is confused about the situation. Clarify what's happening now.

AUTHORITATIVE FACTS:
- Location: ${location}
- Who's here: ${present}
- What just happened: [Summarize last GM beat in one sentence]
- What this means: [One sentence of implication]

REQUIREMENTS:
1. One paragraph clarifying the current situation
2. Use concrete details from SNAPSHOT
3. Do not introduce new plot points
4. End with a clear question or call to action

Think "Where am I and what's happening?" not "Let me dump lore."
================================================`,
        restoreState: false,
      };
      
    case 'broken_context':
      return {
        action: 'acknowledge_error',
        recoveryPrompt: `=== CONTINUITY ERROR RECOVERY (BINDING) ===
The player stated: "${complaint.playerInput.slice(0, 150)}"

Player caught a continuity error. Acknowledge briefly and move forward.

REQUIREMENTS:
1. Brief in-fiction acknowledgment (3-4 words: "You're right" / "Noted" / "Fair point")
2. Soft retcon or clarification based on SNAPSHOT authority
3. Move forward without dwelling on the mistake
4. Maintain player agency - don't overwrite their stated facts

Do not meta-apologize or break the fourth wall. Just correct course smoothly.
================================================`,
        restoreState: true,
      };
      
    case 'repeated_content':
      return {
        action: 'regenerate_options',
        recoveryPrompt: `=== REPETITION RECOVERY (BINDING) ===
The player stated: "${complaint.playerInput.slice(0, 150)}"

Player noticed repeated content. Generate NEW details.

REQUIREMENTS:
1. Acknowledge briefly ("Right, moving on" / "Different angle")
2. Present NEW sensory details, not recycled from recent beats
3. Different word choices and sentence structures
4. Advance the situation - do not soft-reset the scene

Do not re-describe the same props, atmosphere, or NPCs. Find new angles or move the story forward.
================================================`,
        restoreState: false,
      };
      
    case 'out_of_character':
      return {
        action: 'acknowledge_error',
        recoveryPrompt: `=== CHARACTER CORRECTION RECOVERY (BINDING) ===
The player stated: "${complaint.playerInput.slice(0, 150)}"

Player is correcting character portrayal. Honor their authority over PC.

REQUIREMENTS:
1. Honor the player's correction as HIGHEST authority
2. Reframe the scene to match their stated character
3. Do not argue or justify the prior portrayal
4. Player defines their own character - you narrate consequences

The player is always right about their own character's nature, intentions, and boundaries.
================================================`,
        restoreState: false,
      };
      
    case 'rules_question':
      return {
        action: 'explain_rules',
        recoveryPrompt: `=== RULES EXPLANATION (BINDING) ===
The player asked: "${complaint.playerInput.slice(0, 150)}"

Player needs rules clarification. Answer concisely in-fiction when possible.

REQUIREMENTS:
1. Answer the specific question asked
2. Keep it brief (2-3 sentences)
3. Frame as in-world System knowledge when appropriate
4. After explaining, offer a concrete option to try the thing they asked about

Do not dump full mechanics. Just answer their question and let them try it.
================================================`,
        restoreState: false,
      };
  }
}

/**
 * Initialize narrative novelty budget.
 */
export function initNoveltyBudget(): NarrativeNoveltyBudget {
  return {
    recentSentences: new Map(),
    recentParagraphs: new Map(),
    bannedTopics: new Set(),
  };
}

/**
 * Check if a paragraph is too similar to recent content.
 */
export function checkParagraphNovelty(
  paragraph: string,
  budget: NarrativeNoveltyBudget,
  currentTurn: number,
  threshold: number = 0.85
): {
  novel: boolean;
  similarity?: number;
  matchingTurn?: number;
} {
  const fp = beatFingerprint(paragraph);
  
  // Check against recent paragraphs
  for (const [recentFp, turn] of budget.recentParagraphs.entries()) {
    // Only check last 20 turns
    if (currentTurn - turn > 20) continue;
    
    const similarity = beatSimilarity(fp, recentFp);
    if (similarity >= threshold) {
      return {
        novel: false,
        similarity,
        matchingTurn: turn,
      };
    }
  }
  
  return { novel: true };
}

/**
 * Check if a sentence has been recently used.
 */
export function checkSentenceNovelty(
  sentence: string,
  budget: NarrativeNoveltyBudget,
  currentTurn: number,
  windowSize: number = 20
): boolean {
  const normalized = sentence.toLowerCase().trim().slice(0, 100);
  const fp = beatFingerprint(normalized);
  
  for (const [recentFp, turn] of budget.recentSentences.entries()) {
    if (currentTurn - turn > windowSize) continue;
    
    const similarity = beatSimilarity(fp, recentFp);
    if (similarity >= 0.9) {
      return false; // Not novel - too similar to recent sentence
    }
  }
  
  return true;
}

/**
 * Update novelty budget after generating content.
 */
export function updateNoveltyBudget(
  content: string,
  currentTurn: number,
  budget: NarrativeNoveltyBudget
): NarrativeNoveltyBudget {
  const updated = { ...budget };
  
  // Split into paragraphs
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  for (const para of paragraphs) {
    const fp = beatFingerprint(para);
    updated.recentParagraphs.set(fp, currentTurn);
  }
  
  // Split into sentences
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  for (const sent of sentences) {
    if (sent.trim().length < 20) continue; // Skip very short sentences
    const fp = beatFingerprint(sent);
    updated.recentSentences.set(fp, currentTurn);
  }
  
  // Clean up old entries (>20 turns ago)
  const cleanedParagraphs = new Map();
  for (const [fp, turn] of updated.recentParagraphs.entries()) {
    if (currentTurn - turn <= 20) {
      cleanedParagraphs.set(fp, turn);
    }
  }
  updated.recentParagraphs = cleanedParagraphs;
  
  const cleanedSentences = new Map();
  for (const [fp, turn] of updated.recentSentences.entries()) {
    if (currentTurn - turn <= 20) {
      cleanedSentences.set(fp, turn);
    }
  }
  updated.recentSentences = cleanedSentences;
  
  return updated;
}

/**
 * Ban a topic from further exposition.
 */
export function banExpositionTopic(
  topic: string,
  budget: NarrativeNoveltyBudget
): NarrativeNoveltyBudget {
  const updated = { ...budget };
  updated.bannedTopics = new Set(updated.bannedTopics);
  updated.bannedTopics.add(topic.toLowerCase().trim());
  return updated;
}

/**
 * Check if a topic is banned.
 */
export function isTopicBanned(
  content: string,
  budget: NarrativeNoveltyBudget
): { banned: boolean; topic?: string } {
  const lower = content.toLowerCase();
  
  for (const topic of budget.bannedTopics) {
    if (lower.includes(topic)) {
      return { banned: true, topic };
    }
  }
  
  return { banned: false };
}

/**
 * Build novelty retry block for repeated content.
 */
export function buildNoveltyRetryBlock(
  similarity: number,
  matchingTurn: number
): string {
  return `=== NARRATIVE NOVELTY RETRY (BINDING) ===
Your prior paragraph is ${(similarity * 100).toFixed(0)}% similar to content from T${matchingTurn}.

REQUIREMENTS:
1. Write COMPLETELY NEW content
2. Different sensory focus (if visual before, try sound/smell/texture)
3. Different sentence structures
4. Different word choices
5. Advance the situation - do not soft-reset

Do not recycle:
- Same atmosphere descriptions
- Same NPC mannerisms
- Same prop descriptions
- Same emotional beats

Find a new angle or move the story forward.
================================================`;
}

/**
 * Telemetry for meta-recovery metrics.
 */
export interface MetaRecoveryTelemetry {
  turn: number;
  complaintsDetected: number;
  complaintTypes: MetaComplaintType[];
  recoveryActionsUsed: string[];
  noveltyViolations: number;
  bannedTopicHits: number;
}

/**
 * Track meta-recovery metrics for telemetry.
 */
export function trackMetaRecoveryMetrics(
  complaints: MetaComplaint[],
  recoveryActions: RecoveryAction[],
  noveltyViolations: number,
  bannedTopicHits: number,
  turn: number
): MetaRecoveryTelemetry {
  return {
    turn,
    complaintsDetected: complaints.length,
    complaintTypes: complaints.map(c => c.type),
    recoveryActionsUsed: recoveryActions.map(r => r.action),
    noveltyViolations,
    bannedTopicHits,
  };
}
