/**
 * B007 — canonical state slice replay hash for eval harness verification.
 */

import type { GameState } from './types';

export interface ReplayHashRecord {
  turn: number;
  hash: string;
  eventSeq: number;
}

function canonicalSlice(state: GameState): string {
  return JSON.stringify({
    turn: state.turn,
    eventSeq: state.runManifest?.eventSeq ?? 0,
    ledgerRevision: state.ledgerRevision ?? 0,
    location: state.currentLocation ?? null,
    hp: state.character.hp,
    level: state.character.level,
    xp: state.character.xp,
    activeEncounter: state.activeEncounter?.name ?? null,
    committedBeats: state.arcDirector?.committedBeatIds ?? [],
    questSig: (state.quests ?? []).map((q) => [
      q.id,
      q.status,
      (q.objectives ?? []).map((o) => o.completed),
    ]),
    txTail: (state.stateTxLog ?? [])
      .slice(-24)
      .map((t) => [t.turn, t.kind, t.summary]),
    sandboxKeys: (state.sandboxAwardKeys ?? []).slice(-40),
    manifestHash: state.sealedManifest?.beatEffectsHash ?? null,
  });
}

/** FNV-1a hash of canonical committed-state slice. */
export function hashCanonicalState(state: GameState): string {
  let h = 2166136261;
  const s = canonicalSlice(state);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function recordReplayHash(state: GameState): GameState {
  const record: ReplayHashRecord = {
    turn: state.turn,
    hash: hashCanonicalState(state),
    eventSeq: state.runManifest?.eventSeq ?? 0,
  };
  const prev = state.replayHashes ?? [];
  return { ...state, replayHashes: [...prev, record].slice(-500) };
}

export function verifyReplayChain(records: ReplayHashRecord[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1]!;
    const cur = records[i]!;
    if (cur.turn < prev.turn) {
      errors.push(`Turn regression ${prev.turn} → ${cur.turn}`);
    }
    if (cur.turn === prev.turn && cur.hash === prev.hash && cur.eventSeq === prev.eventSeq) {
      errors.push(`Duplicate hash at turn ${cur.turn}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function verifyFinalReplayHash(state: GameState, expectedFinal?: string): boolean {
  if (!expectedFinal) return true;
  return hashCanonicalState(state) === expectedFinal;
}
