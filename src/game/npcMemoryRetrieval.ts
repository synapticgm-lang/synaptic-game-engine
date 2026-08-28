/**
 * WS-2 Wave C: NPC Memory Retrieval and Scoring
 * 
 * Deterministic memory selection for situation packets with:
 * - Relevance scoring (pinned, unresolved, obligation, topic, actor, faction, recency)
 * - Stable tie-breaks (event ID, turn ascending)
 * - Mandatory/forbidden memory rails
 * - Grounding verification
 * 
 * Architecture:
 * - Scores all memories for current situation
 * - Selects top N with stable ordering
 * - Enforces mandatory inclusions
 * - Excludes forbidden events
 */

import type { GameState } from './types';
import type { NpcMemoryLedger, KeyMoment } from './npcMemoryLedger';

export interface MemoryRelevanceScore {
  memoryId: string;
  score: number;
  signals: {
    pinned: number;
    unresolved: number;
    obligation: number;
    topic: number;
    actor: number;
    faction: number;
    recency: number;
  };
}

export interface MemorySelection {
  selected: KeyMoment[];
  mandatory: KeyMoment[];
  forbidden: string[];
  scores: MemoryRelevanceScore[];
  totalEvaluated: number;
}

export interface MemoryGroundingCheck {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingEvidenceIds: string[];
}

// ============================================================================
// Relevance Scoring
// ============================================================================

/**
 * Wave C: Score memory relevance for current situation
 */
export function scoreMemoryRelevance(
  memory: KeyMoment,
  context: {
    currentNpc?: string;
    currentTopic?: string;
    activeFactions?: string[];
    activeQuests?: string[];
    currentTurn: number;
    unresolved Obligations?: string[];
  }
): MemoryRelevanceScore {
  const signals = {
    pinned: 0,
    unresolved: 0,
    obligation: 0,
    topic: 0,
    actor: 0,
    faction: 0,
    recency: 0
  };
  
  // Pinned memories (highest priority)
  if (memory.retention === 'permanent' || memory.category === 'first_meet') {
    signals.pinned = 100;
  }
  
  // Unresolved obligations
  if (context.unresolvedObligations?.includes(memory.actorId)) {
    signals.unresolved = 80;
  }
  
  // Obligation-related memories
  if (memory.category === 'quest_disposition' || memory.category === 'role_change') {
    signals.obligation = 60;
  }
  
  // Topic relevance
  if (context.currentTopic && memory.topicId?.includes(context.currentTopic)) {
    signals.topic = 50;
  }
  
  // Actor relevance
  if (context.currentNpc && memory.actorId === context.currentNpc) {
    signals.actor = 40;
  }
  
  // Faction relevance
  if (context.activeFactions && memory.factionId && 
      context.activeFactions.includes(memory.factionId)) {
    signals.faction = 30;
  }
  
  // Recency (decay over time)
  const turnsAge = context.currentTurn - memory.turn;
  signals.recency = Math.max(0, 20 - (turnsAge * 0.5));
  
  const totalScore = Object.values(signals).reduce((sum, v) => sum + v, 0);
  
  return {
    memoryId: memory.id,
    score: totalScore,
    signals
  };
}

/**
 * Wave C: Stable tie-break using event ID
 */
function stableTieBreak(a: MemoryRelevanceScore, b: MemoryRelevanceScore): number {
  if (a.score !== b.score) {
    return b.score - a.score; // Higher score first
  }
  
  // Stable: lexicographic event ID
  return a.memoryId.localeCompare(b.memoryId);
}

// ============================================================================
// Memory Selection
// ============================================================================

/**
 * Wave C: Select memories for situation packet
 */
export function selectMemoriesForPacket(
  ledger: NpcMemoryLedger,
  context: {
    currentNpc?: string;
    currentTopic?: string;
    activeFactions?: string[];
    activeQuests?: string[];
    currentTurn: number;
    unresolvedObligations?: string[];
    mandatoryMemoryIds?: string[];
    forbiddenEventIds?: string[];
    maxMemories?: number;
  }
): MemorySelection {
  const maxMemories = context.maxMemories ?? 8;
  const mandatoryIds = new Set(context.mandatoryMemoryIds ?? []);
  const forbiddenIds = new Set(context.forbiddenEventIds ?? []);
  
  // Score all memories
  const allScores: MemoryRelevanceScore[] = [];
  const allMemories: KeyMoment[] = [];
  
  for (const memory of ledger.memories) {
    // Skip forbidden
    if (forbiddenIds.has(memory.id)) {
      continue;
    }
    
    allMemories.push(memory);
    const score = scoreMemoryRelevance(memory, context);
    allScores.push(score);
  }
  
  // Sort by score (stable)
  const sorted = allScores.sort(stableTieBreak);
  
  // Separate mandatory from optional
  const mandatoryMemories: KeyMoment[] = [];
  const optionalScores: MemoryRelevanceScore[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const score = sorted[i];
    const memory = allMemories.find(m => m.id === score.memoryId);
    
    if (!memory) continue;
    
    if (mandatoryIds.has(memory.id)) {
      mandatoryMemories.push(memory);
    } else {
      optionalScores.push(score);
    }
  }
  
  // Select top optional memories (fill remaining slots)
  const remainingSlots = maxMemories - mandatoryMemories.length;
  const selectedOptional = optionalScores
    .slice(0, Math.max(0, remainingSlots))
    .map(score => allMemories.find(m => m.id === score.memoryId)!)
    .filter(Boolean);
  
  const selected = [...mandatoryMemories, ...selectedOptional];
  
  return {
    selected,
    mandatory: mandatoryMemories,
    forbidden: Array.from(forbiddenIds),
    scores: sorted,
    totalEvaluated: allMemories.length
  };
}

// ============================================================================
// Grounding Verification
// ============================================================================

/**
 * Wave C: Verify GM output is grounded in provided memories
 */
export function verifyMemoryGrounding(
  gmOutput: string,
  providedMemories: KeyMoment[]
): MemoryGroundingCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingEvidenceIds: string[] = [];
  
  const providedIds = new Set(providedMemories.map(m => m.id));
  const providedActors = new Set(providedMemories.map(m => m.actorId));
  
  // Extract memory reference patterns from GM output
  // Simplified - real implementation would use more sophisticated NLP
  const memoryReferencePatterns = [
    /remember(?:s|ed)?\s+(?:when|that)\s+([A-Z][a-z]+)/g,
    /(?:first\s+met|encountered)\s+([A-Z][a-z]+)/g,
    /([A-Z][a-z]+)\s+(?:betrayed|helped|saved|told)/g
  ];
  
  const referencedActors = new Set<string>();
  
  for (const pattern of memoryReferencePatterns) {
    let match;
    while ((match = pattern.exec(gmOutput)) !== null) {
      referencedActors.add(match[1]);
    }
  }
  
  // Check if referenced actors have memories in packet
  for (const actor of referencedActors) {
    if (!providedActors.has(actor)) {
      warnings.push(`GM references ${actor} but no memory of ${actor} in packet`);
    }
  }
  
  // Check for memory leak patterns
  const leakPatterns = [
    /you (?:don't|can't|won't) remember/i,
    /(?:forgot|forgotten) about/i,
    /never met (?:before|previously)/i
  ];
  
  for (const pattern of leakPatterns) {
    if (pattern.test(gmOutput)) {
      errors.push(`GM claims memory gap but memories exist: "${gmOutput.match(pattern)?.[0]}"`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingEvidenceIds
  };
}

/**
 * Wave C: Build NPC packet for situation
 */
export function buildNpcPacket(
  npcId: string,
  gs: GameState,
  context: {
    includeFull Memories?: boolean;
    includeObligations?: boolean;
    includeTopics?: boolean;
  }
): {
  npcId: string;
  role?: string;
  lifecycleState?: string;
  activeObligation?: string;
  topicModes?: string[];
  keyMemories: KeyMoment[];
  recentMemories: KeyMoment[];
  mandatoryEvidenceIds: string[];
  forbiddenEventIds: string[];
} {
  const ledger = gs.arcDirector?.npcMemories?.find(m => m.npcId === npcId);
  
  if (!ledger) {
    return {
      npcId,
      keyMemories: [],
      recentMemories: [],
      mandatoryEvidenceIds: [],
      forbiddenEventIds: []
    };
  }
  
  // Get lifecycle state
  const lifecycle = gs.arcDirector?.npcLifecycles?.find(l => l.npcId === npcId);
  
  // Select memories
  const selection = selectMemoriesForPacket(ledger, {
    currentNpc: npcId,
    currentTurn: gs.turn,
    maxMemories: context.includeFullMemories ? 10 : 5
  });
  
  // Split key vs recent
  const keyMemories = selection.selected.filter(m =>
    m.retention === 'permanent' ||
    m.category === 'first_meet' ||
    m.category === 'betrayal' ||
    m.category === 'death'
  );
  
  const recentMemories = selection.selected.filter(m =>
    !keyMemories.includes(m)
  ).slice(0, 3);
  
  return {
    npcId,
    role: lifecycle?.role,
    lifecycleState: lifecycle?.state,
    activeObligation: lifecycle?.debtSatisfied ? undefined : 'pending',
    topicModes: [], // Placeholder
    keyMemories,
    recentMemories,
    mandatoryEvidenceIds: selection.mandatory.map(m => m.id),
    forbiddenEventIds: selection.forbidden
  };
}

/**
 * Wave C: Format NPC packet for situation section
 */
export function formatNpcPacketSection(
  packet: ReturnType<typeof buildNpcPacket>
): string {
  const lines: string[] = [
    `### NPC: ${packet.npcId}`,
    ''
  ];
  
  if (packet.role) {
    lines.push(`**Role:** ${packet.role}`);
  }
  
  if (packet.lifecycleState) {
    lines.push(`**State:** ${packet.lifecycleState}`);
  }
  
  if (packet.activeObligation) {
    lines.push(`**Obligation:** ${packet.activeObligation}`);
  }
  
  if (packet.keyMemories.length > 0) {
    lines.push('', '**Key Memories:**');
    for (const memory of packet.keyMemories) {
      lines.push(`- T${memory.turn}: ${memory.summary}`);
    }
  }
  
  if (packet.recentMemories.length > 0) {
    lines.push('', '**Recent Interactions:**');
    for (const memory of packet.recentMemories) {
      lines.push(`- T${memory.turn}: ${memory.summary}`);
    }
  }
  
  if (packet.mandatoryEvidenceIds.length > 0) {
    lines.push('', '**MANDATORY GROUNDING:** Claims about this NPC must reference:', 
      ...packet.mandatoryEvidenceIds.map(id => `- ${id}`));
  }
  
  return lines.join('\n');
}
