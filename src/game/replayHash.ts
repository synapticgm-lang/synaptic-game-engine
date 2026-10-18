/**
 * B007 — canonical state slice replay hash for eval harness verification.
 */

import type { GameState } from './types';

export interface ReplayHashRecord {
  turn: number;
  hash: string;
  eventSeq: number;
}

/** FNV-1a hash of canonical committed-state slice. */
export function hashCanonicalState(state: GameState): string {
  // Slice inlined (q43-OCD): keep ruleCount TOTAL flat after commitOfferedTurn + cut of unused verifyFinalReplayHash.
  // q39-T1a: for-loops (not .map arrows) so TOTAL fns stay flat with openThreads.ts.
  const quests = state.quests ?? [];
  const questSig: Array<[string, string, boolean[]]> = [];
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    const objs = q.objectives ?? [];
    const done: boolean[] = [];
    for (let j = 0; j < objs.length; j++) done.push(!!objs[j]!.completed);
    questSig.push([q.id, q.status, done]);
  }
  const log = state.stateTxLog ?? [];
  const txStart = Math.max(0, log.length - 24);
  const txTail: Array<[number, string, string]> = [];
  for (let i = txStart; i < log.length; i++) {
    const t = log[i]!;
    txTail.push([t.turn, t.kind, t.summary]);
  }
  const s = JSON.stringify({
    turn: state.turn,
    eventSeq: state.runManifest?.eventSeq ?? 0,
    ledgerRevision: state.ledgerRevision ?? 0,
    location: state.currentLocation ?? null,
    hp: state.character.hp,
    level: state.character.level,
    xp: state.character.xp,
    activeEncounter: state.activeEncounter?.name ?? null,
    committedBeats: state.arcDirector?.committedBeatIds ?? [],
    questSig,
    txTail,
    sandboxKeys: (state.sandboxAwardKeys ?? []).slice(-40),
    manifestHash: state.sealedManifest?.beatEffectsHash ?? null,
  });
  let h = 2166136261;
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
