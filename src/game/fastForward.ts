/**
 * Fast-forward for the main game. One stretch is one existing travel step.
 * The destination must already have been visited. A mountain stretch costs one extra allowance turn.
 * An encounter stops the skip. Only the stretches already taken are charged.
 * PYOA does not start. No model call.
 */
import type { GameState } from './types';
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

export function fastForwardTurnCost(state: GameState, destination: string): number[] {
  return stretchTurnCosts(state, state.currentLocation ?? '', destination);
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
  const costs = stretchTurnCosts(state, state.currentLocation ?? '', place.name);
  if (!costs.length) return empty('refused');
  let next = state;
  let charged = 0;
  let leg = 0;
  const taken: number[] = [];
  const receipts: string[] = [];
  let stopped: FastForwardResult['stopped'] = 'allowance';
  while (leg < costs.length && charged + costs[leg]! <= request.maxTurns) {
    if (next.journey?.encounter) {
      stopped = 'encounter';
      break;
    }
    const cmd = next.journey && next.journey.to.toLowerCase() === place.name.toLowerCase()
      ? 'Walk on'
      : `Travel toward ${place.name}`;
    const commit = commitTravel(next, cmd);
    if (!commit.handled && !commit.arrived) break;
    const cost = costs[leg]!;
    charged += cost;
    taken.push(cost);
    leg += 1;
    if (commit.receipt) receipts.push(clip(commit.receipt));
    next = commit.state;
    if (next.journey?.encounter || commit.event === 'meeting' || commit.outcome === 'fight opened') {
      stopped = 'encounter';
      break;
    }
    if (commit.arrived || !next.journey) {
      stopped = 'arrived';
      break;
    }
  }
  return { state: next, charged, refused: false, stopped, receipts, stretchCosts: taken };
}

/** The road's own meeting roll: sometimes nothing, sometimes one encounter for this ground. */
export function stretchEncounter(ctx: StretchContext, level: number, chanceRoll: number, kindRoll: number) {
  return rollRoadEncounter(ctx, level, chanceRoll, kindRoll);
}
