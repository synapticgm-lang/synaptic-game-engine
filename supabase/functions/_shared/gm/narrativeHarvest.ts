/**
 * Batch Y Milestone 1 — Entity Registry Lockdown
 * 
 * DELETED: Title-Case heuristic that auto-harvested capitalized tokens.
 * NEW: Only names in the entity registry can enter present[].
 * 
 * Root cause fix: Title-Case heuristic saw capitalized words in LLM garbage
 * ("Lowmarket Fence", "Rasped", "Scattered Scale") and flagged them as present[]
 * entities. Next turn, engine injected them as valid NPCs.
 * 
 * Does NOT harvest new cities/towns/shores — those stay on the premade world map.
 */

import type { GameState, LoreCard, NpcMemory } from './types.ts';
import { harvestCrowdIntoSceneFacts } from './crowdAuthority.ts';
import { harvestHookIntoSceneFacts } from './hookLock.ts';
import { looksLikeGeographyInvent, isLegalMapPlace } from './worldMapAuthority.ts';
import { isChromePersonToken, isChoicePadPersonToken, isDialogueVerbPersonToken, isFactionOrOrgToken, isPolityFactionOrPlaceToken, isRoleContactLabel } from './chromeAuthority.ts';
import { isRegisteredNpc, getRegisteredNpcs } from './entityRegistry.ts';

/**
 * Extract NPC names from prose that are in the entity registry.
 * DELETED: Title-Case heuristic (NAME_PATTERNS) that auto-harvested capitalized words.
 * NEW: Only harvest names that exist in the immutable NPC registry for this campaign.
 */
function extractRegisteredNpcs(prose: string, bibleId?: string | null): string[] {
  if (!prose?.trim()) return [];
  
  // Get all valid NPCs for this campaign
  const validNpcs = getRegisteredNpcs(bibleId);
  if (!validNpcs.length) return [];
  
  const found = new Set<string>();
  const lower = prose.toLowerCase();
  
  // Only find NPCs that are explicitly in the registry
  for (const npcName of validNpcs) {
    const npcLower = npcName.toLowerCase();
    // Simple word boundary check
    const pattern = new RegExp(`\\b${npcLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(lower)) {
      found.add(npcName);
    }
  }
  
  // Also check for explicit <npc>Name</npc> tags (if LLM uses them)
  const tagPattern = /<npc>([^<]+)<\/npc>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagPattern.exec(prose))) {
    const taggedName = (tagMatch[1] ?? '').trim();
    if (taggedName.length >= 2 && isRegisteredNpc(taggedName, bibleId)) {
      found.add(taggedName);
    }
  }
  
  return [...found].slice(0, 8);
}

function ensureNpcMemory(state: GameState, name: string, turn: number): NpcMemory[] {
  const list = [...(state.npcMemories ?? [])];
  if (list.some((n) => n.npcName.toLowerCase() === name.toLowerCase())) {
    return list.map((n) =>
      n.npcName.toLowerCase() === name.toLowerCase()
        ? {
            ...n,
            facts: [...(n.facts ?? []).slice(-8), `Seen in play T${turn}`].slice(-10),
          }
        : n
    );
  }
  return [
    ...list,
    {
      npcId: `harvest-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
      npcName: name,
      disposition: 'neutral',
      facts: [`Introduced in play T${turn}`],
      lastSeenTurn: turn,
    },
  ];
}

function ensureNpcLore(lorebook: LoreCard[], name: string, turn: number): LoreCard[] {
  if (lorebook.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.type === 'npc')) {
    return lorebook.map((c) =>
      c.name.toLowerCase() === name.toLowerCase() && c.type === 'npc'
        ? { ...c, lastSeenTurn: turn, revealed: true }
        : c
    );
  }
  return [
    ...lorebook,
    {
      id: `harvest-npc-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`,
      name,
      type: 'npc',
      keywords: [name],
      summary: `Met in play. Details unfold through conversation.`,
      lastSeenTurn: turn,
      revealed: true,
    },
  ];
}

/**
 * After GM prose: harvest named NPCs into lorebook + npcMemories.
 * Only registered NPCs from the entity registry can be harvested.
 * Geography invents (new cities) are ignored — map authority owns those.
 */
export function harvestNarrativeIntoLedger(
  state: GameState,
  prose: string,
  turn: number
): GameState {
  if (!prose?.trim()) return state;
  
  // Batch Y Milestone 1: Only harvest NPCs that are in the entity registry
  const registeredNpcs = extractRegisteredNpcs(prose, state.bibleId);
  
  if (!registeredNpcs.length) {
    return {
      ...state,
      sceneFacts: harvestHookIntoSceneFacts(
        harvestCrowdIntoSceneFacts(state.sceneFacts, prose, turn),
        prose,
        turn
      ),
    };
  }

  let next = state;
  let lorebook = [...(next.lorebook ?? [])];
  let npcMemories = [...(next.npcMemories ?? [])];
  const present = new Set([...(next.sceneFacts?.present ?? [])]);

  for (const name of registeredNpcs) {
    // Double-check: only add if registered (should always be true here)
    if (!isRegisteredNpc(name, state.bibleId)) {
      console.warn(`[narrativeHarvest Y-1] Rejected unregistered NPC: ${name}`);
      continue;
    }
    
    // Skip if this string is actually a map settlement (already canonical)
    if (isLegalMapPlace(next, name) && looksLikeGeographyInvent(name)) continue;
    
    lorebook = ensureNpcLore(lorebook, name, turn);
    npcMemories = ensureNpcMemory({ ...next, npcMemories }, name, turn);
    present.add(name);
  }

  const withNames = {
    ...next,
    lorebook,
    npcMemories,
    sceneFacts: {
      ...(next.sceneFacts ?? {}),
      present: [...present].slice(0, 12),
    },
  };
  return {
    ...withNames,
    sceneFacts: harvestHookIntoSceneFacts(
      harvestCrowdIntoSceneFacts(withNames.sceneFacts, prose, turn),
      prose,
      turn
    ),
  };
}

/** Strip / rewrite invented city/town names that are not on the world map. */
export function scrubInventedGeography(
  prose: string,
  state: GameState
): string {
  if (!prose || !state.worldAtlas?.settlements?.length) return prose;
  // Soft: replace "the city of X" when X unknown with nearest settlement name
  return prose.replace(
    /\b(?:the\s+)?(?:city|town|village|port)\s+of\s+([A-Z][a-zA-Z' -]{2,40})\b/g,
    (full, rawName: string) => {
      const name = rawName.trim();
      if (isLegalMapPlace(state, name)) return full;
      const fallback =
        state.worldAtlas!.settlements!.find((s) =>
          s.regionId === state.worldAtlas!.currentRegionId
        )?.name ?? state.worldAtlas!.settlements![0]!.name;
      return full.replace(name, fallback);
    }
  );
}
