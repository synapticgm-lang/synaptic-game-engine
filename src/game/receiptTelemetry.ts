/**
 * Receipt liveness counters for autoplay eval harness (Manus B043 / Wave 4 partial).
 */

import type { GameState } from './types';
import type { StateTxKind } from './stateTx';

export interface ReceiptCounts {
  combat: number;
  questStage: number;
  beatCommit: number;
  crisis: number;
  total: number;
}

export function countTurnReceipts(state: GameState, turn: number): ReceiptCounts {
  const txs = (state.stateTxLog ?? []).filter((t) => t.turn === turn);
  const countKind = (kind: StateTxKind) => txs.filter((t) => t.kind === kind).length;
  const crisis = txs.filter((t) =>
    /crisis|fork|branch|leverage/i.test(t.summary)
  ).length;
  return {
    combat: countKind('combat'),
    questStage: countKind('quest_stage'),
    beatCommit: countKind('beat_commit'),
    crisis,
    total: txs.length,
  };
}

/** Cumulative receipt counts across a run (for summary.json). */
export function countRunReceipts(state: GameState): ReceiptCounts {
  const txs = state.stateTxLog ?? [];
  const countKind = (kind: StateTxKind) => txs.filter((t) => t.kind === kind).length;
  const crisis = txs.filter((t) =>
    /crisis|fork|branch|leverage/i.test(t.summary)
  ).length;
  return {
    combat: countKind('combat'),
    questStage: countKind('quest_stage'),
    beatCommit: countKind('beat_commit'),
    crisis,
    total: txs.length,
  };
}
