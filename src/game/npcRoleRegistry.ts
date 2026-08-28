/**
 * WS-2 Wave A: NPC Role Registry
 * 
 * 24 typed role archetypes with lifecycle contracts.
 * Each role has function, timeline, exit, and transform patterns.
 */

import type { GameState } from './types';

// ============================================================================
// ROLE CATALOG (24 ARCHETYPES)
// ============================================================================

export type NpcRole =
  // Core functional roles
  | 'mysterious_guide'        // Opening NPC, reveals first clue
  | 'trusted_mentor'          // Teaching NPC, skill/knowledge transfer
  | 'quest_patron'            // Main quest giver, story spine driver
  | 'side_quest_giver'        // Optional quest provider
  | 'recurring_merchant'      // Hub vendor, 3+ transactions
  | 'limited_vendor'          // One-time or limited stock
  | 'hub_official'            // Registry, permits, access control
  | 'information_broker'      // Clues/intel for price
  | 'faction_ambassador'      // Alliance offer, faction access
  | 'faction_lieutenant'      // Subordinate, takes over if leader exits
  
  // Opposition & conflict
  | 'hidden_traitor'          // Ally who betrays at scripted beat
  | 'obvious_antagonist'      // Declared opposition, combat/leverage
  | 'rival'                   // Competition, non-lethal stakes
  | 'boss_encounter'          // Final/act-ending confrontation
  
  // Companion & support
  | 'companion'               // Joins party, stays indefinitely
  | 'temporary_ally'          // Joins for specific quest/act
  | 'escort_target'           // Must protect, exits after delivery
  | 'rescued_npc'             // Freed from encounter, may join/exit
  
  // Social & hub roles
  | 'gatekeeper'              // Controls passage, door/bridge
  | 'witness'                 // Saw player action, may gossip/testify
  | 'crowd_background'        // Ambient NPC, no obligation
  | 'faction_grunt'           // Low-rank faction member
  
  // Special lifecycle
  | 'dying_npc'               // Limited turns, death triggers consequence
  | 'transforming_npc';       // Role changes mid-campaign (ally→traitor)

// ============================================================================
// ROLE OBLIGATIONS
// ============================================================================

export interface NpcRoleObligation {
  role: NpcRole;
  function: string;           // What story debt this NPC owes
  timeline: number | null;    // Turns to satisfy (null = no deadline)
  exitCondition: string;      // How NPC leaves when satisfied
  failureCondition: string;   // What happens if deadline missed
  transformPattern?: string;  // How role can evolve
}

/**
 * Role obligation catalog
 * 
 * Each role has:
 * - function: Story debt owed
 * - timeline: Turns to satisfy (null = indefinite)
 * - exitCondition: How NPC exits when done
 * - failureCondition: Consequence if ignored
 * - transformPattern: Optional role evolution
 */
export const ROLE_OBLIGATIONS: Record<NpcRole, NpcRoleObligation> = {
  mysterious_guide: {
    role: 'mysterious_guide',
    function: 'Reveal first clue or objective',
    timeline: 15,
    exitCondition: 'Exits after clue revealed and player acts on it',
    failureCondition: 'Leaves cryptic warning, clue remains hidden',
    transformPattern: 'Can transform to quest_patron if story deepens',
  },
  
  trusted_mentor: {
    role: 'trusted_mentor',
    function: 'Teach skill, grant knowledge, or provide training',
    timeline: 20,
    exitCondition: 'Exits after training complete or knowledge transferred',
    failureCondition: 'Disappointed, may refuse future aid',
  },
  
  quest_patron: {
    role: 'quest_patron',
    function: 'Assign main quest objective',
    timeline: 10,
    exitCondition: 'Monitors from distance after quest accepted',
    failureCondition: 'Assigns quest to other hero, player locked out',
    transformPattern: 'Can transform to faction_ambassador if alliance forms',
  },
  
  side_quest_giver: {
    role: 'side_quest_giver',
    function: 'Offer optional quest',
    timeline: 12,
    exitCondition: 'Exits after quest accepted/rejected',
    failureCondition: 'Quest expires, NPC moves on',
  },
  
  recurring_merchant: {
    role: 'recurring_merchant',
    function: 'Provide goods/services, 3+ transactions',
    timeline: null, // No deadline, stays until hub departure
    exitCondition: 'Exits when player leaves hub or stock exhausted',
    failureCondition: 'N/A - soft deadline',
  },
  
  limited_vendor: {
    role: 'limited_vendor',
    function: 'Sell specific item(s), limited stock',
    timeline: 8,
    exitCondition: 'Exits after sale or stock expires',
    failureCondition: 'Stock spoils or sold to rival',
  },
  
  hub_official: {
    role: 'hub_official',
    function: 'Grant permits, access, or registry',
    timeline: 6,
    exitCondition: 'Exits after paperwork complete',
    failureCondition: 'Office closes, player must find alternate route',
  },
  
  information_broker: {
    role: 'information_broker',
    function: 'Sell clue or intel',
    timeline: 10,
    exitCondition: 'Exits after info purchased or deal rejected',
    failureCondition: 'Intel sold to rival, player loses advantage',
  },
  
  faction_ambassador: {
    role: 'faction_ambassador',
    function: 'Offer alliance with faction',
    timeline: 15,
    exitCondition: 'Exits after alliance accepted/rejected',
    failureCondition: 'Faction considers player neutral or enemy',
  },
  
  faction_lieutenant: {
    role: 'faction_lieutenant',
    function: 'Subordinate role, takes over if leader absent',
    timeline: null,
    exitCondition: 'Exits when faction leader returns or faction dissolved',
    failureCondition: 'N/A - soft deadline',
    transformPattern: 'Becomes faction_ambassador if leader exits',
  },
  
  hidden_traitor: {
    role: 'hidden_traitor',
    function: 'Plant false clue or misdirect player',
    timeline: 25,
    exitCondition: 'Betrayal reveal triggers exit or combat',
    failureCondition: 'Betrayal delayed to later act',
    transformPattern: 'Becomes obvious_antagonist at betrayal reveal',
  },
  
  obvious_antagonist: {
    role: 'obvious_antagonist',
    function: 'Oppose player, create conflict',
    timeline: 40,
    exitCondition: 'Combat resolution, parley, or exile',
    failureCondition: 'Escalates to boss_encounter',
    transformPattern: 'Can transform to rival if parley succeeds',
  },
  
  rival: {
    role: 'rival',
    function: 'Non-lethal competition, parallel goals',
    timeline: 30,
    exitCondition: 'Competition resolved, player wins/loses race',
    failureCondition: 'Rival succeeds first, player loses advantage',
  },
  
  boss_encounter: {
    role: 'boss_encounter',
    function: 'Act-ending confrontation',
    timeline: 50,
    exitCondition: 'Combat terminal or parley with major concession',
    failureCondition: 'Player defeat or forced retreat',
  },
  
  companion: {
    role: 'companion',
    function: 'Join party, aid in challenges',
    timeline: null, // Stays indefinitely
    exitCondition: 'Player dismisses, betrayal, or death',
    failureCondition: 'N/A - soft deadline',
    transformPattern: 'Can transform to hidden_traitor if story demands',
  },
  
  temporary_ally: {
    role: 'temporary_ally',
    function: 'Aid for specific quest or act',
    timeline: 20,
    exitCondition: 'Exits after quest complete or act ends',
    failureCondition: 'Abandons player mid-quest',
  },
  
  escort_target: {
    role: 'escort_target',
    function: 'Must be protected and delivered',
    timeline: 15,
    exitCondition: 'Exits after safe delivery',
    failureCondition: 'Captured, killed, or lost',
  },
  
  rescued_npc: {
    role: 'rescued_npc',
    function: 'Freed from encounter, offers reward/alliance',
    timeline: 8,
    exitCondition: 'Exits after reward given or favor declined',
    failureCondition: 'Returns to captivity or flees',
    transformPattern: 'Can transform to companion if player recruits',
  },
  
  gatekeeper: {
    role: 'gatekeeper',
    function: 'Control passage through door/gate/bridge',
    timeline: 6,
    exitCondition: 'Exits after passage granted or combat resolved',
    failureCondition: 'Gate closes permanently or alternate route needed',
  },
  
  witness: {
    role: 'witness',
    function: 'Saw player action, may gossip or testify',
    timeline: 10,
    exitCondition: 'Exits after testimony or bribe/threat silences',
    failureCondition: 'Spreads rumor, faction reputation damaged',
  },
  
  crowd_background: {
    role: 'crowd_background',
    function: 'Ambient presence, no obligation',
    timeline: null,
    exitCondition: 'Exits when scene changes or player leaves',
    failureCondition: 'N/A - no obligation',
  },
  
  faction_grunt: {
    role: 'faction_grunt',
    function: 'Low-rank faction member, takes orders',
    timeline: null,
    exitCondition: 'Exits when faction leaves or dismissed',
    failureCondition: 'N/A - follows faction lifecycle',
  },
  
  dying_npc: {
    role: 'dying_npc',
    function: 'Deliver deathbed message or clue',
    timeline: 3,
    exitCondition: 'Dies after message delivered',
    failureCondition: 'Dies before message delivered, clue lost',
  },
  
  transforming_npc: {
    role: 'transforming_npc',
    function: 'Role changes mid-campaign based on story',
    timeline: null,
    exitCondition: 'Transforms at scripted beat',
    failureCondition: 'N/A - transformation is the lifecycle',
    transformPattern: 'Script-driven transformation (any role → any role)',
  },
};

// ============================================================================
// ROLE INFERENCE
// ============================================================================

/**
 * Infer NPC role from context
 * 
 * Uses location, dialogue keywords, quest state to guess role.
 * More sophisticated than simple keyword matching.
 */
export function inferNpcRole(
  npc: string,
  state: GameState,
  context: {
    input?: string;
    location?: string;
    sceneContext?: string;
    questContext?: string[];
  }
): NpcRole {
  const input = (context.input || '').toLowerCase();
  const location = context.location || state.currentLocation || '';
  const sceneContext = (context.sceneContext || '').toLowerCase();
  
  // Opening guide (first 3 turns, not yet established)
  const isEarly = (state.turn ?? 0) < 3;
  const isOpening = !state.openingEstablishment?.complete;
  const present = state.sceneFacts?.present ?? [];
  
  if (isEarly && isOpening && present.includes(npc)) {
    // First NPC in opening is likely mysterious_guide
    return 'mysterious_guide';
  }
  
  // Check for explicit role keywords in input
  if (/\b(mentor|teach|train|learn|master)\b/.test(input)) {
    return 'trusted_mentor';
  }
  
  if (/\b(quest|mission|task|assignment|job)\b/.test(input)) {
    const activeMain = (state.quests ?? []).find(q => q.status === 'active' && q.type === 'main');
    return activeMain ? 'side_quest_giver' : 'quest_patron';
  }
  
  if (/\b(buy|sell|trade|merchant|shop|vendor|wares|goods|stock)\b/.test(input)) {
    // Check if recurring (hub) or limited (traveling)
    const isHub = location && /\b(town|city|hub|settlement|outpost)\b/i.test(location);
    return isHub ? 'recurring_merchant' : 'limited_vendor';
  }
  
  if (/\b(permit|registry|register|official|papers|access|clearance)\b/.test(input)) {
    return 'hub_official';
  }
  
  if (/\b(information|intel|clue|secret|know|tell me|reveal|broker)\b/.test(input)) {
    const wantsMoney = /\b(pay|gold|coin|price|cost)\b/.test(input);
    return wantsMoney ? 'information_broker' : 'mysterious_guide';
  }
  
  if (/\b(alliance|ally|faction|join us|side with|support)\b/.test(input)) {
    return 'faction_ambassador';
  }
  
  if (/\b(gate|door|passage|bridge|crossing|checkpoint)\b/.test(input) ||
      /\b(let me pass|open the|through)\b/.test(input)) {
    return 'gatekeeper';
  }
  
  if (/\b(join|follow|come with|party|together)\b/.test(input)) {
    const isTemporary = /\b(help|once|this quest)\b/.test(input);
    return isTemporary ? 'temporary_ally' : 'companion';
  }
  
  if (/\b(escort|protect|guard|deliver|safe)\b/.test(input)) {
    return 'escort_target';
  }
  
  // Check combat context for antagonist roles
  const isHostile = state.activeEncounter?.enemies?.some(
    e => e.name.toLowerCase().includes(npc.toLowerCase())
  );
  
  if (isHostile) {
    // Boss if health is high and it's late in act
    const isBoss = (state.activeEncounter?.maxHp ?? 0) > 50 && (state.turn ?? 0) > 40;
    return isBoss ? 'boss_encounter' : 'obvious_antagonist';
  }
  
  // Check for traitor hints in scene
  if (/\b(suspicious|untrustworthy|shifty|nervous|hiding)\b/.test(sceneContext)) {
    return 'hidden_traitor';
  }
  
  // Check for rescue context
  if (/\b(captive|prisoner|rescue|freed|saved)\b/.test(sceneContext)) {
    return 'rescued_npc';
  }
  
  // Check for dying context
  if (/\b(dying|wounded|bleeding|fading|last breath)\b/.test(sceneContext)) {
    return 'dying_npc';
  }
  
  // Check for witness context
  if (/\b(saw|witnessed|observed|noticed)\b/.test(sceneContext)) {
    return 'witness';
  }
  
  // Default: crowd background for unnamed/generic NPCs
  if (!npc || /\b(person|figure|someone|stranger|guard|civilian)\b/i.test(npc)) {
    return 'crowd_background';
  }
  
  // Named NPC with no clear role: faction_grunt if faction is present
  const hasFaction = (state.worldLedger?.factionStandings ?? []).length > 0;
  return hasFaction ? 'faction_grunt' : 'crowd_background';
}

// ============================================================================
// ROLE TRANSFORMS
// ============================================================================

/**
 * Check if role can transform to another role
 */
export function canTransformRole(from: NpcRole, to: NpcRole): boolean {
  const pattern = ROLE_OBLIGATIONS[from].transformPattern;
  if (!pattern) return false;
  
  // Check if transform pattern mentions target role
  const toSnake = to.replace(/_/g, ' ');
  return pattern.toLowerCase().includes(toSnake);
}

/**
 * Get valid transform targets for a role
 */
export function getValidTransforms(role: NpcRole): NpcRole[] {
  const pattern = ROLE_OBLIGATIONS[role].transformPattern;
  if (!pattern) return [];
  
  const valid: NpcRole[] = [];
  const roles = Object.keys(ROLE_OBLIGATIONS) as NpcRole[];
  
  for (const target of roles) {
    if (canTransformRole(role, target)) {
      valid.push(target);
    }
  }
  
  return valid;
}

// ============================================================================
// DEADLINE CALCULATION
// ============================================================================

/**
 * Calculate deadline turn for an NPC role
 * 
 * @param role - NPC role
 * @param startTurn - Turn when NPC entered scene
 * @param state - Game state (for mode-specific adjustments)
 * @returns Deadline turn (null if no deadline)
 */
export function calculateRoleDeadline(
  role: NpcRole,
  startTurn: number,
  state: GameState
): number | null {
  const obligation = ROLE_OBLIGATIONS[role];
  if (obligation.timeline === null) return null;
  
  // Mode-specific adjustments
  let multiplier = 1.0;
  
  if (state.engineMode === 'litrpg') {
    // LitRPG moves faster, tighter deadlines
    multiplier = 0.8;
  } else if (state.engineMode === 'dnd') {
    // DnD is more forgiving
    multiplier = 1.2;
  } else if (state.engineMode === 'pyoa') {
    // PYOA is tightest (crisis pressure)
    multiplier = 0.7;
  }
  
  const adjustedTimeline = Math.floor(obligation.timeline * multiplier);
  return startTurn + adjustedTimeline;
}

// ============================================================================
// SATISFACTION CHECKS
// ============================================================================

/**
 * Check if NPC role obligation is satisfied
 * 
 * Role-specific satisfaction conditions based on game state.
 */
export function isRoleSatisfied(
  role: NpcRole,
  npc: string,
  state: GameState
): boolean {
  const topics = state.arcDirector?.npcTopics?.[npcKey(npc)] ?? [];
  const topicCount = topics.length;
  const quests = state.quests ?? [];
  
  switch (role) {
    case 'mysterious_guide':
      // Satisfied if opening complete and player acted on clue
      return state.openingEstablishment?.complete ?? false;
      
    case 'trusted_mentor':
      // Satisfied if 2+ training topics
      return topicCount >= 2;
      
    case 'quest_patron':
    case 'side_quest_giver':
      // Satisfied if quest accepted
      return quests.some(q => q.status === 'active');
      
    case 'recurring_merchant':
      // Satisfied if 3+ trade topics
      return topics.filter(t => /trade|buy|sell/.test(t)).length >= 3;
      
    case 'limited_vendor':
      // Satisfied if 1+ trade
      return topics.some(t => /trade|buy|sell/.test(t));
      
    case 'hub_official':
      // Satisfied if 1+ registry topic
      return topicCount >= 1;
      
    case 'information_broker':
      // Satisfied if info purchased
      return topics.some(t => /buy|purchase|pay/.test(t));
      
    case 'faction_ambassador':
      // Satisfied if faction standing changed
      const standings = state.worldLedger?.factionStandings ?? [];
      return standings.length > 0;
      
    case 'gatekeeper':
      // Satisfied if passage granted
      return topics.some(t => /pass|through|enter/.test(t));
      
    case 'escort_target':
      // Satisfied if location changed (delivered)
      const startLoc = state.sceneFacts?.location;
      return !startLoc || state.currentLocation !== startLoc;
      
    case 'hidden_traitor':
      // Satisfied when betrayal revealed (tracked in key moments)
      // For now, use topic count as proxy
      return topicCount >= 3;
      
    case 'obvious_antagonist':
    case 'boss_encounter':
      // Satisfied when combat cleared
      const cleared = state.arcDirector?.encounterClearedReceipts ?? [];
      return cleared.some(r => r.name.toLowerCase().includes(npc.toLowerCase()));
      
    case 'temporary_ally':
      // Satisfied when quest complete
      return quests.some(q => q.status === 'completed');
      
    case 'rescued_npc':
      // Satisfied if 1+ topic (reward given)
      return topicCount >= 1;
      
    case 'dying_npc':
      // Always satisfied (dies immediately after message)
      return topicCount >= 1;
      
    case 'witness':
      // Satisfied if bribed or threatened
      return topics.some(t => /bribe|threaten|silence/.test(t));
      
    case 'companion':
    case 'faction_lieutenant':
    case 'faction_grunt':
    case 'crowd_background':
    case 'rival':
    case 'transforming_npc':
      // No satisfaction condition (stays until story beat)
      return false;
      
    default:
      return false;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function npcKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

/**
 * Format role obligation as situation packet mandate
 */
export function formatRoleObligation(role: NpcRole, npc: string, deadline: number | null): string {
  const obligation = ROLE_OBLIGATIONS[role];
  const deadlineStr = deadline ? ` (deadline: T${deadline})` : '';
  return `NPC ROLE (${npc}): ${obligation.function}${deadlineStr}. ${obligation.exitCondition}`;
}

/**
 * Format exit mandate when deadline missed
 */
export function formatExitMandate(role: NpcRole, npc: string, reason: string): string {
  const obligation = ROLE_OBLIGATIONS[role];
  return `NPC EXIT (${npc}): ${reason}. ${obligation.failureCondition}`;
}
