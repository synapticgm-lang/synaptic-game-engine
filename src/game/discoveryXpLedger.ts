/** One-time discovery XP ledger: first find pays; repeat inspect of the same thing pays 0. */
import type { GameState } from './types';
import { isLookAroundAction } from './sandboxXp';
import { milestoneAreaOpts } from './placeAuthority';
import { milestoneXp, type MilestoneKind } from './xpRules';

const DISCOVERY_MILESTONE: Record<DiscoveryType, MilestoneKind> = {
  location: 'significantPlace',
  object: 'roomCleared',
  npc: 'significantPerson',
  fact: 'roomCleared',
  secret: 'roomCleared',
  quest_clue: 'questStep',
  combat_victory: 'encounter',
  skill_use: 'roomCleared',
  resolution: 'questComplete',
};

export function discoveryXpAmount(state: GameState, type: DiscoveryType): number {
  return milestoneXp(state.engineMode, DISCOVERY_MILESTONE[type], {
    level: state.character?.level ?? 1,
    strictness: state.gmStrictness,
    ...milestoneAreaOpts(state),
  }).amount;
}

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
 * I07 — evidence-id uniqueness: block repeat awards when ledger shows exhaustion.
 */
export function isDiscoveryExhausted(
  target: string,
  type: DiscoveryType,
  context: string,
  ledger: Map<string, DiscoveryRecord>
): boolean {
  const key = buildDiscoveryKey(target, type, context);
  const record = ledger.get(key);
  if (!record) return false;
  if (type === 'object' || type === 'location' || type === 'npc' || type === 'quest_clue') {
    return record.inspectionCount >= 1;
  }
  return record.xpAwarded > 0;
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
      if (isDiscoveryExhausted(location, 'location', currentLocation, ledger)) return null;
      const check = hasDiscoveryBeenAwarded(location, 'location', currentLocation, ledger);
      
      if (!check.awarded) {
        return {
          amount: discoveryXpAmount(state, 'location'),
          reason: `First visit: ${location}`,
          type: 'discovery',
          oneTime: true,
          discoveryKey: buildDiscoveryKey(location, 'location', currentLocation),
        };
      }
    }
  }
  
  // Object inspection — generic room/cell scout is look-around, not a landmark.
  if (/\b(inspect|examine|check|look at|study|investigate)\b/i.test(lower)) {
    if (isLookAroundAction(action)) return null;
    const objectMatch = lower.match(/(?:inspect|examine|check|look at|study)\s+(?:the\s+)?([a-z\s]+)/i);
    if (objectMatch) {
      const object = objectMatch[1].trim();
      if (isDiscoveryExhausted(object, 'object', currentLocation, ledger)) return null;
      const check = hasDiscoveryBeenAwarded(object, 'object', currentLocation, ledger);
      
      if (!check.awarded) {
        // First inspection awards XP
        return {
          amount: discoveryXpAmount(state, 'object'),
          reason: `Examined: ${object}`,
          type: 'novelty',
          oneTime: true,
          discoveryKey: buildDiscoveryKey(object, 'object', currentLocation),
        };
      }
      // Repeat inspect of same evidence-id: 0 XP (option E)
      return null;
    }
  }
  
  // NPC meeting
  if (/\b(meet|talk to|speak with|greet)\b/i.test(lower)) {
    const npcMatch = lower.match(/(?:meet|talk to|speak with|greet)\s+([A-Z][a-z]+)/);
    if (npcMatch) {
      const npc = npcMatch[1];
      if (isDiscoveryExhausted(npc, 'npc', currentLocation, ledger)) return null;
      const check = hasDiscoveryBeenAwarded(npc, 'npc', currentLocation, ledger);
      
      if (!check.awarded) {
        return {
          amount: discoveryXpAmount(state, 'npc'),
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
          amount: discoveryXpAmount(state, 'quest_clue'),
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
        amount: discoveryXpAmount(state, 'combat_victory'),
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
