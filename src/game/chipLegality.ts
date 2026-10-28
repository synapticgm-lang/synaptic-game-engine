/**
 * 29z3 — one rule set for "can this chip happen here?", used by the chip pipeline
 * (`resolveOfferedChoices` drops illegal chips) and the tester (`turnCheck` fails the turn on one).
 * Checks state and the last beat only: who is here, the live fight / road meeting, what the
 * travel engine can actually reach, what the prose established. No story names.
 */

import type { GameState } from './types';
import { isDying } from './tabletop/roundFight';
import { isChromePersonToken } from './chromeAuthority';
import { isLastKillTalkPad, matchesLastKillName } from './combatAuthority';
import { travelPadBlocked } from './padUniverse';
import { classifyEdgeType } from './graphChoices';
import { openOpeningOffer } from './openingEstablishment';
import { applyNamedHubTravel, hubsForBibleId, matchHub } from './outdoorHubs';
import { applyGraphExitTravel } from './mapEngine';
import { isInteriorPlace } from './placeAuthority';
import { commitTravel, isJourneyPad, isJourneyUnderway } from './travelJourney';
import { boundEngineChip, choiceNamesUnnarratedObject } from './choicePipeline';
import { gateChipProblem } from './skillGates';
import { chipHandlesSystemWindow, chipRepeatsAction, placeSaysEmpty } from './chipRules';
import { crowdHere } from './sceneFacts';
import { isSystemStatusChip } from './systemHousing';
import { tabletopStepChip } from './tabletopQuestProgress';
import { hasOpenAsk } from './questGiver';
import { affordanceEntityPresent } from './sceneAffordances';
import {
  listenersOnEmptyText,
  mentionsName,
  peopleHere,
  proseSeatsListener,
  roadMeetingPeople,
} from './scenePresence';

export type ChipProblemKind = 'ghost-chip' | 'impossible-chip' | 'unrelated-chip';

export interface ChipProblem {
  kind: ChipProblemKind;
  detail: string;
}

const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const low = (s: string | undefined | null) => norm(s).toLowerCase();

export {
  crowdHere,
  listenersOnEmptyText,
  mentionsName,
  peopleHere,
  proseSeatsListener,
  roadMeetingPeople,
};

const TALK_CHIP =
  /^(?:talk (?:to|with)|speak (?:to|with)|ask|tell|greet|question|thank|introduce yourself to|parley with)\s+(?!about\b|for\b|around\b|what\b|who\b|why\b|how\b|where\b|if\b|whether\b)(?:the\s+)?(.+)$/i;

/** Named person or role the chip addresses; '' for an unnamed ask ("Ask what they want"). */
export function chipAddressee(label: string): { kind: 'named' | 'role' | 'none'; who: string } | null {
  const t = norm(label).replace(/[.!?]+$/, '');
  if (isSystemStatusChip(t)) return null;
  // T10AI — open-thread Follow-up chips address the same presence record as Talk/Ask.
  const follow = t.match(/^Follow up with\s+([^:]+?)(?:\s*:|$)/i);
  if (follow?.[1]) {
    const who = norm(follow[1]);
    if (/^[A-Z]/.test(who)) return { kind: 'named', who };
    return { kind: 'role', who: who.replace(/^(?:the|a|an)\s+/i, '') };
  }
  const m = t.match(TALK_CHIP);
  if (!m) {
    if (/^(?:ask|talk|speak|greet|tell)\b/i.test(t)) return { kind: 'none', who: '' };
    return null;
  }
  const rest = m[1]!;
  const named = rest.match(/^([A-Z][\w'’-]+(?:\s+(?:of\s+)?[A-Z][\w'’-]+)*)/);
  if (named && !/['’]s$/.test(named[1]!)) return { kind: 'named', who: named[1]! };
  if (named) return { kind: 'role', who: rest.slice(named[1]!.length).trim().split(/\s+/)[0] || named[1]! };
  const role = rest.match(/^([a-z][\w'-]+(?:\s+[a-z][\w'-]+)?)/);
  if (role && !/^(?:them|him|her|someone|anyone|everyone|somebody|anybody|everybody|whoever|whomever|people|nearby|around)\b/.test(role[1]!)) {
    return { kind: 'role', who: role[1]!.split(/\s+(?:about|for|what|who|why|how|where|if)\b/)[0]! };
  }
  return { kind: 'none', who: '' };
}

/** Chips that need someone to hear them (beyond talk/ask). */
const SOCIAL_CHIP =
  /^(?:offer|greet|talk your way|call (?:out|to)|bargain|haggle|plead|persuade|befriend|flatter|threaten|intimidate|bribe|refuse|accept|decline|agree|thank|apologi[sz]e|introduce yourself|use what you know|trade|barter|negotiate|reassure|comfort|warn)\b/i;

/** A question put to someone ("Who are you", "What do they want"). */
const ADDRESSED_QUESTION = /^(?:who|what|why|where|how)\b.*\b(?:you|your|they|them|their)\b/i;

export const ENGINE_COMBAT_CHIP = /^(?:press the attack|try to flee|parley|flee)\b/i;

const PATH_CHIP = /^(?:force|clear|break|smash|shove|batter)\b.*\b(?:path|way|door|gate|passage|through)\b/i;
/** Something in the way — a state/prose shape, not a story word. */
const BLOCKED = /\b(?:block|barr|lock|jam|stuck|rubble|debris|collaps|fallen|wedg|shut|seal|chain|bolt)/i;

const DEST_CHIP =
  /^(?:travel(?:\s+(?:toward|to|into))?|head (?:toward|to|for)|go to|return to|walk to|make for|set out for)\s+(?:the\s+)?(.+)$/i;

const VERTICAL_CHIP =
  /\b(?:upstairs|downstairs|upper (?:floor|storey|story|level)|second floor|staircase|stairs|basement|cellar|attic)\b/i;

export function isOpenGround(state: GameState): boolean {
  const loc = state.currentLocation ?? '';
  if (isInteriorPlace(loc)) return false;
  const f = state.sceneFacts as (GameState['sceneFacts'] & { outdoor?: boolean }) | undefined;
  if (f?.cameraLock?.scale === 'outdoor') return true;
  if (f?.outdoor === true || f?.indoor === false) return true;
  const road = state.journey;
  if (road && road.legsDone < road.legsTotal) return true;
  return !!matchHub(hubsForBibleId(state.campaignBibleId), loc);
}

const BASEMENT = /\b(?:basements?|cellars?|undercrofts?|crypts?|catacombs?|stairs? down|trapdoor)\b/i;

export function basementEstablished(state: GameState): boolean {
  const loc = low(state.currentLocation);
  const card = (state.places ?? []).find((p) => low(p.name) === loc);
  const hay = [
    state.currentLocation,
    state.locationSheet?.name,
    card?.description,
    ...(state.sceneFacts?.props ?? []),
    ...(state.log ?? []).filter((e) => e.role === 'gm' && norm(e.content)).map((e) => norm(e.content)).slice(-3),
  ].join(' ');
  return BASEMENT.test(hay);
}

/** A stance that answers an offer or a need: someone has to have put one to the player. */
const OFFER_ANSWER_CHIP = /^(?:refuse|accept|decline|agree|offer\s+(?:[\w'’-]+\s+)?(?:honest\s+)?help)\b/i;

const WALK_AWAY_CHIP = /^(?:walk away|go another direction)\b/i;

/** Where the travel engine would take the player on this chip, or null when it would not move them. */
function moveDestination(state: GameState, chip: string): string | null {
  const graph = applyGraphExitTravel(state, chip);
  if (graph !== state) return graph.currentLocation ?? null;
  const hub = applyNamedHubTravel(state, chip);
  if (hub !== state) return hub.currentLocation ?? null;
  const c = commitTravel(state, chip);
  if (!c.handled) return null;
  if (c.state.journey && c.state.journey !== state.journey) return c.state.journey.to;
  return c.state.currentLocation !== state.currentLocation ? c.state.currentLocation ?? null : null;
}

/** Would the travel engine actually move the player on this chip? */
export function travelChipMoves(state: GameState, chip: string): boolean {
  if (applyGraphExitTravel(state, chip) !== state) return true;
  if (applyNamedHubTravel(state, chip) !== state) return true;
  const c = commitTravel(state, chip);
  if (!c.handled) return false;
  // Mid-journey every input is handled; holding on the same ground is not a move.
  // T10AG exploration clock may replace the journey object without changing the stretch.
  if (c.arrived || c.state.currentLocation !== state.currentLocation) return true;
  const before = state.journey;
  const after = c.state.journey;
  if (before === after) return false;
  if (!before || !after) return before !== after;
  return (
    before.from !== after.from
    || before.to !== after.to
    || before.legsDone !== after.legsDone
    || before.legsTotal !== after.legsTotal
  );
}

function lastStory(state: GameState): string {
  return [...(state.log ?? [])].reverse().find((e) => e.role === 'gm' && norm(e.content))?.content ?? '';
}

/** Why this chip cannot happen in the turn-start state, or null when it can. */
export function chipProblem(state: GameState, chip: string, storyProse = lastStory(state)): ChipProblem | null {
  const label = norm(chip);
  if (!label) return null;
  // q73-DYING: unconscious at 0 HP can only take a dying chip (death save, potion, present ally).
  if (isDying(state)) {
    const dying = boundEngineChip(chip, state, storyProse);
    if (dying?.kind === 'dying') return null;
    return { kind: 'impossible-chip', detail: `"${label}" cannot be done while unconscious at 0 HP` };
  }
  // Plan §4 / OPT-1: entity-bound affordance chips beat chipLegality word guesses.
  const bound = boundEngineChip(chip, state, storyProse);
  if (bound?.kind === 'affordance' && bound.entityId) {
    if (!affordanceEntityPresent(state, bound.entityId)) {
      return {
        kind: 'ghost-chip',
        detail: `"${label}" targets ${bound.entityId}, which is not in the scene record`,
      };
    }
    return null;
  }
  const lastKill = state.sceneFacts?.lastKill;
  if (isLastKillTalkPad(label, lastKill)) {
    return { kind: 'impossible-chip', detail: `"${label}" talks to ${lastKill?.name}, who is dead` };
  }
  // Empty-room text strips opening cast; a busy beat that names the listener still seats them
  // even when cast-list / mock presence missed the ledger (T10AB-fix2).
  const emptyText = placeSaysEmpty(state, storyProse);
  const here = emptyText ? listenersOnEmptyText(state) : peopleHere(state);
  const addr = chipAddressee(label);
  const proseSeats =
    !emptyText && !!addr?.who && proseSeatsListener(storyProse, addr.who);
  const nobody = !here.length && !crowdHere(state) && !proseSeats;

  if (chipHandlesSystemWindow(state, label)) {
    return { kind: 'impossible-chip', detail: `"${label}" handles the System window, which only the player sees and nobody can touch` };
  }

  if (isJourneyPad(state, label)) {
    return isJourneyUnderway(state) ? null : { kind: 'impossible-chip', detail: `"${label}" is a road chip but no journey is underway` };
  }

  if (addr?.kind === 'named' || addr?.kind === 'role') {
    if (!isChromePersonToken(addr.who)) {
      if (matchesLastKillName(addr.who, lastKill) && lastKill?.outcome === 'victory') {
        return { kind: 'impossible-chip', detail: `"${label}" talks to ${addr.who}, who is dead` };
      }
      const ledgerHere = here.some((p) => mentionsName(p, addr.who) || mentionsName(addr.who, p));
      // T10AI — role/crowd/faction chips ("exhausted faces", "Two Crown") need the same presence
      // record as named Talk; empty-room text already stripped opening cast from `here`.
      if (!ledgerHere && !proseSeats) {
        return {
          kind: 'ghost-chip',
          detail: `"${label}" talks to ${addr.who}, who is not here (here: ${here.join(', ') || 'nobody'})`,
        };
      }
    }
  } else if ((addr || SOCIAL_CHIP.test(label) || ADDRESSED_QUESTION.test(label)) && nobody) {
    const who = addr?.who ? ` the ${addr.who}` : '';
    return { kind: 'ghost-chip', detail: `"${label}" needs${who || ' someone'} to hear it but nobody is here` };
  }

  if (OFFER_ANSWER_CHIP.test(label) && !openOpeningOffer(state)) {
    // An answer needs an open ask: from the person the chip names, else from anyone here.
    const named = here.filter((p) => mentionsName(label, p));
    const askers = (named.length ? named : here).filter((p) => hasOpenAsk(state, p));
    if (!askers.length) {
      return { kind: 'unrelated-chip', detail: `"${label}" answers an offer or a need nobody here has put to the player` };
    }
  }

  const fight = !!state.activeEncounter;
  if (WALK_AWAY_CHIP.test(label) && !fight) {
    const dest = moveDestination(state, label);
    if (!dest) return { kind: 'impossible-chip', detail: `"${label}" leads to no other exit from here` };
    // The place the player just came from: the journey's start on the road, else the previous place.
    if (low(dest) === low(isJourneyUnderway(state) ? state.journey?.from ?? '' : state.circling?.prevPlace ?? '')) {
      return { kind: 'impossible-chip', detail: `"${label}" only turns back toward ${dest}` };
    }
  }
  if (ENGINE_COMBAT_CHIP.test(label) && !fight) {
    return { kind: 'impossible-chip', detail: `"${label}" offers a fight move with no fight` };
  }
  if (/^loot the body of\b/i.test(label)) {
    const target = label.replace(/^loot the body of\s+/i, '');
    if (!lastKill?.remains || !matchesLastKillName(target, lastKill)) {
      return { kind: 'impossible-chip', detail: `"${label}" loots a body that is not here` };
    }
  }
  // q75r: same travelPadBlocked as applyOptionCooldown refill (fight / dying / road lane).
  if (classifyEdgeType(label) === 'travel' && travelPadBlocked(state)) {
    return { kind: 'impossible-chip', detail: `"${label}" travels while the fight blocks travel` };
  }
  const dest = label.match(DEST_CHIP);
  if (dest && !fight && !travelChipMoves(state, label)) {
    return { kind: 'impossible-chip', detail: `"${label}" names a destination the travel engine cannot reach from here` };
  }
  if (PATH_CHIP.test(label)) {
    const hay = [storyProse, ...(state.sceneFacts?.props ?? [])].join(' ');
    if (!BLOCKED.test(hay)) {
      return { kind: 'unrelated-chip', detail: `"${label}" forces a way through but nothing in the scene blocks the way` };
    }
  }
  if (VERTICAL_CHIP.test(label) && isOpenGround(state) && !basementEstablished(state)) {
    return { kind: 'impossible-chip', detail: `"${label}" goes to another floor on open ground` };
  }
  const gate = gateChipProblem(state, label);
  if (gate) return { kind: 'impossible-chip', detail: gate };
  // The quest step taken at its own place is an engine fact, even when the beat never named its object.
  if (/^(?:inspect|examine|check|search|study|read|open|investigate|take|pick up)\b/i.test(label)
    && low(label) !== low(tabletopStepChip(state))
    && choiceNamesUnnarratedObject(label, storyProse, state)) {
    return { kind: 'unrelated-chip', detail: `"${label}" acts on something the scene never set up` };
  }
  return null;
}

/** Keep only chips that can happen here. */
export function legalChips(state: GameState, chips: string[], storyProse?: string): string[] {
  const prose = storyProse ?? lastStory(state);
  return chips.filter((c) => !chipProblem(state, c, prose));
}

/**
 * The committed menu, judged in the state the next turn starts in: a talk chip for someone this
 * beat left elsewhere (or for nobody, when nobody is here) is not offered. Pads are built before the
 * beat commits, so presence is only final here.
 */
export function dropAbsentListenerChips(state: GameState, chips: string[], storyProse?: string): string[] {
  const prose = storyProse ?? lastStory(state);
  const kept = chips.filter((c) => chipProblem(state, c, prose)?.kind !== 'ghost-chip');
  return kept.length || !chips.length ? kept : ['Inspect the immediate surroundings'];
}

/**
 * The live chip list after a beat: legal here and not the action the player just took
 * (typed or tapped — an inspect chip after a typed investigate of the same thing is the same move).
 */
export function liveChips(state: GameState, chips: string[], storyProse?: string): string[] {
  const action = [...(state.log ?? [])].reverse().find((e) => e.role === 'player' && norm(e.content))?.content ?? '';
  return legalChips(state, chips, storyProse).filter((c) => !chipRepeatsAction(c, action));
}
