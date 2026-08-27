/**
 * B018–B021 — ChoiceEdge legal enumeration from beat registry + scene graph.
 */

import type { GameState } from './types';
import {
  contractById,
  contractsForState,
  engineAllowsCombat,
} from './beatContract';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { isPyoaBranchExhausted, isPyoaBranchLocked } from './pyoaBranchLedger';
import { fleeAvailable, parleyAvailable } from './encounterTerminalFsm';

export type ChoiceEdgeKind =
  | 'combat'
  | 'talk'
  | 'travel'
  | 'inspect'
  | 'crisis'
  | 'branch'
  | 'wait'
  | 'quest'
  | 'leverage';

export interface ChoiceEdge {
  id: string;
  label: string;
  kind: ChoiceEdgeKind;
  beatId?: string;
  risk?: 'low' | 'med' | 'high';
}

function hubBeatCount(state: GameState, hubId: string): number {
  return (state.sandboxAwardKeys ?? []).filter((k) => k.startsWith(`hub-beat:${hubId}:`)).length;
}

/** Enumerate legal outgoing edges for the active beat + scene (B018–B021). */
export function enumerateLegalEdges(state: GameState): ChoiceEdge[] {
  const edges: ChoiceEdge[] = [];
  const activeBeat = state.arcDirector?.activeBeatId;
  const contract = activeBeat
    ? contractById(activeBeat.replace(/-repeat$/, ''))
    : undefined;

  if (state.activeEncounter) {
    edges.push(
      { id: 'enc-attack', label: 'Press the attack', kind: 'combat', risk: 'high' }
    );
    if (fleeAvailable(state.activeEncounter)) {
      edges.push({ id: 'enc-flee', label: 'Try to flee', kind: 'combat', risk: 'med' });
    }
    if (parleyAvailable(state.activeEncounter)) {
      edges.push({ id: 'enc-parley', label: 'Parley', kind: 'talk', risk: 'low' });
    }
    // 29a — while engaged, only encounter edges (no travel/inspect padding below)
    return dedupeEdges(edges);
  }

  if (contract) {
    if (contract.kind === 'crisis' || contract.kind === 'branch') {
      edges.push(
        {
          id: `${contract.id}-fork-a`,
          label: 'Choose the risky fork',
          kind: 'crisis',
          beatId: contract.id,
          risk: 'high',
        },
        {
          id: `${contract.id}-buy-time`,
          label: 'Buy time',
          kind: 'crisis',
          beatId: contract.id,
          risk: 'med',
        },
        {
          id: `${contract.id}-help`,
          label: 'Call for help',
          kind: 'talk',
          beatId: contract.id,
          risk: 'low',
        }
      );
    } else if (contract.kind === 'encounter') {
      edges.push(
        {
          id: `${contract.id}-fight`,
          label: 'Engage the threat',
          kind: 'combat',
          beatId: contract.id,
          risk: 'high',
        },
        {
          id: `${contract.id}-position`,
          label: 'Change position',
          kind: 'combat',
          beatId: contract.id,
          risk: 'med',
        }
      );
    } else if (
      contract.kind === 'quest_stage' ||
      contract.kind === 'leverage' ||
      contract.kind === 'check'
    ) {
      edges.push(
        {
          id: `${contract.id}-ask`,
          label: 'Ask a direct question',
          kind: 'talk',
          beatId: contract.id,
        },
        {
          id: `${contract.id}-listen`,
          label: 'Listen for the real answer',
          kind: 'talk',
          beatId: contract.id,
        }
      );
    }
  }

  const allHubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(allHubs, state.currentLocation);
  if (hub && hubBeatCount(state, hub.id) < 2) {
    for (const target of allHubs.filter((h) => h.id !== hub.id).slice(0, 2)) {
      edges.push({
        id: `travel-${target.id}`,
        label: `Travel toward ${target.name}`,
        kind: 'travel',
      });
    }
  }

  if (state.engineMode === 'litrpg') {
    edges.push({ id: 'litrpg-status', label: 'Check Status', kind: 'quest' });
  }
  if (state.engineMode === 'dnd' && engineAllowsCombat(state) && !state.activeEncounter) {
    edges.push({ id: 'dnd-investigate', label: 'Investigate the keep', kind: 'inspect' });
  }
  if (state.engineMode === 'rpg') {
    edges.push({ id: 'rpg-leverage', label: 'Press for leverage', kind: 'leverage', risk: 'med' });
  }
  if (state.engineMode === 'pyoa') {
    if (!isPyoaBranchExhausted(state, 'millstone-charter')) {
      edges.push({
        id: 'pyoa-charter-use',
        label: 'Use the Millstone Charter',
        kind: 'branch',
        beatId: 'pyoa-beat-branch',
      });
    } else {
      edges.push({
        id: 'pyoa-charter-refuse',
        label: 'Walk away from the charter',
        kind: 'branch',
        risk: 'low',
      });
    }
    const dueCrisis = contractsForState(state).find(
      (c) => c.kind === 'crisis' && !(state.arcDirector?.committedBeatIds ?? []).includes(c.id)
    );
    if (dueCrisis) {
      edges.push({
        id: `${dueCrisis.id}-crisis`,
        label: 'Face the crisis now',
        kind: 'crisis',
        beatId: dueCrisis.id,
        risk: 'high',
      });
    }
  }

  // Drop delay pads once PYOA branch locked
  if (state.engineMode === 'pyoa' && isPyoaBranchLocked(state)) {
    for (let i = edges.length - 1; i >= 0; i--) {
      if (/buy time|call for help/i.test(edges[i].label)) edges.splice(i, 1);
    }
  }

  edges.push({ id: 'wait', label: 'Wait and watch', kind: 'wait', risk: 'low' });
  return dedupeEdges(edges);
}

function dedupeEdges(edges: ChoiceEdge[]): ChoiceEdge[] {
  const seen = new Set<string>();
  return edges.filter((e) => {
    const k = e.label.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function edgesToChoiceLabels(edges: ChoiceEdge[]): string[] {
  return edges.map((e) => e.label);
}

export function findEdgeForChoice(edges: ChoiceEdge[], choice: string): ChoiceEdge | undefined {
  const lower = choice.toLowerCase();
  return edges.find((e) => e.label.toLowerCase() === lower);
}
