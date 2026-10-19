/**
 * The one death point (Order S); nothing else writes `dead: true`.
 * LitRPG / Story RPG: 0 HP from any danger path fires Package A lifeline (recoveryConfig) — never permanent death.
 * `self` (John 11:38, 11:46) still denies the act in place at 1 HP (no coin cost).
 * Tabletop `danger` applies the table's `deathRule` (SRD 5.2.1 when deathRule is srd).
 */
import type { EngineMode, GameState } from '../types';
import type { Rng } from './dice';
import { houseRulesOf } from './houseRules';
import { advanceClock } from '../travelJourney';
import { hubsForBibleId, matchHub } from '../outdoorHubs';
import { isWeakened, recoveryConfig } from './recoveryConfig';

export type DeathCause = 'danger' | 'self';

/** Revivify's diamond (SRD): 300 GP. */
const REVIVIFY_GP = 300;

export const HOURS_LATER: Record<number, string> = { 1: 'An hour', 2: 'Two hours', 3: 'Three hours', 4: 'Four hours' };

export function lifelineFor(mode: EngineMode | undefined): string | undefined {
  return mode === 'litrpg' ? 'System lifeline' : mode === 'rpg' ? 'an old oath that will not let you go' : undefined;
}

/** Named hub with no live/pending fight and no open dungeon — same place gate as isSafeHubRest. */
export function isSafeHubPlace(state: GameState): boolean {
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter || state.activeDungeon) return false;
  return !!matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
}

/** Stamp lastSafeHub when the player is at a safe hub place. */
export function stampLastSafeHub(state: GameState): GameState {
  if (!isSafeHubPlace(state)) return state;
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  const name = hub?.name ?? state.currentLocation;
  if (!name || state.lastSafeHub === name) return state;
  return { ...state, lastSafeHub: name };
}

function startHubName(state: GameState): string {
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (hubs[0]?.name) return hubs[0].name;
  const snap = state.campaignBibleSnapshot as { startingLocation?: string } | null | undefined;
  return snap?.startingLocation || state.currentLocation || 'a safe place';
}

function wakeHub(state: GameState): string {
  return state.lastSafeHub || startHubName(state);
}

export { isWeakened } from './recoveryConfig';

/** Clear Weakened on a long rest (or when the turn window has passed). */
export function clearWeakened(state: GameState): GameState {
  if (state.weakenedUntilTurn == null && !(state.character.conditions ?? []).some((c) => /^weakened$/i.test(c))) {
    return state;
  }
  const conditions = (state.character.conditions ?? []).filter((c) => !/^weakened$/i.test(c));
  return {
    ...state,
    weakenedUntilTurn: null,
    character: { ...state.character, conditions },
  };
}

/** Recover the death-spot coin cache once when HERE matches, within the turn window. */
export function tryRecoverDeathCoinCache(state: GameState): { state: GameState; receipts: string[] } {
  const cache = state.deathCoinCache;
  const cfg = recoveryConfig(state.engineMode);
  if (!cache || cache.recovered || !cfg) return { state, receipts: [] };
  const turn = state.turn ?? 0;
  if (turn - cache.droppedTurn > cfg.coinCacheTurns) {
    return { state: { ...state, deathCoinCache: null }, receipts: ['Coin cache: gone (too late)'] };
  }
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  const spot = (cache.place ?? '').trim().toLowerCase();
  if (!here || !spot || here !== spot) return { state, receipts: [] };
  const gold = Math.max(0, (state.gold ?? 0) + cache.amount);
  return {
    state: { ...state, gold, deathCoinCache: { ...cache, recovered: true } },
    receipts: [`Coin recovered: ${cache.amount} (death cache)`],
  };
}

function leashKiller(state: GameState, deathPlace: string): GameState {
  const foe = state.activeEncounter ?? state.sceneFacts?.pendingEncounter ?? null;
  let next: GameState = {
    ...state,
    activeEncounter: null,
    roundCombat: null,
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, pendingEncounter: undefined }
      : state.sceneFacts,
  };
  if (!foe || !deathPlace) return next;
  const max = foe.maxHp || foe.hp || 1;
  const key = deathPlace.trim().toLowerCase();
  const reset = { ...foe, hp: max, maxHp: max, phase: 'engaged' as const, caught: false };
  next = {
    ...next,
    placeThreats: {
      ...(next.placeThreats ?? {}),
      [key]: {
        place: deathPlace,
        encounter: reset,
        storedTurn: next.turn ?? 0,
        lastOutcome: 'defeat' as const,
      },
    },
  };
  return next;
}

/** Package A lifeline for LitRPG / Story RPG danger (and applyPlayPhaseAfterHp at 0 HP). */
function commitLifelinePackageA(
  state: GameState,
  turn: number
): { state: GameState; receipts: string[]; fact: string; dead: boolean } {
  const cfg = recoveryConfig(state.engineMode)!;
  const lifeline = state.character.lifeline ?? lifelineFor(state.engineMode)!;
  const max = Math.max(1, state.character.maxHp || state.character.hp || 1);
  const hp = Math.max(1, Math.floor(max * cfg.recoveryHpFraction));
  const deathPlace = state.currentLocation ?? '';
  const hub = wakeHub(state);
  const gold = Math.max(0, state.gold ?? 0);
  const dropped = Math.floor(gold * (cfg.coinDropPct / 100));
  const conditions = [
    ...(state.character.conditions ?? []).filter((c) => !/^unconscious$/i.test(c) && !/^weakened$/i.test(c)),
    'Weakened',
  ];
  let next: GameState = {
    ...state,
    playPhase: 'live',
    deathSaves: null,
    currentLocation: hub,
    gold: gold - dropped,
    weakenedUntilTurn: turn + cfg.weakenedTurns,
    ambushGraceUntilTurn: turn + cfg.ambushGraceTurns,
    lifelineFiredTurn: turn,
    character: { ...state.character, hp, conditions },
    deathCoinCache:
      dropped > 0
        ? { place: deathPlace || hub, amount: dropped, droppedTurn: turn, recovered: false }
        : state.deathCoinCache ?? null,
  };
  next = leashKiller(next, deathPlace);
  next = advanceClock(next, cfg.clockHours).state;
  const systemLine =
    state.engineMode === 'litrpg'
      ? `Lifeline: System lifeline engaged — HP set to ${hp}.`
      : `Lifeline: ${lifeline} — you live; HP set to ${hp}.`;
  const receipts = [
    systemLine,
    `HP: ${Math.max(0, state.character.hp ?? 0)} → ${hp}`,
    `Wake: ${hub}`,
    `Time: +${cfg.clockHours} hours`,
    `Condition: Weakened (−${cfg.weakenedPenaltyPct}% damage and checks, ${cfg.weakenedTurns} turns or until long rest)`,
    ...(dropped ? [`Coin dropped: ${dropped} at ${deathPlace || 'the place you fell'} (recover within ${cfg.coinCacheTurns} turns)`] : []),
    `Ambush grace: ${cfg.ambushGraceTurns} turns`,
  ];
  const fact =
    state.engineMode === 'litrpg'
      ? `The System lifeline pulled you out. You woke later at ${hub}, Weakened, with part of your coin left where you fell.`
      : `Held by ${lifeline}, you were carried clear. You woke later at ${hub}, Weakened, with part of your coin left where you fell.`;
  return { state: { ...next, lifelineReceipts: receipts, lifelineFact: fact }, receipts, fact, dead: false };
}

/** `deathFact` is what the writer hears when the PC really dies (danger with no table rescue). */
export function commitDeath(
  state: GameState,
  cause: DeathCause,
  rng: Rng,
  deathFact = 'You are dead.'
): { state: GameState; receipts: string[]; fact: string; dead: boolean } {
  const conditions = (state.character.conditions ?? []).filter((c) => !/^unconscious$/i.test(c));
  const up: GameState = { ...state, deathSaves: null, character: { ...state.character, hp: 1, conditions } };
  const hp = `HP: ${Math.max(0, state.character.hp ?? 0)} → 1`;
  const lifeline = state.character.lifeline ?? lifelineFor(state.engineMode);
  if (cause === 'self' && state.engineMode === 'litrpg' && lifeline) {
    return {
      state: up,
      receipts: ['Lifeline: engaged — self-termination denied. HP set to 1.', hp],
      fact: 'The System lifeline caught you before the act was done: it was denied, and you are alive at 1 HP.',
      dead: false,
    };
  }
  if (cause === 'self' && lifeline) {
    return {
      state: up,
      receipts: [`Lifeline: ${lifeline} — you live, at 1 HP`, hp],
      fact: `You stopped short. Fate turned aside, held by ${lifeline}, and you are still alive, barely on your feet.`,
      dead: false,
    };
  }
  if (cause === 'self') {
    return {
      state: advanceClock(up, 1).state,
      receipts: ['Death rule (self): knocked out — you come to an hour later at 1 HP', hp],
      fact: 'You stopped short. The world went dark for a while, and you came to later, alive and weak.',
      dead: false,
    };
  }
  // Package A: LitRPG / RPG danger never ends the run.
  if (state.engineMode === 'litrpg' || state.engineMode === 'rpg') {
    if (state.lifelineFiredTurn === state.turn && (state.character.hp ?? 0) > 0) {
      return { state, receipts: state.lifelineReceipts ?? [], fact: state.lifelineFact ?? '', dead: false };
    }
    return commitLifelinePackageA(state, state.turn ?? 0);
  }
  const rule = houseRulesOf(state).deathRule;
  const gold = Math.max(0, state.gold ?? 0);
  if (rule === 'revive') {
    const paid = Math.min(gold, REVIVIFY_GP);
    const receipts = [
      `Death rule (revive): Revivify — back at 1 HP; ${paid} GP of your coin pays for the diamond`,
      hp,
      ...(paid ? [`Gold Spent: ${paid}`] : []),
    ];
    return {
      state: { ...up, gold: gold - paid },
      receipts,
      fact: 'You died, and someone pulled you back with a Revivify spell; part of your coin paid for the diamond it consumed. You are alive, barely on your feet.',
      dead: false,
    };
  }
  if (rule === 'mercy') {
    const hours = 1 + Math.floor(rng() * 4);
    const lost = Math.floor(gold / 2);
    const receipts = [
      `Death rule (mercy): left for dead — you wake 1d4 (${hours}) hours later at 1 HP`,
      hp,
      ...(lost ? [`Gold Lost: ${lost} (taken while you lay senseless)`] : []),
    ];
    const fact = `You were left for dead. ${HOURS_LATER[hours] ?? 'Hours'} later you wake, alive but weak${lost ? ', and your coin purse is lighter' : ''}.`;
    return { state: advanceClock({ ...up, gold: gold - lost }, hours).state, receipts, fact, dead: false };
  }
  // SRD 5.2.1: when you die, you are dead; attunement to an item ends when you die.
  const inventory = (state.inventory ?? []).map((i) => (i.attuned ? { ...i, attuned: false } : i));
  return {
    state: {
      ...state,
      inventory,
      character: { ...state.character, hp: 0 },
      deathSaves: { successes: 0, failures: 3, dead: true },
    },
    receipts: [],
    fact: deathFact,
    dead: true,
  };
}
