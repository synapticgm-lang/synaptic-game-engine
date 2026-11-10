/**
 * Fast-forward for the main game. One stretch is one existing travel step.
 * The destination must already have been visited. A mountain stretch costs one extra allowance turn.
 * An encounter stops the skip. Only the stretches already taken are charged.
 * PYOA does not start. No model call.
 */
import type { GameState, RoadEncounter } from './types';
import { commitTravel, rollRoadEncounter, stretchTurnCosts } from './travelJourney';
import type { StretchContext } from './travelJourney';

const RECEIPT_CAP = 240;

export interface FastForwardRequest {
  destination: string;
  /** Allowance turns the player is willing to spend. */
  maxTurns: number;
}

export interface FastForwardResult {
  state: GameState;
  charged: number;
  refused: boolean;
  stopped: 'arrived' | 'encounter' | 'allowance' | 'refused';
  receipts: string[];
  /** Allowance charged for each stretch already taken. A mountain stretch is 2. */
  stretchCosts: number[];
}

function visitedPlace(state: GameState, name: string) {
  const key = name.trim().toLowerCase();
  return (state.places ?? []).find((p) => {
    const n = (p.name ?? '').trim().toLowerCase();
    return n === key && typeof p.lastVisitedTurn === 'number';
  });
}

/** True when Skip ahead has a resolver: the place was visited and the map has a priced stretch. */
export function canSkipAheadTo(state: GameState, destination: string): boolean {
  if (state.engineMode === 'pyoa') return false;
  const place = visitedPlace(state, destination);
  if (!place) return false;
  return pricedStretches(state, place.name).length > 0;
}

/** Endurance Stride takes one allowance turn off a stretch, and never below the base cost of 1. */
function enduranceOffset(state: GameState): number {
  const skill = (state.character?.namedSkills ?? []).find((row) => row.id === 'endurance_stride');
  if (!skill) return 0;
  return (skill.level ?? skill.rank ?? 0) >= 1 ? 1 : 0;
}

function pricedStretches(state: GameState, destination: string): number[] {
  const offset = enduranceOffset(state);
  return stretchTurnCosts(state, state.currentLocation ?? '', destination).map((cost) => Math.max(1, cost - offset));
}

export function fastForwardTurnCost(state: GameState, destination: string): number[] {
  return pricedStretches(state, destination);
}

function meetingOver(enc: RoadEncounter): boolean {
  return !!enc.engaged || !!enc.escaped || !!enc.lost;
}

/**
 * A no-choice lone attack: one mugger, or ordinary wildlife.
 * A choice, a group, an elite, or a rare meeting is not this.
 */
export function loneSkipAttack(enc: RoadEncounter | null | undefined): boolean {
  if (!enc || meetingOver(enc) || enc.rare || enc.miniBoss || enc.dangerous) return false;
  if ((enc.count ?? 1) > 1) return false;
  return enc.kind === 'thugs' || enc.kind === 'wildlife';
}

function stopsSkip(enc: RoadEncounter | null | undefined): boolean {
  if (!enc || meetingOver(enc)) return false;
  return !loneSkipAttack(enc);
}

function fightLabel(enc: RoadEncounter): string {
  return enc.kind === 'thugs' ? 'Fought: a lone mugger.' : 'Fought: ordinary wildlife.';
}

function markFought(state: GameState, enc: RoadEncounter): GameState {
  if (!state.journey) return state;
  return {
    ...state,
    journey: { ...state.journey, encounter: { ...enc, engaged: true } },
  };
}

function clip(line: string | undefined): string {
  const t = (line ?? '').replace(/\s+/g, ' ').trim();
  return t.length <= RECEIPT_CAP ? t : `${t.slice(0, RECEIPT_CAP - 1)}…`;
}

/** Quote and walk. Straight line: the gap the map already has, no detour. */
export function runFastForward(state: GameState, request: FastForwardRequest): FastForwardResult {
  const empty = (stopped: FastForwardResult['stopped']): FastForwardResult => ({
    state,
    charged: 0,
    refused: true,
    stopped,
    receipts: [],
    stretchCosts: [],
  });
  if (state.engineMode === 'pyoa') return empty('refused');
  if (!Number.isInteger(request.maxTurns) || request.maxTurns < 1) return empty('refused');
  const place = visitedPlace(state, request.destination);
  if (!place) return empty('refused');
  const costs = pricedStretches(state, place.name);
  if (!costs.length) return empty('refused');
  let next = state;
  let charged = 0;
  let leg = 0;
  const taken: number[] = [];
  const receipts: string[] = [];
  let stopped: FastForwardResult['stopped'] = 'allowance';
  const fightIfLone = (): boolean => {
    const enc = next.journey?.encounter;
    if (!loneSkipAttack(enc)) return false;
    if (charged + 1 > request.maxTurns) {
      stopped = 'allowance';
      return true;
    }
    charged += 1;
    taken.push(1);
    receipts.push(clip(fightLabel(enc!)));
    next = markFought(next, enc!);
    return false;
  };
  while (leg < costs.length) {
    const pending = next.journey?.encounter;
    if (stopsSkip(pending)) {
      stopped = 'encounter';
      break;
    }
    if (fightIfLone()) break;
    const cost = costs[leg]!;
    if (charged + cost > request.maxTurns) {
      stopped = 'allowance';
      break;
    }
    const cmd = next.journey && next.journey.to.toLowerCase() === place.name.toLowerCase()
      ? 'Walk on'
      : `Travel toward ${place.name}`;
    const commit = commitTravel(next, cmd);
    if (!commit.handled && !commit.arrived) break;
    charged += cost;
    taken.push(cost);
    leg += 1;
    if (commit.receipt) receipts.push(clip(commit.receipt));
    next = commit.state;
    const met = next.journey?.encounter;
    if (stopsSkip(met) || commit.outcome === 'fight opened') {
      stopped = 'encounter';
      break;
    }
    if (commit.arrived || !next.journey) {
      const unpaid = fightIfLone();
      if (!unpaid) stopped = 'arrived';
      break;
    }
  }
  return { state: next, charged, refused: false, stopped, receipts, stretchCosts: taken };
}

/** The road's own meeting roll: sometimes nothing, sometimes one encounter for this ground. */
export function stretchEncounter(ctx: StretchContext, level: number, chanceRoll: number, kindRoll: number) {
  return rollRoadEncounter(ctx, level, chanceRoll, kindRoll);
}
