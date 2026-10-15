/**
 * The one death point (Order S); nothing else writes `dead: true`. `danger` applies the table's `deathRule`.
 * `self` (John 11:38, 11:46) never ends the character: the LitRPG / Story RPG `lifeline`, else knocked out to
 * 1 HP (tabletop: the SRD has no such trait), with no coin cost and a writer fact that carries no method.
 */
import type { EngineMode, GameState } from '../types';
import type { Rng } from './dice';
import { houseRulesOf } from './houseRules';
import { advanceClock } from '../travelJourney';

export type DeathCause = 'danger' | 'self';

/** Revivify's diamond (SRD): 300 GP. */
const REVIVIFY_GP = 300;

export const HOURS_LATER: Record<number, string> = { 1: 'An hour', 2: 'Two hours', 3: 'Three hours', 4: 'Four hours' };

export function lifelineFor(mode: EngineMode | undefined): string | undefined {
  return mode === 'litrpg' ? 'System lifeline' : mode === 'rpg' ? 'an old oath that will not let you go' : undefined;
}

/** `deathFact` is what the writer hears when the PC really dies (danger with no table rescue). */
export function commitDeath(state: GameState, cause: DeathCause, rng: Rng, deathFact = 'You are dead.'): { state: GameState; receipts: string[]; fact: string; dead: boolean } {
  const conditions = (state.character.conditions ?? []).filter((c) => !/^unconscious$/i.test(c));
  const up: GameState = { ...state, deathSaves: null, character: { ...state.character, hp: 1, conditions } };
  const hp = `HP: ${Math.max(0, state.character.hp ?? 0)} → 1`;
  const lifeline = state.character.lifeline ?? lifelineFor(state.engineMode);
  if (cause === 'self' && state.engineMode === 'litrpg' && lifeline) {
    return { state: up, receipts: ['Lifeline: engaged — self-termination denied. HP set to 1.', hp], fact: 'The System lifeline caught you before the act was done: it was denied, and you are alive at 1 HP.', dead: false };
  }
  if (cause === 'self' && lifeline) {
    return { state: up, receipts: [`Lifeline: ${lifeline} — you live, at 1 HP`, hp], fact: `You stopped short. Fate turned aside, held by ${lifeline}, and you are still alive, barely on your feet.`, dead: false };
  }
  if (cause === 'self') {
    return { state: advanceClock(up, 1).state, receipts: ['Death rule (self): knocked out — you come to an hour later at 1 HP', hp], fact: 'You stopped short. The world went dark for a while, and you came to later, alive and weak.', dead: false };
  }
  const rule = houseRulesOf(state).deathRule;
  const gold = Math.max(0, state.gold ?? 0);
  if (rule === 'revive') {
    const paid = Math.min(gold, REVIVIFY_GP);
    const receipts = [`Death rule (revive): Revivify — back at 1 HP; ${paid} GP of your coin pays for the diamond`, hp, ...(paid ? [`Gold Spent: ${paid}`] : [])];
    return { state: { ...up, gold: gold - paid }, receipts, fact: 'You died, and someone pulled you back with a Revivify spell; part of your coin paid for the diamond it consumed. You are alive, barely on your feet.', dead: false };
  }
  if (rule === 'mercy') {
    const hours = 1 + Math.floor(rng() * 4);
    const lost = Math.floor(gold / 2);
    const receipts = [`Death rule (mercy): left for dead — you wake 1d4 (${hours}) hours later at 1 HP`, hp, ...(lost ? [`Gold Lost: ${lost} (taken while you lay senseless)`] : [])];
    const fact = `You were left for dead. ${HOURS_LATER[hours] ?? 'Hours'} later you wake, alive but weak${lost ? ', and your coin purse is lighter' : ''}.`;
    return { state: advanceClock({ ...up, gold: gold - lost }, hours).state, receipts, fact, dead: false };
  }
  // SRD: attunement to an item ends when you die.
  const inventory = (state.inventory ?? []).map((i) => (i.attuned ? { ...i, attuned: false } : i));
  return { state: { ...state, inventory, character: { ...state.character, hp: 0 }, deathSaves: { successes: 0, failures: 3, dead: true } }, receipts: [], fact: deathFact, dead: true };
}
