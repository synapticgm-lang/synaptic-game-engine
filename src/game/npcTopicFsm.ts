/**
 * NPC topic FSM — track exhausted dialogue topics; force stage advance when drained.
 */

import type { GameState } from './types';
import { canonicalizeIntent } from './semanticLoopDetector';

export type NpcTopicFsmState = Record<string, string[]>;

/** Wave B: Topic version and cooldown tracking */
export interface TopicVersion {
  topic: string;
  version: number;
  exhaustedAt: number;
  revivalReason?: 'evidence' | 'contradiction' | 'story_beat';
  cooldownUntil?: number;
}

export interface TopicCooldownLedger {
  [npcKey: string]: TopicVersion[];
}

/** B023 — NPC role types for lifecycle tracking */
export type NpcRole =
  | 'guide' // Opening NPC who explains rules
  | 'merchant' // Trader/vendor
  | 'guardian' // Gate/door keeper
  | 'quest_giver' // Starts quests
  | 'informant' // Provides clues
  | 'companion' // Joins party
  | 'antagonist' // Opposition
  | 'neutral'; // No specific role

export interface NpcRoleObligation {
  npc: string;
  role: NpcRole;
  obligationTurn: number; // Turn when role obligation was created
  deadlineTurn: number; // Turn by which NPC must exit or transform
  satisfied: boolean;
  exitedAt?: number;
}

function npcKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

function extractNpcFromInput(input: string, state: GameState): string | null {
  const m = input.match(/(?:talk to|speak with|ask|greet|listen to|press)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (m) return m[1].trim();
  const present = state.sceneFacts?.present ?? [];
  // 29c — Listen / Press / Wait dialogue pads bind to the sole present NPC
  if (present.length === 1) return present[0];
  if (present.length > 0 && /\b(listen|press|wait|ask|talk)\b/i.test(input)) {
    return present[0];
  }
  return null;
}

function topicKey(input: string): string {
  const intent = canonicalizeIntent(input, 0);
  const lower = (input || '').toLowerCase();
  // 29c — collapse Listen/Press/Wait dialogue purgatory into one basin
  if (/\b(listen|press for|wait and watch|wait)\b/.test(lower)) {
    return `dialogue:${intent.target || 'general'}`.slice(0, 48);
  }
  return `${intent.action}:${intent.target || 'general'}`.slice(0, 48);
}

export function isTopicExhausted(
  npc: string,
  topic: string,
  fsm: NpcTopicFsmState | undefined
): boolean {
  const topics = fsm?.[npcKey(npc)] ?? [];
  return topics.includes(topic);
}

export function recordNpcTopic(
  state: GameState,
  input: string
): { state: GameState; exhausted: boolean; npc?: string; topic?: string } {
  const npc = extractNpcFromInput(input, state);
  if (!npc) return { state, exhausted: false };

  const topic = topicKey(input);
  const key = npcKey(npc);
  const prev = state.arcDirector?.npcTopics ?? {};
  const used = prev[key] ?? [];

  if (used.includes(topic)) {
    return { state, exhausted: true, npc, topic };
  }

  const nextTopics = { ...prev, [key]: [...used, topic].slice(-12) };
  return {
    state: {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcTopics: nextTopics,
      },
    },
    exhausted: false,
    npc,
    topic,
  };
}

export function formatNpcTopicMandate(
  npc: string,
  topic: string,
  exhausted: boolean
): string | null {
  if (!exhausted) return null;
  return `NPC TOPIC EXHAUSTED (${npc} / ${topic}): Do not repeat this dialogue basin — advance quest stage, introduce new fact, or end the conversation with consequence.`;
}

/** After 2+ dialogue-basin topics with same NPC, mandate stage advance (29c tighter). */
export function shouldForceNpcStageAdvance(state: GameState, npc: string): boolean {
  const used = state.arcDirector?.npcTopics?.[npcKey(npc)] ?? [];
  return used.length >= 2;
}

/** B022–B023 — full topic exhaustion → quest stage advance or close branch. */
export function advanceNpcTopicExhaustion(
  state: GameState,
  npc: string
): { state: GameState; mandate?: string } {
  const key = npcKey(npc);
  const used = state.arcDirector?.npcTopics?.[key] ?? [];
  if (used.length < 2) return { state };

  let next = state;
  let mandate: string | undefined;

  const quests = next.quests ?? [];
  const activeMain = quests.find(
    (q) => q.status === 'active' && q.type === 'main' && (q.objectives ?? []).some((o) => !o.completed)
  );
  if (activeMain?.objectives?.length) {
    const idx = activeMain.objectives.findIndex((o) => !o.completed);
    if (idx >= 0 && used.length >= 3) {
      const objectives = [...activeMain.objectives];
      objectives[idx] = { ...objectives[idx], completed: true };
      next = {
        ...next,
        quests: quests.map((q) =>
          q.id === activeMain.id ? { ...q, objectives, status: 'active' } : q
        ),
      };
      mandate = `NPC TOPIC SUITE (${npc}): Dialogue basin exhausted — quest stage advanced locally.`;
    }
  }

  // 29a — monotonic topic commit (no reopen)
  const commitKey = key;
  const commits = { ...(next.arcDirector?.topicCommits ?? {}) };
  if (!commits[commitKey] && used.length >= 2) {
    commits[commitKey] = mandate?.includes('quest stage')
      ? 'questStageAdvanced'
      : used.some((t) => /leverage|feed/i.test(t))
        ? 'leverageAccepted'
        : 'refusalFinal';
    next = {
      ...next,
      arcDirector: {
        ...next.arcDirector,
        topicCommits: commits,
      },
    };
    if (!mandate) {
      mandate = `NPC TOPIC COMMIT (${npc}): ${commits[commitKey]} — do not reopen this dialogue basin.`;
    }
  }

  if (!mandate) {
    mandate = `NPC TOPIC SUITE (${npc}): Topics exhausted — close dialogue branch with consequence, not repeat lines.`;
  }

  return { state: next, mandate };
}

/** B023 — Infer NPC role from context and create obligation */
export function inferNpcRole(
  npc: string,
  state: GameState,
  input: string
): NpcRole {
  const lower = (input || '').toLowerCase();
  const present = state.sceneFacts?.present ?? [];
  const isOpening = (state.turn ?? 0) < 3 && !state.openingEstablishment?.complete;
  
  // Guide role: opening NPCs who explain rules or are being talked to during opening
  // Check if NPC is in present array OR if they're mentioned in a talk/ask context during opening
  const isTalkingToNpc = /\b(talk|speak|ask|tell|listen)\b/.test(lower) && 
                         lower.includes(npc.toLowerCase());
  if (isOpening && (present.includes(npc) || isTalkingToNpc)) return 'guide';
  
  // Merchant: trade/buy/sell/shop keywords
  if (/\b(buy|sell|trade|merchant|shop|vendor|wares)\b/.test(lower)) return 'merchant';
  
  // Guardian: gate/door/entrance keywords
  if (/\b(gate|door|entrance|guard|keeper|sentry)\b/.test(lower)) return 'guardian';
  
  // Quest giver: quest/mission/task keywords
  if (/\b(quest|mission|task|job|contract)\b/.test(lower)) return 'quest_giver';
  
  // Informant: information/clue/know keywords
  if (/\b(know|tell|information|clue|reveal|secret)\b/.test(lower)) return 'informant';
  
  // Companion: join/follow/come keywords
  if (/\b(join|follow|come with|party)\b/.test(lower)) return 'companion';
  
  // Antagonist: hostile NPCs
  const enemies = state.activeEncounter?.enemies ?? [];
  if (enemies.some(e => e.name.toLowerCase().includes(npc.toLowerCase()))) return 'antagonist';
  
  return 'neutral';
}

/** B023 — Create or update NPC role obligation */
export function trackNpcRoleObligation(
  state: GameState,
  npc: string,
  input: string
): GameState {
  const role = inferNpcRole(npc, state, input);
  if (role === 'neutral') return state;
  
  const obligations = state.arcDirector?.npcRoleObligations ?? [];
  const existing = obligations.find(o => npcKey(o.npc) === npcKey(npc) && !o.exitedAt);
  
  if (existing) return state; // Already tracking
  
  // Set deadline based on role type
  const turnDeadlines: Record<NpcRole, number> = {
    guide: 8,        // Opening guide exits after 8 turns
    merchant: 12,    // Merchant exits after trade or 12 turns
    guardian: 6,     // Guardian exits after gate passage or 6 turns
    quest_giver: 10, // Quest giver exits after quest accepted or 10 turns
    informant: 8,    // Informant exits after clue revealed or 8 turns
    companion: 999,  // Companions stay indefinitely
    antagonist: 999, // Antagonists stay until combat ends
    neutral: 999,
  };
  
  const obligation: NpcRoleObligation = {
    npc,
    role,
    obligationTurn: state.turn,
    deadlineTurn: state.turn + turnDeadlines[role],
    satisfied: false,
  };
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      npcRoleObligations: [...obligations, obligation],
    },
  };
}

/** B023 — Check if NPC should exit due to deadline */
export function checkNpcRoleDeadlines(
  state: GameState
): { state: GameState; exits: string[] } {
  const obligations = state.arcDirector?.npcRoleObligations ?? [];
  const exits: string[] = [];
  let updated = false;
  
  const nextObligations = obligations.map(obl => {
    if (obl.exitedAt || obl.satisfied) return obl;
    
    // Check if deadline exceeded
    if (state.turn >= obl.deadlineTurn) {
      exits.push(obl.npc);
      updated = true;
      return { ...obl, exitedAt: state.turn, satisfied: true };
    }
    
    // Check if role obligation naturally satisfied
    const topics = state.arcDirector?.npcTopics?.[npcKey(obl.npc)] ?? [];
    const topicCount = topics.length;
    
    // Role-specific satisfaction conditions
    let satisfied = false;
    switch (obl.role) {
      case 'guide':
        satisfied = state.openingEstablishment?.complete || topicCount >= 2;
        break;
      case 'merchant':
        satisfied = topicCount >= 1 && /trade|buy|sell/i.test(topics.join(' '));
        break;
      case 'guardian':
        satisfied = topicCount >= 1 && /pass|through|enter/i.test(topics.join(' '));
        break;
      case 'quest_giver':
        satisfied = (state.quests ?? []).some(q => q.status === 'active');
        break;
      case 'informant':
        satisfied = topicCount >= 1;
        break;
      default:
        satisfied = false;
    }
    
    if (satisfied) {
      updated = true;
      return { ...obl, satisfied: true };
    }
    
    return obl;
  });
  
  if (!updated) return { state, exits: [] };
  
  return {
    state: {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcRoleObligations: nextObligations,
      },
    },
    exits,
  };
}

/** B023 — Format mandate for NPC exits */
export function formatNpcExitMandate(exits: string[]): string | null {
  if (!exits.length) return null;
  const names = exits.slice(0, 3).join(', ');
  return `NPC ROLE DEADLINE: ${names} must exit scene — role obligation complete or deadline exceeded. Do not keep them lingering indefinitely.`;
}

// ============================================================================
// Wave B: Topic Revival and Cooldown
// ============================================================================

/**
 * Wave B: Revive an exhausted topic with new evidence or story beat
 * 
 * Creates a new version of the topic that can be asked again, with cooldown.
 */
export function reviveTopicVersion(
  state: GameState,
  npc: string,
  topic: string,
  reason: 'evidence' | 'contradiction' | 'story_beat',
  currentTurn: number
): GameState {
  const key = npcKey(npc);
  const ledger = state.arcDirector?.topicCooldownLedger ?? {};
  const versions = ledger[key] ?? [];
  
  // Find current version
  const existingVersion = versions.find(v => v.topic === topic);
  const currentVersion = existingVersion?.version ?? 0;
  const nextVersion = currentVersion + 1;
  
  // Calculate cooldown based on reason
  const cooldownTurns = reason === 'evidence' ? 8 : reason === 'contradiction' ? 12 : 0;
  const cooldownUntil = currentTurn + cooldownTurns;
  
  // Create new version entry
  const newVersion: TopicVersion = {
    topic,
    version: nextVersion,
    exhaustedAt: currentTurn,
    revivalReason: reason,
    cooldownUntil: cooldownTurns > 0 ? cooldownUntil : undefined
  };
  
  // Update ledger
  const updatedVersions = [...versions.filter(v => v.topic !== topic), newVersion];
  const updatedLedger = { ...ledger, [key]: updatedVersions };
  
  // Remove from exhausted topics to allow re-asking
  const npcTopics = state.arcDirector?.npcTopics ?? {};
  const exhaustedTopics = npcTopics[key] ?? [];
  const filteredTopics = exhaustedTopics.filter(t => t !== topic);
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      topicCooldownLedger: updatedLedger,
      npcTopics: { ...npcTopics, [key]: filteredTopics }
    }
  };
}

/**
 * Wave B: Check if topic is on cooldown
 */
export function isTopicOnCooldown(
  npc: string,
  topic: string,
  currentTurn: number,
  ledger: TopicCooldownLedger | undefined
): boolean {
  if (!ledger) return false;
  
  const key = npcKey(npc);
  const versions = ledger[key] ?? [];
  const version = versions.find(v => v.topic === topic);
  
  if (!version || !version.cooldownUntil) return false;
  
  return currentTurn < version.cooldownUntil;
}

/**
 * Wave B: Get current topic version
 */
export function getTopicVersion(
  npc: string,
  topic: string,
  ledger: TopicCooldownLedger | undefined
): number {
  if (!ledger) return 0;
  
  const key = npcKey(npc);
  const versions = ledger[key] ?? [];
  const version = versions.find(v => v.topic === topic);
  
  return version?.version ?? 0;
}

/**
 * Wave B: Format cooldown mandate for situation packet
 */
export function formatCooldownMandate(
  npc: string,
  topic: string,
  version: TopicVersion
): string {
  const turnsRemaining = version.cooldownUntil ? version.cooldownUntil - version.exhaustedAt : 0;
  const reasonText = version.revivalReason === 'evidence' 
    ? 'new evidence revealed'
    : version.revivalReason === 'contradiction'
    ? 'contradictory information found'
    : 'story beat triggered';
  
  return `TOPIC REVIVAL: ${npc} topic "${topic}" v${version.version} (${reasonText}). On cooldown for ${turnsRemaining} turns. Do not rehash until cooldown expires.`;
}
