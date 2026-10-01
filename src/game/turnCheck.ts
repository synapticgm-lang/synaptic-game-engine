/**
 * 29z2 — per-turn tester check for fate-autoplay rows (read by autoThumbs).
 * Model-free. Uses who is present, the offered chips, and the player's last action.
 * P0 fails the turn: ghost / impossible chip, prose that ignores the action, an interior or
 * extra floor drawn for open ground, a quest naming a place the scene never established.
 * Stiff / abstract prose is judged by the thumbs model pass, not here (no phrase list).
 */

import type { GameState } from './types';
import { checkObligationCoverage, buildIntentContract } from './intentContract';
import { parsePlayerIntent } from './intentParser';
import { isLookAroundAction } from './sandboxXp';
import { hubsForBibleId } from './outdoorHubs';
import { extractNamedPlaces } from './questPlay';
import { isLegalMapPlace } from './worldMapAuthority';
import { resolvePlayAreaMap, type ActiveDungeonState } from './mapEngine';
import { previewDungeonCard } from './dungeonCard';
import { isExplorableDungeon, isInteriorMap } from './placeAuthority';
import {
  basementEstablished,
  chipAddressee,
  chipProblem,
  isOpenGround,
  mentionsName,
  peopleHere,
  roadMeetingPeople,
} from './chipLegality';
import { floorPlanIssues } from './floorPlan';
import { isSystemWindowLabel } from './chromeAuthority';
import { openingCastNames } from './openingEstablishment';
import { isMetNpc, presentNpcRecords } from './npcRecords';
import { sentenceLooksLikeSelfIntro } from './npcMemory';
import { canDoKeys, locksOpenedWithoutSkill } from './skillGates';

export { chipAddressee, peopleHere } from './chipLegality';

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
  | 'verb-swapped';

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

export const TURN_CHECK_P0_KINDS: ReadonlySet<TurnCheckKind> = new Set([
  'ghost-chip',
  'impossible-chip',
  'unrelated-chip',
  'ignored-action',
  'open-ground-interior',
  'bad-floor-plan',
  'unestablished-quest-place',
  'broken-prose',
  'sheet-forgotten',
  'levelup-no-change',
  'lock-without-skill',
  'plays-player',
  'absent-speaker',
  'wrong-voice',
  'lecture-ending',
  'ghost-talk',
  'window-touched',
]);

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
const STOP =
  /^(?:with|from|that|this|have|into|your|their|about|would|could|should|then|will|just|them|they|what|when|where|which|there|here|some|more|look|search|inspect|check|examine|study|take|try|find|carefully|around|toward|towards|again|slowly|quietly|closer|nearby|area|room|scene|place|while|still|move|make|give|open|pick|read|touch|down|over|back|away)$/;
/** Words before the verb of a typed line ("I", "carefully"): skipped so the verb itself can be dropped. */
const LEAD = /^(?:i|we|you|then|now|so|carefully|slowly|quietly|quickly|just|try|to|and)$/;
const MOTION_VERB = /^(?:walk|walks|walking|move|moving|go|going|keep|continue|press|proceed|step|stroll|wander|head|carry)$/;
/** The prose moves the body: a walk can be told with any travel verb. */
const MOTION_TOLD =
  /\b(?:walk|stepp?|cross|pass|strode|stride|went|moved?|moving|continu|head(?:ed|ing)|made (?:their|his|her|your|my) way|kept (?:to|on|going|walking)|carried on|pressed on|wander|stroll|trudg|climb|descend|follow|leav|left|reach|enter|arriv)/i;

/** The words the action acts on: the verb (first word after any lead-in) is the action, not its object. */
function objectWords(action: string): string[] {
  const words = low(action).match(/[a-z]+/g) ?? [];
  let i = 0;
  while (i < words.length && LEAD.test(words[i]!)) i++;
  const walking = MOTION_VERB.test(words[i] ?? '');
  return words
    .slice(i + 1)
    .filter((w) => w.length >= 4 && !STOP.test(w) && !(walking && MOTION_VERB.test(w)))
    .slice(0, 4);
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

function actionVerb(action: string): string {
  const words = low(action).match(/[a-z]+/g) ?? [];
  return words.find((w) => !LEAD.test(w)) ?? '';
}

/** Word stem: a plural or verb ending does not make "exits" miss "exit". */
function stemOf(word: string): string {
  const w = word.toLowerCase();
  const cut = w.replace(/(?:ings?|ed|es|s)$/, '');
  if (cut.length >= 3) return cut.slice(0, 5);
  const plural = w.replace(/s$/, '');
  return (plural.length >= 3 ? plural : w).slice(0, 5);
}

function stemHit(prose: string, word: string): boolean {
  return new RegExp(`\\b${stemOf(word)}`, 'i').test(prose);
}

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
  prose: string
): { p0: TurnCheckFlag[]; down: TurnCheckFlag[] } {
  const p0: TurnCheckFlag[] = [];
  const down: TurnCheckFlag[] = [];
  const act = norm(action);
  const text = norm(prose);
  if (!act || !text || /^\(crash/.test(act)) return { p0, down };
  const quoted = /["“][^"”]{2,}["”]/.test(text);

  const addr = chipAddressee(act);
  const typedNamed = !addr ? peopleHere(before).find((p) => mentionsName(act, p)) : undefined;
  const intent = parsePlayerIntent(act, before);
  const bodyAction = NON_TALK_ACTION.test(act);
  const talkish = !!addr || (!bodyAction && (intent.kind === 'talk' || intent.kind === 'refuse'));

  if (addr?.kind === 'named' || (talkish && typedNamed)) {
    const who = addr?.kind === 'named' ? addr.who : typedNamed!;
    if (!mentionsName(text, who) && !quoted) {
      p0.push({ kind: 'ignored-action', detail: `player spoke to ${who}; the prose never has ${who} answer or appear` });
    }
  } else if (talkish) {
    const contract = buildIntentContract({ typed: act, resolvedText: act, intent, state: before });
    const cov = checkObligationCoverage(
      { ...contract, obligations: contract.obligations.filter((o) => o.kind === 'talk' || o.kind === 'refuse') },
      text
    );
    if (!cov.ok && !quoted) {
      p0.push({ kind: 'ignored-action', detail: `player said "${act.slice(0, 80)}"; nobody answers in the prose` });
    }
  }

  const travel = act.match(TRAVEL_ACTION);
  const moved = low(after.currentLocation) !== low(before.currentLocation) || (!!after.journey && after.journey !== before.journey);
  const fighting = !!before.activeEncounter || !!before.sceneFacts?.pendingEncounter;
  if (travel && !moved && !fighting) {
    p0.push({ kind: 'ignored-action', detail: `player chose to travel toward ${travel[1]}; they never left ${before.currentLocation || 'here'}` });
  }
  if (ATTACK_ACTION.test(act) && before.activeEncounter && !BLOW.test(text)) {
    p0.push({ kind: 'ignored-action', detail: `player attacked ${before.activeEncounter.name}; the prose shows no blow` });
  }
  if (travel && moved) {
    // The destination itself must be named: the ground on the way ("Back streets") is not where they went.
    const dest = travel[1]!.replace(/\s+[—–-]\s+.*$/, '').trim();
    const where = [dest, after.journey?.to ?? ''].filter(Boolean);
    if (!where.some((w) => placeNamed(text, w))) {
      p0.push({ kind: 'ignored-action', detail: `player travelled toward ${dest}; the prose never names ${dest}` });
    }
  }

  const looking = isLookAroundAction(act) || /^(?:wait|look|listen|rest)\b/i.test(act);
  if (!travel && !looking) {
    const share = restatedShare(text, gmBodies(before));
    if (share >= 0.6) {
      p0.push({
        kind: 'ignored-action',
        detail: `the beat restates an earlier beat (${Math.round(share * 100)}% of its lines) instead of doing "${act.slice(0, 60)}"`,
      });
    }
  }

  if (!talkish && !travel && !looking) {
    const words = objectWords(act);
    if (words.length && !words.some((w) => stemHit(text, w))) {
      down.push({ kind: 'action-object-missing', detail: `prose never names what the player acted on (${words.join(', ')})` });
    } else if (words.length) {
      const verb = actionVerb(act);
      const family = VERB_FAMILY.find((f) => f.verb.test(verb));
      if (family && !family.told.test(text.replace(/["“][^"”]*["”]/g, ' '))) {
        down.push({
          kind: 'verb-swapped',
          detail: `player chose to ${verb} the ${words.join(' ')}; the prose names it but never ${family.name}s it`,
        });
      }
    } else if (!words.length && MOTION_VERB.test(actionVerb(act)) && !MOTION_TOLD.test(text)) {
      down.push({ kind: 'action-object-missing', detail: `player chose "${act.slice(0, 60)}"; the prose never moves them` });
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
 * ("their your hands"), a plural given a possessive 's ("streets's"), a verb glued after "didn't know",
 * and "your" in narration that tells the PC by name in the third person.
 */
/** A body action, not speech: the talk check does not apply to it. */
const NON_TALK_ACTION =
  /^(?:wait|look|inspect|examine|investigate|check|study|search|rest|listen|watch|hold|walk|travel|go|leave|head|climb|press the attack|attack|strike|flee|hide|sneak|loot|take|open|read)\b/i;

export function brokenProse(prose: string, pcName?: string): TurnCheckFlag[] {
  const out: TurnCheckFlag[] = [];
  const text = norm(prose);
  if (!text) return out;
  const narration = text.replace(/["“][^"”]*["”]/g, ' ');
  const hit = (re: RegExp, why: string) => {
    const m = narration.match(re);
    if (m) out.push({ kind: 'broken-prose', detail: `${why}: "${m[0].trim()}"` });
  };
  hit(
    /\b(?:the|a|an)\s+[a-z]+ed\s+(?:the|a|an|his|her|their|its|from|into|onto|toward|towards|across|through|past|off|out of|between|on|at)\s/i,
    'a name is missing before its verb'
  );
  hit(/\b(?:the|a|an|their|his|her|its|my|our)\s+(?:your|their|his|her|my|the)\s+[a-z]/i, 'stacked determiners');
  hit(/\b[a-z]{3,}s['’]s\b/i, 'plural with a possessive s');
  hit(/\b(?:didn['’]t|did not|don['’]t|doesn['’]t|never) know\s+[a-z]+ed\s+(?:the|a|an|their|his|her|its)\b/i, 'mangled clause');
  const name = norm(pcName);
  if (name && name.length >= 2) {
    const first = name.split(/\s+/)[0]!;
    const told = new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(narration);
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
  return [q.location, ...extractNamedPlaces(visible)].map((n) => norm(n)).filter((n) => n.length >= 3);
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
  row: { offeredChoices?: string[]; playerInput?: string; fatePick?: string; gmText?: string }
): TurnCheck {
  const prose = row.gmText ?? '';
  const action = row.playerInput || row.fatePick || '';
  const followed = checkActionFollowed(before, after, action, prose);
  const p0 = [
    ...checkChips(before, row.offeredChoices ?? []),
    ...checkChosenChip(before, row.fatePick || action),
    ...followed.p0,
    ...checkQuestPlaces(before, after),
    ...brokenProse(prose, after.character?.name),
    ...checkSheetMemory(before, prose),
    ...checkLevelUpChanges(before, after),
    ...locksOpenedWithoutSkill(before, after).map((detail) => ({ kind: 'lock-without-skill' as const, detail })),
  ];
  const chips = row.offeredChoices ?? [];
  p0.push(
    ...checkEmptyRoomTalk(after, chips.filter((c) => !chipProblem(before, c)), prose, action),
    ...checkSystemWindow(after, chips, prose)
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
    down: [...followed.down, ...brokenLines(prose), ...crimes.down, ...checkRepeatChips(chips, action)],
    presentNames: peopleHere(before),
  };
}

/** Narration or the place card says nobody is here. Spoken lines do not count: a speaker is someone. */
const EMPTY_ROOM =
  /\b(?:nobody|no one|no-one|not a soul|no other (?:soul|person|people)|no sign of (?:anyone|life|people)|(?:you are|you're|you were|you stand|you stood|you're still|you are still) alone|alone (?:here|now|in (?:the|this))|deserted|(?:room|hall|chamber|place|building|house|ruin|street|square|space|corridor|bathhouse|cell|court|yard) (?:is|was|stood|lay|sat|stands|lies|sits) (?:empty|silent and empty)|empty (?:room|hall|chamber|ruin|building|house|street|square|corridor|bathhouse|cell))\b/i;

export function placeSaysEmpty(state: GameState, prose: string): boolean {
  const card = (state.places ?? []).find((p) => low(p.name) === low(state.currentLocation));
  const text = [prose, card?.description].filter(Boolean).join(' ').replace(/["“][^"”]*["”]/g, ' ');
  return EMPTY_ROOM.test(text);
}

/** Who can hear a talk chip when the place text says the room is empty: never the opening card's cast. */
export function listenersOnEmptyText(state: GameState): string[] {
  const cast = openingCastNames(state);
  return peopleHere(state).filter((n) => !cast.some((c) => mentionsName(n, c) || mentionsName(c, n)));
}

const TALK_NEEDS_EAR =
  /^(?:offer|greet|talk your way|call (?:out|to)|bargain|haggle|plead|persuade|befriend|threaten|intimidate|bribe|refuse|accept|decline|agree|thank|apologi[sz]e|introduce yourself|negotiate|reassure|warn)\b|^(?:who|what|why|where|how)\b.*\b(?:you|your|they|them|their)\b/i;
const WHO_ASK = /\bwho are you\b/i;

/**
 * Talk on empty-room text. A talk chip is illegal when the beat or the place card says nobody is here
 * and no listener is left once the opening cast is dropped. A "who are you" in the prose is flagged on
 * empty-room text whoever the people list holds (unless the player typed it).
 */
export function checkEmptyRoomTalk(state: GameState, chips: string[], prose: string, action = ''): TurnCheckFlag[] {
  if (!placeSaysEmpty(state, prose)) return [];
  const out: TurnCheckFlag[] = [];
  const ears = listenersOnEmptyText(state);
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

const WINDOW_NOUN = /\b(?:(?:blue|system|status|translucent|glowing|floating)\s+(?:panel|window|screen|box|plate)|the panel)\b/i;
const WINDOW_QUALIFIED = /\b(?:blue|system|status)\s+(?:panel|window|screen)\b/i;
const WINDOW_PHYSICAL =
  /\b(?:touch|tap(?:s|ped)?\b|press|push|poke|prod|grab|grasp|grip|lift|weigh|weight|heavy|surface|rippl|heat|warmth|textur|smooth|rough|knock|rap(?:s|ped)?\b|brush|strok|solid|vibrat|shatter)/i;
const WINDOW_NOT_PHYSICAL =
  /\b(?:pass(?:es|ed)? (?:straight |clean |right )?through|nothing to (?:touch|hold|grip)|can(?:not|['’]t) (?:touch|feel|hold)|only you (?:can )?see)/i;
const PHYSICAL_CHIP = /^(?:touch|tap|press|push|poke|grab|take|pick up|lift|knock on|break|smash|pull|hold|weigh)\b/i;

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
  const narration = norm(prose).replace(/["“][^"”]*["”]/g, ' ');
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

/** Verb families for "the same move again": a chip worded differently is still the action just taken. */
const MOVE_FAMILY: RegExp[] = [
  /^(?:look|inspect|examine|investigate|check|study|scan|observe|survey|peer)$/,
  /^(?:search|rummage|sift|comb)$/,
  /^(?:wait|rest|pause|linger|watch)$/,
  /^(?:listen)$/,
  /^(?:take|grab|pick|lift|pocket)$/,
  /^(?:open|unlatch|pry|prise)$/,
  /^(?:read|decipher)$/,
];

function moveFamily(verb: string): number {
  return MOVE_FAMILY.findIndex((f) => f.test(verb));
}

/** Does this chip repeat the action the player just took? */
export function chipRepeatsAction(chip: string, action: string): boolean {
  const clean = (s: string) => low(s).replace(/[.!?]+$/, '').replace(/^(?:i|we)\s+/, '');
  const c = clean(chip);
  const a = clean(action);
  if (!c || !a || /^\(crash/.test(a)) return false;
  if (c === a) return true;
  const fam = moveFamily(actionVerb(c));
  if (fam < 0 || fam !== moveFamily(actionVerb(a))) return false;
  const chipObjects = objectWords(c);
  const actObjects = objectWords(a);
  if (!chipObjects.length) return !actObjects.length;
  return chipObjects.every((w) => stemHit(a, w));
}

/** Down for any offered chip that repeats the action the player just took. */
export function checkRepeatChips(chips: string[], action: string): TurnCheckFlag[] {
  return chips
    .filter((c) => chipRepeatsAction(c, action))
    .map((c) => ({ kind: 'repeat-chip' as const, detail: `"${norm(c)}" repeats the action just taken ("${norm(action).slice(0, 60)}")` }));
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SPEECH_VERB =
  '(?:said|says|answered|answers|asked|asks|added|replied|replies|told|tells|called|calls|whispered|whispers|muttered|mutters|snapped|snaps|let the name)';
const SYSTEM_TERMS =
  /\blevel (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b|\bXP\b|\bHP\b|\bhit points\b|\bexperience points\b|\bstat (?:sheet|block)\b/i;
const ASKS_ROLL = /\b(?:roll (?:a|an|for|your)\b|make an? [a-z]+ (?:check|save|saving throw)\b)/i;
const PROMPT_ENDING =
  /\b(?:what (?:do|will|would|should) you do|what now|your move|the choice is yours|what happens next is up to you)\b[^.!?]*[.!?]?["”']?\s*$/i;

function fiveGrams(text: string): string[] {
  const w = low(text).match(/[a-z'’~]+/g) ?? [];
  const out: string[] = [];
  for (let i = 0; i + 5 <= w.length; i++) {
    const g = w.slice(i, i + 5);
    if (g.includes('~') || g.filter((x) => x.length >= 4).length < 2) continue;
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
  const narration = text.replace(/["“][^"”]*["”]/g, ' ');

  const pc = norm(after.character?.name).split(/\s+/)[0] ?? '';
  const who = pc.length >= 2 ? `(?:${esc(pc)}|you)` : 'you';
  const pcLine = text.match(new RegExp(`["“]([^"”]{3,})["”]\\s*,?\\s*${who}\\s+${SPEECH_VERB}\\b|\\b${who}\\s+${SPEECH_VERB}\\b[^.!?"“]{0,40}["“]([^"”]{3,})["”]`, 'i'));
  if (pcLine) {
    const said = low(pcLine[1] ?? pcLine[2]);
    const typed = new Set(low(action).match(/[a-z]{3,}/g) ?? []);
    const saidWords = said.match(/[a-z]{3,}/g) ?? [];
    const echoes = saidWords.length > 0 && saidWords.filter((w) => typed.has(w)).length / saidWords.length >= 0.6;
    if (!echoes) p0.push({ kind: 'plays-player', detail: `the prose writes the player's own words: "${pcLine[0].slice(0, 100)}"` });
  }

  const here = peopleHere(after).map(low);
  for (const m of after.npcMemories ?? []) {
    const names = [m.npcName, ...(m.aliases ?? [])].map(norm).filter((n) => n.length >= 3);
    if (names.some((n) => here.some((h) => h === low(n) || h.includes(low(n)) || low(n).includes(h)))) continue;
    const spoke = names.find((n) =>
      new RegExp(`\\b${esc(n)}\\b[^.!?]{0,30}\\b${SPEECH_VERB}\\b|\\b${esc(n)}\\b[^.!?"“]{0,20}["“]`, 'i').test(text)
    );
    if (spoke) p0.push({ kind: 'absent-speaker', detail: `${m.npcName} speaks but is not here at ${after.currentLocation || 'this place'}` });
  }

  if (after.engineMode !== 'litrpg') {
    const sys = narration.match(SYSTEM_TERMS);
    if (sys) p0.push({ kind: 'wrong-voice', detail: `system ledger in the story: "${sys[0]}"` });
  }
  const roll = narration.match(ASKS_ROLL);
  if (roll) p0.push({ kind: 'wrong-voice', detail: `the writer asks for a roll: "${roll[0]}"` });
  if (PROMPT_ENDING.test(text)) p0.push({ kind: 'lecture-ending', detail: 'the beat ends by asking what the player does' });

  const masks = [
    after.currentLocation,
    before.currentLocation,
    after.character?.name,
    ...(after.npcMemories ?? []).map((m) => m.npcName),
    ...hubsForBibleId(after.campaignBibleId).map((h) => h.name),
  ]
    .map(norm)
    .filter((n) => n.length >= 3)
    .sort((a, b) => b.length - a.length);
  const mask = (t: string) => masks.reduce((acc, n) => acc.replace(new RegExp(esc(n), 'gi'), ' ~ '), t);
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

/** Someone on the road, in the prose: a person word, not a story name. */
const SOMEONE =
  /\b(?:someone|somebody|figure|figures|man|woman|men|women|traveler|traveller|stranger|rider|riders|merchant|pilgrim|thugs?|bandits?|people|camp|voice|voices|footsteps|hooded|cloaked)\b/i;

/** The picked chip must follow the prose before it: a road-meeting chip needs the meeting on the page. */
export function checkChosenChip(before: GameState, chosen: string): TurnCheckFlag[] {
  const pick = norm(chosen);
  if (!pick || !roadMeetingPeople(before)) return [];
  if (!chipAddressee(pick) && !/^(?:greet|face|approach|skirt|slip past|hide from|talk your way)\b/i.test(pick)) return [];
  const lastGm = gmBodies(before).slice(-1)[0] ?? '';
  if (SOMEONE.test(lastGm)) return [];
  return [{ kind: 'unrelated-chip', detail: `"${pick}" meets someone on the road, but the prose before it showed nobody` }];
}
