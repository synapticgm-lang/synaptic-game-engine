/**
 * Edge type stub (client: src/game/stateTx.ts). Runtime helpers stay client-only.
 */

import type { GameState } from './types.ts';

export type StateTxKind =
  | 'inventory_gain'
  | 'inventory_lose'
  | 'inventory_equip'
  | 'hp'
  | 'mp'
  | 'presence'
  | 'location'
  | 'quest_reveal'
  | 'quest_complete'
  | 'quest_fail'
  | 'quest_stage'
  | 'beat_commit'
  | 'combat'
  | 'open_ask'
  | 'correction'
  | 'other';

export interface StateTx {
  id: string;
  rev: number;
  turn: number;
  kind: StateTxKind;
  summary: string;
  entity?: string;
  why?: string;
  createdAt: number;
}

const MAX_TX = 80;

function pushTx(log: StateTx[], tx: Omit<StateTx, 'id' | 'createdAt'>): StateTx[] {
  return [
    ...log,
    { ...tx, id: crypto.randomUUID(), createdAt: Date.now() },
  ].slice(-MAX_TX);
}

/** A fight round the engine rolled before GM prose (lands on the GM response turn, like a beat commit). */
export function pushCombatStateTx(state: GameState, summary: string, entity: string, why: string): GameState {
  const log = pushTx([...(state.stateTxLog ?? [])], {
    rev: Math.max(0, state.ledgerRevision ?? 0),
    turn: state.turn + 1,
    kind: 'combat',
    summary: summary.slice(0, 160),
    entity,
    why,
  });
  return { ...state, stateTxLog: log };
}
