/**
 * 29z3 — one rule set for "can this chip happen here?", used by the chip pipeline
 * (`resolveOfferedChoices` drops illegal chips) and the tester (`turnCheck` fails the turn on one).
 * Checks state and the last beat only: who is here, the live fight / road meeting, what the
 * travel engine can actually reach, what the prose established. No story names.
 */

import type { GameState } from './types';
import { presentNpcNames } from './npcRelationships';
import { isChromePersonToken } from './chromeAuthority';
import { isLastKillTalkPad, matchesLastKillName } from './combatAuthority';
import { encounterBlocksTravel } from './encounterTerminalFsm';
import { classifyEdgeType } from './graphChoices';
import { openingCastNames } from './openingEstablishment';
import { applyNamedHubTravel, hubsForBibleId, matchHub } from './outdoorHubs';
import { applyGraphExitTravel } from './mapEngine';
import { isInteriorPlace } from './placeAuthority';
import { playerCommittedTravel } from './travelAuthority';
import { commitTravel, isJourneyPad, isJourneyUnderway } from './travelJourney';
import { choiceNamesUnnarratedObject } from './choicePipeline';
import { gateChipProblem } from './skillGates';
import { chipHandlesSystemWindow, chipRepeatsAction, placeSaysEmpty } from './chipRules';

export type ChipProblemKind = 'ghost-chip' | 'impossible-chip' | 'unrelated-chip';

export interface ChipProblem {
  kind: ChipProblemKind;
  detail: string;
}

const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const low = (s: string | undefined | null) => norm(s).toLowerCase();

function nameTokens(name: string): string[] {
  return low(name)
    .replace(/^(?:the|a|an)\s+/, '')
    .split(/[\s'’-]+/)
    .filter((t) => t.length >= 3 && !/^(?:the|of|and)$/.test(t));
}

export function mentionsName(text: string, name: string): boolean {
  const hay = low(text);
  if (!hay) return false;
  if (hay.includes(low(name))) return true;
  return nameTokens(name).some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay));
}

const ROAD_PEOPLE: Record<string, string> = {
  traveler: 'a traveler',
  meeting: 'someone coming the other way',
  thugs: 'thugs',
  camp: 'a camp',
  villain: 'someone blocking the way',
};

/** The person or group a live, un-fought road meeting puts on this stretch. */
export function roadMeetingPeople(state: GameState): string | null {
  const enc = state.journey?.encounter;
  if (!enc || enc.engaged || !isJourneyUnderway(state)) return null;
  return ROAD_PEOPLE[enc.kind] ?? null;
}

/** Everyone who could answer at turn start: scene presence, companions, the live foe, the opening cast, a road meeting. */
export function peopleHere(state: GameState): string[] {
  const out = new Map<string, string>();
  const add = (n?: string | null) => {
    const name = norm(n);
    if (!name || isChromePersonToken(name)) return;
    if (!out.has(name.toLowerCase())) out.set(name.toLowerCase(), name);
  };
  presentNpcNames(state).forEach(add);
  (state.companions ?? []).forEach((c) => add(c.name));
  add(state.activeEncounter?.name);
  add(state.sceneFacts?.pendingEncounter?.name);
  if (openingCastStillHere(state)) openingCastNames(state).forEach(add);
  (state.sceneFacts?.anonymousRoles ?? []).forEach(add);
  add(roadMeetingPeople(state));
  return [...out.values()];
}

/** Who can hear a talk chip when the place text says the room is empty: never the opening card's cast. */
export function listenersOnEmptyText(state: GameState): string[] {
  const cast = openingCastNames(state);
  return peopleHere(state).filter((n) => !cast.some((c) => mentionsName(n, c) || mentionsName(c, n)));
}

/** The opening card's cast stays while the player is still in the card's place and has not travelled. */
function openingCastStillHere(state: GameState): boolean {
  if (state.openingEstablishment?.complete !== true) return true;
  const where = low(state.openingEstablishment?.answers?.where);
  if (!where || where !== low(state.currentLocation)) return false;
  return !(state.log ?? []).some((e) => e.role === 'player' && playerCommittedTravel(e.content));
}

export function crowdHere(state: GameState): boolean {
  const f = state.sceneFacts;
  return f?.crowd === 'present' || f?.crowd === 'sparse' || (f?.crowdCount ?? 0) > 0;
}

const TALK_CHIP =
  /^(?:talk (?:to|with)|speak (?:to|with)|ask|tell|greet|question|thank|introduce yourself to|parley with)\s+(?!about\b|for\b|around\b|what\b|who\b|why\b|how\b|where\b|if\b|whether\b)(?:the\s+)?(.+)$/i;

/** Named person or role the chip addresses; '' for an unnamed ask ("Ask what they want"). */
export function chipAddressee(label: string): { kind: 'named' | 'role' | 'none'; who: string } | null {
  const t = norm(label).replace(/[.!?]+$/, '');
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
  if (role && !/^(?:them|him|her|someone|anyone|everyone|people|nearby|around)\b/.test(role[1]!)) {
    return { kind: 'role', who: role[1]!.split(/\s+(?:about|for|what|who|why|how|where|if)\b/)[0]! };
  }
  return { kind: 'none', who: '' };
}

/** Chips that need someone to hear them (beyond talk/ask). */
const SOCIAL_CHIP =
  /^(?:offer|greet|talk your way|call (?:out|to)|bargain|haggle|plead|persuade|befriend|flatter|threaten|intimidate|bribe|refuse|accept|decline|agree|thank|apologi[sz]e|introduce yourself|use what you know|trade|barter|negotiate|reassure|comfort|warn)\b/i;

/** A question put to someone ("Who are you", "What do they want"). */
const ADDRESSED_QUESTION = /^(?:who|what|why|where|how)\b.*\b(?:you|your|they|them|their)\b/i;

const ENGINE_COMBAT_CHIP = /^(?:press the attack|try to flee|parley|flee)\b/i;

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

function gmBodies(state: GameState): string[] {
  return (state.log ?? []).filter((e) => e.role === 'gm' && norm(e.content)).map((e) => norm(e.content));
}

export function basementEstablished(state: GameState): boolean {
  const loc = low(state.currentLocation);
  const card = (state.places ?? []).find((p) => low(p.name) === loc);
  const hay = [
    state.currentLocation,
    state.locationSheet?.name,
    card?.description,
    ...(state.sceneFacts?.props ?? []),
    ...gmBodies(state).slice(-3),
  ].join(' ');
  return BASEMENT.test(hay);
}

/** Would the travel engine actually move the player on this chip? */
export function travelChipMoves(state: GameState, chip: string): boolean {
  if (applyGraphExitTravel(state, chip) !== state) return true;
  if (applyNamedHubTravel(state, chip) !== state) return true;
  const c = commitTravel(state, chip);
  if (!c.handled) return false;
  // Mid-journey every input is handled; holding on the same ground is not a move.
  return c.arrived || c.state.journey !== state.journey || c.state.currentLocation !== state.currentLocation;
}

function lastStory(state: GameState): string {
  return [...(state.log ?? [])].reverse().find((e) => e.role === 'gm' && norm(e.content))?.content ?? '';
}

/** Why this chip cannot happen in the turn-start state, or null when it can. */
export function chipProblem(state: GameState, chip: string, storyProse = lastStory(state)): ChipProblem | null {
  const label = norm(chip);
  if (!label) return null;
  const lastKill = state.sceneFacts?.lastKill;
  if (isLastKillTalkPad(label, lastKill)) {
    return { kind: 'impossible-chip', detail: `"${label}" talks to ${lastKill?.name}, who is dead` };
  }
  const here = placeSaysEmpty(state, storyProse) ? listenersOnEmptyText(state) : peopleHere(state);
  const nobody = !here.length && !crowdHere(state);

  if (chipHandlesSystemWindow(state, label)) {
    return { kind: 'impossible-chip', detail: `"${label}" handles the System window, which only the player sees and nobody can touch` };
  }

  if (isJourneyPad(label)) {
    return isJourneyUnderway(state) ? null : { kind: 'impossible-chip', detail: `"${label}" is a road chip but no journey is underway` };
  }

  const addr = chipAddressee(label);
  if (addr?.kind === 'named') {
    if (!isChromePersonToken(addr.who)) {
      if (matchesLastKillName(addr.who, lastKill) && lastKill?.outcome === 'victory') {
        return { kind: 'impossible-chip', detail: `"${label}" talks to ${addr.who}, who is dead` };
      }
      if (!here.some((p) => mentionsName(p, addr.who) || mentionsName(addr.who, p))) {
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

  const fight = !!state.activeEncounter || !!state.sceneFacts?.pendingEncounter;
  if (ENGINE_COMBAT_CHIP.test(label) && !fight) {
    return { kind: 'impossible-chip', detail: `"${label}" offers a fight move with no fight` };
  }
  if (/^loot the body of\b/i.test(label)) {
    const target = label.replace(/^loot the body of\s+/i, '');
    if (!lastKill?.remains || !matchesLastKillName(target, lastKill)) {
      return { kind: 'impossible-chip', detail: `"${label}" loots a body that is not here` };
    }
  }
  if (classifyEdgeType(label) === 'travel' && encounterBlocksTravel(state)) {
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
  if (/^(?:inspect|examine|check|search|study|read|open|investigate|take|pick up)\b/i.test(label)
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

function lastPlayerLine(state: GameState): string {
  return [...(state.log ?? [])].reverse().find((e) => e.role === 'player' && norm(e.content))?.content ?? '';
}

/**
 * The live chip list after a beat: legal here and not the action the player just took
 * (typed or tapped — an inspect chip after a typed investigate of the same thing is the same move).
 */
export function liveChips(state: GameState, chips: string[], storyProse?: string): string[] {
  const action = lastPlayerLine(state);
  return legalChips(state, chips, storyProse).filter((c) => !chipRepeatsAction(c, action));
}
