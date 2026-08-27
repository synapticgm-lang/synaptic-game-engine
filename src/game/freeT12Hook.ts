/**
 * 29b — Free T12 durable delta contract enforced in ArcDirector (not eval-only).
 * Qualifying: levelTick | questStage≥2 | encounterCleared | branchLocked | topicCommit.
 */

import type { BeatContract } from './beatContract';
import { contractById, resolveBiblePrefix } from './beatContract';
import type { GameState } from './types';

export function hasDurableDeltaByT12(state: GameState): boolean {
  if ((state.character?.level ?? 1) >= 2) return true;
  if ((state.arcDirector?.encounterClearedReceipts ?? []).length >= 1) return true;
  if (state.pyoaBranchLedger?.branchLocked || state.pyoaBranchLedger?.branchClosed) return true;
  if (Object.keys(state.arcDirector?.topicCommits ?? {}).length > 0) return true;
  for (const q of state.quests ?? []) {
    const done = (q.objectives ?? []).filter((o) => o.completed).length;
    if (done >= 1 && (q.status === 'active' || q.status === 'completed')) return true;
  }
  return false;
}

/**
 * Force a durable delta beat when Free window reaches T12 without one.
 * Prefer mode-honest commits: PYOA crisis/branch, LitRPG/DnD quest stage or skirmish,
 * RPG leverage/topic stage.
 */
export function forceFreeT12DurableDelta(
  state: GameState,
  committed: Set<string>
): BeatContract | null {
  if (state.turn < 12) return null;
  if (hasDurableDeltaByT12(state)) return null;
  if (state.arcDirector?.freeT12Forced) return null;

  const mode = state.engineMode;
  const prefix = resolveBiblePrefix(state);

  if (mode === 'pyoa') {
    const crisis = contractById('pyoa-beat-crisis');
    if (crisis && !committed.has(crisis.id)) return crisis;
    const branch = contractById('pyoa-beat-branch');
    if (branch && !committed.has(branch.id)) return branch;
  }

  if (mode === 'rpg') {
    const lev = contractById('rpg-beat-leverage') ?? contractById('rpg-beat-demand');
    if (lev && !committed.has(lev.id)) return lev;
  }

  if (mode === 'litrpg' || mode === 'dnd') {
    // Prefer quest stage (talk path) before spawn when not already in combat
    const stageId =
      prefix === 'summoned-pact'
        ? 'sp-beat-hear-reason'
        : prefix === 'cursed-keep'
          ? 'ck-beat-check'
          : null;
    if (stageId) {
      const stage = contractById(stageId);
      if (stage && !committed.has(stage.id)) return stage;
    }
    const skirmishId =
      prefix === 'summoned-pact'
        ? 'sp-beat-skirmish'
        : prefix === 'cursed-keep'
          ? 'ck-beat-hostility'
          : null;
    if (skirmishId && !state.activeEncounter) {
      const sk = contractById(skirmishId);
      if (sk && !committed.has(sk.id)) return sk;
    }
  }

  // Synthetic durable quest tick when no contract remains
  return {
    id: `free-t12-durable-${prefix || mode || 'run'}`,
    biblePrefix: prefix || 'any',
    kind: 'quest_stage',
    minTurn: 12,
    once: true,
    summary: 'Free T12 durable progress',
    mandate:
      'ARC BEAT (Free T12 hook): Commit a visible quest-stage advance or consequence this beat — not inspect drip.',
    questId: (state.quests ?? []).find((q) => q.status === 'active' || q.status === 'available')?.id,
    questObjectiveIndex: 0,
    xpChunk: 25,
  };
}
