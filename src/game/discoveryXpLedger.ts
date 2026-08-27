/**
 * P1.1 - One-Time Discovery + XP Ledger (upgraded from "lower inspect XP")
 * 
 * Record inspection rewards by scene/object/fact. First discovery/risk/resolution earn XP;
 * repeated inspection of unchanged state earns zero.
 * 
 * Not: Just lower inspect XP globally.
 * 
 * Target:
 * - maxlevel LitRPG ≥Level 2 by T300
 * - Study-only XP share ≤30% of STATUS XP lines
 * - Repeat empty-search earns 0 XP
 */

import type { GameState } from './types';

export interface DiscoveryKey {
  /** What was discovered (location name, object, fact, NPC, etc.) */
  target: string;
  /** Type of discovery */
  type: DiscoveryType;
  /** Zone or location context */
  context: string;
}

export type DiscoveryType =
  | 'location'          // First visit to a location
  | 'object'            // First inspection of an object/prop
  | 'npc'               // First meeting with an NPC
  | 'fact'              // First learning of a fact/clue
  | 'secret'            // Discovery of hidden/secret content
  | 'quest_clue'        // Clue related to active quest
  | 'combat_victory'    // First defeat of enemy type
  | 'skill_use'         // First successful skill check
  | 'resolution';       // Quest/obstacle resolution

export interface DiscoveryRecord {
  key: string;
  target: string;
  type: DiscoveryType;
  context: string;
  turn: number;
  xpAwarded: number;
  /** How many times this has been inspected */
  inspectionCount: number;
}

export interface XpAward {
  amount: number;
  reason: string;
  type: 'discovery' | 'novelty' | 'risk' | 'quest' | 'resolution' | 'combat' | 'inspect';
  /** Is this a one-time award? */
  oneTime: boolean;
  /** Discovery key if this is tracked */
  discoveryKey?: string;
}

/**
 * Build a canonical discovery key for ledger tracking.
 */
export function buildDiscoveryKey(target: string, type: DiscoveryType, context: string): string {
  const normalized = target.toLowerCase().trim().slice(0, 60);
  const ctx = context.toLowerCase().trim().slice(0, 40);
  return `${type}:${normalized}@${ctx}`;
}

/**
 * Check if a discovery has already been awarded XP.
 */
export function hasDiscoveryBeenAwarded(
  target: string,
  type: DiscoveryType,
  context: string,
  ledger: Map<string, DiscoveryRecord>
): { awarded: boolean; record?: DiscoveryRecord } {
  const key = buildDiscoveryKey(target, type, context);
  const record = ledger.get(key);
  
  if (!record) {
    return { awarded: false };
  }
  
  return { awarded: true, record };
}

/**
 * Record a discovery in the ledger.
 */
export function recordDiscovery(
  target: string,
  type: DiscoveryType,
  context: string,
  turn: number,
  xpAwarded: number,
  ledger: Map<string, DiscoveryRecord>
): Map<string, DiscoveryRecord> {
  const key = buildDiscoveryKey(target, type, context);
  const existing = ledger.get(key);
  
  const updated = new Map(ledger);
  
  if (existing) {
    // Update inspection count
    updated.set(key, {
      ...existing,
      inspectionCount: existing.inspectionCount + 1,
    });
  } else {
    // New discovery
    updated.set(key, {
      key,
      target,
      type,
      context,
      turn,
      xpAwarded,
      inspectionCount: 1,
    });
  }
  
  return updated;
}

/**
 * Calculate XP for an action based on novelty and risk.
 */
export function calculateDiscoveryXp(
  action: string,
  state: GameState,
  ledger: Map<string, DiscoveryRecord>
): XpAward | null {
  const lower = action.toLowerCase();
  const currentLocation = state.currentLocation || 'unknown';
  
  // Location discovery
  if (/\b(enter|arrive|travel to|reach)\b/i.test(lower)) {
    const locationMatch = lower.match(/(?:enter|arrive|travel to|reach)\s+(?:the\s+)?([a-z\s]+)/i);
    if (locationMatch) {
      const location = locationMatch[1].trim();
      const check = hasDiscoveryBeenAwarded(location, 'location', currentLocation, ledger);
      
      if (!check.awarded) {
        return {
          amount: 15,
          reason: `First visit: ${location}`,
          type: 'discovery',
          oneTime: true,
          discoveryKey: buildDiscoveryKey(location, 'location', currentLocation),
        };
      }
    }
  }
  
  // Object inspection
  if (/\b(inspect|examine|check|look at|study|investigate)\b/i.test(lower)) {
    const objectMatch = lower.match(/(?:inspect|examine|check|look at|study)\s+(?:the\s+)?([a-z\s]+)/i);
    if (objectMatch) {
      const object = objectMatch[1].trim();
      const check = hasDiscoveryBeenAwarded(object, 'object', currentLocation, ledger);
      
      if (!check.awarded) {
        // First inspection awards XP
        return {
          amount: 5,
          reason: `Examined: ${object}`,
          type: 'novelty',
          oneTime: true,
          discoveryKey: buildDiscoveryKey(object, 'object', currentLocation),
        };
      } else if (check.record && check.record.inspectionCount >= 2) {
        // Repeat inspection of same object in same location: 0 XP
        return null;
      }
    }
  }
  
  // NPC meeting
  if (/\b(meet|talk to|speak with|greet)\b/i.test(lower)) {
    const npcMatch = lower.match(/(?:meet|talk to|speak with|greet)\s+([A-Z][a-z]+)/);
    if (npcMatch) {
      const npc = npcMatch[1];
      const check = hasDiscoveryBeenAwarded(npc, 'npc', currentLocation, ledger);
      
      if (!check.awarded) {
        return {
          amount: 10,
          reason: `Met: ${npc}`,
          type: 'discovery',
          oneTime: true,
          discoveryKey: buildDiscoveryKey(npc, 'npc', currentLocation),
        };
      }
    }
  }
  
  // Quest clue discovery
  const activeQuests = (state.quests ?? []).filter(q => q.status === 'active' && q.revealed);
  for (const quest of activeQuests) {
    const questKeywords = quest.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (questKeywords.some(kw => lower.includes(kw))) {
      const check = hasDiscoveryBeenAwarded(`${quest.name}_clue`, 'quest_clue', currentLocation, ledger);
      
      if (!check.awarded) {
        return {
          amount: 20,
          reason: `Quest clue: ${quest.name}`,
          type: 'quest',
          oneTime: true,
          discoveryKey: buildDiscoveryKey(`${quest.name}_clue`, 'quest_clue', currentLocation),
        };
      }
    }
  }
  
  // Combat victory
  if (state.activeEncounter) {
    const enemyName = state.activeEncounter.name;
    const check = hasDiscoveryBeenAwarded(enemyName, 'combat_victory', currentLocation, ledger);
    
    if (!check.awarded && /\b(attack|fight|defeat)\b/i.test(lower)) {
      return {
        amount: 25,
        reason: `First combat: ${enemyName}`,
        type: 'combat',
        oneTime: true,
        discoveryKey: buildDiscoveryKey(enemyName, 'combat_victory', currentLocation),
      };
    }
  }
  
  // Empty search repeat check
  const searchedEmpty = state.sceneFacts?.searchedEmpty ?? [];
  if (/\b(search|look for)\b/i.test(lower)) {
    const searchTarget = lower.match(/(?:search|look for)\s+(?:the\s+)?([a-z\s]+)/i);
    if (searchTarget) {
      const target = searchTarget[1].trim();
      if (searchedEmpty.includes(target)) {
        // Repeat search of empty container: 0 XP
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Calculate XP for quest resolution (completion/failure).
 */
export function calculateResolutionXp(
  questName: string,
  completed: boolean,
  questType: 'main' | 'side' | 'daily',
  ledger: Map<string, DiscoveryRecord>
): XpAward | null {
  const check = hasDiscoveryBeenAwarded(questName, 'resolution', 'quest');
  
  if (check.awarded) {
    // Already awarded resolution XP for this quest
    return null;
  }
  
  const baseXp = questType === 'main' ? 100 : questType === 'side' ? 50 : 25;
  const multiplier = completed ? 1.0 : 0.5; // Half XP for failed quests
  
  return {
    amount: Math.floor(baseXp * multiplier),
    reason: `${completed ? 'Completed' : 'Failed'}: ${questName}`,
    type: 'resolution',
    oneTime: true,
    discoveryKey: buildDiscoveryKey(questName, 'resolution', 'quest'),
  };
}

/**
 * Calculate XP for risk-taking actions.
 */
export function calculateRiskXp(
  action: string,
  threatTier: number,
  playerLevel: number
): XpAward | null {
  const lower = action.toLowerCase();
  
  // Risky actions in high-threat zones
  if (/\b(attack|confront|challenge|force|threaten)\b/i.test(lower)) {
    if (threatTier > playerLevel) {
      const riskBonus = (threatTier - playerLevel) * 5;
      return {
        amount: 10 + riskBonus,
        reason: `Risky action in Tier ${threatTier} zone`,
        type: 'risk',
        oneTime: false, // Risk XP can be earned multiple times
      };
    }
  }
  
  return null;
}

/**
 * Update discovery ledger after awarding XP.
 */
export function updateDiscoveryLedger(
  awards: XpAward[],
  turn: number,
  ledger: Map<string, DiscoveryRecord>
): Map<string, DiscoveryRecord> {
  let updated = new Map(ledger);
  
  for (const award of awards) {
    if (award.oneTime && award.discoveryKey) {
      const [typeAndTarget, context] = award.discoveryKey.split('@');
      const [type, target] = typeAndTarget.split(':');
      
      updated = recordDiscovery(
        target,
        type as DiscoveryType,
        context || 'unknown',
        turn,
        award.amount,
        updated
      );
    }
  }
  
  return updated;
}

/**
 * Calculate XP share for inspect-only actions vs other sources.
 */
export function calculateInspectXpShare(
  recentAwards: XpAward[],
  windowSize: number = 100
): {
  inspectPercentage: number;
  inspectTotal: number;
  totalXp: number;
  analysis: string;
} {
  const recent = recentAwards.slice(-windowSize);
  
  const inspectXp = recent
    .filter(a => a.type === 'inspect' || a.reason.toLowerCase().includes('exam'))
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalXp = recent.reduce((sum, a) => sum + a.amount, 0);
  
  const inspectPercentage = totalXp > 0 ? (inspectXp / totalXp) * 100 : 0;
  
  return {
    inspectPercentage,
    inspectTotal: inspectXp,
    totalXp,
    analysis: `Inspect XP: ${inspectXp}/${totalXp} (${inspectPercentage.toFixed(1)}%)`,
  };
}

/**
 * Check if player is leveling appropriately for turn count (LitRPG).
 */
export function checkLevelingPace(
  level: number,
  turn: number,
  engineMode: string
): {
  onPace: boolean;
  expectedLevel: number;
  analysis: string;
} {
  if (engineMode !== 'litrpg') {
    return {
      onPace: true,
      expectedLevel: level,
      analysis: 'Leveling not tracked for this mode',
    };
  }
  
  // Expected leveling pace for LitRPG maxlevel playthrough:
  // Level 1: T0-50
  // Level 2: T50-150
  // Level 3: T150-300
  // Level 4+: T300+
  
  let expectedLevel = 1;
  if (turn >= 50) expectedLevel = 2;
  if (turn >= 150) expectedLevel = 3;
  if (turn >= 300) expectedLevel = 4;
  
  const onPace = level >= expectedLevel;
  
  return {
    onPace,
    expectedLevel,
    analysis: onPace
      ? `On pace: Level ${level} at T${turn} (expected ≥${expectedLevel})`
      : `Behind pace: Level ${level} at T${turn} (expected ≥${expectedLevel})`,
  };
}

/**
 * Telemetry for discovery XP metrics.
 */
export interface DiscoveryXpTelemetry {
  turn: number;
  totalDiscoveries: number;
  uniqueLocations: number;
  uniqueObjects: number;
  uniqueNpcs: number;
  questClues: number;
  resolutions: number;
  averageXpPerDiscovery: number;
  inspectXpPercentage: number;
}

/**
 * Track discovery XP metrics for telemetry.
 */
export function trackDiscoveryXpMetrics(
  ledger: Map<string, DiscoveryRecord>,
  recentAwards: XpAward[]
): DiscoveryXpTelemetry {
  const records = Array.from(ledger.values());
  
  const uniqueLocations = records.filter(r => r.type === 'location').length;
  const uniqueObjects = records.filter(r => r.type === 'object').length;
  const uniqueNpcs = records.filter(r => r.type === 'npc').length;
  const questClues = records.filter(r => r.type === 'quest_clue').length;
  const resolutions = records.filter(r => r.type === 'resolution').length;
  
  const totalXp = records.reduce((sum, r) => sum + r.xpAwarded, 0);
  const averageXpPerDiscovery = records.length > 0 ? totalXp / records.length : 0;
  
  const inspectShare = calculateInspectXpShare(recentAwards);
  
  return {
    turn: 0, // Will be filled by caller
    totalDiscoveries: records.length,
    uniqueLocations,
    uniqueObjects,
    uniqueNpcs,
    questClues,
    resolutions,
    averageXpPerDiscovery,
    inspectXpPercentage: inspectShare.inspectPercentage,
  };
}
