/**
 * Normalized PYOA authored-book types (pick + dice).
 * Adapters map Umbra / Saltglass-Orisonhold / Tide-Cinderfall-Underlibrary shapes here.
 */

import type { PyoaCond, PyoaPageVariant } from './pyoaCond';

export type PyoaBookPlayType = 'pick' | 'dice';

export type PyoaBookId =
  | 'umbra-protocol'
  | 'saltglass'
  | 'vesperhold'
  | 'tide-that-did-not-return'
  | 'cinderfall'
  | 'underlibrary';

export interface PyoaBookExit {
  id: string;
  label: string;
  to: string;
  when?: PyoaCond;
  setFlags?: Record<string, string | boolean>;
  /** Dice check result lane (engine-only; never shown as a chip). */
  result?: 'full' | 'mixed' | 'miss';
  /** Dice: mixed/recovery stamina cost. */
  cost?: boolean;
  stat?: string;
  target?: number;
}

export interface PyoaBookCheck {
  stat: string;
  target: number;
  label: string;
}

export interface PyoaBookNode {
  id: string;
  page: string;
  exits: PyoaBookExit[];
  kind?: string;
  title?: string;
  place?: string;
  stake?: string;
  variants?: PyoaPageVariant[];
  /** Good ending leaf (or Umbra endingId). */
  endingId?: string | null;
  /** Death / doom leaf. */
  deathId?: string | null;
  /** Dice skill test. */
  check?: PyoaBookCheck;
  /** Dice reward keepsake. */
  grant?: string;
  /** Dice bottleneck role. */
  role?: string;
  endingKey?: string;
  endingTitle?: string;
}

export interface PyoaDiceRules {
  system: '2d6';
  version: number;
  stats: string[];
  statSpread: number[];
  stamina: number;
  luck: number;
  luckMax: number;
  targets: [number, number];
}

export interface CompiledPyoaBook {
  id: PyoaBookId;
  title: string;
  type: PyoaBookPlayType;
  startId: string;
  nodes: Map<string, PyoaBookNode>;
  nodeList: PyoaBookNode[];
  endings: string[];
  deaths: string[];
  diceRules?: PyoaDiceRules;
}

export interface PyoaDiceSheet {
  stats: Record<string, number>;
  stamina: number;
  staminaMax: number;
  luck: number;
  luckMax: number;
  keepsakes: string[];
}

/** Last plain roll the player saw (check section). */
export interface PyoaDiceRollView {
  sectionId: string;
  visit: number;
  stat: string;
  target: number;
  label: string;
  die1: number;
  die2: number;
  statBonus: number;
  total: number;
  baseOutcome: 'full' | 'mixed' | 'miss';
  outcome: 'full' | 'mixed' | 'miss';
  usedLuck: boolean;
  doubleSix: boolean;
  doubleOne: boolean;
}

export interface PyoaBookPlayState {
  bookId: PyoaBookId;
  type: PyoaBookPlayType;
  currentNodeId: string;
  visited: string[];
  flags: Record<string, string | boolean>;
  endingId?: string | null;
  deathId?: string | null;
  /** Stable seed for reload-locked rolls. */
  seed: number;
  visitCount: Record<string, number>;
  dice?: PyoaDiceSheet;
  /** Active check awaiting luck push or continue. */
  pendingRoll?: PyoaDiceRollView | null;
  /** Sections that already granted bottleneck luck / region-gate rest. */
  bottleneckSeen?: Record<string, true>;
}

export interface PyoaBookValidationIssue {
  code:
    | 'missing_start'
    | 'unknown_link'
    | 'missing_section'
    | 'unreachable_ending'
    | 'unreachable_death'
    | 'empty_book'
    | 'bad_check'
    | 'bad_meta';
  message: string;
  nodeId?: string;
  to?: string;
}

export interface PyoaBookValidationResult {
  ok: boolean;
  issues: PyoaBookValidationIssue[];
  sectionCount: number;
  endingCount: number;
  deathCount: number;
  unreachableEndingIds: string[];
  unreachableDeathIds: string[];
}
