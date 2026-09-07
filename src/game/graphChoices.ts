/**
 * Graph-derived pads (02ac Phase 3) — legal state edges, not LLM invent.
 * Existing 02i/02w/02aa pad locks still win (excluded families, never-CAST, closed scene).
 */

import type { GameState } from './types';
import { PlayerIntent, inferIntent } from './intentEnums';
import {
  enumerateLegalEdges as enumerateBeatEdges,
  edgesToChoiceLabels as beatEdgesToLabels,
} from './choiceEdge';
import { fleeAvailable, parleyAvailable } from './encounterTerminalFsm';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { realPresentPeople } from './chromeAuthority';
import { excludedPadFamilies, isExcludedPadLabel } from './padUniverse';
import { canHarvestAsNamedPerson } from './entityRegistry';

export type EdgeType =
  | 'attack'
  | 'flee'
  | 'parley'
  | 'talk'
  | 'travel'
  | 'inspect'
  | 'loot'
  | 'wait'
  | 'quest';

export interface StateEdge {
  type: EdgeType;
  label: string;
  intent: PlayerIntent;
  target?: string;
  cooldown: number;
}

export type ChoiceHistoryEntry = { turn: number; choiceType: EdgeType };

function isOutdoorScene(state: GameState): boolean {
  const facts = state.sceneFacts as { outdoor?: boolean; indoor?: boolean } | undefined;
  if (facts?.outdoor === true) return true;
  if (facts?.indoor === false) return true;
  if (facts?.indoor === true) return false;
  return !!matchHub(hubsForBibleId(state.campaignBibleId ?? state.bibleId), state.currentLocation);
}

function extraHubs(state: GameState): Array<{ name: string }> {
  const extra = (state as GameState & { hubs?: Array<{ name: string }> }).hubs;
  return Array.isArray(extra) ? extra : [];
}

export function classifyEdgeType(label: string): EdgeType {
  const lower = (label ?? '').toLowerCase();
  if (/\b(press the attack|attack|strike|engage|fight)\b/.test(lower)) return 'attack';
  if (/\bflee\b/.test(lower)) return 'flee';
  if (/\bparley\b/.test(lower)) return 'parley';
  if (/\b(travel|head toward|return to|go to)\b/.test(lower)) return 'travel';
  if (/\b(loot|search the (?:body|corpse)|open the (?:chest|crate))\b/.test(lower)) return 'loot';
  if (/\b(talk|ask|listen|press for)\b/.test(lower)) return 'talk';
  if (/\b(wait)\b/.test(lower)) return 'wait';
  if (/\b(quest|status|objective)\b/.test(lower)) return 'quest';
  return 'inspect';
}

/**
 * Enumerate legal state edges. Combat-only while a fight is live.
 */
export function enumerateLegalEdges(state: GameState): StateEdge[] {
  const edges: StateEdge[] = [];
  const excluded = excludedPadFamilies(state);
  const bibleId = state.campaignBibleId ?? (state as GameState & { bibleId?: string }).bibleId;

  if (state.activeEncounter) {
    edges.push({
      type: 'attack',
      label: 'Press the attack',
      intent: PlayerIntent.INTENT_ATTACK,
      cooldown: 0,
    });
    if (fleeAvailable(state.activeEncounter)) {
      edges.push({
        type: 'flee',
        label: 'Try to flee',
        intent: PlayerIntent.INTENT_FLEE,
        cooldown: 1,
      });
    }
    if (parleyAvailable(state.activeEncounter)) {
      edges.push({
        type: 'parley',
        label: 'Parley',
        intent: PlayerIntent.INTENT_PARLEY,
        cooldown: 1,
      });
    }
    return edges.filter((e) => !isExcludedPadLabel(e.label, excluded));
  }

  if (state.openingEstablishment?.complete && isOutdoorScene(state) && !excluded.has('travel')) {
    const here = (state.currentLocation ?? '').toLowerCase();
    const fromBible = hubsForBibleId(state.campaignBibleId);
    const listed = fromBible.length
      ? fromBible.map((h) => ({ name: h.name }))
      : extraHubs(state);
    for (const hub of listed) {
      if (!hub.name || hub.name.toLowerCase() === here) continue;
      edges.push({
        type: 'travel',
        label: `Travel to ${hub.name}`,
        intent: PlayerIntent.INTENT_TRAVEL_HUB,
        target: hub.name,
        cooldown: 2,
      });
      if (edges.filter((e) => e.type === 'travel').length >= 4) break;
    }
  }

  if (!excluded.has('talk')) {
    for (const npc of realPresentPeople(state.sceneFacts?.present ?? [])) {
      if (!canHarvestAsNamedPerson(npc, bibleId)) continue;
      edges.push({
        type: 'talk',
        label: `Talk to ${npc}`,
        intent: PlayerIntent.INTENT_TALK,
        target: npc,
        cooldown: 3,
      });
    }
  }

  const activeQuest = (state.quests ?? []).find((q) => q.status === 'active');
  if (activeQuest) {
    const nextObj = (activeQuest.objectives ?? []).find((o) => !o.completed);
    if (nextObj?.description) {
      edges.push({
        type: 'quest',
        label: nextObj.description.slice(0, 42),
        intent: PlayerIntent.INTENT_CONTINUE,
        cooldown: 0,
      });
    }
  }

  for (const prop of state.sceneFacts?.props ?? []) {
    if (!/chest|crate|corpse|body/i.test(prop)) continue;
    edges.push({
      type: 'loot',
      label: `Loot ${prop}`,
      intent: PlayerIntent.INTENT_SEARCH,
      target: prop,
      cooldown: 1,
    });
  }

  edges.push({
    type: 'inspect',
    label: 'Look around',
    intent: PlayerIntent.INTENT_LOOK_AROUND,
    cooldown: 5,
  });
  edges.push({
    type: 'wait',
    label: 'Wait and watch',
    intent: PlayerIntent.INTENT_WAIT,
    cooldown: 5,
  });

  return edges.filter((e) => !isExcludedPadLabel(e.label, excluded));
}

export function applySemanticCooldown(
  edges: StateEdge[],
  history: ChoiceHistoryEntry[]
): StateEdge[] {
  const currentTurn = history[history.length - 1]?.turn ?? 0;
  const window = 5;
  return edges.filter((edge) => {
    if (edge.cooldown === 0) return true;
    const recentUses = history.filter(
      (h) => currentTurn - h.turn <= window && h.choiceType === edge.type
    ).length;
    return recentUses < edge.cooldown;
  });
}

export function edgesToChoiceLabels(edges: StateEdge[]): string[] {
  return edges.map((e) => e.label);
}

export function historyFromRecentChoices(state: GameState): ChoiceHistoryEntry[] {
  const out: ChoiceHistoryEntry[] = [];
  for (const row of state.recentChoices ?? []) {
    for (const label of row.choices ?? []) {
      out.push({ turn: row.turn, choiceType: classifyEdgeType(label) });
    }
  }
  return out;
}

/** Sealed-beat pad list: graph first, then existing beat-contract edges. Cap 6. */
export function compileGraphChoiceLabels(state: GameState): string[] {
  const graph = applySemanticCooldown(enumerateLegalEdges(state), historyFromRecentChoices(state));
  const labels = edgesToChoiceLabels(graph);
  const beatLabels = beatEdgesToLabels(enumerateBeatEdges(state));
  const seen = new Set(labels.map((l) => l.toLowerCase()));
  for (const label of beatLabels) {
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels.slice(0, 6);
}

export function inferEdgeIntent(label: string): PlayerIntent {
  return inferIntent(label);
}
