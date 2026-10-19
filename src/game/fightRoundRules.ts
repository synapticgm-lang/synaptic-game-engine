/**
 * Per-mode fight round rules (John 18 Oct 19:15, FIGHT2). Each mode supplies which picks take a real
 * combat turn and how the foe's turn resolves when the fight clock hits the mode's cap
 * (the cap itself comes from encounterCapsForMode). No imports beyond types, so any module can
 * register without an import cycle; the server copy registers LitRPG/RPG the same way.
 */
import type { ActiveEncounter, GameState } from './types';

export interface FightCapRound {
  state: GameState;
  receipts: string[];
  /** The PC lost by this mode's rules (LitRPG/RPG at 0 HP). Tabletop never sets it: 0 HP means death saves. */
  defeated?: boolean;
}

export interface FightRoundRules {
  /** Picks that take a real combat turn in this mode, besides fight/flee/parley (talk and idle never do). */
  isCombatTurn?: (input: string) => boolean;
  /** The foe's turn by this mode's own rules when the cap is reached on a combat turn. */
  capRound?: (state: GameState, enc: ActiveEncounter, input: string) => FightCapRound | null;
}

const RULES: Record<string, FightRoundRules> = {};

export function registerFightRoundRules(mode: string, rules: FightRoundRules): void {
  RULES[mode] = { ...RULES[mode], ...rules };
}

export function fightRoundRulesFor(mode: string | null | undefined): FightRoundRules {
  return (mode && RULES[mode]) || {};
}
