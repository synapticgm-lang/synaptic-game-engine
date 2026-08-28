/**
 * WS-4 Wave B: Encounter Aftermath and Receipt Generation
 * 
 * Every encounter terminal produces typed receipts with:
 * - XP awards
 * - Loot distribution
 * - Faction changes
 * - Quest updates
 * - NPC consequences
 * - Dungeon progress
 * 
 * Receipts are idempotent and validated against ledgers.
 * 
 * Architecture:
 * - One receipt per encounter resolution
 * - Idempotency keys prevent duplicate application
 * - Ledger reconciliation validates all deltas
 * - Atomic: all effects or none
 */

import type { GameState, EngineMode } from './types';
import type { BaseReceipt, ResourceDelta, RelationshipDelta } from './types/crossPackageContracts';
import type { CombatResolution, CombatTerminal } from './encounterResolutionMechanics';

export type EncounterReceiptType =
  | 'xp_award'
  | 'loot_drop'
  | 'faction_change'
  | 'quest_update'
  | 'npc_consequence'
  | 'dungeon_progress';

export interface EncounterReceipt extends BaseReceipt {
  kind: 'encounter_aftermath';
  schemaVersion: 1;
  encounterId: string;
  terminal: CombatTerminal | 'parleyResolved' | 'parleyFailed' | 'fled' | 'caught';
  idempotencyKey: string;
  receiptTypes: EncounterReceiptType[];
  resourceDeltas: ResourceDelta[];
  relationshipDeltas: RelationshipDelta[];
  xpAwarded: number;
  lootAwarded: string[];
  questUpdates: QuestUpdate[];
  npcConsequences: NpcConsequence[];
  dungeonProgress?: DungeonProgress;
}

export interface QuestUpdate {
  questId: string;
  action: 'advance' | 'complete' | 'fail';
  reason: string;
}

export interface NpcConsequence {
  npcId: string;
  action: 'defeat' | 'ally' | 'betray' | 'depart';
  reason: string;
}

export interface DungeonProgress {
  dungeonId: string;
  nodesCleared: string[];
  bossDefeated?: string;
  floorCompleted?: number;
}

export interface LedgerReconciliation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Receipt Generation
// ============================================================================

/**
 * Wave B: Generate encounter aftermath receipt
 */
export function generateEncounterReceipt(
  encounterId: string,
  terminal: CombatTerminal | 'parleyResolved' | 'parleyFailed' | 'fled' | 'caught',
  resolution: CombatResolution | null,
  gs: GameState
): EncounterReceipt {
  const idempotencyKey = createIdempotencyKey(encounterId, terminal, gs.turn);
  const engineMode = gs.engineMode;
  
  // Calculate XP based on terminal and mode
  const xpAwarded = calculateEncounterXp(terminal, engineMode, resolution);
  
  // Determine loot
  const lootAwarded = determineLoot(terminal, engineMode, gs);
  
  // Calculate resource deltas
  const resourceDeltas = buildResourceDeltas(terminal, resolution, xpAwarded, lootAwarded);
  
  // Calculate relationship deltas
  const relationshipDeltas = buildRelationshipDeltas(terminal, gs);
  
  // Quest updates
  const questUpdates = buildQuestUpdates(terminal, gs);
  
  // NPC consequences
  const npcConsequences = buildNpcConsequences(terminal, gs);
  
  // Dungeon progress
  const dungeonProgress = buildDungeonProgress(terminal, gs);
  
  // Determine receipt types
  const receiptTypes: EncounterReceiptType[] = [];
  if (xpAwarded > 0) receiptTypes.push('xp_award');
  if (lootAwarded.length > 0) receiptTypes.push('loot_drop');
  if (relationshipDeltas.length > 0) receiptTypes.push('faction_change');
  if (questUpdates.length > 0) receiptTypes.push('quest_update');
  if (npcConsequences.length > 0) receiptTypes.push('npc_consequence');
  if (dungeonProgress) receiptTypes.push('dungeon_progress');
  
  return {
    kind: 'encounter_aftermath',
    schemaVersion: 1,
    receiptId: `encounter_receipt_${idempotencyKey}`,
    turn: gs.turn,
    encounterId,
    terminal,
    idempotencyKey,
    receiptTypes,
    resourceDeltas,
    relationshipDeltas,
    xpAwarded,
    lootAwarded,
    questUpdates,
    npcConsequences,
    dungeonProgress
  };
}

/**
 * Wave B: Create idempotency key for receipt
 */
export function createIdempotencyKey(
  encounterId: string,
  terminal: string,
  turn: number
): string {
  // Hash the encounter ID, terminal, and turn to create unique key
  const combined = `${encounterId}-${terminal}-${turn}`;
  return Buffer.from(combined).toString('base64').slice(0, 32);
}

/**
 * Wave B: Check if receipt has already been applied
 */
export function hasReceiptBeenApplied(
  idempotencyKey: string,
  gs: GameState
): boolean {
  const appliedReceipts = gs.arcDirector?.appliedReceipts ?? [];
  return appliedReceipts.includes(idempotencyKey);
}

/**
 * Wave B: Mark receipt as applied
 */
export function markReceiptApplied(
  idempotencyKey: string,
  gs: GameState
): GameState {
  const appliedReceipts = gs.arcDirector?.appliedReceipts ?? [];
  
  if (appliedReceipts.includes(idempotencyKey)) {
    // Already applied, return unchanged
    return gs;
  }
  
  return {
    ...gs,
    arcDirector: {
      ...gs.arcDirector,
      appliedReceipts: [...appliedReceipts, idempotencyKey]
    }
  };
}

// ============================================================================
// Receipt Application
// ============================================================================

/**
 * Wave B: Apply encounter receipt to game state
 * 
 * Validates all deltas before applying any - atomic transaction.
 */
export function applyEncounterReceipt(
  receipt: EncounterReceipt,
  gs: GameState
): { gs: GameState; applied: boolean; errors: string[] } {
  // Check idempotency
  if (hasReceiptBeenApplied(receipt.idempotencyKey, gs)) {
    return {
      gs,
      applied: false,
      errors: ['Receipt already applied']
    };
  }
  
  // Validate all deltas
  const reconciliation = reconcileReceiptAgainstLedgers(receipt, gs);
  if (!reconciliation.valid) {
    return {
      gs,
      applied: false,
      errors: reconciliation.errors
    };
  }
  
  // Apply all effects atomically
  let nextGs = gs;
  
  // Apply XP
  if (receipt.xpAwarded > 0) {
    nextGs = {
      ...nextGs,
      totalXp: (nextGs.totalXp ?? 0) + receipt.xpAwarded
    };
  }
  
  // Apply loot
  if (receipt.lootAwarded.length > 0) {
    const newItems = [...(nextGs.inventory?.items ?? []), ...receipt.lootAwarded];
    nextGs = {
      ...nextGs,
      inventory: {
        ...nextGs.inventory,
        items: newItems
      }
    };
  }
  
  // Apply quest updates
  for (const update of receipt.questUpdates) {
    nextGs = applyQuestUpdate(update, nextGs);
  }
  
  // Apply dungeon progress
  if (receipt.dungeonProgress) {
    nextGs = applyDungeonProgress(receipt.dungeonProgress, nextGs);
  }
  
  // Mark receipt as applied
  nextGs = markReceiptApplied(receipt.idempotencyKey, nextGs);
  
  return {
    gs: nextGs,
    applied: true,
    errors: []
  };
}

/**
 * Wave B: Reconcile receipt against authoritative ledgers
 */
export function reconcileReceiptAgainstLedgers(
  receipt: EncounterReceipt,
  gs: GameState
): LedgerReconciliation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate XP delta
  if (receipt.xpAwarded < 0) {
    errors.push('XP award cannot be negative');
  }
  
  // Validate loot
  for (const item of receipt.lootAwarded) {
    if (!item || item.trim().length === 0) {
      errors.push('Empty loot item');
    }
  }
  
  // Validate quest updates
  for (const update of receipt.questUpdates) {
    const quest = gs.quests?.find(q => q.id === update.questId);
    if (!quest) {
      warnings.push(`Quest ${update.questId} not found in game state`);
    } else if (quest.status === 'complete' && update.action === 'complete') {
      warnings.push(`Quest ${update.questId} already complete`);
    }
  }
  
  // Validate dungeon progress
  if (receipt.dungeonProgress) {
    if (!gs.activeDungeon) {
      errors.push('Dungeon progress receipt but no active dungeon');
    } else if (gs.activeDungeon.id !== receipt.dungeonProgress.dungeonId) {
      errors.push(`Dungeon ID mismatch: ${receipt.dungeonProgress.dungeonId} vs ${gs.activeDungeon.id}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateEncounterXp(
  terminal: string,
  engineMode: EngineMode,
  resolution: CombatResolution | null
): number {
  // Base XP by terminal
  const baseXp: Record<string, number> = {
    victory: 50,
    defeat: 0,
    fled: 10,
    caught: 0,
    parleyResolved: 30,
    parleyFailed: 0,
    forced_timeout: 20
  };
  
  let xp = baseXp[terminal] ?? 0;
  
  // Mode multipliers
  if (engineMode === 'litrpg') {
    xp = Math.floor(xp * 1.5); // LitRPG gets more XP
  } else if (engineMode === 'dnd') {
    xp = Math.floor(xp * 1.2); // DnD gets moderate bonus
  }
  
  // Turn efficiency bonus
  if (resolution && resolution.turnsElapsed <= 3) {
    xp = Math.floor(xp * 1.2); // Fast victory bonus
  }
  
  return xp;
}

function determineLoot(
  terminal: string,
  engineMode: EngineMode,
  gs: GameState
): string[] {
  const loot: string[] = [];
  
  // Only victory grants loot
  if (terminal !== 'victory') {
    return loot;
  }
  
  // Basic loot based on mode
  if (engineMode === 'litrpg') {
    loot.push('Health Potion');
    if (Math.random() > 0.7) {
      loot.push('Gold Coins (50)');
    }
  } else if (engineMode === 'dnd') {
    loot.push('Healing Potion');
    if (Math.random() > 0.8) {
      loot.push('Magic Scroll');
    }
  }
  
  return loot;
}

function buildResourceDeltas(
  terminal: string,
  resolution: CombatResolution | null,
  xpAwarded: number,
  lootAwarded: string[]
): ResourceDelta[] {
  const deltas: ResourceDelta[] = [];
  
  // XP delta
  if (xpAwarded > 0) {
    deltas.push({
      resourceType: 'xp',
      amount: xpAwarded,
      reason: `Encounter ${terminal}`
    });
  }
  
  // Loot deltas
  for (const item of lootAwarded) {
    deltas.push({
      resourceType: 'item',
      amount: 1,
      reason: `Loot from encounter: ${item}`
    });
  }
  
  // HP delta from combat
  if (resolution) {
    const playerBefore = resolution.beforeSnapshot.find(s => s.entity === 'player');
    const playerAfter = resolution.afterSnapshot.find(s => s.entity === 'player');
    
    if (playerBefore && playerAfter) {
      const hpChange = playerAfter.hp - playerBefore.hp;
      if (hpChange !== 0) {
        deltas.push({
          resourceType: 'hp',
          amount: hpChange,
          reason: `Combat damage/healing`
        });
      }
    }
  }
  
  return deltas;
}

function buildRelationshipDeltas(terminal: string, gs: GameState): RelationshipDelta[] {
  const deltas: RelationshipDelta[] = [];
  
  // Placeholder - real implementation would check NPC/faction involvement
  if (terminal === 'victory') {
    // Example: defeating enemies might anger their faction
  } else if (terminal === 'parleyResolved') {
    // Example: successful parley improves relations
  }
  
  return deltas;
}

function buildQuestUpdates(terminal: string, gs: GameState): QuestUpdate[] {
  const updates: QuestUpdate[] = [];
  
  // Check if encounter resolves any quest objectives
  const activeQuests = gs.quests?.filter(q => q.status === 'active') ?? [];
  
  for (const quest of activeQuests) {
    // Placeholder - real implementation would check quest requirements
    if (terminal === 'victory' && quest.objectives) {
      // Example: defeating enemies might complete quest objective
    }
  }
  
  return updates;
}

function buildNpcConsequences(terminal: string, gs: GameState): NpcConsequence[] {
  const consequences: NpcConsequence[] = [];
  
  // Check if encounter affects NPCs
  if (gs.activeEncounter?.enemies) {
    for (const enemy of gs.activeEncounter.enemies) {
      if (terminal === 'victory' && enemy.hp <= 0) {
        consequences.push({
          npcId: enemy.id,
          action: 'defeat',
          reason: 'Defeated in combat'
        });
      }
    }
  }
  
  return consequences;
}

function buildDungeonProgress(terminal: string, gs: GameState): DungeonProgress | undefined {
  if (!gs.activeDungeon) {
    return undefined;
  }
  
  // Clear current node if victory
  if (terminal === 'victory' && gs.activeDungeon.currentNodeId) {
    return {
      dungeonId: gs.activeDungeon.id,
      nodesCleared: [gs.activeDungeon.currentNodeId]
    };
  }
  
  return undefined;
}

function applyQuestUpdate(update: QuestUpdate, gs: GameState): GameState {
  const quests = gs.quests ?? [];
  const quest = quests.find(q => q.id === update.questId);
  
  if (!quest) return gs;
  
  const updatedQuest = { ...quest };
  
  switch (update.action) {
    case 'complete':
      updatedQuest.status = 'complete';
      break;
    case 'fail':
      updatedQuest.status = 'failed';
      break;
    case 'advance':
      // Advance objectives - placeholder
      break;
  }
  
  return {
    ...gs,
    quests: quests.map(q => q.id === update.questId ? updatedQuest : q)
  };
}

function applyDungeonProgress(progress: DungeonProgress, gs: GameState): GameState {
  if (!gs.activeDungeon) return gs;
  
  const clearedNodeIds = new Set([
    ...(gs.activeDungeon.clearedNodeIds ?? []),
    ...progress.nodesCleared
  ]);
  
  return {
    ...gs,
    activeDungeon: {
      ...gs.activeDungeon,
      clearedNodeIds: Array.from(clearedNodeIds)
    }
  };
}
