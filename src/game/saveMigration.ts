import type { GameState, PlayPhase } from './types';
import {
  CURRENT_SAVE_REPAIR_REVISION,
  normalizeDungeonMobLedger,
} from './dungeonMobLedger';
import { applyErrorRepairs } from './errorRepairWarden';
import { debugLogger } from './debugLogger';

export type SaveRepairSeverity = 'cosmetic' | 'semantic';

export type SaveRepairResult = {
  state: GameState;
  dirty: boolean;
  notes: string[];
  severity: SaveRepairSeverity;
  shouldNotify: boolean;
};

function defaultPlayPhase(state: GameState): { playPhase: PlayPhase; changed: boolean } {
  if (state.playPhase != null) {
    return { playPhase: state.playPhase, changed: false };
  }
  return { playPhase: 'live', changed: true };
}

/**
 * Idempotent save normalization — run on every load/continue.
 * Returns dirty only when fields were actually added or corrected.
 */
export function repairSaveSchema(state: GameState): SaveRepairResult {
  if ((state.saveRepairRevision ?? 0) >= CURRENT_SAVE_REPAIR_REVISION) {
    const shouldNotify =
      (state.lastSeenSaveRepairRevision ?? 0) < CURRENT_SAVE_REPAIR_REVISION;
    return { state, dirty: false, notes: [], severity: 'cosmetic', shouldNotify };
  }

  const notes: string[] = [];
  let severity: SaveRepairSeverity = 'cosmetic';
  let dirty = false;
  let next = state;

  const note = (msg: string, kind: SaveRepairSeverity = 'cosmetic') => {
    notes.push(msg);
    dirty = true;
    if (kind === 'semantic') severity = 'semantic';
  };

  const phase = defaultPlayPhase(next);
  if (phase.changed) {
    next = { ...next, playPhase: phase.playPhase };
    note('default playPhase live', 'cosmetic');
  }

  const mobLedger = normalizeDungeonMobLedger(next, (msg) => note(msg, 'semantic'));
  if (mobLedger.changed) {
    next = mobLedger.state;
  }

  if (dirty) {
    next = {
      ...next,
      saveRepairRevision: CURRENT_SAVE_REPAIR_REVISION,
    };
  }

  const shouldNotify =
    severity === 'semantic'
    && (next.lastSeenSaveRepairRevision ?? 0) < CURRENT_SAVE_REPAIR_REVISION;

  return { state: next, dirty, notes, severity, shouldNotify };
}

export const SAVE_REPAIR_TOAST =
  'Save updated for new hazard and quest rules.';

/** Apply repair after load; optional persist is handled by caller. */
export function repairOpeningPlayGate(state: GameState): { state: GameState; changed: boolean } {
  const est = state.openingEstablishment;
  if (!est) return { state, changed: false };
  let next = state;
  let changed = false;
  if (est.complete && state.pendingGeneratedOpening) {
    next = { ...next, pendingGeneratedOpening: false };
    changed = true;
  }
  if (est.pending.length === 0 && est.complete !== true) {
    next = {
      ...next,
      openingEstablishment: { ...est, complete: true },
    };
    changed = true;
  }
  return { state: next, changed };
}

export function applySaveRepair(state: GameState): SaveRepairResult {
  let result = repairSaveSchema(state);
  const opening = repairOpeningPlayGate(result.state);
  if (opening.changed) {
    result = {
      ...result,
      state: opening.state,
      dirty: true,
      notes: [...result.notes, 'opening play gate normalized'],
    };
  }
  const errors = applyErrorRepairs(result.state);
  if (errors.dirty) {
    result = {
      ...result,
      state: errors.state,
      dirty: true,
      notes: [...result.notes, ...errors.notes.map((n) => `${n.code}: ${n.detail}`)],
      severity: errors.notes.some((n) => n.class === 'quest_coherence' || n.class === 'opening_contract')
        ? 'semantic'
        : result.severity,
    };
  }
  if (result.dirty) {
    debugLogger.record('STATE_UPDATE', 'Save schema repaired', {
      notes: result.notes,
      severity: result.severity,
      revision: CURRENT_SAVE_REPAIR_REVISION,
      errorRepair: errors.notes,
    });
  }
  return result;
}
