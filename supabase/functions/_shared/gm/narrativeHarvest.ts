/**
 * 29e — Harvest AI inventions into the ledger (NPCs / local detail), then lock them.
 * Does NOT harvest new cities/towns/shores — those stay on the premade world map.
 */

import type { GameState, LoreCard, NpcMemory } from './types.ts';
import { harvestCrowdIntoSceneFacts } from './crowdAuthority.ts';
import { harvestHookIntoSceneFacts } from './hookLock.ts';
import { looksLikeGeographyInvent, isLegalMapPlace } from './worldMapAuthority.ts';
import { isChromePersonToken, isChoicePadPersonToken, isDialogueVerbPersonToken, isFactionOrOrgToken, isPolityFactionOrPlaceToken, isRoleContactLabel } from './chromeAuthority.ts';

const NAME_PATTERNS = [
  /\b(?:named|called|is)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g,
  /\b([A-Z][a-z]{2,})\s+(?:says|said|asks|asked|replies|nods|smiles|frowns|growls|whispers)\b/g,
  /\b(?:meet|meets|met|greets|approach(?:es)?)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g,
];

const BLOCKLIST =
  /^(The|You|Your|System|Status|Quest|Turn|North|South|East|West|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Chapter|They|Them|Their|One|Press|Wait|Ready|Scout|Ask|Talk|Leave|Open|Hold|Flee|Parley|Leverage|Attack|Ahead|Behind|Beside|Nearby|Ascend|Draw|Intervene|Peer|Give|Maintain|Figure|Rasped|He|She|It)$/i;

function isBlockedHarvestName(name: string): boolean {
  if (BLOCKLIST.test(name) || isChromePersonToken(name)) return true;
  if (isChoicePadPersonToken(name) || isDialogueVerbPersonToken(name)) return true;
  if (/^figure\s+\d+$/i.test(name.trim())) return true;
  if (isPolityFactionOrPlaceToken(name) || isFactionOrOrgToken(name)) return true;
  if (isRoleContactLabel(name)) return true;
  return false;
}

function extractCandidateNames(prose: string): string[] {
  const found = new Set<string>();
  for (const re of NAME_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(prose))) {
      const name = (m[1] ?? '').trim();
      if (name.length < 3 || name.length > 40) continue;
      if (isBlockedHarvestName(name)) continue;
      if (looksLikeGeographyInvent(name)) continue;
      found.add(name);
    }
  }
  return [...found].slice(0, 6);
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
 * Geography invents (new cities) are ignored — map authority owns those.
 */
export function harvestNarrativeIntoLedger(
  state: GameState,
  prose: string,
  turn: number
): GameState {
  if (!prose?.trim()) return state;
  const names = extractCandidateNames(prose);
  if (!names.length) {
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

  for (const name of names) {
    // Skip if this string is actually a map settlement (already canonical)
    if (isBlockedHarvestName(name)) continue;
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
