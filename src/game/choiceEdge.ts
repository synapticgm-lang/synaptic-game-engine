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
import { placeExits } from './placeRegistry';
import { isPyoaBranchExhausted, isPyoaBranchLocked, isPyoaCharterClosed, isPyoaItemDestroyed } from './pyoaBranchLedger';
import {
  ensurePyoaSpine,
  isAuthoredPyoaBook,
  legalSpineExits,
  spineBibleSupported,
  spineForceEdgeAfterDelay,
} from './pyoaSpine';
import { fleeAvailable, parleyAvailable } from './encounterTerminalFsm';
import { fightApproachChips } from './fightApproach';
import { countLoiterFamilyStreak } from './beatFingerprint';
import { restChip } from './recoveryRules';
import { tabletopCastChip } from './tabletop/spellCasting';
import { tabletopStepChip } from './tabletopQuestProgress';
import { shopChips } from './shopChips';
import { excludedPadFamilies, isExcludedEdge, isExcludedPadLabel } from './padUniverse';
import { affordancesCoverGenerics } from './sceneAffordances';

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
    fightApproachChips(state)
      .slice(0, 2)
      .forEach((label, i) => edges.push({ id: `enc-approach-${i}`, label, kind: 'combat', risk: 'high' }));
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
      // 02w — do not birth Leave/Travel spine labels when the universe excluded them
      if (isExcludedPadLabel(ex.label, excluded)) continue;
      edges.push({
        id: `spine-${ex.id}`,
        label: ex.label,
        kind: 'branch',
        risk: getSpineNodeMajor(ex.to) ? 'high' : 'med',
      });
    }
    if (spineState.pyoaSpine?.endingId) {
      const endingDone =
        state.playPhase === 'ended'
        || spineState.pyoaSpine.flags?.endingAccepted === '1';
      if (!endingDone && !excluded.has('leave') && !isAuthoredPyoaBook(state.campaignBibleId)) {
        edges.push({
          id: 'spine-ending',
          label: 'Accept the ending that follows',
          kind: 'branch',
          risk: 'high',
        });
      }
      return closeEdgeUniverse(state, edges);
    }
    if (!force && exits.length && !isAuthoredPyoaBook(state.campaignBibleId)) {
      // One delay pad allowed before force (Thornferry). Authored books are chips only.
      edges.push({ id: 'wait', label: 'Wait and watch', kind: 'wait', risk: 'low' });
    }
    if (exits.length || isAuthoredPyoaBook(state.campaignBibleId)) {
      return closeEdgeUniverse(state, edges);
    }
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
      // OPT-1 item 4 / TT-C1 item 5: Scout/Ready deleted when scene affordances cover the beat.
      // Under loiter with no affordances, keep an exit pad so inspect loops cannot self-feed.
      if (!affordancesCoverGenerics(state)) {
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
        }
      }
    }
  }

  const allHubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(allHubs, state.currentLocation);
  if (hub && hubBeatCount(state, hub.id) < 2 && !excluded.has('travel')) {
    // q50-MAP2 — travel edges from the place record (placeExits), not a private hub slice.
    const targets = placeExits(state, state.currentLocation);
    for (let i = 0; i < targets.length && i < 2; i++) {
      const name = targets[i]!;
      const target = matchHub(allHubs, name);
      edges.push({
        id: `travel-${target?.id ?? name}`,
        label: `Travel toward ${name}`,
        kind: 'travel',
      });
    }
  }

  const rest = state.activeEncounter ? null : restChip(state);
  const restEdge: ChoiceEdge | null = rest ? { id: 'rest', label: rest, kind: 'wait', risk: 'low' } : null;

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
    const step = tabletopStepChip(state);
    if (step) edges.push({ id: 'dnd-investigate', label: step, kind: 'inspect' });
    if (restEdge) edges.push(restEdge);
    const cast = tabletopCastChip(state);
    if (cast) edges.push({ id: 'dnd-cast', label: cast, kind: 'inspect', risk: 'low' });
    for (const shop of shopChips(state)) {
      edges.push({ id: `dnd-shop-${shop.kind}-${shop.itemId ?? shop.item}`, label: shop.label, kind: 'talk', risk: 'low' });
    }
  } else if (restEdge) {
    edges.push(restEdge);
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
  // OPT-1 item 4: default Wait deleted when affordances cover; PYOA spine Wait above is unchanged.
  if (!skipWait && !affordancesCoverGenerics(state)) {
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
