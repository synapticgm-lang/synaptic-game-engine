/** Forward-Progress Governor. */
import type { GameState, Quest, NpcMemory, FactionStanding } from './types';
import type { StateTx } from './stateTx';

export type ProgressDeltaKind =
  | 'quest_progress'
  | 'discovery'
  | 'access'
  | 'relationship'
  | 'threat'
  | 'resources'
  | 'character'
  | 'none';

export interface ProgressDelta {
  kind: ProgressDeltaKind;
  turn: number;
  summary: string;
  
  entity?: string;
  
  authority?: string;
}

export interface ProgressGovernorState {
  
  lastProgressTurn: number;
  
  recentDeltas: ProgressDelta[];
  
  turnsSinceProgress: number;
}


export function detectProgressDeltas(
  previous: GameState,
  next: GameState
): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  const turn = next.turn;

  const questDeltas = detectQuestDeltas(previous.quests ?? [], next.quests ?? [], turn);
  deltas.push(...questDeltas);

  const discoveryDeltas = detectDiscoveryDeltas(previous, next, turn);
  deltas.push(...discoveryDeltas);

  const accessDeltas = detectAccessDeltas(previous, next, turn);
  deltas.push(...accessDeltas);

  const relationshipDeltas = detectRelationshipDeltas(previous, next, turn);
  deltas.push(...relationshipDeltas);

  const threatDeltas = detectThreatDeltas(previous, next, turn);
  deltas.push(...threatDeltas);

  const resourceDeltas = detectResourceDeltas(next.stateTxLog ?? [], turn);
  deltas.push(...resourceDeltas);

  const characterDeltas = detectCharacterDeltas(previous, next, turn);
  deltas.push(...characterDeltas);

  return deltas;
}

function detectQuestDeltas(prevQuests: Quest[], nextQuests: Quest[], turn: number): ProgressDelta[] {
  const deltas: ProgressDelta[] = [];
  
  const prevMap = new Map(prevQuests.map(q => [q.id, q]));
  
  for (const q of nextQuests) {
    const prev = prevMap.get(q.id);
    
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
    
    if (prev.status !== q.status && (q.status === 'completed' || q.status === 'failed')) {
      deltas.push({
        kind: 'quest_progress',
        turn,
        summary: `Quest ${q.status}: ${q.name}`,
        entity: q.name,
        authority: `quest:${q.id}`,
      });
    }
    
    if (!prev.revealed && q.revealed) {
      deltas.push({
        kind: 'quest_progress',
        turn,
        summary: `Quest unlocked: ${q.name}`,
        entity: q.name,
        authority: `quest:${q.id}`,
      });
    }
    
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
  
  const newFacts = nextTimeline.slice(prevTimeline.length);
  for (const fact of newFacts) {
    if (/^(you (?:see|hear|smell|feel)|the (?:air|atmosphere|room))/i.test(fact.text)) continue;
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
  
  const prevNpcs = new Map((previous.npcMemories ?? []).map(n => [n.npcName, n]));
  for (const npc of next.npcMemories ?? []) {
    const prev = prevNpcs.get(npc.npcName);
    
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
    
    if (prev.disposition !== npc.disposition) {
      deltas.push({
        kind: 'relationship',
        turn,
        summary: `${npc.npcName} disposition: ${prev.disposition} → ${npc.disposition}`,
        entity: npc.npcName,
        authority: 'npc_memory',
      });
    }
    
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
  
  if (!previous.activeEncounter && next.activeEncounter) {
    deltas.push({
      kind: 'threat',
      turn,
      summary: `Combat: ${next.activeEncounter.name}`,
      entity: next.activeEncounter.name,
      authority: 'encounter',
    });
  }
  
  if (previous.activeEncounter && !next.activeEncounter) {
    deltas.push({
      kind: 'threat',
      turn,
      summary: `Defeated: ${previous.activeEncounter.name}`,
      entity: previous.activeEncounter.name,
      authority: 'encounter',
    });
  }
  
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


export function updateProgressGovernor(
  previous: GameState,
  next: GameState,
  prevGovernor: ProgressGovernorState
): ProgressGovernorState {
  const deltas = detectProgressDeltas(previous, next);
  
  const meaningfulDeltas = deltas.filter(d => d.kind !== 'none');
  
  if (meaningfulDeltas.length > 0) {
    return {
      lastProgressTurn: next.turn,
      recentDeltas: [...prevGovernor.recentDeltas, ...meaningfulDeltas].slice(-20),
      turnsSinceProgress: 0,
    };
  }
  
  return {
    ...prevGovernor,
    recentDeltas: prevGovernor.recentDeltas.slice(-20),
    turnsSinceProgress: prevGovernor.turnsSinceProgress + 1,
  };
}


export function initProgressGovernor(): ProgressGovernorState {
  return {
    lastProgressTurn: 0,
    recentDeltas: [],
    turnsSinceProgress: 0,
  };
}


export function hasActiveObjectives(state: GameState): boolean {
  const hasQuests = (state.quests ?? []).some(
    q => (q.status === 'active' || q.status === 'available') && q.revealed
  );
  if (hasQuests) return true;
  
  if (state.activeEncounter) return true;
  
  if (state.activeDungeon) return true;
  
  const hasOpenAsks = (state.campaignMemory?.consequences ?? []).some(c => c.unresolved);
  if (hasOpenAsks) return true;
  
  if (!state.openingEstablishment?.complete) return true;
  
  return false;
}
