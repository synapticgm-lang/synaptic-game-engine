/**
 * 29z2 — per-turn tester check for fate-autoplay rows (read by autoThumbs).
 * Model-free. Uses who is present, the offered chips, and the player's last action.
 * P0 fails the turn: ghost / impossible chip, prose that ignores the action, an interior or
 * extra floor drawn for open ground, a quest naming a place the scene never established.
 * Stiff / abstract prose is judged by the thumbs model pass, not here (no phrase list).
 */

import type { GameState } from './types';
import { checkObligationCoverage, buildIntentContract } from './intentContract';
import { npcHoldsPcQuote, parsePlayerIntent } from './intentParser';
import { isLookAroundAction } from './sandboxXp';
import { resolveOfferedChoices } from './playTranscript';
import { hubsForBibleId } from './outdoorHubs';
import { getRegisteredLocations } from './entityRegistry';
import { handedRefs } from './completedEventPacket';
import { extractNamedPlaces } from './questPlay';
import { isLegalMapPlace } from './worldMapAuthority';
import { resolvePlayAreaMap, type ActiveDungeonState } from './mapEngine';
import { previewDungeonCard } from './dungeonCard';
import { isExplorableDungeon, isInteriorMap } from './placeAuthority';
import {
  basementEstablished,
  chipAddressee,
  chipProblem,
  ENGINE_COMBAT_CHIP,
  isOpenGround,
  listenersOnEmptyText,
  mentionsName,
  peopleHere,
  roadMeetingPeople,
} from './chipLegality';
import { crowdDepartedByRecord } from './scenePresence';
import {
  actionVerb,
  chipRepeatsAction,
  actedOnWords,
  PHYSICAL_CHIP,
  placeSaysEmpty,
  stemHit,
  WINDOW_NOUN,
} from './chipRules';
import { floorPlanIssues } from './floorPlan';
import { isCrowdFillerToken, isSystemWindowLabel } from './chromeAuthority';
import { isMetNpc, presentNpcRecords } from './npcRecords';
import { sentenceLooksLikeSelfIntro } from './npcMemory';
import { canDoKeys, locksOpenedWithoutSkill } from './skillGates';
import { terminalFightOutcome } from './engineResult';
import { escRe, fightRolls, narrationOf } from './engineFactPatterns';
import { roundCombatChips } from './tabletop/combatChips';
import { checkChipKinds } from './chipCheck';
import { resolvePlace, dungeonRoomPlace } from './places';
import { UNDERWAY_HERE, underwayHereLabel } from './locationName';
import { isRoadLabel, isTripHere, roadMeetingOver } from './travelJourney';
import { placeExits } from './placeRegistry';

export { chipAddressee, listenersOnEmptyText, peopleHere } from './chipLegality';
export { chipRepeatsAction, placeSaysEmpty } from './chipRules';

/**
 * q50-MAP2 — HERE must have a place record with exits, unless closed / road / dungeon room.
 */
export function checkRegisteredPlace(state: GameState): TurnCheckFlag[] {
  const loc = norm(state.currentLocation);
  if (!loc) return [];
  if (isRoadLabel(loc) || isTripHere(state, loc)) return [];
  if (dungeonRoomPlace(state, loc) && isExplorableDungeon(state.activeDungeon)) return [];
  if (isExplorableDungeon(state.activeDungeon)) return [];
  const place =
    resolvePlace(state.places, loc)
    ?? resolvePlace(state.places, dungeonRoomPlace(state, loc) ?? '');
  if (!place) {
    return [{ kind: 'no-registered-place', detail: `current location "${loc}" has no place record` }];
  }
  if (place.closed || place.arcStatus === 'closed') return [];
  if (placeExits(state, loc).length === 0) {
    return [{ kind: 'no-registered-place', detail: `registered place "${loc}" has no exits` }];
  }
  return [];
}

export type TurnCheckKind =
  | 'ghost-chip'
  | 'impossible-chip'
  | 'unrelated-chip'
  | 'ignored-action'
  | 'open-ground-interior'
  | 'bad-floor-plan'
  | 'unestablished-quest-place'
  | 'action-object-missing'
  | 'broken-line'
  | 'broken-prose'
  | 'sheet-forgotten'
  | 'levelup-no-change'
  | 'lock-without-skill'
  | 'plays-player'
  | 'absent-speaker'
  | 'wrong-voice'
  | 'lecture-ending'
  | 'repeated-habit'
  | 'ghost-talk'
  | 'window-touched'
  | 'repeat-chip'
  | 'verb-swapped'
  | 'dead-chip'
  | 'missing-chip-kind'
  /** q50-MAP2: HERE has no place record, or a non-closed record with empty exits. */
  | 'no-registered-place'
  /** q76c — checkTurnInvariants P0 codes (harness / check-lap only). */
  | 'travel-blocked'
  | 'dying-options'
  | 'typed-unanswered'
  | 'label-outcome'
  | 'system-ledger'

export interface TurnCheckFlag {
  kind: TurnCheckKind;
  detail: string;
}

export interface TurnCheck {
  /** Fail the turn. */
  p0: TurnCheckFlag[];
  /** Thumbs-down, not a fail. */
  down: TurnCheckFlag[];
  /** Who was here at turn start (the judge pass reads this). */
  presentNames: string[];
}


const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const low = (s: string | undefined | null) => norm(s).toLowerCase();

/** P0 chip checks against the turn-start state (same rules the chip pipeline filters on). */
export function checkChips(state: GameState, chips: string[]): TurnCheckFlag[] {
  const out: TurnCheckFlag[] = [];
  for (const chip of chips) {
    const problem = chipProblem(state, chip);
    if (problem) out.push({ kind: problem.kind, detail: problem.detail });
  }
  return out;
}

function gmBodies(state: GameState): string[] {
  return (state.log ?? []).filter((e) => e.role === 'gm' && norm(e.content)).map((e) => norm(e.content));
}

function sentencesOf(text: string): string[] {
  return norm(text)
    .split(/(?<=[.!?]["”']?)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 28);
}

function wordSet(s: string): Set<string> {
  return new Set(low(s).match(/[a-z]{3,}/g) ?? []);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n / (a.size + b.size - n);
}

/** Share of this beat's sentences that restate an earlier beat. */
export function restatedShare(prose: string, earlier: string[]): number {
  const mine = sentencesOf(prose);
  if (mine.length < 2) return 0;
  const old = earlier.flatMap(sentencesOf).map(wordSet);
  const hits = mine.filter((s) => {
    const w = wordSet(s);
    return old.some((o) => jaccard(w, o) >= 0.7);
  }).length;
  return hits / mine.length;
}

const TRAVEL_ACTION = /^(?:travel(?:\s+(?:toward|to|into))?|head (?:toward|to|for)|go to|return to|walk to)\s+(?:the\s+)?(.+)$/i;

/** tt-fix-8 — a chip the engine offered and then committed as this turn's action: the engine resolved it. */
export function engineResolvedChip(after: GameState, action: string, offered: string[]): boolean {
  const said = low(norm(action));
  const done = low(norm(after.completedEvent?.playerAction ?? ''));
  return !!done && said.startsWith(done) && offered.some((c) => low(norm(c)) === said);
}

/**
 * The typed verb and the body verbs that tell it. A named object is not enough: "search the crate"
 * told as "you kick the crate" did a different action. A failed or empty result still uses the verb.
 */
const VERB_FAMILY: { name: string; verb: RegExp; told: RegExp }[] = [
  {
    name: 'search',
    verb: /^(?:search|rummage|sift|comb|dig|hunt)$/,
    told: /\b(?:search|rummag|sift|comb|dig|dug|hunt|pat(?:s|ted)? (?:down|through)|feel (?:through|along|inside|under)|felt (?:through|along|inside|under)|go(?:es)? through|went through|turn(?:s|ed)? (?:over|out|up)|empt|nothing|check|look(?:s|ed)? (?:through|under|behind|inside|in|over)|pull(?:s|ed)? (?:aside|back|out|open)|lift|open|pri(?:es|ed)|pry|prise|lever|inside|within|contain|find|found)/i,
  },
  {
    name: 'inspect',
    verb: /^(?:inspect|examine|investigate|check|study|scan|observe|survey)$/,
    told: /\b(?:look|inspect|examin|check|stud(?:y|ie)|peer|scan|eye[sd]?\b|gaze|glanc|survey|observ|investigat|search|squint|watch|see|saw|seen|notic|spot|find|found|read|make out|made out|catch|caught|run (?:a|your|their|his|her) (?:eye|gaze)|ask(?:s|ed|ing)? (?:after|about|around)|question|inquir|enquir|(?:take|took|taking) stock|mark|count|tally|test|tri(?:es|ed)|try)/i,
  },
  {
    name: 'take',
    verb: /^(?:take|grab|pick|lift|pocket|snatch|collect)$/,
    told: /\b(?:take|took|taken|grab|pick|lift|pocket|snatch|seiz|hold|held|clutch|scoop|tuck|stow|carr|collect|close (?:your|a|their) (?:hand|fingers)|won['’]t (?:come|budge)|will not (?:come|budge))/i,
  },
  {
    name: 'open',
    verb: /^(?:open|unlatch|pry|prise|unlock)$/,
    told: /\b(?:open|pull|push|pri(?:es|ed)|prise|pry|lever|unlatch|unlock|swing|swung|creak|gives? way|gave way|lid|hinge|lock|won['’]t|will not|refus|stuck|jam|budge)/i,
  },
  {
    name: 'read',
    verb: /^(?:read|decipher)$/,
    told: /\b(?:read|decipher|word|letter|text|writ|ink|script|scrawl|rune|line|says|said)/i,
  },
  {
    name: 'climb',
    verb: /^(?:climb|scale|clamber)$/,
    told: /\b(?:climb|scal|clamber|haul|ascend|hand ?hold|foothold|pull(?:s|ed)? (?:yourself|himself|herself|themselves|up)|slip|fall|fell)/i,
  },
];

/**
 * A place is named when its whole name appears, or one of its capitalised words does as a name
 * ("the Close" for Cathedral Close). A lowercase common word ("road", "close") is not the place.
 */
function placeNamed(prose: string, place: string): boolean {
  const core = norm(place).replace(/^(?:the|a|an)\s+/i, '');
  if (!core) return false;
  if (low(prose).includes(core.toLowerCase())) return true;
  return core
    .split(/[\s'’-]+/)
    .filter((w) => /^[A-Z][a-z]{3,}$/.test(w))
    .some((w) => new RegExp(`\\b${w}\\b`).test(prose));
}

/**
 * Did the prose do the player's last action? P0 when a named talk gets no answer and no mention,
 * an unnamed talk gets no spoken line, a committed travel never names where the player went, or
 * the beat restates an earlier beat (the arrival) instead of acting.
 */
export function checkActionFollowed(
  before: GameState,
  after: GameState,
  action: string,
  prose: string,
  offered: string[] = [],
  opts?: { outcomeShown?: 'engine' }
): { p0: TurnCheckFlag[]; down: TurnCheckFlag[] } {
  const p0: TurnCheckFlag[] = [];
  const down: TurnCheckFlag[] = [];
  const act = norm(action);
  const text = norm(prose);
  if (!act || !text || /^\(crash/.test(act)) return { p0, down };
  const quoted = /["“][^"”]{2,}["”]/.test(text);
  // RC-R1: the engine combat-log line owns the close (`outcomeShown`); the record alone also credits a settled non-escape fight.
  const fight = terminalFightOutcome(after.completedEvent?.engineResult);
  const fightTold =
    opts?.outcomeShown === 'engine'
    || (!!fight && fight.outcome !== 'escaped');

  const addr = chipAddressee(act);
  // A talk shape with no addressee ("Talk your way past the thugs") still names who here it is to.
  const typedNamed = !addr || addr.kind === 'none' ? peopleHere(before).find((p) => mentionsName(act, p)) : undefined;
  const intent = parsePlayerIntent(act, before);
  const bodyAction = NON_TALK_ACTION.test(act) || isAddresseelessPhysicalAct(act);
  const talkish =
    !!addr ||
    (!bodyAction && (intent.kind === 'talk' || intent.kind === 'refuse') && !isAddresseelessPhysicalAct(act));
  // An offer or plea is followed when someone here answers it; its words are the act, not an object.
  const socialAct = !talkish && !bodyAction && TALK_NEEDS_EAR.test(act);
  // A downed or dead PC rolls a death save, not the attack the chip names: no blow is owed.
  // T10AH — SRD Unconscious: when the prose says the act cannot happen, that is correct — not ignored-action.
  const pcDown = (before.character?.hp ?? 1) <= 0 || fightRolls(after.completedEvent?.engineResult).pcCannotAct;
  const proseRefusesDownedAct =
    pcDown
    && /\b(?:cannot|can't|could not|unable|unconscious|locked inside|stayed locked)\b/i.test(text);
  const flagIgnored = (detail: string) => {
    if (!proseRefusesDownedAct) p0.push({ kind: 'ignored-action', detail });
  };

  // T10AI — empty-room text (old placeSaysEmpty) OR engine-recorded departure (narrow input).
  // Do not loosen empty-room detection to stand in for the occupancy record.
  const emptyAgree =
    placeSaysEmpty(before, text) || placeSaysEmpty(after, text);
  const departedByRecord =
    crowdDepartedByRecord(before.sceneFacts) || crowdDepartedByRecord(after.sceneFacts);
  const listenersBefore = peopleHere(before).filter((n) => !isCrowdFillerToken(n));
  const listenersAfter = peopleHere(after).filter((n) => !isCrowdFillerToken(n));
  const honestAbsent =
    (emptyAgree || departedByRecord)
    && listenersBefore.length === 0
    && listenersAfter.length === 0;

  if (addr?.kind === 'named' || addr?.kind === 'role' || (talkish && typedNamed)) {
    const who = addr?.kind === 'named' || addr?.kind === 'role' ? addr.who : typedNamed!;
    const whoHere =
      listenersBefore.some((p) => mentionsName(p, who) || mentionsName(who, p))
      || listenersAfter.some((p) => mentionsName(p, who) || mentionsName(who, p));
    if (honestAbsent || ((emptyAgree || departedByRecord) && !whoHere)) {
      // Gate and engine/prose agree: no reply owed.
    } else if (!mentionsName(text, who) && !quoted) {
      flagIgnored(`player spoke to ${who}; the prose never has ${who} answer or appear`);
    }
  } else if (talkish) {
    // Empty scene: speech to shutters / empty street needs no NPC answer — "nobody answers" is the correct beat.
    // T10Z — crowd fillers alone are not listeners (bystanders do not owe an answer).
    if (!honestAbsent && listenersBefore.length > 0) {
      const contract = buildIntentContract({ typed: act, resolvedText: act, intent, state: before });
      const cov = checkObligationCoverage(
        { ...contract, obligations: contract.obligations.filter((o) => o.kind === 'talk' || o.kind === 'refuse') },
        text
      );
      if (!cov.ok && !quoted && !(fightTold && fight!.forcedBy === 'parley')) {
        flagIgnored(`player said "${act.slice(0, 80)}"; nobody answers in the prose`);
      }
    }
  } else if (
    socialAct
    && !quoted
    && !honestAbsent
    && !listenersBefore.some((p) => mentionsName(text, p))
  ) {
    flagIgnored(`player chose "${act.slice(0, 80)}"; nobody here answers in the prose`);
  }

  const travel = act.match(TRAVEL_ACTION);
  const moved = low(after.currentLocation) !== low(before.currentLocation) || (!!after.journey && after.journey !== before.journey);
  const fighting = !!before.activeEncounter || !!before.sceneFacts?.pendingEncounter;
  if (travel && !moved && !fighting) {
    flagIgnored(`player chose to travel toward ${travel[1]}; they never left ${before.currentLocation || 'here'}`);
  }
  if (ATTACK_ACTION.test(act) && before.activeEncounter && !pcDown && !BLOW.test(text) && !fightTold) {
    flagIgnored(`player attacked ${before.activeEncounter.name}; the prose shows no blow`);
  }
  if (travel && moved) {
    // The destination itself must be named: the ground on the way ("Back streets") is not where they went.
    const dest = travel[1]!.replace(/\s+[—–-]\s+.*$/, '').trim();
    const where = [dest, after.journey?.to ?? ''].filter(Boolean);
    if (!where.some((w) => placeNamed(text, w))) {
      flagIgnored(`player travelled toward ${dest}; the prose never names ${dest}`);
    }
  }

  const looking = isLookAroundAction(act) || /^(?:wait|look|listen|rest|scout|survey|scan)\b/i.test(act);
  const blowOwned = ATTACK_ACTION.test(act) && !!before.activeEncounter;
  if (!travel && !looking) {
    const share = restatedShare(text, gmBodies(before));
    if (share >= 0.6) {
      flagIgnored(
        `the beat restates an earlier beat (${Math.round(share * 100)}% of its lines) instead of doing "${act.slice(0, 60)}"`,
      );
    }
  }

  // Typed words are read for what they act on. An engine chip the engine resolved is trusted by structure.
  if (!talkish && !socialAct && !travel && !looking && !blowOwned && !engineResolvedChip(after, act, offered)) {
    const words = actedOnWords(act);
    if (words.length && !words.some((w) => stemHit(text, w))) {
      down.push({ kind: 'action-object-missing', detail: `prose never names what the player acted on (${words.join(', ')})` });
    } else if (words.length) {
      const verb = actionVerb(act);
      const family = VERB_FAMILY.find((f) => f.verb.test(verb));
      if (family && !family.told.test(narrationOf(text))) {
        down.push({
          kind: 'verb-swapped',
          detail: `player chose to ${verb} the ${words.join(' ')}; the prose names it but never ${family.name}s it`,
        });
      }
    }
  }
  return { p0, down };
}

/** Structural broken lines only (doubled word, unclosed quote, dangling article, lowercase splice). */
export function brokenLines(prose: string): TurnCheckFlag[] {
  const out: TurnCheckFlag[] = [];
  const text = norm(prose);
  if (!text) return out;
  const dbl = text.match(/\b([a-z]{2,})\s+\1\b/i);
  if (dbl && !/^(?:had|that)$/i.test(dbl[1]!)) out.push({ kind: 'broken-line', detail: `doubled word "${dbl[0]}"` });
  const straight = (text.match(/"/g) ?? []).length;
  const open = (text.match(/“/g) ?? []).length;
  const close = (text.match(/”/g) ?? []).length;
  if (straight % 2 === 1 || open !== close) out.push({ kind: 'broken-line', detail: 'unclosed quote' });
  const dangling = text
    .split(/(?<=[.!?])\s+/)
    .find((s) => /\b(?:the|a|an|of|to|with|from)\s*[.!?]$/i.test(s));
  if (dangling) out.push({ kind: 'broken-line', detail: `line ends mid-phrase: "${dangling.slice(-60)}"` });
  const splice = text.match(/[^.…][.!?]\s+([a-z][a-z]+)\b/);
  if (splice) out.push({ kind: 'broken-line', detail: `sentence starts lowercase: "${splice[0].trim()}"` });
  return out;
}

/**
 * Sentence shapes that can only come from a broken paint or a mangled clause (P0 — the reader stops):
 * a name dropped between an article and its verb ("the stepped from"), stacked determiners
 * ("their your hands"; object-pronoun "her" + a noun phrase, as in "read her the way", is not a stack), a plural given a possessive 's ("streets's"; a capitalized name ending in s, "Arus's",
 * takes 's), a verb glued after "didn't know",
 * and "your" in narration that tells the PC by name in the third person.
 */
/** A body action, not speech: the talk check does not apply to it. */
const NON_TALK_ACTION =
  /^(?:wait|look|inspect|examine|investigate|check|study|search|rest|listen|watch|hold|walk|travel|go|leave|head|climb|press the attack|attack|strike|flee|hide|sneak|loot|take|open|read|flick|spit|kick|toss|throw|slam|spin|pull|push|drag|point|eye|stare|shake|drop|grab|shove|yank)\b/i;

/**
 * T10Y — addressee-less physical I-acts (flick salt / spit / eye a corner) are not talk turns.
 * A real ask/quote/talk chip still needs an answer; this only stops the checker overreach on body verbs.
 */
function isAddresseelessPhysicalAct(act: string): boolean {
  const t = norm(act);
  if (!t) return false;
  if (/["\u201c]/.test(t)) return false;
  if (/\b(?:ask|tell|talk|speak|say|whisper|shout|yell|call out)\b/i.test(t)) return false;
  if (/^(?:i|you)\s+/i.test(t) && NON_TALK_ACTION.test(t.replace(/^(?:i|you)\s+/i, ''))) return true;
  return NON_TALK_ACTION.test(t);
}

export function brokenProse(prose: string, pcName?: string): TurnCheckFlag[] {
  const out: TurnCheckFlag[] = [];
  const text = norm(prose);
  if (!text) return out;
  const narration = narrationOf(text);
  const hit = (re: RegExp, why: string) => {
    const m = narration.match(re);
    if (m) out.push({ kind: 'broken-prose', detail: `${why}: "${m[0].trim()}"` });
  };
  // A past-tense verb is a stem of three letters or more plus -ed, not -eed: "bed", "shed", "steed" are nouns.
  hit(
    /\b(?:the|a|an)\s+[a-z]{2,}[a-df-z]ed\s+(?:the|a|an|his|her|their|its|from|into|onto|toward|towards|across|through|past|off|out of|between|on|at)\s/i,
    'a name is missing before its verb'
  );
  hit(/\b(?:the|a|an|their|his|its|my|our)\s+(?:your|their|his|her|my|the)\s+[a-z]/i, 'stacked determiners');
  hit(/\b[a-z]{3,}s['’]s\b/, 'plural with a possessive s');
  hit(/\b(?:didn['’]t|did not|don['’]t|doesn['’]t|never) know\s+[a-z]+ed\s+(?:the|a|an|their|his|her|its)\b/i, 'mangled clause');
  const name = norm(pcName);
  if (name && name.length >= 2) {
    const first = name.split(/\s+/)[0]!;
    const told = new RegExp(`\\b${escRe(first)}\\b`).test(narration);
    if (told && /\byour\b/i.test(narration) && !/\byou\b/i.test(narration)) {
      const m = narration.match(/\byour\s+[a-z]+/i);
      out.push({ kind: 'broken-prose', detail: `"${m?.[0] ?? 'your'}" in narration that tells ${first} in the third person` });
    }
  }
  return out;
}

const ATTACK_ACTION = /^(?:press the attack|attack|strike|hit|swing at|slash|stab|charge|fight|face)\b/i;
/** Contact in a fight beat: a blow landing, missing, or being turned aside. */
const BLOW =
  /\b(?:strik|struck|hit|slash|cut|swing|swung|stab|thrust|lung|parr|block|miss|drove|drive|slam|smash|bash|club|kick|punch|bit|bite|clash|batter|hack|chop|pierc|knock|blow|blade (?:bit|caught|found)|steel (?:bit|rang|met))/i;

/** The map the player would see (same path as the Map modal). */
function drawnMap(state: GameState): ActiveDungeonState | null {
  if (state.activeDungeon) return state.activeDungeon;
  const place = norm(state.currentLocation);
  if (!place) return null;
  return resolvePlayAreaMap(null, place, [], state.currentCoordinates, state.seed || state.saveId || 'interior', {
    underground: (site) => previewDungeonCard(state, site),
  });
}

function openGroundMapIssue(state: GameState): string | null {
  if (!isOpenGround(state)) return null;
  const map = drawnMap(state);
  const explorable: boolean = isExplorableDungeon(map);
  if (!map || explorable) return null;
  const zs = new Set(map.nodes.map((n) => n.zLevel ?? 0));
  const basement = basementEstablished(state);
  if (isInteriorMap(map) && !basement) return `an interior floor plan (${map.dungeonName}) is drawn for open ground at ${state.currentLocation}`;
  if ([...zs].some((z) => z > 0)) return `an upper floor is drawn for open ground at ${state.currentLocation}`;
  if (!basement && [...zs].some((z) => z < 0)) return `a basement is drawn for open ground at ${state.currentLocation} with no basement in the scene`;
  return null;
}

function establishedPlace(state: GameState, name: string, prose: string[]): boolean {
  const key = low(name);
  if (!key) return true;
  if (isLegalMapPlace(state, name)) return true;
  const known = [
    state.currentLocation,
    state.previousLocationSheet?.name,
    state.journey?.to,
    state.journey?.from,
    state.journey?.ground,
    ...hubsForBibleId(state.campaignBibleId).map((h) => h.name),
    ...(state.places ?? []).flatMap((p) => [p.name, p.loreName, ...(p.aliases ?? [])]),
  ]
    .map((n) => low(n))
    .filter((n) => n.length >= 3);
  if (known.some((k) => k === key || k.includes(key) || key.includes(k))) return true;
  return prose.some((p) => low(p).includes(key));
}

function questPlaceNames(q: NonNullable<GameState['quests']>[number]): string[] {
  const visible = [q.name, q.whatNext, ...(q.objectives ?? []).map((o) => o.description)].filter(Boolean).join('. ');
  return [q.location, q.leadsTo, ...extractNamedPlaces(visible)].map((n) => norm(n)).filter((n) => n.length >= 3);
}

/** P0 when a quest revealed or moved this turn names a place the world and the prose never set up. */
export function checkQuestPlaces(before: GameState, after: GameState): TurnCheckFlag[] {
  const out: TurnCheckFlag[] = [];
  const prior = new Map((before.quests ?? []).map((q) => [q.id, q]));
  const prose = gmBodies(after);
  const people = new Set([...peopleHere(after), ...(after.npcMemories ?? []).map((m) => m.npcName)].map(low));
  for (const q of after.quests ?? []) {
    if (!q.revealed) continue;
    const old = prior.get(q.id);
    const changed = !old || !old.revealed || old.location !== q.location || old.whatNext !== q.whatNext;
    if (!changed) continue;
    for (const place of questPlaceNames(q)) {
      if (people.has(low(place))) continue;
      if (!establishedPlace(after, place, prose)) {
        out.push({ kind: 'unestablished-quest-place', detail: `quest "${q.name}" names ${place}, which the scene never established` });
      }
    }
  }
  return out;
}

export function checkPlayerTurn(
  before: GameState,
  after: GameState,
  row: {
    offeredChoices?: string[];
    playerInput?: string;
    fatePick?: string;
    gmText?: string;
    previousPick?: string;
    outcomeShown?: 'engine';
  }
): TurnCheck {
  const prose = row.gmText ?? '';
  const action = row.playerInput || row.fatePick || '';
  const followed = checkActionFollowed(before, after, action, prose, row.offeredChoices ?? [], {
    outcomeShown: row.outcomeShown,
  });
  const p0 = [
    ...checkChips(before, row.offeredChoices ?? []),
    ...checkChosenChip(before, row.fatePick || action),
    ...followed.p0,
    ...checkQuestPlaces(before, after),
    ...checkRegisteredPlace(before),
    ...brokenProse(prose, after.character?.name),
    ...checkSheetMemory(before, prose),
    ...checkLevelUpChanges(before, after),
    ...locksOpenedWithoutSkill(before, after).map((detail) => ({ kind: 'lock-without-skill' as const, detail })),
  ];
  const chips = row.offeredChoices ?? [];
  // This turn's text sits above the list the player picks from next, not the list they just picked from.
  const nextChips = resolveOfferedChoices(after);
  p0.push(
    ...checkEmptyRoomTalk(after, nextChips.filter((c) => !chipProblem(after, c)), prose, action),
    ...checkSystemWindow(after, nextChips, prose)
  );
  const crimes = checkPlayCrimes(before, after, action, prose);
  p0.push(...crimes.p0);
  const mapIssue = openGroundMapIssue(after);
  if (mapIssue && openGroundMapIssue(before) !== mapIssue) p0.push({ kind: 'open-ground-interior', detail: mapIssue });
  const planIssues = drawnPlanIssues(after);
  const oldPlanIssues = new Set(drawnPlanIssues(before));
  const newPlanIssues = planIssues.filter((i) => !oldPlanIssues.has(i));
  if (newPlanIssues.length) {
    p0.push({ kind: 'bad-floor-plan', detail: `${drawnMap(after)?.dungeonName ?? 'map'}: ${newPlanIssues.slice(0, 3).join('; ')}` });
  }
  return {
    p0,
    down: [...followed.down, ...checkChipKinds(before, chips), ...brokenLines(prose), ...crimes.down, ...checkRepeatChips(chips, row.previousPick ?? previousPlayerAction(before), fightRoundChips(before, chips))],
    presentNames: peopleHere(before),
  };
}

/** A live fight's round choices (tabletop round chips, the death save, the engine's fight moves). */
function fightRoundChips(state: GameState, chips: string[]): string[] {
  const round = new Set((roundCombatChips(state) ?? []).map((c) => low(norm(c))));
  return chips.filter((c) => round.has(low(norm(c))) || (!!state.activeEncounter && ENGINE_COMBAT_CHIP.test(norm(c))));
}

/**
 * The chips were offered before this turn's pick, so a repeat is measured against the turn before it. The turn
 * record's own previous pick (ow.previousPick) wins; the log is the fallback.
 */
function previousPlayerAction(before: GameState): string {
  const last = [...(before.log ?? [])].reverse().find((e) => e.role === 'player' && norm(e.content));
  return norm(last?.content);
}

const TALK_NEEDS_EAR =
  /^(?:offer|greet|talk your way|call (?:out|to)|bargain|haggle|plead|persuade|befriend|threaten|intimidate|bribe|refuse|accept|decline|agree|thank|apologi[sz]e|introduce yourself|negotiate|reassure|warn)\b|^(?:who|what|why|where|how)\b.*\b(?:you|your|they|them|their)\b/i;
const WHO_ASK = /\bwho are you\b/i;

/**
 * Talk on empty-room text. A talk chip is illegal when the beat or the place card says nobody is here
 * and no listener is left once the opening cast is dropped. Someone here whom the beat's own narration
 * names is still a listener. A "who are you" in the prose is flagged on empty-room text whoever the
 * people list holds (unless the player typed it).
 */
export function checkEmptyRoomTalk(state: GameState, chips: string[], prose: string, action = ''): TurnCheckFlag[] {
  if (!placeSaysEmpty(state, prose)) return [];
  const out: TurnCheckFlag[] = [];
  const narration = narrationOf(prose);
  const ears = [...new Set([...listenersOnEmptyText(state), ...peopleHere(state).filter((p) => mentionsName(narration, p))])];
  for (const chip of chips) {
    const label = norm(chip);
    const addr = chipAddressee(label);
    if (!addr && !TALK_NEEDS_EAR.test(label)) continue;
    const addressed = addr?.kind === 'named' || addr?.kind === 'role';
    if (addressed && ears.some((p) => mentionsName(p, addr!.who) || mentionsName(addr!.who, p))) continue;
    if (!addressed && ears.length) continue;
    out.push({ kind: 'ghost-chip', detail: `"${label}" talks to someone, but the place text says nobody is here` });
  }
  if (WHO_ASK.test(prose) && !WHO_ASK.test(action)) {
    out.push({ kind: 'ghost-talk', detail: 'the prose asks "who are you" in a place its own text says is empty' });
  }
  return out;
}

const WINDOW_QUALIFIED = /\b(?:blue|system|status)\s+(?:panel|window|screen)\b/i;
const WINDOW_PHYSICAL =
  /\b(?:touch|tap(?:s|ped)?\b|press|push|poke|prod|grab|grasp|grip|lift|weigh|weight|heavy|surface|rippl|heat|warmth|textur|smooth|rough|knock|rap(?:s|ped)?\b|brush|strok|solid|vibrat|shatter)/i;
const WINDOW_NOT_PHYSICAL =
  /\b(?:pass(?:es|ed)? (?:straight |clean |right )?through|nothing to (?:touch|hold|grip)|can(?:not|['’]t) (?:touch|feel|hold)|only you (?:can )?see)/i;
function systemWindowInPlay(state: GameState, prose: string): boolean {
  if (state.engineMode !== 'litrpg') return false;
  if ((state.sceneFacts?.props ?? []).some((p) => isSystemWindowLabel(p))) return true;
  return [prose, ...gmBodies(state).slice(-3)].some((t) => WINDOW_QUALIFIED.test(t));
}

/**
 * The LitRPG System window is not a thing in the room: only the PC sees it and nobody can touch it.
 * P0 when the prose gives it a surface, heat, weight or a touch, or a chip handles it like an object.
 */
export function checkSystemWindow(state: GameState, chips: string[], prose: string): TurnCheckFlag[] {
  if (!systemWindowInPlay(state, prose)) return [];
  const out: TurnCheckFlag[] = [];
  const narration = narrationOf(norm(prose));
  const lines = narration.split(/(?<=[.!?])\s+/);
  const touched = lines
    .map((s, i) => {
      if (!WINDOW_NOUN.test(s)) return '';
      const next = lines[i + 1] ?? '';
      return /\b(?:it|its)\b/i.test(next) ? `${s} ${next}` : s;
    })
    .find((s) => s && WINDOW_PHYSICAL.test(s) && !WINDOW_NOT_PHYSICAL.test(s));
  if (touched) out.push({ kind: 'window-touched', detail: `the System window is handled like an object: "${touched.slice(0, 120)}"` });
  for (const chip of chips) {
    const label = norm(chip);
    if (PHYSICAL_CHIP.test(label) && WINDOW_NOUN.test(label)) {
      out.push({ kind: 'window-touched', detail: `"${label}" handles the System window like an object` });
    }
  }
  return out;
}

/**
 * Down for any offered chip that repeats the player's previous action. No previous action, no repeat. A fight's
 * round choices and the death save are offered again every round by rule, so they are no repeat.
 */
export function checkRepeatChips(chips: string[], action: string, roundChips: string[] = []): TurnCheckFlag[] {
  if (!norm(action)) return [];
  const round = new Set(roundChips.map((c) => low(norm(c))));
  return chips
    .filter((c) => !round.has(low(norm(c))) && chipRepeatsAction(c, action))
    .map((c) => ({ kind: 'repeat-chip' as const, detail: `"${norm(c)}" repeats the previous action ("${norm(action).slice(0, 60)}")` }));
}

const SPEECH_VERB =
  '(?:said|says|answered|answers|asked|asks|added|replied|replies|told|tells|called|calls|whispered|whispers|muttered|mutters|snapped|snaps|let the name)';
const SYSTEM_TERMS =
  /\blevel (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b|\bXP\b|\bHP\b|\bhit points\b|\bexperience points\b|\bstat (?:sheet|block)\b/i;
const ASKS_ROLL = /\b(?:roll (?:a|an|for|your)\b|make an? [a-z]+ (?:check|save|saving throw)\b)/i;
/** A question to the player ends in "?" ("What now waited was a traveler." asks nothing); a hand-over line may end either way. */
const PROMPT_ENDING =
  /(?:\b(?:what (?:do|will|would|should) you do|what now)\b[^.!?]*\?|\b(?:your move|the choice is yours|what happens next is up to you)\b[^.!?]*[.!?]?)["”']?\s*$/i;

/**
 * The narrator's five-word runs that carry content: most of the run (3 of 5) is content-length words, so a
 * grammar frame ("and stopped in front of") is not a habit. Quoted speech is the person's, not the narrator's.
 */
function fiveGrams(text: string): string[] {
  const w = low(narrationOf(text)).match(/[a-z'’~]+/g) ?? [];
  const out: string[] = [];
  for (let i = 0; i + 5 <= w.length; i++) {
    const g = w.slice(i, i + 5);
    if (g.includes('~') || g.filter((x) => x.length >= 4).length < 3) continue;
    out.push(g.join(' '));
  }
  return out;
}

/**
 * 29z7 — the prose crimes of the standing brief that code can see. Shared by the tester and the
 * writer's commit gate (`writerDraftProblems`), so both hold the same line.
 * P0: the prose writes the player's words; a known person who is not here speaks; system ledger or a
 * roll request outside LitRPG (a roll request anywhere); the beat ends by asking what the player does.
 * Down: a five-word run from the last three beats comes back (names and places masked).
 */
export function checkPlayCrimes(
  before: GameState,
  after: GameState,
  action: string,
  prose: string
): { p0: TurnCheckFlag[]; down: TurnCheckFlag[] } {
  const p0: TurnCheckFlag[] = [];
  const down: TurnCheckFlag[] = [];
  const text = norm(prose);
  if (!text) return { p0, down };
  const narration = narrationOf(text);

  const pc = norm(after.character?.name).split(/\s+/)[0] ?? '';
  const who = pc.length >= 2 ? `(?:${escRe(pc)}|you)` : 'you';
  // A quote closed by a full stop ends its sentence: a following "Jax said…" is new indirect speech, not its tag.
  // A quote tagged before it ('Col said, "…?"') is that speaker's; a "Jax said" after it is not its tag.
  const taggedBefore = (head: string) => {
    const tag = head.match(new RegExp(`\\b([\\w'’-]+)\\s+${SPEECH_VERB}\\s*[,:]?\\s*$`, 'i'));
    return !!tag && !new RegExp(`^${who}$`, 'i').test(tag[1]);
  };
  const pcLine = [...text.matchAll(new RegExp(`["“]([^"”]{2,}[^."”])["”]\\s*,?\\s*${who}\\s+${SPEECH_VERB}\\b|\\b${who}\\s+${SPEECH_VERB}\\b[^.!?"“]{0,40}["“]([^"”]{3,})["”]`, 'gi'))]
    .find((m) => m[1] == null || !taggedBefore(text.slice(0, m.index ?? 0)));
  if (pcLine) {
    const said = low(pcLine[1] ?? pcLine[2]);
    const typed = new Set(low(action).match(/[a-z]{3,}/g) ?? []);
    const saidWords = said.match(/[a-z]{3,}/g) ?? [];
    const echoes = saidWords.length > 0 && saidWords.filter((w) => typed.has(w)).length / saidWords.length >= 0.6;
    if (!echoes) p0.push({ kind: 'plays-player', detail: `the prose writes the player's own words: "${pcLine[0].slice(0, 100)}"` });
  }
  // T10F — player's quoted words in an NPC's mouth (reject; do not rewrite into their line).
  if (npcHoldsPcQuote(text, action, after.character?.name)) {
    p0.push({
      kind: 'plays-player',
      detail: `an NPC speaks the player's quoted words: "${action.slice(0, 100)}"`,
    });
  }

  // Someone here when the beat began may speak in it, even if they leave by its end.
  const here = [...peopleHere(before), ...peopleHere(after)].map(low);
  const placeNames = [
    before.currentLocation,
    after.currentLocation,
    ...(after.places ?? []).flatMap((p) => [p.name, p.loreName, ...(p.aliases ?? [])]),
    ...getRegisteredLocations(after.campaignBibleId),
  ].map(norm).filter((p) => p.length >= 4);
  for (const m of after.npcMemories ?? []) {
    const names = [m.npcName, ...(m.aliases ?? [])].map(norm).filter((n) => n.length >= 3);
    if (names.some((n) => here.some((h) => h === low(n) || h.includes(low(n)) || low(n).includes(h)))) continue;
    const spoke = names.find((n) => {
      // "Pellane" inside "Pellane War Camp" is the place, not King Pellane.
      const inPlace = placeNames.filter((p) => p.length > n.length && new RegExp(`\\b${escRe(n)}\\b`, 'i').test(p));
      const t = inPlace.reduce((acc, p) => acc.replace(new RegExp(`\\b${escRe(p)}\\b`, 'gi'), (x) => '~'.repeat(x.length)), text);
      return new RegExp(`\\b${escRe(n)}\\b[^.!?]{0,30}\\b${SPEECH_VERB}\\b|\\b${escRe(n)}\\b[^.!?"“]{0,20}["“]`, 'i').test(t);
    });
    if (spoke) p0.push({ kind: 'absent-speaker', detail: `${m.npcName} speaks but is not here at ${after.currentLocation || 'this place'}` });
  }

  if (after.engineMode !== 'litrpg') {
    const sys = narration.match(SYSTEM_TERMS);
    if (sys) p0.push({ kind: 'wrong-voice', detail: `system ledger in the story: "${sys[0]}"` });
  }
  const roll = narration.match(ASKS_ROLL);
  if (roll) p0.push({ kind: 'wrong-voice', detail: `the writer asks for a roll: "${roll[0]}"` });
  if (PROMPT_ENDING.test(text)) p0.push({ kind: 'lecture-ending', detail: 'the beat ends by asking what the player does' });

  // Same handed-ref list the writer gets (REF ENUM displays + labels) — not a second handmade mask list.
  const masks = [...new Set([...handedRefs(before), ...handedRefs(after)])]
    .map(norm)
    .filter((n) => n.length >= 3)
    .sort((a, b) => b.length - a.length);
  const mask = (t: string) => masks.reduce((acc, n) => acc.replace(new RegExp(escRe(n), 'gi'), ' ~ '), t);
  const old = new Set(gmBodies(before).slice(-3).flatMap((b) => fiveGrams(mask(b))));
  const again = fiveGrams(mask(text)).find((g) => old.has(g));
  if (again) down.push({ kind: 'repeated-habit', detail: `"${again}" comes back from an earlier beat` });
  return { p0, down };
}

const ASKS_NAME = /\b(?:your name|who are you|who might you be|what are you called|what do they call you)\b/i;
const NEVER_MET = /\b(?:never (?:met|seen) (?:you|him|her|them)(?: before)?|(?:do|does|did)(?:n['’]t| not) know (?:you|him|her|them)|(?:a|the) stranger to (?:me|him|her|them)|first time (?:we['’]ve|we have|they had|she had|he had) met)\b/i;

/**
 * 29z3 — a person whose info sheet says they met the player must not act as if they never did:
 * introduce themselves again, ask the name they already know, or say they have never met.
 */
export function checkSheetMemory(before: GameState, prose: string): TurnCheckFlag[] {
  const known = presentNpcRecords(before).filter(isMetNpc);
  if (!known.length || !norm(prose)) return [];
  const out: TurnCheckFlag[] = [];
  const sentences = norm(prose).split(/(?<=[.!?]["”']?)\s+/).map((s) => s.trim()).filter(Boolean);
  for (const m of known) {
    const names = [m.npcName, ...(m.aliases ?? [])].filter((n) => n.trim().length >= 3);
    const about: string[] = [];
    sentences.forEach((s, i) => {
      if (!names.some((n) => mentionsName(s, n))) return;
      const next = sentences[i + 1] ?? '';
      about.push(/^["“]/.test(next.trim()) ? `${s} ${next}` : s);
    });
    const intro = about.find((s) => names.some((n) => sentenceLooksLikeSelfIntro(s, n)));
    if (intro) {
      out.push({ kind: 'sheet-forgotten', detail: `${m.npcName} has met the player but introduces themselves again: "${intro.slice(0, 120)}"` });
      continue;
    }
    const ask = m.knownPlayerName ? about.find((s) => ASKS_NAME.test(s) && s.includes('?')) : undefined;
    if (ask) {
      out.push({ kind: 'sheet-forgotten', detail: `${m.npcName} knows the player as ${m.knownPlayerName} but asks the name again: "${ask.slice(0, 120)}"` });
      continue;
    }
    const never = about.find((s) => NEVER_MET.test(s));
    if (never) out.push({ kind: 'sheet-forgotten', detail: `${m.npcName} has met the player but acts as if they never did: "${never.slice(0, 120)}"` });
  }
  return out;
}

/** 29z3 — a level-up must change something the player can do (a skill rank or a lock in reach). */
export function checkLevelUpChanges(before: GameState, after: GameState): TurnCheckFlag[] {
  const was = before.character?.level ?? 1;
  const now = after.character?.level ?? 1;
  if (now <= was) return [];
  const old = new Set(canDoKeys(before));
  if (canDoKeys(after).some((k) => !old.has(k))) return [];
  return [{ kind: 'levelup-no-change', detail: `level ${was} → ${now} changed nothing the player can do (no new skill rank, lock or option)` }];
}

/** Floor-plan problems on the drawn building / dungeon map (street maps are not floor plans). */
export function drawnPlanIssues(state: GameState): string[] {
  const map = drawnMap(state);
  if (!map || !(isInteriorMap(map) || isExplorableDungeon(map))) return [];
  return floorPlanIssues(map, { building: isInteriorMap(map), minRooms: 1 });
}

/**
 * fight2d-PERSONTAG — a road-meeting / "talk to someone" chip is backed only by an
 * engine-recorded person in the CURRENT scene: a `person:` timeline tag at this HERE,
 * or a live journey meeting that still carries its seeded `name` (timeline can age out
 * at the 40-cap while the camp/champion meeting is open). Never a kind label, prose word,
 * or a person tag from a place the PC has left. (SOMEONE regex stays removed.)
 */
export function checkChosenChip(before: GameState, chosen: string): TurnCheckFlag[] {
  const pick = norm(chosen);
  if (!pick || !roadMeetingPeople(before)) return [];
  if (!chipAddressee(pick) && !/^(?:greet|face|approach|skirt|slip past|hide from|talk your way)\b/i.test(pick)) return [];
  const here = low(before.currentLocation);
  if (!here) {
    return [{ kind: 'unrelated-chip', detail: `"${pick}" meets someone on the road, but the prose before it showed nobody` }];
  }
  // T10Z-fix — live meeting clears the chip only when the engine seeded a person name
  // on this stretch (camp keeper / traveler). A bare kind stub is not presence.
  const enc = before.journey?.encounter;
  if (enc && !roadMeetingOver(enc) && low(enc.name)) return [];
  const trip = low(underwayHereLabel(before));
  const road = low(UNDERWAY_HERE);
  const onTrip = !!trip && (here === trip || here === road);
  const timeline = before.timeline ?? [];
  for (let i = 0; i < timeline.length; i++) {
    const f = timeline[i]!;
    if (f.kind !== 'person' || !low(f.name)) continue;
    const p = low(f.place);
    if (!p) continue;
    if (p === here || (onTrip && (p === trip || p === road))) return [];
  }
  return [{ kind: 'unrelated-chip', detail: `"${pick}" meets someone on the road, but the prose before it showed nobody` }];
}
