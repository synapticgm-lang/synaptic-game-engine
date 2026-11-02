/**
 * 28j — anti-circling, game-wide (engine, not story):
 * - remembers places, rooms and the action families tried at each place, and when the game last progressed;
 * - ranks chips: the quest's next step, unvisited places, unexplored rooms and unmet people first;
 *   the way back to the previous place is labelled "Go back to …" and ranks last;
 * - rests Inspect / Wait / Look-type chips at a place where they produced nothing new recently;
 * - after 3 turns with no progress, injects one nudge built from existing engine facts.
 * 28o — circling:
 * - the exact action tried at a place with no progress is rested/demoted there (any family, not only loiter);
 * - travel back to any of the last few places ranks below fresh places, not only the previous one;
 * - stuck in place (2+ turns, no move) with no way on offered → one exit chip to the best hub;
 * - chipProgressWeights feeds the autoplay picker so ranking changes what gets picked.
 * 28x — opening places used up:
 * - travel to a place already visited this save is dropped when an unvisited exit, a fight or the quest step is offered;
 * - when none is offered, one is added: an unvisited hub, else a fight chip in modes that allow combat;
 * - a nudge line already fired this save never fires again unchanged.
 */
import type { CirclingMemory, GameState, QuestObjective } from './types';
import { hubsForBibleId, matchHub, placeFirstSight, questTravelSite } from './outdoorHubs';
import { isMetNpc, presentNpcRecords } from './npcRecords';
import { engineAllowsCombat } from './beatContract';
import { isRoadLabel } from './travelJourney';
import { giverIsHere, isTalkStageObjective, talkStageGiver } from './questGiver';
import { hallTopicAlreadyAnswered } from './openingEstablishment';
import { travelChipMoves } from './chipLegality';
import { objectiveOpensInterior } from './enterInterior';
import { storyRpgDecisionChip } from './storyRpgProgress';
import { tabletopStepAnchor, tabletopStepChip } from './tabletopQuestProgress';
import { mainSpineQuest } from './questPlay';
import { stallPressureActive } from './openThreads';
import { directorNudgeIfStuck } from './director';
import { STALL_N } from './directorConstants';
import {
  isOutdoorWildsPlace,
  wildsHasStock,
  wildsHasNonGrayStock,
  hasNodeStock,
  ensureWilds,
  ensureGatherPouch,
} from './wilds';
import { ensureRegionResources } from './regionLevels';
import { gatherModeOk, huntModeOk } from './wildlifeActions';
import { canAddMaterials } from './inventory';

export type { CirclingMemory } from './types';

const REST_TURNS = 4;
/** @deprecated T10DIR — stall/nudge threshold lives on director.STALL_N; kept for local stuck helpers. */
const STUCK_TURNS = STALL_N;

// T10Q4 — same-turn Face auto-resolve DEFEAT is progress (Fight: VICTORY already was; DEFEAT was the LOOP STOP gap).
const PROGRESS_RECEIPT = /^(?:XP Gained|Loot:|Gold Gained|Quest|Fight: (?:VICTORY|DEFEAT)|Parley check:.*success|Dungeon: (?:you moved|you opened|you found|search of .*you found (?!nothing))|Dungeon: .* is cleared|Nudge:|.+ pulls away)/i;

/**
 * 29z1 / T10RC3 — player-caused person-facing ledger change only.
 * Talk commits (facts length, topics, met, disposition, standing, purchases) count.
 * Director stall self-writes must not: agenda/threat fact churn, seat/depart present flips.
 * (Do not hash sceneFacts.present — travel trim is not social; T10AR.)
 */
function socialSignature(state: GameState): string {
  const mems = (state.npcMemories ?? [])
    .map((m) =>
      [
        m.npcId,
        m.facts?.length ?? 0,
        m.completedTopics?.length ?? 0,
        m.met ? 1 : 0,
        m.disposition,
        m.relationshipStatus ?? '',
        m.knownPlayerName ?? '',
        (m.purchases ?? []).length,
      ].join(':')
    )
    .sort()
    .join('|');
  const arc = state.arcDirector;
  const topics = Object.entries(arc?.npcTopics ?? {})
    .map(([k, v]) => `${k}:${v.length}`)
    .sort()
    .join('|');
  return [
    mems,
    topics,
    Object.keys(arc?.topicCommits ?? {}).length,
    (arc?.socialMilestones ?? []).length,
    JSON.stringify(arc?.npcRelationships ?? null),
  ].join('#');
}

/** A new person remembered, a new answered fact or topic, or a relationship change committed this turn. */
export function socialChanged(before: GameState, after: GameState): boolean {
  return socialSignature(before) !== socialSignature(after);
}

function questSignature(state: GameState): string {
  return (state.quests ?? [])
    .map((q) => `${q.id}:${q.status}:${q.revealed ? 1 : 0}:${(q.objectives ?? []).filter((o) => o.completed).length}`)
    .sort()
    .join('|');
}

const placeName = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * A move that goes somewhere: the place (or the far end of the road being walked) is not one of the
 * last few places. A bounce between two places, road included, is not movement.
 */
export function movedOn(before: GameState, after: GameState): boolean {
  const from = placeName(before.currentLocation);
  const to = placeName(after.currentLocation);
  const aj = after.journey && after.journey.legsDone < after.journey.legsTotal ? after.journey : null;
  const bj = before.journey;
  const legOn = !!aj && !!bj && placeName(bj.to) === placeName(aj.to) && aj.legsDone > bj.legsDone;
  if ((!to || to === from) && !legOn) return false;
  const target = placeName(aj ? aj.to : after.currentLocation);
  const recent = [...(before.circling?.recentPlaces ?? []), from].filter(Boolean);
  return !recent.some((p) => samePlace(p, target));
}

export interface TurnProgress {
  progressed: boolean;
  reasons: string[];
}

/**
 * 29z1 / T10RC3 — the one meaning of progress (loop stop, thumbs no-progress, recordCirclingTurn):
 * XP or level, loot, quest, fight, non-bounce move, place unlock, or player-caused social
 * (talk / disposition / topics — not Director agenda/seat churn). A new chip label is not progress.
 */
function placeDiscoverySignature(state: GameState): string {
  const disc = [...(state.discoveredLocations ?? [])].map((x) => x.toLowerCase()).sort().join('|');
  const places = (state.places ?? [])
    .map((p) => `${(p.id ?? '').toLowerCase()}:${(p.name ?? '').toLowerCase()}`)
    .sort()
    .join('|');
  return `${disc}#${places}`;
}

export function turnProgress(before: GameState, after: GameState, receipts: string[] = []): TurnProgress {
  const reasons: string[] = [];
  if ((after.character?.xp ?? 0) !== (before.character?.xp ?? 0) || (after.character?.level ?? 1) !== (before.character?.level ?? 1)) {
    reasons.push('xp');
  }
  // T10AG — LitRPG class pick (Choose Warrior/Berserker/Sorcerer) is durable progress, not a soft chip flip.
  const classOf = (s: GameState) => s.character?.srd?.classId ?? s.character?.classId ?? '';
  if (classOf(after) !== classOf(before)) reasons.push('class');
  if ((after.inventory ?? []).length > (before.inventory ?? []).length) reasons.push('loot');
  if (questSignature(after) !== questSignature(before)) reasons.push('quest');
  if (receipts.some((r) => PROGRESS_RECEIPT.test(r))) reasons.push('receipt');
  if (movedOn(before, after)) reasons.push('moved');
  if (socialChanged(before, after)) reasons.push('social');
  // T10DIR2 — engine unlock of a place card / discoveredLocations (director lead), not prose.
  if (placeDiscoverySignature(after) !== placeDiscoverySignature(before)) reasons.push('place');
  const inFight = (s: GameState) => !!s.activeEncounter || !!s.deathSaves;
  if ((inFight(before) || inFight(after)) && fightSignature(before) !== fightSignature(after)) reasons.push('fight');
  return { progressed: reasons.length > 0, reasons };
}

/** A fight round or a death save moves the game: either side's HP, the foe's presence, or the save tally. */
function fightSignature(state: GameState): string {
  const enc = state.activeEncounter;
  const saves = state.deathSaves;
  return [
    state.character?.hp ?? '',
    enc ? `${enc.name}:${enc.hp ?? ''}:${enc.count ?? ''}` : '-',
    saves ? `${saves.successes}:${saves.failures}:${saves.stable ? 1 : 0}:${saves.dead ? 1 : 0}` : '-',
  ].join('|');
}

/**
 * After the writer's facts are committed: a social / quest / XP / loot change this turn counts as progress
 * for the turn circling already recorded (the stuck count resets; the ask is no longer "tried with nothing").
 */
export function creditCommittedProgress(recorded: GameState, after: GameState, playerInput: string): GameState {
  const mem = after.circling;
  if (!mem) return after;
  const p = turnProgress(recorded, after, []);
  if (!p.reasons.some((r) => r !== 'moved')) return after;
  const turn = recorded.turn ?? 0;
  const key = placeKey(recorded);
  const act = actionKey(playerInput);
  const triedHere = { ...(mem.tried?.[key] ?? {}) };
  if (act) delete triedHere[act];
  const staleHere = { ...(mem.stale?.[key] ?? {}) };
  delete staleHere[actionFamily(playerInput)];
  return {
    ...after,
    circling: {
      ...mem,
      stale: { ...mem.stale, [key]: staleHere },
      tried: { ...(mem.tried ?? {}), [key]: triedHere },
      lastProgressTurn: Math.max(mem.lastProgressTurn, turn),
    },
  };
}

export function actionFamily(input: string): string {
  const a = (input ?? '').toLowerCase();
  // Check System is chrome, never filler.
  if (/^check system\b/.test(a)) return 'other';
  // Keep inspect/examine/study as 'inspect' for loiter/stall (29x / 10c); filler cap still covers them.
  if (/\b(inspect|examine|study)\b/.test(a)) return 'inspect';
  if (/\b(wait|ready yourself|watch|hold still|keep watch)\b/.test(a)) return 'wait';
  if (/\b(look around|look over|survey|scout|scan)\b/.test(a)) return 'look';
  if (/\b(talk|ask|speak|greet|offer)\b/.test(a)) return 'talk';
  if (/\b(travel|go to|go back|head to|walk to|return to|enter|next unexplored|go through)\b/.test(a)) return 'move';
  if (/^hunt the\b/.test(a) || /^i go hunting\b/.test(a)) return 'fight';
  if (/^gather\b/.test(a) || /^i look for (?:ore|herbs|resources)\b/.test(a)) return 'other';
  if (/\b(attack|fight|strike|flee|parley|face the|look for a fight)\b/.test(a)) return 'fight';
  // XP-D1 OPEN3/OPEN4 — Read / Analyze / Open-box / Search / Listen / Investigate / Loot.
  if (
    /^(?:search|read|analyze|open|listen|investigate|loot)\b/.test(a)
    || /\b(search|loot|read the system trail|open the .+ reward box|look inward)\b/.test(a)
  ) {
    return 'search';
  }
  if (/^use\b/.test(a)) return 'use';
  return 'other';
}

/** Search / Read / Analyze / Open / Inspect / Use — no-progress filler (one owner with turnProgress). */
export function isFillerNoProgressChip(chip: string): boolean {
  const fam = actionFamily(chip);
  return fam === 'search' || fam === 'use' || fam === 'inspect';
}

/**
 * Meaningful scene key for filler suppress (OPEN4): place + quest + fight + kit + level.
 * Raw XP ticks do NOT clear the block (open3 leftover).
 */
export function fillerSceneKey(state: GameState): string {
  const quest = (state.quests ?? [])
    .map((q) => `${q.id}:${q.status}:${(q.objectives ?? []).filter((o) => o.completed).length}`)
    .sort()
    .join('|');
  const enc = state.activeEncounter
    ? `${state.activeEncounter.name}:${state.activeEncounter.hp ?? ''}`
    : state.sceneFacts?.lastKill?.name ?? '-';
  // NPC beat = met roster size (introSpoken), not flicker-prone present[] labels.
  const npcBeat = (state.npcMemories ?? [])
    .filter((n) => n.introSpoken)
    .map((n) => (n.npcId || n.npcName || '').toLowerCase())
    .sort()
    .join(',');
  return [
    placeKey(state),
    quest,
    enc,
    npcBeat,
    String((state.inventory ?? []).length),
    String(state.character?.level ?? 1),
  ].join('#');
}

const FILLER_OFFER_CAP = 2;

/** Family key for offer-cap (OPEN5: rotating Read/Analyze labels must share one budget). */
function fillerOfferFamilyKey(chip: string): string {
  return `fam:${actionFamily(chip)}`;
}

/** Credit offered filler labels under the current meaningful scene (call once per committed pad). */
export function creditFillerOffers(state: GameState, offered: string[]): GameState {
  const mem = state.circling ?? { stale: {}, lastProgressTurn: state.turn ?? 0 };
  const sceneKey = fillerSceneKey(state);
  let offerSceneKey = mem.fillerOfferSceneKey;
  let offerCounts = { ...(mem.fillerOfferCounts ?? {}) };
  let fillerBlockedFamilies = [...(mem.fillerBlockedFamilies ?? [])];
  let fillerBlockSceneKey = mem.fillerBlockSceneKey;
  if (offerSceneKey && offerSceneKey !== sceneKey) {
    offerSceneKey = sceneKey;
    offerCounts = {};
  }
  if (!offerSceneKey) offerSceneKey = sceneKey;
  for (const raw of offered) {
    if (!isFillerNoProgressChip(raw)) continue;
    if (isFreeInputChipLabel(raw)) continue;
    // Hunt / Gather / Check System / Seek Fight are never filler.
    if (/^hunt the\b|^gather\b|^look for a fight$|^check system\b/i.test((raw ?? '').trim())) continue;
    const key = actionKey(raw);
    if (!key) continue;
    offerCounts[key] = (offerCounts[key] ?? 0) + 1;
    const famKey = fillerOfferFamilyKey(raw);
    offerCounts[famKey] = (offerCounts[famKey] ?? 0) + 1;
    // OPEN5 — after 2 offers of any search/read/analyze/… family label, block the whole family
    // (OPEN4 per-label cap missed when the compiler rotated "signs of the rumor/report/proof").
    const fam = actionFamily(raw);
    if ((offerCounts[famKey] ?? 0) >= FILLER_OFFER_CAP && !fillerBlockedFamilies.includes(fam)) {
      fillerBlockedFamilies = [...fillerBlockedFamilies, fam];
      fillerBlockSceneKey = sceneKey;
    }
  }
  return {
    ...state,
    circling: {
      ...mem,
      fillerOfferSceneKey: offerSceneKey,
      fillerOfferCounts: offerCounts,
      fillerBlockedFamilies,
      fillerBlockSceneKey,
    },
  };
}

function isFreeInputChipLabel(chip: string): boolean {
  return /^(?:say something|do something else)/i.test((chip ?? '').trim());
}

/** True when this filler label (or its family) has already been offered FILLER_OFFER_CAP times without a meaningful scene change. */
export function fillerOfferExhausted(state: GameState, chip: string): boolean {
  if (!isFillerNoProgressChip(chip)) return false;
  if (/^hunt the\b|^gather\b|^look for a fight$/i.test((chip ?? '').trim())) return false;
  const mem = state.circling;
  if (!mem?.fillerOfferSceneKey || mem.fillerOfferSceneKey !== fillerSceneKey(state)) return false;
  const n = mem.fillerOfferCounts?.[actionKey(chip)] ?? 0;
  if (n >= FILLER_OFFER_CAP) return true;
  const famN = mem.fillerOfferCounts?.[fillerOfferFamilyKey(chip)] ?? 0;
  return famN >= FILLER_OFFER_CAP;
}

const LOITER = new Set(['inspect', 'wait', 'look']);
const TRIED_TURNS = 6;
const TRIED_PER_PLACE = 12;
const RECENT_PLACES = 4;
const SHORT_RETURN_TURNS = 2;

function placeKey(state: GameState): string {
  return (state.currentLocation ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function actionKey(input: string): string {
  return (input ?? '').toLowerCase().replace(/[…]|\.{3}/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Turns since this exact action was tried here with no progress (null = not recently). */
function triedAgo(state: GameState, chip: string): number | null {
  const last = state.circling?.tried?.[placeKey(state)]?.[actionKey(chip)];
  if (last == null) return null;
  const ago = (state.turn ?? 0) - last;
  return ago < TRIED_TURNS ? ago : null;
}

/**
 * Record this turn: what was tried here, and whether the game moved on (turnProgress against the
 * state at the start of the turn; without it, against the last recorded place).
 */
export function recordCirclingTurn(state: GameState, playerInput: string, receipts: string[], before?: GameState): GameState {
  const mem: CirclingMemory = state.circling ?? { stale: {}, lastProgressTurn: state.turn ?? 0 };
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const moved = !!mem.lastLocation && here !== mem.lastLocation;
  // HERE stays the road label for a whole trip; a new leg or a reroute is still a move.
  const j = state.journey;
  const leg = j && j.legsDone < j.legsTotal ? `${j.from}>${j.to}>${j.startedTurn}>${j.legsDone}` : undefined;
  const legMoved = !moved && !!leg && !!mem.lastLeg && leg !== mem.lastLeg;
  const start: GameState = before ?? { ...state, currentLocation: mem.lastLocation ?? here, journey: state.journey };
  const progressed = mem.lastLocation
    ? turnProgress({ ...start, circling: mem }, state, receipts).progressed
    : receipts.some((r) => PROGRESS_RECEIPT.test(r));
  const key = placeKey(state);
  const fam = actionFamily(playerInput);
  const stale = { ...mem.stale, [key]: { ...(mem.stale[key] ?? {}) } };
  if (!progressed && LOITER.has(fam)) stale[key]![fam] = state.turn ?? 0;
  if (progressed) delete stale[key]![fam];
  const visits = { ...(mem.visits ?? {}) };
  if (moved || !mem.lastLocation) visits[key] = (visits[key] ?? 0) + 1;
  const act = actionKey(playerInput);
  const triedHere = { ...(mem.tried?.[key] ?? {}) };
  // T10WARDEN2 — identical action + identical engine result → mark for pad demotion (never reject free text).
  const resultBlob = [
    ...(receipts ?? []),
    state.completedEvent?.engineResult ?? '',
  ].join(' ');
  const deadKey = !progressed && act
    ? `${act}|${resultBlob.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}`
    : '';
  if (act) {
    if (progressed) delete triedHere[act];
    else triedHere[act] = state.turn ?? 0;
  }
  const trimmed = Object.fromEntries(
    Object.entries(triedHere).sort((a, b) => b[1] - a[1]).slice(0, TRIED_PER_PLACE)
  );
  const tried = { ...(mem.tried ?? {}), [key]: trimmed };
  const priorPlaces = mem.recentPlaces ?? [];
  const turnedBack =
    moved && priorPlaces.length >= 2 && priorPlaces[priorPlaces.length - 2] === key
    && (state.turn ?? 0) - (mem.movedTurn ?? -99) <= SHORT_RETURN_TURNS;
  const recentPlaces = moved || !mem.lastLocation
    ? [...priorPlaces.filter((p) => p !== key), key].slice(-RECENT_PLACES)
    : priorPlaces;
  const recentFamilies = [...(mem.recentFamilies ?? []), fam].slice(-3);
  const offRoad = moved && isRoadLabel(mem.lastLocation);
  const left = offRoad
    ? before?.journey?.from || mem.lastLeg?.split('>')[0] || mem.prevPlace
    : mem.lastLocation;
  // XP-D1 OPEN3/OPEN4 — dead Search/Read/… take blocks the filler family until a *meaningful* scene change.
  // Meaningful = fillerSceneKey (no raw XP). Social-only turnProgress does not clear the offer-cap scene.
  const sceneKey = fillerSceneKey(state);
  let fillerBlockSceneKey = mem.fillerBlockSceneKey;
  let fillerBlockedFamilies = mem.fillerBlockedFamilies ?? [];
  let fillerOfferSceneKey = mem.fillerOfferSceneKey;
  let fillerOfferCounts = mem.fillerOfferCounts ?? {};
  const meaningfulMoved = !fillerBlockSceneKey || fillerBlockSceneKey !== sceneKey;
  const offerSceneMoved = !fillerOfferSceneKey || fillerOfferSceneKey !== sceneKey;
  // Clear offer counts / family block only on meaningful scene change (place/quest/fight/kit/level/NPC beat).
  if (fillerBlockSceneKey && meaningfulMoved) {
    fillerBlockSceneKey = undefined;
    fillerBlockedFamilies = [];
  }
  if (fillerOfferSceneKey && offerSceneMoved) {
    fillerOfferSceneKey = undefined;
    fillerOfferCounts = {};
  }
  if (!progressed && (fam === 'search' || fam === 'use')) {
    fillerBlockSceneKey = sceneKey;
    // Family-block Search/Read/Analyze/Open/Use. Inspect/Study use offer-count + tried rest (T10WARDEN2).
    if (!fillerBlockedFamilies.includes(fam)) fillerBlockedFamilies = [...fillerBlockedFamilies, fam];
  }
  return {
    ...state,
    circling: {
      ...mem,
      stale,
      visits,
      tried,
      recentPlaces,
      recentFamilies,
      lastProgressTurn: progressed ? state.turn ?? 0 : mem.lastProgressTurn,
      prevPlace: moved ? left : mem.prevPlace,
      tripArrivalTurn: offRoad ? state.turn ?? 0 : moved ? undefined : mem.tripArrivalTurn,
      lastLocation: here,
      movedTurn: moved || legMoved ? state.turn ?? 0 : mem.movedTurn,
      lastLeg: leg,
      shortReturnTurn: turnedBack ? state.turn ?? 0 : moved ? undefined : mem.shortReturnTurn,
      openingPlace: mem.openingPlace ?? (state.circling ? undefined : here || undefined),
      lastDeadActResult: progressed ? undefined : (deadKey || mem.lastDeadActResult),
      fillerBlockSceneKey,
      fillerBlockedFamilies,
      fillerOfferSceneKey,
      fillerOfferCounts,
    },
  };
}

/** Turns since the last progress (XP, move, loot, quest, new fact). */
export function turnsWithoutProgress(state: GameState): number {
  const mem = state.circling;
  if (!mem) return 0;
  return Math.max(0, (state.turn ?? 0) - mem.lastProgressTurn);
}

/**
 * T10DIR — anti-circling nudge routes through the Director (sole progression owner).
 * Deleted: "Nudge skipped: no engine-fact nudge; OPT-5 stall uses the scene planner" dead end.
 */
export function nudgeIfStuck(state: GameState): { state: GameState; receipts: string[]; notes: string[] } {
  return directorNudgeIfStuck(state);
}

function travelDest(chip: string): string | null {
  const m = chip.match(/^(?:travel\s+(?:toward|to)|go\s+to|head\s+(?:to|toward)|walk\s+to|return\s+to|go\s+back\s+to)\s+(.+)$/i);
  return m ? m[1]!.replace(/[.!?]+$/, '').trim() : null;
}

/** Orientation steps — LitRPG/RPG still skip them for the *chip* so Hear/Scout can show; they pay XP separately. */
function isBearingsChipStep(description: string): boolean {
  const d = (description ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return !!d && (/\bbearings?\b/.test(d) || /\borient(?:ation|ing)?\b/.test(d));
}

/** Next open objective index; LitRPG/RPG skip bearings so Hear their reason / Scout… can show early. */
function storyObjectiveIndex(state: GameState, quest: { objectives?: QuestObjective[] }): number {
  const objs = quest.objectives ?? [];
  const skipBearings = state.engineMode === 'litrpg' || state.engineMode === 'rpg';
  for (let i = 0; i < objs.length; i++) {
    const o = objs[i]!;
    if (o.completed || o.optional) continue;
    if (skipBearings && isBearingsChipStep(o.description)) continue;
    return i;
  }
  return -1;
}

function chipAlreadyPlayed(state: GameState, chip: string): boolean {
  const said = chip.toLowerCase();
  return (state.log ?? []).some(
    (e) => e.role === 'player' && String(e.content ?? '').replace(/\s+/g, ' ').trim().toLowerCase() === said
  );
}

/** Active starter / main first, then any accepted revealed quest (LitRPG / Story RPG). */
function storyQuestForChip(state: GameState) {
  if (state.engineMode === 'dnd') return mainSpineQuest(state);
  const live = (state.quests ?? []).filter((q) => q.status === 'active' && q.revealed);
  return live.find((q) => q.type === 'main') ?? live[0] ?? null;
}

/** The quest's next step as one chip, when the engine knows one. */
export function storyChip(state: GameState): string | null {
  if (state.activeEncounter) return null;
  // Story RPG: a decision step is taken by its own chip (storyRpgProgress ticks it), wherever the player is.
  const decision = storyRpgDecisionChip(state);
  if (decision) return decision;
  const tabletopStep = tabletopStepChip(state);
  if (tabletopStep) return tabletopStep;
  // Tabletop: the main quest the step tracker follows, so no chip speaks for another quest's step.
  // (dnd chip set unchanged — tabletopStepChip above owns TT pads; this branch is LitRPG/RPG.)
  const quest = storyQuestForChip(state);
  if (!quest) return null;
  const here = (state.currentLocation ?? '').toLowerCase();
  const objIdx = storyObjectiveIndex(state, quest);
  const obj = objIdx >= 0 ? quest.objectives![objIdx] : undefined;
  const talkStage = !!obj && isTalkStageObjective(state, quest.id, objIdx);
  const giver = talkStage ? talkStageGiver(state, quest.id, objIdx) : null;
  const giverHere = !!giver && giverIsHere(state, giver);
  // A talk stage whose giver stands here is done here, before any trip to the quest's site.
  if (!giverHere) {
    const hubs = hubsForBibleId(state.campaignBibleId);
    // LitRPG/RPG talk stage: travel to the opener place (giver home) before a generic quest site.
    const opener = (state.openingEstablishment?.answers?.where ?? '').trim();
    const leads =
      (state.engineMode === 'dnd' && obj ? tabletopStepAnchor(state, quest, objIdx).place : null)
      ?? (talkStage && (state.engineMode === 'litrpg' || state.engineMode === 'rpg') ? opener || null : null)
      ?? questTravelSite(quest);
    const site = leads ? matchHub(hubs, leads) : null;
    if (site && !here.includes(site.name.toLowerCase()) && !samePlace(here, site.name.toLowerCase())) {
      return `Travel toward ${site.name}`;
    }
    // Opener string may not be a hub — still offer Travel toward <opener> when away.
    if (
      talkStage
      && (state.engineMode === 'litrpg' || state.engineMode === 'rpg')
      && opener
      && !samePlace(here, opener.toLowerCase())
    ) {
      return `Travel toward ${opener}`;
    }
    const linked = hubs.find((h) => h.linkedQuestIds?.includes(quest.id) && !here.includes(h.name.toLowerCase()));
    if (!site && linked) return `Travel toward ${linked.name}`;
    if (talkStage) return null;
  }
  // At the opening card's place the card's talk chip carries the stage: one label for one topic.
  const cardPlace = (state.openingEstablishment?.answers?.where ?? '').trim().toLowerCase();
  const atCard = giverHere && samePlace(here, cardPlace) && !hallTopicAlreadyAnswered(state, 'want');
  // XP-D1 A2: if Ask-what-they-want was already played, fall through to the XP-paying step chip
  // (do not return null and starve Hear their reason / Scout…).
  let chip = obj ? (atCard ? 'Ask what they want' : stepChip(obj)) : null;
  if (chip && atCard && chipAlreadyPlayed(state, chip)) {
    chip = stepChip(obj!);
  }
  if (!chip) return null;
  // Offered only when an engine action carries it out: a talk to its giver here, a move, or opening the site here.
  if (!talkStage && !travelChipMoves(state, chip) && !objectiveOpensInterior(state, chip)) return null;
  return chipAlreadyPlayed(state, chip) ? null : chip;
}

const FREE_INPUT_CHIP = /^(?:say something|do something else)/i;

/**
 * XP-D1 A2 — LitRPG / Story RPG: keep the quest step (or travel-to-step) chip in the top N.
 * Drops a lower pad when injecting; tabletop / PYOA unchanged.
 */
export function pinStoryChipInTop(state: GameState, choices: string[], topN = 3): string[] {
  if (state.engineMode !== 'litrpg' && state.engineMode !== 'rpg') return choices;
  if (state.activeEncounter || !choices.length) return choices;
  const story = storyChip(state);
  if (!story) return choices;
  const list = [...choices];
  const want = story.toLowerCase();
  const idx = list.findIndex((c) => c.toLowerCase() === want);
  if (idx >= 0 && idx < topN) return list;
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(story);
  if (list.length > choices.length) {
    for (let i = list.length - 1; i >= topN; i--) {
      const c = list[i]!;
      if (FREE_INPUT_CHIP.test(c) || c.toLowerCase() === want) continue;
      list.splice(i, 1);
      break;
    }
  }
  return list;
}

const OBJECTIVE_TAIL =
  /;|\s(?:amidst|amid|among|in|inside|within|at|from|before|after|while|near|beneath|under|on|across|through|by|and|then|until|without|so)\s/i;

/** An objective as a whole chip: the sentence if it fits, else its verb and object. Never a cut-off line. */
export function objectiveChip(description: string): string | null {
  const whole = (description ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  if (!whole) return null;
  if (whole.length <= 60) return whole;
  // A long step's aside in brackets is a note, never part of the chip.
  const text = whole.replace(/\s*\([^)]*\)/g, '').trim();
  if (text.length <= 60) return text;
  const head = text.split(OBJECTIVE_TAIL)[0]!.trim();
  return head.split(' ').length >= 2 && head.length <= 60 ? head : null;
}

/** A quest step as a chip: its own verb and object when the step record carries them, else the sentence as a whole chip. */
export function stepChip(step: Pick<QuestObjective, 'description' | 'verb' | 'object'>): string | null {
  if (step.verb && step.object) return `${step.verb} ${step.object}`;
  return objectiveChip(step.description);
}

const samePlace = (a: string, b: string) => !!a && !!b && (a === b || a.includes(b) || b.includes(a));

/**
 * Lower = moves the game on. 0 story step · 1 fresh place / room / fight · 2 unmet person · 3 other ·
 * 4 place visited before · 5 one of the last few places · 6 loiter · 7 head back · 9 the previous place.
 * An exact action already tried here with no progress adds 5.
 */
export function chipProgressScore(state: GameState, chip: string): number {
  const lower = chip.toLowerCase();
  const story = storyChip(state);
  const mem = state.circling;
  // T10WARDEN2 — same exact action that just yielded the same dead result ranks worse (pads only).
  const deadAct = (mem?.lastDeadActResult ?? '').split('|')[0] ?? '';
  const sameDead = !!deadAct && actionKey(chip) === deadAct ? 4 : 0;
  const repeat = (triedAgo(state, chip) != null ? 5 : 0) + sameDead;
  if (story && lower === story.toLowerCase()) return repeat;
  const dest = travelDest(chip);
  if (dest) {
    const d = dest.toLowerCase();
    const prev = (mem?.prevPlace ?? '').toLowerCase();
    // T10AR — bounce travel (prev / recent) ranks below untried talk so hub ping-pong
    // is not the Fate-weighted first pick while Ask chips sit open (s9601 T160–T165).
    if (samePlace(d, prev)) return 9 + repeat;
    if ((mem?.recentPlaces ?? []).some((p) => samePlace(d, p))) return 8 + repeat;
    const visited = (state.places ?? []).some((p) => p.lastVisitedTurn != null && p.name.toLowerCase() === d);
    return (visited ? 4 : 1) + repeat;
  }
  if (/^(?:enter|next unexplored room|fight the|open the|search the)\b/i.test(chip)) return 1 + repeat;
  const unmet = presentNpcRecords(state).filter((m) => !isMetNpc(m)).map((m) => m.npcName.toLowerCase());
  if (unmet.some((n) => lower.includes(n))) return 2 + repeat;
  const fam = actionFamily(chip);
  // T10AR — under stall, an untried talk/agenda chip outranks revisit travel.
  if (fam === 'talk' && triedAgo(state, chip) == null && stallPressureActive(state)) return 1 + repeat;
  if (fam === 'fight') return 1 + repeat;
  if (LOITER.has(fam)) return 6 + repeat;
  if (/^head back to the exit$/i.test(chip)) return 7 + repeat;
  return 3 + repeat;
}

/** Picker weights from chipProgressScore: progress chips are likelier, repeats and yo-yo still possible. */
export function chipProgressWeights(state: GameState, choices: string[]): number[] {
  return choices.map((c) => {
    const s = chipProgressScore(state, c);
    if (s <= 0) return 8;
    if (s === 1) return 6;
    if (s === 2) return 5;
    if (s === 3) return 3;
    if (s === 4) return 2;
    if (s <= 6) return 1;
    if (s <= 8) return 0.5;
    return 0.25;
  });
}

export const SEEK_FIGHT_CHIP = 'Look for a fight';
/** XP-D1 OPEN5 — player-chosen hunt (always-on in wilds; not drought-gated, not filler). */
export const HUNT_WILDS_CHIP = 'Hunt the wildlife nearby';
export const GATHER_WILDS_CHIP = 'Gather herbs and resources nearby';
/** XP-D1 OPEN6 — turn in enough mats for a gather-quest objective. */
export const HAND_OVER_MATERIALS_CHIP = 'Hand over the materials';

export function isSeekFightChip(input: string): boolean {
  return actionKey(input) === actionKey(SEEK_FIGHT_CHIP);
}

export function isHuntChip(input: string): boolean {
  return /^hunt the (?:wildlife nearby|animal)\b/i.test((input ?? '').trim());
}

export function isGatherChip(input: string): boolean {
  return /^gather herbs and resources nearby$/i.test((input ?? '').trim());
}

export function isHandOverMaterialsChip(input: string): boolean {
  return /^hand over the materials\b/i.test((input ?? '').trim());
}

/**
 * When an active revealed quest objective asks for N of a material the player holds enough of,
 * offer the Hand over pad. Matches objective text / target against material name or id.
 */
export function gatherQuestTurnInChip(state: GameState): string | null {
  const mats = state.materials ?? [];
  if (!mats.length) return null;
  for (const q of state.quests ?? []) {
    if (!q.revealed || (q.status !== 'active' && q.status !== 'available')) continue;
    for (const o of q.objectives ?? []) {
      if (o.completed) continue;
      const targetName = typeof o.target === 'object' && o.target ? o.target.name : '';
      const text = `${o.description ?? ''} ${o.object ?? ''} ${targetName} ${o.id ?? ''}`.toLowerCase();
      if (!/\b(herb|ore|hide|leather|bloom|peacebloom|copper|iron|gather|collect|deliver|bring)\b/i.test(text)) {
        continue;
      }
      const qtyMatch = text.match(/\b(\d{1,3})\b/);
      const need = Math.max(1, qtyMatch ? parseInt(qtyMatch[1]!, 10) : 1);
      const hit = mats.find((m) => {
        const id = m.id.toLowerCase();
        const name = m.name.toLowerCase();
        return (
          text.includes(id)
          || text.includes(name)
          || (/\bherb/.test(text) && /bloom|leaf|herb|thorn|root|blood/.test(id + name))
          || (/\bore\b/.test(text) && /ore|copper|tin|iron|mithril|thorium/.test(id + name))
          || (/\b(hide|leather)\b/.test(text) && /leather|hide/.test(id + name))
        );
      });
      if (hit && (hit.quantity ?? 0) >= need) return HAND_OVER_MATERIALS_CHIP;
    }
  }
  return null;
}

/** Visited this save: a place record with a visit turn, or a place the circling memory arrived at. */
function placeVisited(state: GameState, name: string): boolean {
  const n = name.toLowerCase();
  if ((state.places ?? []).some((p) => p.lastVisitedTurn != null && samePlace(p.name.toLowerCase(), n))) return true;
  return Object.keys(state.circling?.visits ?? {}).some((k) => samePlace(k, n));
}

function isRevisitChip(state: GameState, chip: string): boolean {
  const dest = travelDest(chip);
  return !!dest && placeVisited(state, dest);
}

/** An unvisited exit, a fight or the quest step, not already tried here with no progress. */
function movesOn(state: GameState, chip: string, story: string | null): boolean {
  if (triedAgo(state, chip) != null) return false;
  if (story && chip.toLowerCase() === story.toLowerCase()) return true;
  if (travelDest(chip)) return !isRevisitChip(state, chip);
  if (/^(?:enter|next unexplored room|fight the)\b/i.test(chip)) return true;
  return actionFamily(chip) === 'fight';
}

function canSeekFight(state: GameState): boolean {
  if (!engineAllowsCombat(state) || state.sceneFacts?.pendingEncounter) return false;
  if (state.arcDirector?.lastEncounterClearedTurn === state.turn) return false;
  const lastKillTurn = state.sceneFacts?.lastKill?.turn;
  return !(typeof lastKillTurn === 'number' && (state.turn ?? 0) - lastKillTurn <= 1);
}

/**
 * No way on offered (revisits only, or stuck in place): one chip that moves the game on —
 * the best unvisited hub (quest-linked first), else a fight where the mode allows combat,
 * else (stuck with no travel at all) the least recent hub.
 */
function wayOnChip(state: GameState, list: string[], story: string | null): string | null {
  const mem = state.circling;
  if (!mem || state.activeDungeon || state.openingEstablishment?.complete === false) return null;
  if (list.some((c) => movesOn(state, c, story))) return null;
  const revisitsOnly = list.some((c) => isRevisitChip(state, c));
  const stuck = turnsWithoutProgress(state) >= 2 && !(mem.recentFamilies ?? []).slice(-2).includes('move');
  if (!revisitsOnly && !stuck) return null;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const here = placeKey(state);
  const hereHub = matchHub(hubs, state.currentLocation);
  const active = new Set((state.quests ?? []).filter((q) => q.status === 'active' && q.revealed).map((q) => q.id));
  const recent = mem.recentPlaces ?? [];
  const others = hubs
    .filter((h) => h.id !== hereHub?.id && !here.includes(h.name.toLowerCase()))
    .map((h, i) => ({
      h,
      i,
      visited: placeVisited(state, h.name),
      r: (h.linkedQuestIds?.some((id) => active.has(id)) ? 0 : 4) + (recent.some((p) => samePlace(h.name.toLowerCase(), p)) ? 1 : 0),
    }));
  const fresh = others.filter((o) => !o.visited).sort((a, b) => a.r - b.r || a.i - b.i)[0]?.h;
  if (fresh) return `Travel toward ${fresh.name}`;
  // 29z1 — standing still is not a reason to fight while an unanswered talk is on offer.
  const talkOpen = list.some((c) => actionFamily(c) === 'talk' && triedAgo(state, c) == null);
  if (canSeekFight(state) && (revisitsOnly || !talkOpen)) return SEEK_FIGHT_CHIP;
  if (list.some((c) => travelDest(c) || /^(?:enter|next unexplored room)\b/i.test(c))) return null;
  const old = others.sort((a, b) => a.r - b.r || a.i - b.i)[0]?.h;
  return old ? `Travel toward ${old.name}` : null;
}

const JOB_CHIP = /\b(?:accept|take (?:on |up )?(?:the )?(?:job|work|quest|contract|bounty)|job|quest|contract|bounty)\b/i;
const WAY_ON_CHIP = /^(?:walk on|enter|next unexplored room)\b/i;

/** The quest step or a job chip, not already tried here with no progress. */
function isUntriedJob(state: GameState, chip: string, story: string | null): boolean {
  if (triedAgo(state, chip) != null) return false;
  if (story && chip.toLowerCase() === story.toLowerCase()) return true;
  return JOB_CHIP.test(chip) && !travelDest(chip) && actionFamily(chip) !== 'talk';
}

/** An exit to a place not visited yet (or the way on along a road / into a room), not already tried here. */
function isUnusedExit(state: GameState, chip: string): boolean {
  if (triedAgo(state, chip) != null) return false;
  if (travelDest(chip)) return !isRevisitChip(state, chip);
  return WAY_ON_CHIP.test(chip);
}

/**
 * 29z1 — this same ask was already answered: tried here and nothing new came of it (a talk that committed
 * a fact is progress and leaves the tried memory). Having met the person is not enough.
 */
function isHeardTalk(state: GameState, chip: string): boolean {
  return actionFamily(chip) === 'talk' && triedAgo(state, chip) != null;
}

/**
 * 29x — auto player only (a person can still tap any chip). Replaces the pick with the untried job, else an
 * unused exit, when (1) the pick asks again what was already answered, or (2) the last auto picks were only
 * look / wait / inspect and the pick is not a talk. Returns the pick unchanged when neither applies.
 */
export function applyAutoPlayerStallRules(
  state: GameState,
  offered: string[],
  pick: string
): { pick: string; rule: 'heard-talk' | 'loiter' | null } {
  if (state.activeEncounter) return { pick, rule: null };
  const story = storyChip(state);
  const wayOn =
    offered.find((c) => isUntriedJob(state, c, story)) ?? offered.find((c) => isUnusedExit(state, c));
  if (!wayOn || wayOn === pick) return { pick, rule: null };
  if (isHeardTalk(state, pick)) return { pick: wayOn, rule: 'heard-talk' };
  const recent = state.circling?.recentFamilies ?? [];
  if (actionFamily(pick) !== 'talk' && recent.length >= 2 && recent.every((f) => LOITER.has(f))) {
    return { pick: wayOn, rule: 'loiter' };
  }
  return { pick, rule: null };
}

const SHOWN_CHIPS = 4;
/** Only a dungeon card offers this chip, so its presence means the player is inside one. */
const CARD_EXIT = /^head back to the exit$/i;

/** Final chip order: move-the-story-on and new things first, stale loiter and tried repeats rested, "Go back" last. */
export function rankChoices(state: GameState, choices: string[]): { choices: string[]; notes: string[] } {
  const notes: string[] = [];
  if (state.activeEncounter || !choices.length) return { choices, notes };
  const mem = state.circling;
  const key = placeKey(state);
  const turn = state.turn ?? 0;
  const story = storyChip(state);

  let list = [...choices];
  // Inside a dungeon card the way out is the card's own exit chip; a travel story chip would skip it.
  const cardOwnsExit = choices.some((c) => CARD_EXIT.test(c)) && !!travelDest(story ?? '');
  if (story && !cardOwnsExit && !list.some((c) => c.toLowerCase() === story.toLowerCase())) {
    list = [story, ...list];
    notes.push(`Story chip: ${story.slice(0, 40)}`);
  }
  // XP-D1 OPEN2 — after a short no-progress run, drop inventory-Use chips so the
  // Director's way-on / story chip can surface. Search/look/inspect still use the
  // existing triedAgo rest path (same-result notes) — not a second suppress rule.
  const stalled = turnsWithoutProgress(state) >= STALL_N;
  if (stalled) {
    const before = list.length;
    list = list.filter((c) => actionFamily(c) !== 'use');
    if (list.length < before) notes.push('Stall: dropped no-progress Use chips');
  }
  // XP-D1 OPEN3/OPEN4 — drop Search/Read/… taken with no effect, or offered ≥2× this meaningful scene.
  {
    const sceneKey = fillerSceneKey(state);
    const blocked =
      mem?.fillerBlockSceneKey && mem.fillerBlockSceneKey === sceneKey
        ? new Set(mem.fillerBlockedFamilies ?? [])
        : null;
    const before = list.length;
    list = list.filter((c) => {
      if (fillerOfferExhausted(state, c)) return false;
      if (blocked && blocked.has(actionFamily(c))) return false;
      return true;
    });
    if (list.length < before) notes.push('Scene: dropped no-progress / offer-capped filler');
  }
  const exit = wayOnChip(state, list, story);
  if (exit && !list.some((c) => c.toLowerCase() === exit.toLowerCase())) {
    list = [exit, ...list];
    notes.push(`Stuck exit chip: ${exit.slice(0, 40)}`);
  }
  // XP-D1 OPEN5 — Hunt every outdoor turn (stock permitting); not drought-gated; not filler; never steals
  // quest-progress / Travel / Check System. When Hunt is available, drought Seek Fight hands over to it.
  // OPEN7 — after a hunt defeat, do not push Hunt/Seek for HUNT_DEATH_COOLDOWN_TURNS; prefer recovery chips.
  // OPEN7 — do not push Hunt when every live slot is gray to the player.
  {
    const openingDone = state.openingEstablishment?.complete === true;
    const outdoor = isOutdoorWildsPlace(state);
    const turn = state.turn ?? 0;
    const deathCd =
      typeof state.wildsHuntDeathCooldownUntilTurn === 'number'
      && turn < state.wildsHuntDeathCooldownUntilTurn;
    // Wilds pads: LitRPG + Story RPG may Gather; only LitRPG may Hunt (tabletop dnd / PYOA see neither).
    const canWilds =
      openingDone
      && outdoor
      && gatherModeOk(state)
      && !state.activeEncounter
      && !state.activeDungeon;
    const canHunt = canWilds && huntModeOk(state) && !deathCd;
    let huntReady = false;
    if (canWilds) {
      let s = ensureGatherPouch(ensureRegionResources(ensureWilds(state)));
      const hasPayStock = wildsHasNonGrayStock(s);
      huntReady = canHunt && wildsHasStock(s) && hasPayStock;
      if (deathCd) {
        // Recovery chips: rest / heal / quest / travel — never Hunt.
        list = list.filter((c) => !isHuntChip(c) && !isSeekFightChip(c));
        const hasRecovery = list.some(
          (c) =>
            movesOn(state, c, story)
            || actionFamily(c) === 'wait'
            || /\b(rest|heal|bandage|camp|recover)\b/i.test(c)
            || /^check system\b/i.test(c)
        );
        if (!hasRecovery) {
          const restChip = 'Wait and catch your breath';
          if (!list.some((c) => /^wait\b/i.test(c))) {
            list = [restChip, ...list];
            notes.push('Wilds: recovery after defeat (no Hunt)');
          }
        } else {
          notes.push('Wilds: Hunt withheld (death cooldown)');
        }
      } else if (huntReady && !list.some((c) => isHuntChip(c))) {
        // Least useful slot first: dead filler, then idle loiter, and only then a social chip.
        const isIdleLoiter = (c: string) => LOITER.has(actionFamily(c)) && !movesOn(state, c, story);
        let fillerIdx = list.findIndex((c) => isFillerNoProgressChip(c));
        if (fillerIdx < 0) fillerIdx = list.findIndex((c) => isIdleLoiter(c));
        if (fillerIdx < 0) fillerIdx = list.findIndex((c) => actionFamily(c) === 'talk');
        const progressIdx = list.findIndex((c) => movesOn(state, c, story) && !isHuntChip(c));
        const exitIdx = exit ? list.findIndex((c) => c.toLowerCase() === exit.toLowerCase()) : -1;
        const systemIdx = list.findIndex((c) => /^check system\b/i.test(c));
        if (fillerIdx >= 0 && fillerIdx !== progressIdx && fillerIdx !== exitIdx && fillerIdx !== systemIdx) {
          list = list.map((c, i) => (i === fillerIdx ? HUNT_WILDS_CHIP : c));
          notes.push('Wilds: Hunt the wildlife nearby (replaced filler/social)');
        } else {
          const insertAt = Math.max(
            1,
            Math.min(list.length, (progressIdx >= 0 ? progressIdx : exitIdx) + 1)
          );
          list = [...list.slice(0, insertAt), HUNT_WILDS_CHIP, ...list.slice(insertAt)];
          notes.push('Wilds: Hunt the wildlife nearby');
        }
      } else if (canHunt && wildsHasStock(s) && !hasPayStock) {
        notes.push('Wilds: Hunt not pushed (stock gray to player)');
      }
      // Gather when the region has resource nodes in stock.
      // OPEN6/OPEN7 — do not offer Gather when the pouch cannot take another material (pad would only fail).
      const hasNodes = hasNodeStock(s);
      const pouchCanTake = canAddMaterials(s, 1).ok;
      if (hasNodes && outdoor && pouchCanTake && !list.some((c) => isGatherChip(c))) {
        const gatherSlot = list.findIndex(
          (c) => isFillerNoProgressChip(c) && !isHuntChip(c) && !movesOn(state, c, story)
        );
        if (gatherSlot >= 0) {
          list = list.map((c, i) => (i === gatherSlot ? GATHER_WILDS_CHIP : c));
          notes.push('Wilds: Gather herbs and resources nearby');
        } else if (list.filter((c) => isHuntChip(c) || isGatherChip(c)).length < 2) {
          list = [...list, GATHER_WILDS_CHIP];
          notes.push('Wilds: Gather herbs and resources nearby (extra)');
        }
      }
      // XP-D1 OPEN6 — gather-quest turn-in when the player holds enough named mats.
      {
        const turnIn = gatherQuestTurnInChip(s);
        if (turnIn && !list.some((c) => /^hand over the materials\b/i.test(c))) {
          list = [...list, turnIn];
          notes.push('Wilds: Hand over the materials');
        }
      }
    }
    // XP-D1 OPEN4 — Look for a fight on drought; OPEN5 hands over to Hunt when wilds are in reach.
    // OPEN7 — Seek Fight also withheld during death cooldown.
    const sinceCombat = state.arcDirector?.turnsSinceCombatReceipt;
    const alreadySeek = list.some((c) => isSeekFightChip(c) || isHuntChip(c));
    const drought = typeof sinceCombat === 'number' && sinceCombat >= 8;
    if (openingDone && canSeekFight(state) && drought && !alreadySeek && !huntReady && !deathCd) {
      const fillerIdx = list.findIndex(
        (c) => isFillerNoProgressChip(c) || (LOITER.has(actionFamily(c)) && !movesOn(state, c, story))
      );
      const progressIdx = list.findIndex((c) => movesOn(state, c, story) && !isSeekFightChip(c));
      const exitIdx = exit ? list.findIndex((c) => c.toLowerCase() === exit.toLowerCase()) : -1;
      if (fillerIdx >= 0 && fillerIdx !== progressIdx && fillerIdx !== exitIdx) {
        list = list.map((c, i) => (i === fillerIdx ? SEEK_FIGHT_CHIP : c));
        notes.push('Threat chip: Look for a fight (replaced filler/social)');
      } else if (!list.some((c) => movesOn(state, c, story))) {
        list = [SEEK_FIGHT_CHIP, ...list];
        notes.push('Threat chip: Look for a fight');
      } else {
        const insertAt = Math.max(1, Math.min(list.length, (progressIdx >= 0 ? progressIdx : exitIdx) + 1));
        list = [...list.slice(0, insertAt), SEEK_FIGHT_CHIP, ...list.slice(insertAt)];
        notes.push('Threat chip: Look for a fight (beside progress)');
      }
    }
  }
  if (list.some((c) => movesOn(state, c, story))) {
    const dropped = list.filter((c) => isRevisitChip(state, c) && !(story && c.toLowerCase() === story.toLowerCase()));
    if (dropped.length) {
      list = list.filter((c) => !dropped.includes(c));
      notes.push(`Dropped revisit: ${dropped.map((c) => c.slice(0, 32)).join(' / ')}`);
    }
  }

  const kept: string[] = [];
  for (const c of list) {
    const fam = actionFamily(c);
    const last = mem?.stale?.[key]?.[fam];
    if (LOITER.has(fam) && last != null && turn - last < REST_TURNS) {
      notes.push(`Rested chip: ${c.slice(0, 32)}`);
      continue;
    }
    const ago = triedAgo(state, c);
    if (ago != null && ago < REST_TURNS && !(story && c.toLowerCase() === story.toLowerCase())) {
      notes.push(`Rested repeat: ${c.slice(0, 32)}`);
      continue;
    }
    // T10WARDEN2 — rest the exact action that just produced the same dead engine result.
    const deadAct = (mem?.lastDeadActResult ?? '').split('|')[0] ?? '';
    if (deadAct && actionKey(c) === deadAct && !(story && c.toLowerCase() === story.toLowerCase())) {
      notes.push(`Rested same-result: ${c.slice(0, 32)}`);
      continue;
    }
    kept.push(c);
  }
  // Never rest below three chips — but do not re-admit an exact no-progress repeat
  // (inventory Use / search / System trail), scene-blocked filler, or offer-capped filler.
  const sceneKeyNow = fillerSceneKey(state);
  const fillerBlocked =
    mem?.fillerBlockSceneKey && mem.fillerBlockSceneKey === sceneKeyNow
      ? new Set(mem.fillerBlockedFamilies ?? [])
      : null;
  const isBlockedFiller = (c: string) =>
    !!fillerBlocked?.has(actionFamily(c)) || fillerOfferExhausted(state, c);
  while (kept.length < 3 && kept.length < list.length) {
    const back = list.find((c) => !kept.includes(c) && triedAgo(state, c) == null && !isBlockedFiller(c));
    if (!back) break;
    kept.push(back);
  }
  while (kept.length < 3 && kept.length < list.length) {
    const back = list.find((c) => !kept.includes(c) && !isBlockedFiller(c));
    if (!back) break;
    kept.push(back);
  }

  const prev = (mem?.prevPlace ?? '').toLowerCase();
  const ranked = kept
    .map((c, i) => ({ c, i, s: chipProgressScore(state, c) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map(({ c }) => {
      const dest = travelDest(c);
      return dest && samePlace(dest.toLowerCase(), prev) && !/^go back to\b/i.test(c) ? `Go back to ${dest}` : c;
    });
  // The offered list shows four chips; inside a dungeon card its way out is always one of them (ranked last of the four).
  const exitAt = ranked.findIndex((c) => CARD_EXIT.test(c));
  if (exitAt > SHOWN_CHIPS - 1) ranked.splice(SHOWN_CHIPS - 1, 0, ...ranked.splice(exitAt, 1));
  // XP-D1 A2 — pin starter/quest step (or travel-to-it) into the top 3 for LitRPG / Story RPG.
  const pinned = pinStoryChipInTop(state, ranked, 3);
  if (pinned.join('|') !== ranked.join('|')) notes.push('Quest step chip pinned top-3');
  if (pinned.join('|') !== choices.join('|')) notes.push('Anti-circling rank');
  return { choices: pinned, notes };
}
