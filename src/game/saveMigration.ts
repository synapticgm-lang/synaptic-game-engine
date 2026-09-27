import type { GameState, PlayPhase } from './types';
import {
  CURRENT_SAVE_REPAIR_REVISION,
  normalizeDungeonMobLedger,
} from './dungeonMobLedger';
import { applyErrorRepairs } from './errorRepairWarden';
import { debugLogger } from './debugLogger';
import { emptyWorldLedger } from './worldSim';
import { isMetNpc, resolveNpcRecord, splitCompoundCastEntry } from './npcRecords';
import { seedBibleNpcRoster } from './npcMemory';
import { resolveActiveCampaignBible } from './campaignSeed';
import { resolveOpeningHookPick } from './openingEstablishment';

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

function repairNpcRecords(state: GameState): { state: GameState; changed: boolean } {
  let changed = false;
  let next = state;

  const memories = (next.npcMemories ?? []).map((m) => {
    if (m.aliases !== undefined && m.met !== undefined && m.present !== undefined) return m;
    changed = true;
    return {
      ...m,
      aliases: m.aliases ?? [],
      met: m.met ?? isMetNpc(m),
      present: m.present ?? false,
    };
  });
  if (changed) next = { ...next, npcMemories: memories };

  const bible = resolveActiveCampaignBible(next);
  const seeded = seedBibleNpcRoster(next, bible);
  if ((seeded.npcMemories?.length ?? 0) !== (next.npcMemories?.length ?? 0)) {
    next = seeded;
    changed = true;
  }

  if (next.openingEstablishment && next.openingEstablishment.castNpcIds === undefined) {
    const pick = bible ? resolveOpeningHookPick(bible, next.seed) : null;
    next = {
      ...next,
      openingEstablishment: { ...next.openingEstablishment, castNpcIds: pick?.castNpcIds ?? [] },
    };
    changed = true;
  }

  const present = next.sceneFacts?.present;
  if (present?.some((p) => /\sand\s|&|,/i.test(p))) {
    const split: string[] = [];
    for (const entry of present) {
      if (!/\sand\s|&|,/i.test(entry)) {
        split.push(entry);
        continue;
      }
      for (const part of splitCompoundCastEntry(entry, next)) {
        const name = resolveNpcRecord(next, part)?.npcName;
        if (name && !split.includes(name)) split.push(name);
      }
    }
    next = { ...next, sceneFacts: { ...next.sceneFacts!, present: split } };
    changed = true;
  }

  return { state: next, changed };
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

  if (next.powerScaling == null) {
    next = { ...next, powerScaling: 'balanced' };
    note('default powerScaling balanced', 'cosmetic');
  }

  const ledger = next.worldLedger;
  if (ledger && !Array.isArray(ledger.factionStandings)) {
    next = {
      ...next,
      worldLedger: { ...ledger, factionStandings: [] },
    };
    note('hydrate worldLedger.factionStandings', 'cosmetic');
  } else   if (!ledger) {
    next = {
      ...next,
      worldLedger: emptyWorldLedger(),
    };
    note('hydrate empty worldLedger with factionStandings', 'cosmetic');
  }

  // Pack 12 fog-of-war: ensure discoveredLocations exists
  if (!Array.isArray(next.discoveredLocations)) {
    const startingLocation = next.currentLocation?.trim();
    next = {
      ...next,
      discoveredLocations: startingLocation ? [startingLocation] : [],
    };
    note('hydrate discoveredLocations with starting location', 'cosmetic');
  }

  const npcRecords = repairNpcRecords(next);
  if (npcRecords.changed) {
    next = npcRecords.state;
    note('27d npc records: aliases/met/present + card-only NPCs', 'cosmetic');
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
