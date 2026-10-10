/**
 * s74 M — a talk-stage objective has a giver: the opening card's lead cast (the handler / summoner of
 * this opening). The stage is open only while that giver is here, and it completes only on the giver's
 * own committed speech.
 */
import type { GameState } from './types';
import type { SpokenLine } from './tokenProse';
import { contractsForState } from './beatContract';
import { hallTalkAsksWant, openingCastNames, playerAskedWhyPulled } from './openingEstablishment';
import { peopleHere } from './chipLegality';

/** True when a beat contract marks this quest objective as heard from a giver. */
export function isTalkStageObjective(state: GameState, questId: string, objectiveIndex: number): boolean {
  return contractsForState(state).some(
    (c) => c.talkStage && c.questId === questId && c.questObjectiveIndex === objectiveIndex
  );
}

/** The giver of a talk-stage objective, or null when the opening card names no one to give it. */
export function talkStageGiver(state: GameState, questId: string, objectiveIndex: number): string | null {
  if (!isTalkStageObjective(state, questId, objectiveIndex)) return null;
  return openingCastNames(state)[0] ?? null;
}

const bare = (s: string) =>
  (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/^(?:the|a|an)\s+/, '');

/** "Handler Orrin" and "the handler beyond the grate" are both the handler. */
export function isGiverName(name: string, giver: string): boolean {
  const a = bare(name);
  const b = bare(giver);
  if (!a || !b) return false;
  return a === b || ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `);
}

export function giverIsHere(state: GameState, giver: string): boolean {
  return peopleHere(state).some((n) => isGiverName(n, giver));
}

export function giverSpoke(speech: readonly SpokenLine[] | undefined, giver: string): boolean {
  return (speech ?? []).some((l) => !!l.words?.trim() && isGiverName(l.speaker, giver));
}

const said = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** The player's line is about the stage: it asks for or demands the reason, or it is the step's own chip. */
export function playerAsksForTalkStage(playerInput: string, stepChip?: string | null): boolean {
  const line = said(playerInput);
  if (!line) return false;
  if (stepChip && line === said(stepChip)) return true;
  return playerAskedWhyPulled(playerInput) || hallTalkAsksWant(playerInput);
}
