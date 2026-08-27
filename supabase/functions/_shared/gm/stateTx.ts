/**
 * Edge type stub (client: src/game/stateTx.ts). Runtime helpers stay client-only.
 */

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
