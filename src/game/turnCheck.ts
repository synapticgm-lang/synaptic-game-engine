/**
 * 29z2 — per-turn tester check for fate-autoplay rows (read by autoThumbs).
 * Model-free. Uses who is present, the offered chips, and the player's last action.
 * P0 fails the turn: ghost / impossible chip, prose that ignores the action, an interior or
 * extra floor drawn for open ground, a quest naming a place the scene never established.
 * Stiff / abstract prose is judged by the thumbs model pass, not here (no phrase list).
 */

import type { GameState } from './types';
import { presentNpcNames } from './npcRelationships';
import { isChromePersonToken } from './chromeAuthority';
import { isLastKillTalkPad, matchesLastKillName } from './combatAuthority';
import { encounterBlocksTravel } from './encounterTerminalFsm';
import { classifyEdgeType } from './graphChoices';
import { checkObligationCoverage, buildIntentContract } from './intentContract';
import { parsePlayerIntent } from './intentParser';
import { isLookAroundAction } from './sandboxXp';
import { openingCastNames } from './openingEstablishment';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { extractNamedPlaces } from './questPlay';
import { isLegalMapPlace } from './worldMapAuthority';
import { resolvePlayAreaMap, type ActiveDungeonState } from './mapEngine';
import { isExplorableDungeon, isInteriorMap, isInteriorPlace } from './placeAuthority';

export type TurnCheckKind =
  | 'ghost-chip'
  | 'impossible-chip'
  | 'ignored-action'
  | 'open-ground-interior'
  | 'unestablished-quest-place'
  | 'action-object-missing'
  | 'broken-line';

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
  'ignored-action',
  'open-ground-interior',
  'unestablished-quest-place',
]);

const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const low = (s: string | undefined | null) => norm(s).toLowerCase();

function nameTokens(name: string): string[] {
  return low(name)
    .replace(/^(?:the|a|an)\s+/, '')
    .split(/[\s'’-]+/)
    .filter((t) => t.length >= 3 && !/^(?:the|of|and)$/.test(t));
}

function mentionsName(text: string, name: string): boolean {
  const hay = low(text);
  if (!hay) return false;
  if (hay.includes(low(name))) return true;
  return nameTokens(name).some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay));
}

/** Everyone who could answer at turn start: scene presence, companions, the live foe, the opening cast. */
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
  if (state.openingEstablishment?.complete !== true) openingCastNames(state).forEach(add);
  (state.sceneFacts?.anonymousRoles ?? []).forEach(add);
  return [...out.values()];
}

function crowdHere(state: GameState): boolean {
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

const ENGINE_COMBAT_CHIP = /^(?:press the attack|try to flee|parley|flee)\b/i;

/** P0 chip checks against the turn-start state. */
export function checkChips(state: GameState, chips: string[]): TurnCheckFlag[] {
  const out: TurnCheckFlag[] = [];
  const here = peopleHere(state);
  const lastKill = state.sceneFacts?.lastKill;
  const blocksTravel = encounterBlocksTravel(state);
  for (const chip of chips) {
    const label = norm(chip);
    if (!label) continue;
    if (isLastKillTalkPad(label, lastKill)) {
      out.push({ kind: 'impossible-chip', detail: `"${label}" talks to ${lastKill?.name}, who is dead` });
      continue;
    }
    const addr = chipAddressee(label);
    if (addr?.kind === 'named') {
      if (isChromePersonToken(addr.who)) continue;
      if (matchesLastKillName(addr.who, lastKill) && lastKill?.outcome === 'victory') {
        out.push({ kind: 'impossible-chip', detail: `"${label}" talks to ${addr.who}, who is dead` });
      } else if (!here.some((p) => mentionsName(p, addr.who) || mentionsName(addr.who, p))) {
        out.push({
          kind: 'ghost-chip',
          detail: `"${label}" talks to ${addr.who}, who is not here (here: ${here.join(', ') || 'nobody'})`,
        });
      }
    } else if (addr && !here.length && !crowdHere(state)) {
      const who = addr.who ? ` the ${addr.who}` : '';
      out.push({ kind: 'ghost-chip', detail: `"${label}" talks to${who || ' someone'} but nobody is here` });
    }
    const type = classifyEdgeType(label);
    if (ENGINE_COMBAT_CHIP.test(label) && !state.activeEncounter && !state.sceneFacts?.pendingEncounter) {
      out.push({ kind: 'impossible-chip', detail: `"${label}" offers a fight move with no fight` });
    }
    if (/^loot the body of\b/i.test(label)) {
      const target = label.replace(/^loot the body of\s+/i, '');
      if (!lastKill?.remains || !matchesLastKillName(target, lastKill)) {
        out.push({ kind: 'impossible-chip', detail: `"${label}" loots a body that is not here` });
      }
    }
    if (type === 'travel' && blocksTravel) {
      out.push({ kind: 'impossible-chip', detail: `"${label}" travels while the fight blocks travel` });
    }
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
  /^(?:with|from|that|this|have|into|your|their|about|would|could|should|then|will|just|them|they|what|when|where|which|there|here|some|more|look|search|inspect|check|examine|study|take|try|find|carefully|around|toward|towards|again|slowly|quietly|closer|nearby|area|room|scene|place|while|still|keep|move|make|give|open|pick|read|touch|down|over|back|away)$/;

function objectWords(action: string): string[] {
  return (low(action).match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.test(w)).slice(0, 4);
}

function stemHit(prose: string, word: string): boolean {
  const stem = word.slice(0, Math.max(4, Math.min(5, word.length)));
  return new RegExp(`\\b${stem}`, 'i').test(prose);
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
  const talkish = !!addr || intent.kind === 'talk' || intent.kind === 'refuse';

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
  if (travel && moved) {
    const dest = travel[1]!;
    const where = [dest, after.currentLocation ?? '', after.journey?.to ?? '', after.journey?.ground ?? ''].filter(Boolean);
    if (!where.some((w) => mentionsName(text, w))) {
      p0.push({ kind: 'ignored-action', detail: `player travelled toward ${dest}; the prose never says where they went` });
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

function isOpenGround(state: GameState): boolean {
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

function basementEstablished(state: GameState): boolean {
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
  const p0 = [...checkChips(before, row.offeredChoices ?? []), ...followed.p0, ...checkQuestPlaces(before, after)];
  const mapIssue = openGroundMapIssue(after);
  if (mapIssue && openGroundMapIssue(before) !== mapIssue) p0.push({ kind: 'open-ground-interior', detail: mapIssue });
  return { p0, down: [...followed.down, ...brokenLines(prose)], presentNames: peopleHere(before) };
}
