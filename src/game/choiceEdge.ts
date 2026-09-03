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
import { isPyoaBranchExhausted, isPyoaBranchLocked, isPyoaCharterClosed, isPyoaItemDestroyed } from './pyoaBranchLedger';
import {
  ensurePyoaSpine,
  legalSpineExits,
  spineBibleSupported,
  spineForceEdgeAfterDelay,
} from './pyoaSpine';
import { fleeAvailable, parleyAvailable } from './encounterTerminalFsm';
import { countLoiterFamilyStreak } from './beatFingerprint';
import { excludedPadFamilies, isExcludedEdge } from './padUniverse';

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

function closeEdgeUniverse(state: GameState, edges: ChoiceEdge[]): ChoiceEdge[] {
  const excluded = excludedPadFamilies(state);
  return dedupeEdges(edges.filter((e) => !isExcludedEdge(e, excluded)));
}

/** Enumerate legal outgoing edges for the active beat + scene (B018–B021). */
export function enumerateLegalEdges(state: GameState): ChoiceEdge[] {
  const edges: ChoiceEdge[] = [];
  const excluded = excludedPadFamilies(state);
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
    return closeEdgeUniverse(state, edges);
  }

  // PYOA spine v1 — Thornferry: pads = legal exits from current node
  if (state.engineMode === 'pyoa' && spineBibleSupported(state.campaignBibleId)) {
    const spineState = ensurePyoaSpine(state);
    const exits = legalSpineExits(spineState);
    const force = spineForceEdgeAfterDelay(spineState);
    for (const ex of exits) {
      edges.push({
        id: `spine-${ex.id}`,
        label: ex.label,
        kind: 'branch',
        risk: getSpineNodeMajor(ex.to) ? 'high' : 'med',
      });
    }
    if (spineState.pyoaSpine?.endingId && !excluded.has('leave')) {
      edges.push({
        id: 'spine-ending',
        label: 'Accept the ending that follows',
        kind: 'branch',
        risk: 'high',
      });
      return closeEdgeUniverse(state, edges);
    }
    if (!force && exits.length) {
      // One delay pad allowed before force
      edges.push({ id: 'wait', label: 'Wait and watch', kind: 'wait', risk: 'low' });
    }
    if (exits.length) return closeEdgeUniverse(state, edges);
    // Fall through to legacy PYOA edges if spine not seeded somehow
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
      // 31i/31p — no live foe yet. Under loiter treadmill, skip Scout/Ready recycle;
      // offer exit/talk instead so inspect loops cannot self-feed.
      const loiter = countLoiterFamilyStreak(state);
      if (loiter.count >= 3 && loiter.key === 'loiter') {
        if (!excluded.has('leave')) {
          edges.push({
            id: `${contract.id}-exit`,
            label: 'Leave through the nearest exit',
            kind: 'travel',
            beatId: contract.id,
          });
        }
        edges.push({
          id: `${contract.id}-ask`,
          label: 'Ask a direct question',
          kind: 'talk',
          beatId: contract.id,
        });
      } else {
        edges.push(
          {
            id: `${contract.id}-scout-threat`,
            label: 'Scout for danger',
            kind: 'inspect',
            beatId: contract.id,
          },
          {
            id: `${contract.id}-ready`,
            label: 'Ready yourself and watch',
            kind: 'inspect',
            beatId: contract.id,
            risk: 'med',
          }
        );
      }
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
  if (hub && hubBeatCount(state, hub.id) < 2 && !excluded.has('travel')) {
    for (const target of allHubs.filter((h) => h.id !== hub.id).slice(0, 2)) {
      edges.push({
        id: `travel-${target.id}`,
        label: `Travel toward ${target.name}`,
        kind: 'travel',
      });
    }
  }

  if (state.engineMode === 'litrpg') {
    // 31i — Status at most once per 4 turns; never under drought/recovery pad spam
    const mandate = state.arcDirector?.lastMandate ?? '';
    const droughtPad =
      /DROUGHT|STAGNATION|LOITER INTERRUPT/i.test(mandate) ||
      (state.sceneFacts?.engineRecoveryStreak ?? 0) > 0;
    const recentStatus = (state.recentChoices ?? [])
      .slice(-4)
      .some((r) => (r.choices ?? []).some((c) => /check status/i.test(c)));
    if (!droughtPad && !recentStatus) {
      edges.push({ id: 'litrpg-status', label: 'Check Status', kind: 'quest' });
    }
  }
  if (state.engineMode === 'dnd' && engineAllowsCombat(state) && !state.activeEncounter) {
    edges.push({ id: 'dnd-investigate', label: 'Investigate the keep', kind: 'inspect' });
  }
  if (state.engineMode === 'rpg') {
    edges.push({ id: 'rpg-leverage', label: 'Press for leverage', kind: 'leverage', risk: 'med' });
  }
  if (state.engineMode === 'pyoa') {
    if (isPyoaCharterClosed(state) || isPyoaItemDestroyed(state, 'charter')) {
      // P0-5: burned charter is gone — no Use pad.
    } else if (!isPyoaBranchExhausted(state, 'millstone-charter')) {
      edges.push({
        id: 'pyoa-charter-use',
        label: 'Use the Millstone Charter',
        kind: 'branch',
        beatId: 'pyoa-beat-branch',
      });
    } else if (!excluded.has('leave')) {
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
      if (/buy time|call for help|wait and watch/i.test(edges[i].label)) edges.splice(i, 1);
    }
    edges.push({
      id: 'pyoa-locked-consequence',
      label: 'Face the locked consequence',
      kind: 'branch',
      risk: 'high',
    });
  }

  // 29c — drop Wait under loiter / when RPG leverage is due
  // 31i — also drop Wait after engine recovery / drought (feeds same dead path)
  const mandateNow = state.arcDirector?.lastMandate ?? '';
  const skipWait =
    (state.engineMode === 'pyoa' && isPyoaBranchLocked(state)) ||
    mandateNow.includes('LOITER INTERRUPT') ||
    /DROUGHT|STAGNATION/i.test(mandateNow) ||
    (state.sceneFacts?.engineRecoveryStreak ?? 0) > 0;
  if (!skipWait) {
    edges.push({ id: 'wait', label: 'Wait and watch', kind: 'wait', risk: 'low' });
  }
  return closeEdgeUniverse(state, edges);
}

function getSpineNodeMajor(toId: string): boolean {
  return /tf-(streets|proof|gate|end)/.test(toId);
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
