/**
 * WS-7 Wave 1: Leverage Mechanics
 * 
 * Leverage assets, pressure profiles, conditional resolution, one-use exhaustion.
 */

import type { GameState } from './types';
import type {
  LeverageAsset,
  LeverageType,
  LeveragePressureProfile,
  LeverageResolution,
} from './socialCrisisTypes';
import { getLeverageTrustDelta, calculateLeverageModifier } from './socialCrisisTypes';

// ============================================================================
// LEVERAGE REGISTRY
// ============================================================================

/**
 * Register new leverage asset
 * 
 * Creates asset on first use against target NPC.
 */
export function registerLeverageAsset(
  type: LeverageType,
  targetNpc: string,
  state: GameState,
  opts: {
    evidenceStrength: number;
    credibility: number;
  }
): { state: GameState; assetId: string } {
  const assets = state.arcDirector?.leverageAssets ?? [];
  
  // Check if asset already exists for this NPC + type
  const existing = assets.find(
    a => a.type === type && a.targetNpc.toLowerCase() === targetNpc.toLowerCase()
  );
  
  if (existing) {
    return { state, assetId: existing.id };
  }
  
  // Create new asset
  const assetId = `${type}:${targetNpc}:${state.turn ?? 0}`;
  const asset: LeverageAsset = {
    id: assetId,
    type,
    targetNpc,
    evidenceStrength: opts.evidenceStrength,
    credibility: opts.credibility,
    firstUsedTurn: state.turn ?? 0,
    exhausted: false,
  };
  
  const newState: GameState = {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      leverageAssets: [...assets, asset],
    },
  };
  
  return { state: newState, assetId };
}

/**
 * Mark leverage asset as exhausted (one-use per NPC target)
 */
export function exhaustLeverageAsset(
  assetId: string,
  state: GameState
): GameState {
  const assets = state.arcDirector?.leverageAssets ?? [];
  const updated = assets.map(a =>
    a.id === assetId ? { ...a, exhausted: true } : a
  );
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      leverageAssets: updated,
    },
  };
}

/**
 * Check if leverage asset is exhausted
 */
export function isLeverageExhausted(
  assetId: string,
  state: GameState
): boolean {
  const assets = state.arcDirector?.leverageAssets ?? [];
  const asset = assets.find(a => a.id === assetId);
  return asset?.exhausted ?? false;
}

// ============================================================================
// PRESSURE PROFILES
// ============================================================================

/**
 * Get or infer pressure profile for NPC
 * 
 * Wave 1: Uses simple heuristics from NPC role and faction.
 * Wave 2: Uses WS-2 NPC memory ledger for more nuanced profiles.
 */
export function getPressureProfile(
  npc: string,
  state: GameState
): LeveragePressureProfile {
  // Try to find explicit profile (future: from NPC memory)
  const profiles = state.arcDirector?.leveragePressureProfiles ?? [];
  const explicit = profiles.find(p => p.npc.toLowerCase() === npc.toLowerCase());
  if (explicit) return explicit;
  
  // Infer from NPC role (simplified for Wave 1)
  const role = inferNpcRole(npc, state);
  
  return {
    npc,
    fears: inferFears(role),
    wants: inferWants(role),
    duties: inferDuties(role),
    taboos: inferTaboos(role),
  };
}

/**
 * Infer NPC role (simplified for Wave 1)
 */
function inferNpcRole(npc: string, state: GameState): string {
  // Check if NPC is in scene
  const present = state.sceneFacts?.present ?? [];
  if (!present.includes(npc)) return 'unknown';
  
  // Check if NPC is faction member
  const factions = state.worldLedger?.factionStandings ?? [];
  for (const faction of factions) {
    const members = faction.members ?? [];
    if (members.includes(npc.toLowerCase())) {
      return 'faction_member';
    }
  }
  
  // Check if NPC is merchant (common role)
  const topics = state.arcDirector?.npcTopics?.[npcKey(npc)] ?? [];
  if (topics.some(t => /trade|buy|sell/.test(t))) {
    return 'merchant';
  }
  
  // Default
  return 'civilian';
}

function inferFears(role: string): string[] {
  switch (role) {
    case 'merchant': return ['poverty', 'reputation loss', 'theft'];
    case 'faction_member': return ['betrayal', 'exile', 'dishonor'];
    case 'civilian': return ['violence', 'authority', 'public shame'];
    default: return ['harm', 'loss'];
  }
}

function inferWants(role: string): string[] {
  switch (role) {
    case 'merchant': return ['profit', 'security', 'repeat business'];
    case 'faction_member': return ['loyalty', 'advancement', 'recognition'];
    case 'civilian': return ['safety', 'peace', 'fairness'];
    default: return ['survival', 'comfort'];
  }
}

function inferDuties(role: string): string[] {
  switch (role) {
    case 'merchant': return ['fair dealing', 'quality goods'];
    case 'faction_member': return ['obey orders', 'protect faction'];
    case 'civilian': return ['follow laws', 'support community'];
    default: return ['self-preservation'];
  }
}

function inferTaboos(role: string): string[] {
  switch (role) {
    case 'merchant': return ['theft', 'fraud'];
    case 'faction_member': return ['betrayal', 'desertion'];
    case 'civilian': return ['murder', 'treason'];
    default: return ['harm innocents'];
  }
}

function npcKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

// ============================================================================
// CONDITIONAL RESOLUTION
// ============================================================================

/**
 * Resolve leverage attempt
 * 
 * Returns modifier (-6 to +6) and trust delta.
 * Does NOT commit state changes (caller must do that).
 */
export function resolveLeverage(
  asset: LeverageAsset,
  targetNpc: string,
  state: GameState
): LeverageResolution {
  // Check if exhausted
  if (asset.exhausted) {
    return {
      assetId: asset.id,
      targetNpc,
      modifier: -6,
      trustDelta: 0,
      outcome: 'failure',
      cost: 'Leverage already used on this target',
    };
  }
  
  // Get pressure profile
  const profile = getPressureProfile(targetNpc, state);
  
  // Calculate modifier
  const modifier = calculateLeverageModifier(asset, profile);
  
  // Get trust delta
  const trustDelta = getLeverageTrustDelta(asset.type);
  
  // Determine outcome
  let outcome: 'success' | 'partial' | 'failure';
  if (modifier >= 4) {
    outcome = 'success';
  } else if (modifier >= 0) {
    outcome = 'partial';
  } else {
    outcome = 'failure';
  }
  
  // Cost (trust is always paid)
  const cost = `Trust with ${targetNpc}: ${trustDelta >= 0 ? '+' : ''}${trustDelta}`;
  
  return {
    assetId: asset.id,
    targetNpc,
    modifier,
    trustDelta,
    outcome,
    cost,
  };
}

// ============================================================================
// LEVERAGE TYPES
// ============================================================================

/**
 * Get leverage type display name
 */
export function getLeverageTypeName(type: LeverageType): string {
  switch (type) {
    case 'physical_threat': return 'Physical Threat';
    case 'economic_pressure': return 'Economic Pressure';
    case 'social_exposure': return 'Social Exposure';
    case 'legal_authority': return 'Legal Authority';
    case 'moral_appeal': return 'Moral Appeal';
    case 'favor_reminder': return 'Favor Reminder';
  }
}

/**
 * Get leverage type description
 */
export function getLeverageTypeDescription(type: LeverageType): string {
  switch (type) {
    case 'physical_threat':
      return 'Threaten with force or violence (-18 trust, requires combat advantage)';
    case 'economic_pressure':
      return 'Offer payment or threaten financial ruin (-12 trust, requires wealth)';
    case 'social_exposure':
      return 'Threaten to reveal secret or shame publicly (-15 trust, requires evidence)';
    case 'legal_authority':
      return 'Invoke law or official mandate (-10 trust, requires official status)';
    case 'moral_appeal':
      return 'Appeal to shared values or conscience (+8 trust, requires common ground)';
    case 'favor_reminder':
      return 'Remind of past favor owed (+6 trust, requires past help)';
  }
}
