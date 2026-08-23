/** Edge type stub (client: src/game/hookArc.ts). */

export type HookArcStage =
  | 'pre_identity'
  | 'identity'
  | 'first_choice'
  | 'consequence'
  | 'open';

export interface HookArcState {
  stage: HookArcStage;
  identityDone: boolean;
  firstChoiceDone: boolean;
  consequenceSeen: boolean;
  updatedTurn: number;
}
