/**
 * CampaignContract — frozen opening invariants.
 * Premades keep identity / premise / kit rails; divergence is logged, not silent.
 */

import type { GameState } from './types';
import type { CampaignBible } from './campaignBibleTypes';
import { displayAdventurerName } from './pcNameAuthority';

export interface CampaignContract {
  bibleId: string | null;
  storyName: string;
  engineMode: string;
  premise: string | null;
  characterName: string;
  startingLocation: string;
  /** Kit names frozen at New Game (equipped / starter). */
  kitRail: string[];
  /** Starter quest ids from bible. */
  starterQuestIds: string[];
  pickedHookId?: string | null;
  frozenTurn: number;
  frozenAt: number;
}

export interface CampaignDivergence {
  id: string;
  turn: number;
  field: string;
  expected: string;
  observed: string;
  note: string;
  createdAt: number;
}

const MAX_DIV = 24;

export function freezeCampaignContract(
  state: GameState,
  bible?: CampaignBible | null
): CampaignContract {
  const kitRail = (state.inventory ?? [])
    .filter((i) => i.equipped || i.itemType === 'weapon' || i.itemType === 'armor')
    .map((i) => i.name)
    .filter(Boolean)
    .slice(0, 12);
  const starterQuestIds = (state.quests ?? [])
    .filter((q) => q.type === 'main' || q.revealed)
    .map((q) => q.id)
    .slice(0, 8);

  return {
    bibleId: state.campaignBibleId ?? bible?.id ?? null,
    storyName: state.storyName,
    engineMode: state.engineMode,
    premise: state.campaignPremise ?? bible?.premise?.slice(0, 280) ?? null,
    characterName: displayAdventurerName(state.character?.name),
    startingLocation: state.currentLocation || bible?.startingLocation || '',
    kitRail,
    starterQuestIds,
    pickedHookId: state.openingEstablishment?.pickedHook ?? null,
    frozenTurn: state.turn,
    frozenAt: Date.now(),
  };
}

/**
 * Attach contract once (idempotent). Call after New Game seed settles.
 */
export function ensureCampaignContract(
  state: GameState,
  bible?: CampaignBible | null
): GameState {
  if (state.campaignContract) return state;
  return {
    ...state,
    campaignContract: freezeCampaignContract(state, bible),
    campaignDivergences: state.campaignDivergences ?? [],
  };
}

/**
 * Detect soft drifts against the frozen contract (name wipe, premise wipe, kit invent without permit).
 * Does not hard-block — records divergence for Expert / continuity UI.
 */
export function detectCampaignDivergences(state: GameState): CampaignDivergence[] {
  const c = state.campaignContract;
  if (!c) return [];
  const out: CampaignDivergence[] = [];
  const push = (field: string, expected: string, observed: string, note: string) => {
    out.push({
      id: crypto.randomUUID(),
      turn: state.turn,
      field,
      expected,
      observed,
      note,
      createdAt: Date.now(),
    });
  };

  const name = state.character?.name?.trim() ?? '';
  if (c.characterName && name && name !== c.characterName) {
    // Player corrections are allowed — only flag if name became empty or generic
    if (/^(survivor|adventurer|hero|player|you)$/i.test(name) && !/^(survivor|adventurer|hero|player|you)$/i.test(c.characterName)) {
      push('characterName', c.characterName, name, 'Character name reset to a generic label');
    }
  }

  if (c.storyName && state.storyName && state.storyName !== c.storyName) {
    push('storyName', c.storyName, state.storyName, 'Campaign title diverged from opening contract');
  }

  if (c.premise && state.campaignPremise && state.campaignPremise !== c.premise) {
    // Premise can be refined — only flag total wipe
    if (state.campaignPremise.length < 20 && c.premise.length > 40) {
      push('premise', c.premise.slice(0, 80), state.campaignPremise, 'Campaign premise collapsed');
    }
  }

  return out;
}

export function mergeCampaignDivergences(state: GameState): GameState {
  const fresh = detectCampaignDivergences(state);
  if (!fresh.length) return state;
  const prev = state.campaignDivergences ?? [];
  // Dedupe same field+observed in last few
  const merged = [...prev];
  for (const d of fresh) {
    if (merged.slice(-6).some((x) => x.field === d.field && x.observed === d.observed)) continue;
    merged.push(d);
  }
  return { ...state, campaignDivergences: merged.slice(-MAX_DIV) };
}

/** Compact prompt rails from the frozen contract. */
export function formatCampaignContractForPrompt(state: GameState): string {
  const c = state.campaignContract;
  if (!c) return '';
  return `=== CAMPAIGN CONTRACT (IMMUTABLE OPENING RAILS) ===
Story: ${c.storyName}
Bible: ${c.bibleId || 'none'}
Hero: ${c.characterName}
Start place: ${c.startingLocation || '—'}
Kit rail: ${c.kitRail.join(', ') || 'none'}
Premise: ${(c.premise || '—').slice(0, 220)}
RULES: Do not rewrite the hero's established name/identity without a player correction. Do not replace the premise with a different campaign. New named kit beyond the rail needs Introduction Permit or player naming.
=======================================================`;
}
