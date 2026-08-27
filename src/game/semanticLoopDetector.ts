/**
 * P0.2 - Semantic Loop Detector + Context-Sensitive Escalation
 * 
 * Canonicalize intent as action type + target + purpose over last 8-12 turns.
 * Use proportional escalation ladder: warning → time/resource cost → NPC/world response 
 * → complication → crisis → combat when appropriate.
 * 
 * Not: Spawn combat after ≥5 identical text strings only.
 * 
 * Target:
 * - No semantic option family >25% of options in 50-turn window
 * - No non-progress window >5 turns during active objective
 * - Escalation is telegraphed, causally linked, and genre-appropriate
 */

import type { GameState, EngineMode } from './types';

export interface SemanticIntent {
  /** Canonical action type (inspect, ask, listen, travel, wait, attack, etc.) */
  action: string;
  /** Canonical target (person, object, location, etc.) */
  target: string;
  /** Implied purpose (gather_info, avoid_commitment, stall, explore, etc.) */
  purpose: string;
  /** Turn number */
  turn: number;
  /** Original player input */
  originalText: string;
}

export interface LoopDetectionResult {
  /** Is this a semantic loop? */
  isLoop: boolean;
  /** Number of similar intents in recent window */
  loopCount: number;
  /** The canonical intent being repeated */
  repeatedIntent?: SemanticIntent;
  /** Recommended escalation level (1-6) */
  escalationLevel: number;
  /** All recent intents for analysis */
  recentIntents: SemanticIntent[];
}

export interface EscalationResponse {
  /** Escalation level (1-6) */
  level: number;
  /** What kind of escalation to apply */
  kind: 'warning' | 'cost' | 'npc_response' | 'complication' | 'crisis' | 'combat';
  /** Specific mandate for the GM */
  mandate: string;
  /** Is this genre-appropriate for the current mode? */
  genreAppropriate: boolean;
}

/**
 * Canonicalize a player input into a semantic intent signature.
 */
export function canonicalizeIntent(input: string, turn: number): SemanticIntent {
  const lower = input.toLowerCase().trim();
  
  // Extract action
  let action = 'generic';
  if (/\b(inspect|examine|check|look at|study|investigate)\b/i.test(lower)) {
    action = 'inspect';
  } else if (/\b(ask|question|inquire|talk to|speak (?:to|with))\b/i.test(lower)) {
    action = 'ask';
  } else if (/\b(listen|eavesdrop|overhear)\b/i.test(lower)) {
    action = 'listen';
  } else if (/\b(wait|stand around|do nothing|observe silently)\b/i.test(lower)) {
    action = 'wait';
  } else if (/\b(walk away|leave|go another direction|exit)\b/i.test(lower)) {
    action = 'disengage';
  } else if (/\b(travel to|go to|head to|move to)\b/i.test(lower)) {
    action = 'travel';
  } else if (/\b(attack|fight|strike|hit)\b/i.test(lower)) {
    action = 'attack';
  } else if (/\b(search|look for|find)\b/i.test(lower)) {
    action = 'search';
  } else if (/\b(take|grab|pick up|acquire)\b/i.test(lower)) {
    action = 'take';
  } else if (/\b(use|equip|drink|eat|consume)\b/i.test(lower)) {
    action = 'use';
  } else if (/\b(read|browse|peruse)\b/i.test(lower)) {
    action = 'read';
  }
  
  // Extract target (simplified - look for key nouns)
  let target = 'environment';
  if (/\b(bag|pack|pockets?|inventory)\b/i.test(lower)) {
    target = 'bag';
  } else if (/\b(door|entrance|exit|gate)\b/i.test(lower)) {
    target = 'door';
  } else if (/\b(corner|table|bar|stall|market)\b/i.test(lower)) {
    target = 'ambient_location';
  } else if (/\b(person|someone|stranger|npc|they|them)\b/i.test(lower)) {
    target = 'person';
  } else if (/\b(earth|system|status|interface)\b/i.test(lower)) {
    target = 'meta';
  } else if (/\b(ground|floor|debris|surroundings?)\b/i.test(lower)) {
    target = 'ground';
  } else if (/\b(crowd|queue|group|people)\b/i.test(lower)) {
    target = 'crowd';
  } else {
    // Try to extract a specific noun
    const nounMatch = lower.match(/\b(the|a|an)\s+([a-z]+(?:\s+[a-z]+)?)\b/);
    if (nounMatch) {
      target = nounMatch[2];
    }
  }
  
  // Infer purpose
  let purpose = 'act';
  if (action === 'inspect' && target === 'ambient_location') {
    purpose = 'stall';
  } else if (action === 'wait' || action === 'listen') {
    purpose = 'avoid_commitment';
  } else if (action === 'ask' && /\b(earth|where am i|what is this)\b/i.test(lower)) {
    purpose = 'gather_meta_info';
  } else if (action === 'inspect' && target === 'bag') {
    purpose = 'inventory_check';
  } else if (action === 'disengage') {
    purpose = 'escape_interaction';
  } else if (action === 'travel') {
    purpose = 'explore';
  } else if (action === 'ask' || action === 'inspect') {
    purpose = 'gather_info';
  }
  
  return {
    action,
    target,
    purpose,
    turn,
    originalText: input.slice(0, 100),
  };
}

/**
 * Calculate semantic similarity between two intents.
 * Returns 0-1 score where 1 is identical.
 */
export function intentSimilarity(a: SemanticIntent, b: SemanticIntent): number {
  let score = 0;
  
  // Action match (most important)
  if (a.action === b.action) score += 0.5;
  
  // Target match
  if (a.target === b.target) score += 0.3;
  
  // Purpose match
  if (a.purpose === b.purpose) score += 0.2;
  
  return score;
}

/**
 * Detect semantic loops in recent player behavior.
 */
export function detectSemanticLoop(
  state: GameState,
  windowSize: number = 12
): LoopDetectionResult {
  const log = state.log ?? [];
  const recentIntents: SemanticIntent[] = [];
  
  // Extract recent player intents
  let count = 0;
  for (let i = log.length - 1; i >= 0 && count < windowSize; i--) {
    const entry = log[i];
    if (entry?.role === 'player' && entry.content) {
      const intent = canonicalizeIntent(entry.content, i);
      recentIntents.unshift(intent);
      count++;
    }
  }
  
  if (recentIntents.length < 3) {
    return {
      isLoop: false,
      loopCount: 0,
      escalationLevel: 0,
      recentIntents,
    };
  }
  
  // Check the most recent intent against previous intents
  const current = recentIntents[recentIntents.length - 1];
  let loopCount = 1;
  
  // Count similar intents in recent window
  for (let i = recentIntents.length - 2; i >= Math.max(0, recentIntents.length - 8); i--) {
    const similarity = intentSimilarity(current, recentIntents[i]);
    if (similarity >= 0.7) {
      loopCount++;
    }
  }
  
  // Determine if this is a loop
  const isLoop = loopCount >= 3;
  
  // Calculate escalation level based on loop count
  let escalationLevel = 0;
  if (loopCount >= 3) escalationLevel = 1; // Warning
  if (loopCount >= 4) escalationLevel = 2; // Cost
  if (loopCount >= 5) escalationLevel = 3; // NPC response
  if (loopCount >= 6) escalationLevel = 4; // Complication
  if (loopCount >= 7) escalationLevel = 5; // Crisis
  if (loopCount >= 8) escalationLevel = 6; // Combat (if appropriate)
  
  return {
    isLoop,
    loopCount,
    repeatedIntent: isLoop ? current : undefined,
    escalationLevel,
    recentIntents,
  };
}

/**
 * Build an escalation response appropriate for the genre and loop severity.
 */
export function buildEscalationResponse(
  detection: LoopDetectionResult,
  engineMode: EngineMode,
  activeObjective: boolean
): EscalationResponse | null {
  if (!detection.isLoop || detection.escalationLevel === 0) {
    return null;
  }
  
  const level = detection.escalationLevel;
  const intent = detection.repeatedIntent!;
  
  // Level 1: Warning
  if (level === 1) {
    return {
      level: 1,
      kind: 'warning',
      mandate: `LOOP DETECTED (${detection.loopCount}× ${intent.action} ${intent.target}): The player is repeating similar actions. Provide a gentle in-world signal that time is passing or opportunity is narrowing. Someone might grow impatient, an offer might start to expire, or ambient pressure might increase slightly.`,
      genreAppropriate: true,
    };
  }
  
  // Level 2: Time/Resource Cost
  if (level === 2) {
    return {
      level: 2,
      kind: 'cost',
      mandate: `STAGNATION COST (${detection.loopCount}× ${intent.action} ${intent.target}): The player's repetitive behavior must have a consequence. Time passes visibly, someone leaves or closes an offer, a resource depletes (stamina, daylight, crowd attention), or a deadline moves closer. Make the cost concrete and persistent.`,
      genreAppropriate: true,
    };
  }
  
  // Level 3: NPC/World Response
  if (level === 3) {
    const isLitRPG = engineMode === 'litrpg';
    const isDnD = engineMode === 'dnd';
    
    return {
      level: 3,
      kind: 'npc_response',
      mandate: `WORLD REACTS (${detection.loopCount}× ${intent.action} ${intent.target}): Someone or something in the world must respond to the player's stalling. ${isLitRPG ? 'An NPC challenges them, a System notification warns of inactivity penalty, or a faction takes notice.' : isDnD ? 'An NPC grows suspicious or impatient, a patrol approaches, or ambient danger escalates.' : 'A character acts on their own agenda, an opportunity vanishes, or pressure increases.'} The world is not paused.`,
      genreAppropriate: true,
    };
  }
  
  // Level 4: Complication
  if (level === 4) {
    return {
      level: 4,
      kind: 'complication',
      mandate: `FORCED COMPLICATION (${detection.loopCount}× ${intent.action} ${intent.target}): The player's inaction has created a persistent problem. A quest deadline fails, an NPC relationship sours, a location becomes hostile, an opportunity closes permanently, or a new obstacle emerges. This complication must persist beyond this turn and require the player to adapt their approach.`,
      genreAppropriate: true,
    };
  }
  
  // Level 5: Crisis
  if (level === 5) {
    const isLitRPG = engineMode === 'litrpg';
    const isDnD = engineMode === 'dnd';
    const isPyoa = engineMode === 'pyoa';
    
    return {
      level: 5,
      kind: 'crisis',
      mandate: `CRISIS INTERRUPT (${detection.loopCount}× ${intent.action} ${intent.target}): The player's extended stalling has triggered a crisis. ${isLitRPG ? 'A stronger threat appears, a faction acts against them, or a major quest path closes.' : isDnD ? 'Combat initiates, an ambush springs, or a major ally abandons them.' : isPyoa ? 'A critical choice point arrives with irreversible consequences, or the story forks based on their inaction.' : 'A major turning point forces immediate action.'} Telegraph the crisis briefly, then present clear stakes and choices.`,
      genreAppropriate: true,
    };
  }
  
  // Level 6: Combat (genre-appropriate)
  if (level === 6) {
    const isLitRPG = engineMode === 'litrpg';
    const isDnD = engineMode === 'dnd';
    const isPyoa = engineMode === 'pyoa';
    const isRpg = engineMode === 'rpg';
    
    // PYOA and Story RPG don't use combat as escalation
    if (isPyoa || isRpg) {
      return {
        level: 6,
        kind: 'crisis',
        mandate: `FORCED TURNING POINT (${detection.loopCount}× ${intent.action} ${intent.target}): The player has stalled beyond the breaking point. ${isPyoa ? 'The story branches irreversibly - their inaction becomes a choice that closes paths and opens others. Present the consequences as a dramatic turning point with no going back.' : 'A major relationship breaks, a critical opportunity passes forever, or the story advances without them making a key decision. Show them what they lost.'}`,
        genreAppropriate: true,
      };
    }
    
    // LitRPG and DnD can use combat
    const genreAppropriate = activeObjective && (isLitRPG || isDnD);
    
    return {
      level: 6,
      kind: 'combat',
      mandate: `FORCED ENCOUNTER (${detection.loopCount}× ${intent.action} ${intent.target}): The player's extended stalling has triggered combat. ${isLitRPG ? 'A hostile mob attacks, a zone timer expires into spawns, or their loitering attracts aggressive NPCs.' : isDnD ? 'An ambush triggers, a patrol engages, or their suspicious behavior provokes an attack.' : 'Danger forces immediate action.'} This encounter must be causally linked to their location and behavior - not a random spawn. Telegraph briefly, then initiate combat.`,
      genreAppropriate,
    };
  }
  
  return null;
}

/**
 * Calculate semantic diversity in recent choice sets.
 * Returns the percentage of options that belong to the most common semantic family.
 */
export function calculateChoiceDiversity(
  recentChoiceSets: Array<{ turn: number; choices: string[] }>,
  windowSize: number = 50
): {
  maxFamilyPercentage: number;
  dominantFamily: string;
  analysis: string;
} {
  const recent = recentChoiceSets.slice(-windowSize);
  if (recent.length === 0) {
    return {
      maxFamilyPercentage: 0,
      dominantFamily: 'none',
      analysis: 'No recent choices to analyze',
    };
  }
  
  // Count action types across all choices
  const actionCounts = new Map<string, number>();
  let totalChoices = 0;
  
  for (const set of recent) {
    for (const choice of set.choices) {
      totalChoices++;
      const intent = canonicalizeIntent(choice, set.turn);
      const family = `${intent.action}_${intent.target}`;
      actionCounts.set(family, (actionCounts.get(family) || 0) + 1);
    }
  }
  
  if (totalChoices === 0) {
    return {
      maxFamilyPercentage: 0,
      dominantFamily: 'none',
      analysis: 'No choices in recent window',
    };
  }
  
  // Find the most common family
  let maxCount = 0;
  let dominantFamily = 'none';
  
  for (const [family, count] of actionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantFamily = family;
    }
  }
  
  const maxFamilyPercentage = (maxCount / totalChoices) * 100;
  
  return {
    maxFamilyPercentage,
    dominantFamily,
    analysis: `${dominantFamily} appears in ${maxFamilyPercentage.toFixed(1)}% of recent choices (${maxCount}/${totalChoices})`,
  };
}

/**
 * Format escalation mandate for inclusion in situation packet.
 */
export function formatEscalationMandate(response: EscalationResponse): string {
  return `ESCALATION (Level ${response.level} - ${response.kind.toUpperCase()}): ${response.mandate}`;
}

/**
 * Telemetry for loop detection metrics.
 */
export interface LoopDetectionTelemetry {
  turn: number;
  loopDetected: boolean;
  loopCount: number;
  escalationLevel: number;
  escalationKind: string;
  repeatedAction: string;
  repeatedTarget: string;
  repeatedPurpose: string;
}

/**
 * Track loop detection metrics for telemetry.
 */
export function trackLoopMetrics(
  detection: LoopDetectionResult,
  escalation: EscalationResponse | null,
  turn: number
): LoopDetectionTelemetry {
  return {
    turn,
    loopDetected: detection.isLoop,
    loopCount: detection.loopCount,
    escalationLevel: escalation?.level ?? 0,
    escalationKind: escalation?.kind ?? 'none',
    repeatedAction: detection.repeatedIntent?.action ?? 'none',
    repeatedTarget: detection.repeatedIntent?.target ?? 'none',
    repeatedPurpose: detection.repeatedIntent?.purpose ?? 'none',
  };
}
