/**
 * P0.0 - Forward-Progress Governor (Manus #1 priority)
 * 
 * Guarantee meaningful persistent state change every 3-5 turns during active objectives.
 * State changes: quest stage, discovered knowledge, location access, NPC relationships,
 * threat state, resources, character condition.
 * 
 * Must not just change the scene - must change campaign state.
 */

import type { GameState, Quest, NpcMemory, FactionStanding, StateTx } from './types';

export type ProgressDeltaKind =
  | 'quest_progress'      // Quest stage, obstacle resolved, deadline worsened, objective failed/unlocked
  | 'discovery'           // New actionable fact discovered and recorded (not repeated inspection)
  | 'access'              // Route opened, area closed, position materially changed, travel cost paid
  | 'relationship'        // NPC relationship, commitment, suspicion, availability, faction position, condition
  | 'threat'              // Threat escalated, avoided at cost, resolved, created persistent complication
  | 'resources'           // Item consumed/acquired/lost, health/time changed, debt incurred, leverage gained
  | 'character'           // Character condition, ability state, reputation, injury, meaningful progression
  | 'none';               // No meaningful delta detected

export interface ProgressDelta {
  kind: ProgressDeltaKind;
  turn: number;
  summary: string;
  /** What changed (quest name, NPC name, location, etc.) */
  entity?: string;
  /** Ledger authority (stateTx id, quest id, timeline entry, etc.) */
  authority?: string;
}

export interface ProgressGovernorState {
  /** Last turn with a meaningful delta */
  lastProgressTurn: number;
  /** Recent deltas for tracking */
  recentDeltas: ProgressDelta[];
  /** Turns since last meaningful progress */
  turnsSinceProgress: number;
}

/**
 * Calculate meaningful progress deltas between two game states.
 */
export function detectProgressDeltas(
  previous: GameState,
  next: GameState
): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  const turn = next.turn;

  // Quest progress: stage changes, objectives completed, new quests revealed
  const questDeltas = detectQuestDeltas(previous.quests ?? [], next.quests ?? [], turn);
  deltas.push(...questDeltas);

  // Discovery: new timeline facts (excluding pure atmosphere)
  const discoveryDeltas = detectDiscoveryDeltas(previous, next, turn);
  deltas.push(...discoveryDeltas);

  // Access: location changes, new places discovered
  const accessDeltas = detectAccessDeltas(previous, next, turn);
  deltas.push(...accessDeltas);

  // Relationship: NPC memory changes, faction standing changes
  const relationshipDeltas = detectRelationshipDeltas(previous, next, turn);
  deltas.push(...relationshipDeltas);

  // Threat: combat state changes, encounter spawns/defeats
  const threatDeltas = detectThreatDeltas(previous, next, turn);
  deltas.push(...threatDeltas);

  // Resources: inventory, HP, MP changes (from stateTx)
  const resourceDeltas = detectResourceDeltas(next.stateTxLog ?? [], turn);
  deltas.push(...resourceDeltas);

  // Character: level, abilities, conditions
  const characterDeltas = detectCharacterDeltas(previous, next, turn);
  deltas.push(...characterDeltas);

  return deltas;
}

function detectQuestDeltas(prevQuests: Quest[], nextQuests: Quest[], turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  const prevMap = new Map(prevQuests.map(q => [q.id, q]));
  
  for (const q of nextQuests) {
    const prev = prevMap.get(q.id);
    
    // New quest revealed
    if (!prev && q.revealed && q.status !== 'hidden') {
      deltas.push({
        kind: 'quest_progress',
        turn,
        summary: `New quest revealed: ${q.name}`,
        entity: q.name,
        authority: `quest:${q.id}`,
      });
      continue;
    }
    
    if (!prev) continue;
    
    // Quest status change
    if (prev.status !== q.status && (q.status === 'completed' || q.status === 'failed')) {
      deltas.push({
        kind: 'quest_progress',
        turn,
        summary: `Quest ${q.status}: ${q.name}`,
        entity: q.name,
        authority: `quest:${q.id}`,
      });
    }
    
    // Quest revealed
    if (!prev.revealed && q.revealed) {
      deltas.push({
        kind: 'quest_progress',
        turn,
        summary: `Quest unlocked: ${q.name}`,
        entity: q.name,
        authority: `quest:${q.id}`,
      });
    }
    
    // Objectives completed
    const prevCompleted = (prev.objectives ?? []).filter(o => o.completed).length;
    const nextCompleted = (q.objectives ?? []).filter(o => o.completed).length;
    if (nextCompleted > prevCompleted) {
      deltas.push({
        kind: 'quest_progress',
        turn,
        summary: `Quest objective completed: ${q.name}`,
        entity: q.name,
        authority: `quest:${q.id}`,
      });
    }
  }
  
  return deltas;
}

function detectDiscoveryDeltas(previous: GameState, next: GameState, turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  const prevTimeline = previous.timeline ?? [];
  const nextTimeline = next.timeline ?? [];
  
  // New timeline facts (excluding atmosphere-only entries)
  const newFacts = nextTimeline.slice(prevTimeline.length);
  for (const fact of newFacts) {
    // Skip pure atmosphere entries
    if (/^(you (?:see|hear|smell|feel)|the (?:air|atmosphere|room))/i.test(fact.text)) continue;
    // Skip repeated inspection of the same thing
    if (prevTimeline.some(f => f.text.toLowerCase().includes(fact.text.toLowerCase().slice(0, 30)))) continue;
    
    deltas.push({
      kind: 'discovery',
      turn,
      summary: `Discovered: ${fact.text.slice(0, 80)}`,
      entity: fact.kind,
      authority: `timeline:${fact.turn}`,
    });
  }
  
  return deltas;
}

function detectAccessDeltas(previous: GameState, next: GameState, turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  // Location change
  const prevLoc = (previous.currentLocation ?? '').trim();
  const nextLoc = (next.currentLocation ?? '').trim();
  if (nextLoc && nextLoc !== prevLoc) {
    deltas.push({
      kind: 'access',
      turn,
      summary: `Moved to ${nextLoc}`,
      entity: nextLoc,
      authority: 'location',
    });
  }
  
  // New places discovered
  const prevPlaces = new Set((previous.places ?? []).map(p => p.id));
  const newPlaces = (next.places ?? []).filter(p => !prevPlaces.has(p.id));
  for (const place of newPlaces.slice(0, 2)) {
    deltas.push({
      kind: 'access',
      turn,
      summary: `Discovered location: ${place.name}`,
      entity: place.name,
      authority: `place:${place.id}`,
    });
  }
  
  // Dungeon progress (new rooms visited)
  const prevVisited = new Set(previous.activeDungeon?.visitedNodeIds ?? []);
  const nextVisited = new Set(next.activeDungeon?.visitedNodeIds ?? []);
  const newRooms = [...nextVisited].filter(id => !prevVisited.has(id));
  if (newRooms.length > 0) {
    deltas.push({
      kind: 'access',
      turn,
      summary: `Explored ${newRooms.length} new room(s)`,
      authority: 'dungeon',
    });
  }
  
  return deltas;
}

function detectRelationshipDeltas(previous: GameState, next: GameState, turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  // NPC memory changes
  const prevNpcs = new Map((previous.npcMemories ?? []).map(n => [n.npcName, n]));
  for (const npc of next.npcMemories ?? []) {
    const prev = prevNpcs.get(npc.npcName);
    
    // New NPC met
    if (!prev) {
      deltas.push({
        kind: 'relationship',
        turn,
        summary: `Met NPC: ${npc.npcName}`,
        entity: npc.npcName,
        authority: 'npc_memory',
      });
      continue;
    }
    
    // Disposition changed
    if (prev.disposition !== npc.disposition) {
      deltas.push({
        kind: 'relationship',
        turn,
        summary: `${npc.npcName} disposition: ${prev.disposition} → ${npc.disposition}`,
        entity: npc.npcName,
        authority: 'npc_memory',
      });
    }
    
    // New facts learned
    if ((npc.facts ?? []).length > (prev.facts ?? []).length) {
      deltas.push({
        kind: 'relationship',
        turn,
        summary: `Learned about ${npc.npcName}`,
        entity: npc.npcName,
        authority: 'npc_memory',
      });
    }
  }
  
  // Faction standing changes
  const prevFactions = new Map((previous.worldLedger?.factionStandings ?? []).map(f => [f.name, f]));
  for (const faction of next.worldLedger?.factionStandings ?? []) {
    const prev = prevFactions.get(faction.name);
    if (!prev) {
      deltas.push({
        kind: 'relationship',
        turn,
        summary: `Faction encountered: ${faction.name}`,
        entity: faction.name,
        authority: 'faction',
      });
      continue;
    }
    
    if (prev.standing !== faction.standing) {
      deltas.push({
        kind: 'relationship',
        turn,
        summary: `${faction.name} standing: ${prev.standing} → ${faction.standing}`,
        entity: faction.name,
        authority: 'faction',
      });
    }
  }
  
  return deltas;
}

function detectThreatDeltas(previous: GameState, next: GameState, turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  // Combat started
  if (!previous.activeEncounter && next.activeEncounter) {
    deltas.push({
      kind: 'threat',
      turn,
      summary: `Combat: ${next.activeEncounter.name}`,
      entity: next.activeEncounter.name,
      authority: 'encounter',
    });
  }
  
  // Combat resolved
  if (previous.activeEncounter && !next.activeEncounter) {
    deltas.push({
      kind: 'threat',
      turn,
      summary: `Defeated: ${previous.activeEncounter.name}`,
      entity: previous.activeEncounter.name,
      authority: 'encounter',
    });
  }
  
  // Significant HP loss (≥ 20% of max)
  const prevHp = previous.character?.hp ?? 0;
  const nextHp = next.character?.hp ?? 0;
  const maxHp = next.character?.maxHp ?? 100;
  if (prevHp - nextHp >= maxHp * 0.2) {
    deltas.push({
      kind: 'threat',
      turn,
      summary: `Took significant damage: ${prevHp - nextHp} HP`,
      authority: 'combat',
    });
  }
  
  return deltas;
}

function detectResourceDeltas(stateTxLog: StateTx[], turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  // Get recent transactions from this turn
  const recentTx = stateTxLog.filter(tx => tx.turn === turn);
  
  for (const tx of recentTx) {
    switch (tx.kind) {
      case 'inventory_gain':
        deltas.push({
          kind: 'resources',
          turn,
          summary: tx.summary,
          entity: tx.entity,
          authority: `tx:${tx.id}`,
        });
        break;
      case 'inventory_lose':
        deltas.push({
          kind: 'resources',
          turn,
          summary: tx.summary,
          entity: tx.entity,
          authority: `tx:${tx.id}`,
        });
        break;
      case 'hp':
        // Only count significant HP changes (already covered in threat)
        if (Math.abs(parseInt(tx.summary.replace(/[^0-9-]/g, '')) || 0) >= 10) {
          deltas.push({
            kind: 'resources',
            turn,
            summary: tx.summary,
            authority: `tx:${tx.id}`,
          });
        }
        break;
      case 'mp':
        deltas.push({
          kind: 'resources',
          turn,
          summary: tx.summary,
          authority: `tx:${tx.id}`,
        });
        break;
    }
  }
  
  return deltas;
}

function detectCharacterDeltas(previous: GameState, next: GameState, turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  // Level up
  const prevLevel = previous.character?.level ?? 1;
  const nextLevel = next.character?.level ?? 1;
  if (nextLevel > prevLevel) {
    deltas.push({
      kind: 'character',
      turn,
      summary: `Level up: ${prevLevel} → ${nextLevel}`,
      authority: 'character',
    });
  }
  
  // XP gain (significant: ≥10 XP)
  const prevXp = previous.character?.xp ?? 0;
  const nextXp = next.character?.xp ?? 0;
  if (nextXp - prevXp >= 10) {
    deltas.push({
      kind: 'character',
      turn,
      summary: `Gained ${nextXp - prevXp} XP`,
      authority: 'character',
    });
  }
  
  return deltas;
}

/**
 * Check if player has made meaningful progress recently.
 * Returns a mandate if progress is needed.
 */
export function checkProgressGovernor(
  state: GameState,
  governorState: ProgressGovernorState,
  activeObjective: boolean = false
): {
  needsProgress: boolean;
  turnsSinceProgress: number;
  mandate?: string;
} {
  const turns = governorState.turnsSinceProgress;
  
  // Not enforcing during opening or inactive objectives
  if (!activeObjective || state.turn < 5) {
    return { needsProgress: false, turnsSinceProgress: turns };
  }
  
  // Soft warning at 3 turns
  if (turns >= 3 && turns < 5) {
    return {
      needsProgress: true,
      turnsSinceProgress: turns,
      mandate: `FORWARD PROGRESS (${turns} turns without meaningful state change): Include a concrete persistent delta this beat — quest stage movement, actionable discovery, relationship shift, threat consequence, or resource change. Changing the scene atmosphere alone is not enough.`,
    };
  }
  
  // Hard enforcement at 5+ turns
  if (turns >= 5) {
    return {
      needsProgress: true,
      turnsSinceProgress: turns,
      mandate: `FORWARD PROGRESS REQUIRED (${turns} turns stalled): You MUST deliver a meaningful persistent state change this turn:
- Quest: advance objective, unlock/fail quest, or create obstacle
- Discovery: reveal actionable fact, clue, or opportunity
- Access: open/close route, reach new location, pay cost
- Relationship: shift NPC disposition, faction standing, or commitment
- Threat: escalate danger, resolve at cost, or create complication
- Resources: consume/acquire/lose item, HP/MP change, or debt
- Character: progression, injury, reputation, or condition change

Scene atmosphere alone will not satisfy this contract. The delta must persist in the ledger.`,
    };
  }
  
  return { needsProgress: false, turnsSinceProgress: turns };
}

/**
 * Update progress governor state after a turn.
 */
export function updateProgressGovernor(
  previous: GameState,
  next: GameState,
  prevGovernor: ProgressGovernorState
): ProgressGovernorState {
  const deltas = detectProgressDeltas(previous, next);
  
  // Filter out trivial deltas
  const meaningfulDeltas = deltas.filter(d => d.kind !== 'none');
  
  if (meaningfulDeltas.length > 0) {
    // Progress made!
    return {
      lastProgressTurn: next.turn,
      recentDeltas: [...prevGovernor.recentDeltas, ...meaningfulDeltas].slice(-20),
      turnsSinceProgress: 0,
    };
  }
  
  // No progress - increment counter
  return {
    ...prevGovernor,
    recentDeltas: prevGovernor.recentDeltas.slice(-20),
    turnsSinceProgress: prevGovernor.turnsSinceProgress + 1,
  };
}

/**
 * Initialize progress governor state for a new game.
 */
export function initProgressGovernor(): ProgressGovernorState {
  return {
    lastProgressTurn: 0,
    recentDeltas: [],
    turnsSinceProgress: 0,
  };
}

/**
 * Check if state has any active objectives requiring progress.
 */
export function hasActiveObjectives(state: GameState): boolean {
  // Has active/available quests
  const hasQuests = (state.quests ?? []).some(
    q => (q.status === 'active' || q.status === 'available') && q.revealed
  );
  if (hasQuests) return true;
  
  // In combat
  if (state.activeEncounter) return true;
  
  // In dungeon
  if (state.activeDungeon) return true;
  
  // Has open asks or unresolved consequences
  const hasOpenAsks = (state.campaignMemory?.consequences ?? []).some(c => c.unresolved);
  if (hasOpenAsks) return true;
  
  // Opening not complete
  if (!state.openingEstablishment?.complete) return true;
  
  return false;
}
