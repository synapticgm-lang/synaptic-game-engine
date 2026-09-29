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
  | 'lock-without-skill';

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
  /^(?:wait|look|inspect|examine|search|rest|listen|watch|hold|walk|travel|go|leave|head|climb|press the attack|attack|strike|flee|hide|sneak|loot|take|open|read)\b/i;

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
  return resolvePlayAreaMap(null, place, [], state.currentCoordinates);
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
  const mapIssue = openGroundMapIssue(after);
  if (mapIssue && openGroundMapIssue(before) !== mapIssue) p0.push({ kind: 'open-ground-interior', detail: mapIssue });
  const planIssues = drawnPlanIssues(after);
  const oldPlanIssues = new Set(drawnPlanIssues(before));
  const newPlanIssues = planIssues.filter((i) => !oldPlanIssues.has(i));
  if (newPlanIssues.length) {
    p0.push({ kind: 'bad-floor-plan', detail: `${drawnMap(after)?.dungeonName ?? 'map'}: ${newPlanIssues.slice(0, 3).join('; ')}` });
  }
  return { p0, down: [...followed.down, ...brokenLines(prose)], presentNames: peopleHere(before) };
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
